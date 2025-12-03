from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime
from pydantic import BaseModel
from ..database import get_db
from ..models.document import Document, DocumentCategory, OCRStatus
from ..models.client import Client
from ..models.document_annotation import DocumentAnnotation
from ..schemas.document import (
    DocumentResponse,
    DocumentValidationResult,
    EnhancedValidationResult,
    DocumentVerifyRequest
)
from ..services.ai_service import ai_service
from ..services.document_validator import DocumentValidator
from ..services.document_coordinates import get_coordinates_for_demo_document, is_demo_document, get_entity_label
import fitz  # PyMuPDF
from ..config import settings


class InternalDocumentUpload(BaseModel):
    source_system: str  # "SX", "CX", or "WX"
    document_url: str
    document_type: str
    document_name: str
    uploaded_by: str

router = APIRouter(prefix="/api", tags=["documents"])


@router.get("/clients/{client_id}/documents", response_model=List[DocumentResponse])
def get_client_documents(client_id: int, db: Session = Depends(get_db)):
    """Get all documents for a client"""
    documents = db.query(Document).filter(
        Document.client_id == client_id
    ).order_by(Document.upload_date.desc()).all()

    return documents


@router.post("/clients/{client_id}/documents", response_model=DocumentResponse)
async def upload_document(
    client_id: int,
    file: UploadFile = File(...),
    document_category: DocumentCategory = Form(...),
    regulatory_classification_id: Optional[int] = Form(None),
    uploaded_by: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload a document for a client"""
    # Verify client exists
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Create upload directory if it doesn't exist
    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{client_id}_{timestamp}_{file.filename}"
    file_path = os.path.join(upload_dir, filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Determine file type
    file_type = file.filename.split('.')[-1] if '.' in file.filename else 'unknown'

    # Create document record
    document = Document(
        client_id=client_id,
        regulatory_classification_id=regulatory_classification_id,
        filename=file.filename,
        file_path=file_path,
        file_type=file_type,
        uploaded_by=uploaded_by,
        document_category=document_category,
        ocr_status=OCRStatus.PENDING
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document


@router.post("/clients/{client_id}/documents/from-internal-system", response_model=DocumentResponse)
async def upload_document_from_internal_system(
    client_id: int,
    upload_data: InternalDocumentUpload,
    db: Session = Depends(get_db)
):
    """Upload a document from internal system with automatic OCR/LLM processing"""
    # Verify client exists
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Create upload directory if it doesn't exist
    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)

    # Simulate fetching document from internal system
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{client_id}_{timestamp}_{upload_data.document_name}"
    file_path = os.path.join(upload_dir, filename)

    # Create simulated document content for demo
    simulated_content = f"""
INTERNAL DOCUMENT FROM {upload_data.source_system}

Document Type: {upload_data.document_type}
Source System: {upload_data.source_system}
Client: {client.name}
Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

This is a simulated document fetched from the {upload_data.source_system} system.
In production, this would be the actual document content retrieved from {upload_data.document_url}.

Legal Entity Name: {client.name}
Country of Incorporation: {client.country_of_incorporation or 'Not specified'}
Entity Type: {client.entity_type or 'Not specified'}
    """

    # Write simulated content to file
    with open(file_path, "w") as f:
        f.write(simulated_content)

    # Map document type to category
    category_mapping = {
        "registration_certificate": DocumentCategory.REGISTRATION_CERTIFICATE,
        "articles_of_incorporation": DocumentCategory.ARTICLES_OF_INCORPORATION,
        "board_resolution": DocumentCategory.BOARD_RESOLUTION,
        "kyc_documentation": DocumentCategory.KYC_DOCUMENTATION,
        "client_confirmation": DocumentCategory.CLIENT_CONFIRMATION,
        "product_agreement": DocumentCategory.PRODUCT_AGREEMENT,
        "due_diligence_report": DocumentCategory.DUE_DILIGENCE_REPORT,
        "financial_statements": DocumentCategory.FINANCIAL_STATEMENTS,
        "compliance_certificate": DocumentCategory.COMPLIANCE_CERTIFICATE,
        "risk_assessment": DocumentCategory.RISK_ASSESSMENT
    }

    document_category = category_mapping.get(upload_data.document_type, DocumentCategory.OTHER)

    # Create document record
    document = Document(
        client_id=client_id,
        filename=upload_data.document_name,
        file_path=file_path,
        file_type="pdf",
        uploaded_by=upload_data.uploaded_by,
        document_category=document_category,
        ocr_status=OCRStatus.PROCESSING
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    # Automatically trigger OCR/LLM processing
    try:
        # Extract text
        extracted_text = ai_service.extract_text(file_path, "pdf")
        document.extracted_text = extracted_text

        # Prepare client data for validation
        client_data = {
            "legal_entity_name": client.name,
            "jurisdiction": client.country_of_incorporation or "Not specified",
            "entity_type": client.entity_type or "Not specified"
        }

        # Run enhanced validation
        validation_result = ai_service.enhanced_validate_document(
            extracted_text=extracted_text,
            client_data=client_data,
            document_category=document.document_category.value
        )

        document.ai_validation_result = validation_result
        document.ocr_status = OCRStatus.COMPLETED

        db.commit()
        db.refresh(document)

    except Exception as e:
        document.ocr_status = OCRStatus.FAILED
        db.commit()
        # Don't raise exception - return document with failed status

    return document


@router.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    """Get document details"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Delete a document"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete physical file
    if os.path.exists(document.file_path):
        os.remove(document.file_path)

    db.delete(document)
    db.commit()

    return {"message": "Document deleted successfully"}


@router.post("/documents/{document_id}/validate", response_model=DocumentResponse)
def validate_document(document_id: int, db: Session = Depends(get_db)):
    """Trigger AI validation for a document"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get client info
    client = db.query(Client).filter(Client.id == document.client_id).first()

    try:
        # Update status to processing
        document.ocr_status = OCRStatus.PROCESSING
        db.commit()

        # Extract text
        extracted_text = ai_service.extract_text(document.file_path, document.file_type)
        document.extracted_text = extracted_text

        # Get regulatory framework if applicable
        regulatory_framework = None
        if document.regulatory_classification_id:
            from ..models.regulatory_classification import RegulatoryClassification
            reg_class = db.query(RegulatoryClassification).filter(
                RegulatoryClassification.id == document.regulatory_classification_id
            ).first()
            if reg_class:
                regulatory_framework = reg_class.framework.value

        # Validate using AI
        validation_result = ai_service.validate_document(
            extracted_text=extracted_text,
            client_name=client.name,
            document_category=document.document_category.value,
            regulatory_framework=regulatory_framework
        )

        document.ai_validation_result = validation_result
        document.ocr_status = OCRStatus.COMPLETED

        db.commit()
        db.refresh(document)

        return document

    except Exception as e:
        document.ocr_status = OCRStatus.FAILED
        db.commit()
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.get("/documents/{document_id}/validation", response_model=DocumentValidationResult)
def get_validation_result(document_id: int, db: Session = Depends(get_db)):
    """Get AI validation result for a document"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not document.ai_validation_result:
        raise HTTPException(status_code=404, detail="No validation result available")

    return DocumentValidationResult(**document.ai_validation_result)


@router.post("/documents/{document_id}/enhanced-validate", response_model=EnhancedValidationResult)
async def enhanced_validate_document(document_id: int, db: Session = Depends(get_db)):
    """
    Enhanced AI validation with detailed entity extraction and confidence scores.
    This endpoint simulates AI processing for demo purposes.
    """
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get client data
    client = db.query(Client).filter(Client.id == document.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    try:
        # Update status to processing
        document.ocr_status = OCRStatus.PROCESSING
        db.commit()

        # For demo purposes, use simulated text extraction
        # In production, this would actually extract text from the document
        if not document.extracted_text:
            # Simulate extracted text for demo
            extracted_text = f"""
            CERTIFICATE OF INCORPORATION

            Legal Entity Name: {client.name}
            Jurisdiction: {client.country_of_incorporation or 'Not specified'}
            Entity Type: {client.entity_type or 'Not specified'}

            Document Type: Certificate of Incorporation
            Issue Date: 2023-01-15
            Document Reference: COI-2023-001234

            This is to certify that {client.name} has been duly incorporated
            under the laws of {client.country_of_incorporation or 'Not specified'} as a {client.entity_type or 'Not specified'}.

            Authorized Signatory: John Smith, Company Secretary
            Date of Issuance: January 15, 2023
            """
            document.extracted_text = extracted_text
        else:
            extracted_text = document.extracted_text

        # Prepare client data for validation
        client_data = {
            "legal_entity_name": client.name,
            "jurisdiction": client.country_of_incorporation or "Not specified",
            "entity_type": client.entity_type or "Not specified"
        }

        # Enhanced validation with entity extraction
        validation_result = ai_service.enhanced_validate_document(
            extracted_text=extracted_text,
            client_data=client_data,
            document_category=document.document_category.value
        )

        # Store validation result
        document.ai_validation_result = validation_result
        document.ocr_status = OCRStatus.COMPLETED

        db.commit()
        db.refresh(document)

        return EnhancedValidationResult(**validation_result)

    except Exception as e:
        import traceback
        print(f"\n=== ENHANCED VALIDATION ERROR ===")
        print(f"Error: {str(e)}")
        print(f"Traceback:\n{traceback.format_exc()}")
        print(f"=================================\n")
        document.ocr_status = OCRStatus.FAILED
        db.commit()
        raise HTTPException(status_code=500, detail=f"Enhanced validation failed: {str(e)}")


@router.get("/documents/{document_id}/enhanced-validation", response_model=EnhancedValidationResult)
def get_enhanced_validation_result(document_id: int, db: Session = Depends(get_db)):
    """Get enhanced AI validation result for a document"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not document.ai_validation_result:
        raise HTTPException(status_code=404, detail="No validation result available")

    return EnhancedValidationResult(**document.ai_validation_result)


@router.post("/documents/{document_id}/verify")
def verify_document(
    document_id: int,
    verify_request: DocumentVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Mark document as verified by human after reviewing AI extraction.
    Updates document status to indicate human verification complete.
    """
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not document.ai_validation_result:
        raise HTTPException(status_code=400, detail="Document must be validated before verification")

    # Update validation result to mark as verified
    validation_result = document.ai_validation_result
    validation_result["validation_status"] = "verified"
    validation_result["verified_by"] = verify_request.verified_by
    validation_result["verified_at"] = datetime.now().isoformat()
    if verify_request.notes:
        validation_result["verification_notes"] = verify_request.notes

    document.ai_validation_result = validation_result
    document.ocr_status = OCRStatus.COMPLETED

    db.commit()
    db.refresh(document)

    return {
        "message": "Document verified successfully",
        "document_id": document_id,
        "verified_by": verify_request.verified_by,
        "validation_status": "verified"
    }


@router.get("/clients/{client_id}/document-validation")
def get_client_document_validation(client_id: int, db: Session = Depends(get_db)):
    """Run comprehensive document validation for a client"""
    validator = DocumentValidator(db)

    try:
        # Run deterministic checks
        deterministic_results = validator.run_deterministic_checks(client_id)

        # Get AI suggestions for missing documents
        ai_suggestions = validator.suggest_missing_documents(client_id)

        # Overall status based on data quality score
        data_quality_score = deterministic_results["data_quality_score"]
        overall_status = "excellent" if data_quality_score >= 90 else \
                        "good" if data_quality_score >= 75 else \
                        "fair" if data_quality_score >= 60 else "poor"

        return {
            "client_id": client_id,
            "overall_status": overall_status,
            "data_quality_score": data_quality_score,
            "deterministic_checks": deterministic_results,
            "ai_suggestions": ai_suggestions,
            "can_publish_to_cx": True,  # Always allow publishing per plan requirements
            "validation_timestamp": datetime.now().isoformat()
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.post("/documents/{document_id}/ai-validate")
def ai_validate_document(document_id: int, db: Session = Depends(get_db)):
    """Run AI validation on specific document"""
    validator = DocumentValidator(db)

    try:
        result = validator.run_ai_validation(document_id)
        return result

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI validation failed: {str(e)}")


# ============================================================================
# DOCUMENT ANNOTATION ENDPOINTS (For AI-powered Document Review with Visual Highlights)
# ============================================================================

@router.post("/documents/{document_id}/annotate")
async def annotate_document(document_id: int, db: Session = Depends(get_db)):
    """
    Extract entities using LLM and create annotations with coordinates for visual highlighting.
    This endpoint is used for the AI-powered document review feature.
    """
    # 1. Get document
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # 2. Get client details for validation context
    client = db.query(Client).filter(Client.id == document.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    try:
        # 3. Extract text from PDF using PyMuPDF
        extracted_text = ""
        if document.file_path.lower().endswith('.pdf'):
            try:
                pdf_doc = fitz.open(document.file_path)
                for page in pdf_doc:
                    extracted_text += page.get_text()
                pdf_doc.close()
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail="Only PDF documents are supported for annotation")

        # Store extracted text in document if not already stored
        if not document.extracted_text:
            document.extracted_text = extracted_text
            db.commit()

        # 4. Use LLM/AI service to extract entities with confidence scores
        entities = ai_service.extract_entities_with_llm(
            extracted_text=extracted_text,
            client_name=client.name,
            country=client.country_of_incorporation,
            entity_type=client.entity_type
        )

        # 5. Get coordinates for entities (hardcoded for demo document)
        coordinates = get_coordinates_for_demo_document(document.filename)

        if not coordinates:
            # If not a demo document, return error for now
            # In production, you would use actual OCR coordinates
            raise HTTPException(
                status_code=400,
                detail="Annotation coordinates not available for this document. Please use the demo registration certificate."
            )

        # 6. Delete any existing annotations for this document
        db.query(DocumentAnnotation).filter(
            DocumentAnnotation.document_id == document_id
        ).delete()

        # 7. Create annotations for each extracted entity
        annotations = []
        for entity_type, entity_data in entities.items():
            if entity_type in coordinates and entity_data.get("value"):
                annotation = DocumentAnnotation(
                    document_id=document_id,
                    entity_type=entity_type,
                    entity_label=get_entity_label(entity_type),
                    extracted_value=entity_data["value"],
                    confidence=entity_data["confidence"],
                    page_number=coordinates[entity_type]["page"],
                    bounding_box=coordinates[entity_type]["bbox"],
                    status="auto_extracted"
                )
                db.add(annotation)
                annotations.append(annotation)

        db.commit()

        # 8. Calculate overall confidence
        overall_confidence = sum(e["confidence"] for e in entities.values() if e.get("confidence")) / len(entities) if entities else 0.0

        # 9. Determine validation status
        if overall_confidence >= 0.90:
            validation_status = "verified"
        elif overall_confidence >= 0.75:
            validation_status = "needs_review"
        else:
            validation_status = "failed"

        # 10. Update document OCR status
        document.ocr_status = OCRStatus.COMPLETED
        db.commit()

        # 11. Return annotations
        return {
            "document_id": document_id,
            "annotations": [
                {
                    "id": ann.id,
                    "entity_type": ann.entity_type,
                    "entity_label": ann.entity_label,
                    "extracted_value": ann.extracted_value,
                    "confidence": ann.confidence,
                    "page_number": ann.page_number,
                    "bounding_box": ann.bounding_box,
                    "status": ann.status,
                    "corrected_value": ann.corrected_value,
                    "verified_by": ann.verified_by,
                    "verified_at": ann.verified_at.isoformat() if ann.verified_at else None
                }
                for ann in annotations
            ],
            "overall_confidence": overall_confidence,
            "validation_status": validation_status,
            "message": "Document annotated successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Annotation failed: {str(e)}")


@router.get("/documents/{document_id}/annotations")
def get_document_annotations(document_id: int, db: Session = Depends(get_db)):
    """
    Get all annotations for a document.
    Returns entity extractions with coordinates for visual highlighting.
    """
    # Verify document exists
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get annotations
    annotations = db.query(DocumentAnnotation).filter(
        DocumentAnnotation.document_id == document_id
    ).order_by(DocumentAnnotation.page_number, DocumentAnnotation.id).all()

    return [
        {
            "id": ann.id,
            "entity_type": ann.entity_type,
            "entity_label": ann.entity_label,
            "extracted_value": ann.extracted_value,
            "confidence": ann.confidence,
            "page_number": ann.page_number,
            "bounding_box": ann.bounding_box,
            "status": ann.status,
            "corrected_value": ann.corrected_value,
            "verified_by": ann.verified_by,
            "verified_at": ann.verified_at.isoformat() if ann.verified_at else None,
            "notes": ann.notes
        }
        for ann in annotations
    ]


class AnnotationVerifyRequest(BaseModel):
    verified_by: str = "Demo User"
    corrected_value: Optional[str] = None
    notes: Optional[str] = None


@router.put("/documents/annotations/{annotation_id}/verify")
def verify_annotation(
    annotation_id: int,
    verify_request: AnnotationVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Mark an annotation as verified or corrected by a user.
    This is used in the document review workflow.
    """
    # Get annotation
    annotation = db.query(DocumentAnnotation).filter(
        DocumentAnnotation.id == annotation_id
    ).first()

    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    # Update annotation
    if verify_request.corrected_value:
        annotation.status = "corrected"
        annotation.corrected_value = verify_request.corrected_value
    else:
        annotation.status = "verified"

    annotation.verified_by = verify_request.verified_by
    annotation.verified_at = datetime.utcnow()
    if verify_request.notes:
        annotation.notes = verify_request.notes

    db.commit()
    db.refresh(annotation)

    return {
        "message": "Annotation verified successfully",
        "annotation_id": annotation_id,
        "status": annotation.status,
        "verified_by": annotation.verified_by,
        "verified_at": annotation.verified_at.isoformat()
    }
