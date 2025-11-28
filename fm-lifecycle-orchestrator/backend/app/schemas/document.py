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


class ExtractedEntity(BaseModel):
    """Single extracted entity with confidence and validation"""
    value: Optional[str] = None
    confidence: float  # 0.0 to 1.0
    matches_expected: bool
    expected_value: Optional[str] = None
    issues: list[str] = []


class DocumentValidationResult(BaseModel):
    """AI validation result structure"""
    extracted_entities: Dict[str, Any]
    validation_checks: Dict[str, bool]
    confidence_score: float
    recommendations: list[str]
    extracted_text_preview: str


class EnhancedValidationResult(BaseModel):
    """Enhanced AI validation with detailed entity extraction"""
    # Key extracted entities
    legal_name: ExtractedEntity
    jurisdiction: ExtractedEntity
    document_type: ExtractedEntity
    issue_date: ExtractedEntity
    expiry_date: ExtractedEntity
    signatory: ExtractedEntity
    document_reference: ExtractedEntity
    entity_type: ExtractedEntity

    # Overall assessment
    overall_confidence: float  # 0.0 to 1.0
    validation_status: str  # "verified", "needs_review", "failed"
    processing_time_ms: int

    # Issues and recommendations
    issues: list[str] = []
    warnings: list[str] = []
    recommendations: list[str] = []

    # Raw data
    extracted_text_preview: str  # First 500 chars


class DocumentVerifyRequest(BaseModel):
    """Request to verify AI-extracted data"""
    verified_by: str
    notes: Optional[str] = None
