from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any
from ..models.document import DocumentCategory, OCRStatus


class DocumentCreate(BaseModel):
    filename: str
    document_category: DocumentCategory
    regulatory_classification_id: Optional[int] = None
    uploaded_by: Optional[str] = None


class DocumentResponse(BaseModel):
    id: int
    client_id: int
    regulatory_classification_id: Optional[int] = None
    filename: str
    file_path: str
    file_type: Optional[str] = None
    upload_date: datetime
    uploaded_by: Optional[str] = None
    document_category: DocumentCategory
    ocr_status: OCRStatus
    extracted_text: Optional[str] = None
    ai_validation_result: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class DocumentValidationResult(BaseModel):
    """AI validation result structure"""
    extracted_entities: Dict[str, Any]
    validation_checks: Dict[str, bool]
    confidence_score: float
    recommendations: list[str]
    extracted_text_preview: str
