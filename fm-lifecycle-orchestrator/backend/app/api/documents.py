from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime
from ..database import get_db
from ..models.document import Document, DocumentCategory, OCRStatus
from ..models.client import Client
from ..schemas.document import (
    DocumentResponse,
    DocumentValidationResult,
    EnhancedValidationResult,
    DocumentVerifyRequest
)
from ..services.ai_service import ai_service
from ..config import settings

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
            Jurisdiction: {client.jurisdiction or 'Not specified'}
            Entity Type: {client.entity_type or 'Not specified'}

            Document Type: Certificate of Incorporation
            Issue Date: 2023-01-15
            Document Reference: COI-2023-001234

            This is to certify that {client.name} has been duly incorporated
            under the laws of {client.jurisdiction or 'Not specified'} as a {client.entity_type or 'Not specified'}.

            Authorized Signatory: John Smith, Company Secretary
            Date of Issuance: January 15, 2023
            """
            document.extracted_text = extracted_text
        else:
            extracted_text = document.extracted_text

        # Prepare client data for validation
        client_data = {
            "legal_entity_name": client.name,
            "jurisdiction": client.jurisdiction or "Not specified",
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
