from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime
from ..database import get_db
from ..models.document import Document, DocumentCategory, OCRStatus
from ..models.client import Client
from ..schemas.document import DocumentResponse, DocumentValidationResult
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
