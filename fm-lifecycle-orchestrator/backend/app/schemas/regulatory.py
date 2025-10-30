from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any, List
from ..models.regulatory_classification import RegulatoryFramework, ValidationStatus


class RegulatoryClassificationBase(BaseModel):
    framework: RegulatoryFramework
    classification: str
    validation_status: ValidationStatus = ValidationStatus.PENDING


class RegulatoryClassificationUpdate(BaseModel):
    classification: Optional[str] = None
    validation_status: Optional[ValidationStatus] = None
    validation_notes: Optional[str] = None
    last_review_date: Optional[datetime] = None
    next_review_date: Optional[datetime] = None
    additional_data: Optional[Dict[str, Any]] = None


class RegulatoryClassificationResponse(RegulatoryClassificationBase):
    id: int
    client_id: int
    classification_date: datetime
    last_review_date: Optional[datetime] = None
    next_review_date: Optional[datetime] = None
    validation_notes: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None
    document_count: int = 0

    model_config = ConfigDict(from_attributes=True)
