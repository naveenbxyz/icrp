from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any, List


# Classification Rule Schemas
class ClassificationRuleBase(BaseModel):
    regime: str
    rule_type: str
    rule_name: str
    rule_config: Dict[str, Any]
    description: Optional[str] = None
    is_active: bool = True


class ClassificationRuleCreate(ClassificationRuleBase):
    created_by: Optional[str] = None


class ClassificationRuleUpdate(BaseModel):
    rule_config: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ClassificationRuleResponse(ClassificationRuleBase):
    id: int
    version: int
    created_date: datetime
    updated_date: datetime
    created_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Regime Eligibility Schemas
class RegimeEligibilityBase(BaseModel):
    client_id: int
    regime: str
    is_eligible: bool
    eligibility_reason: Optional[str] = None


class RegimeEligibilityResponse(RegimeEligibilityBase):
    id: int
    matched_rules: Optional[List[Dict[str, Any]]] = None
    unmatched_rules: Optional[List[Dict[str, Any]]] = None
    client_attributes: Optional[Dict[str, Any]] = None
    rule_version: Optional[int] = None
    last_evaluated_date: datetime
    created_date: datetime

    model_config = ConfigDict(from_attributes=True)


# Mandatory Evidence Schemas
class MandatoryEvidenceBase(BaseModel):
    regime: str
    evidence_type: str
    evidence_name: str
    category: str
    description: Optional[str] = None
    is_mandatory: bool = True
    validity_days: Optional[int] = None
    is_active: bool = True


class MandatoryEvidenceCreate(MandatoryEvidenceBase):
    pass


class MandatoryEvidenceUpdate(BaseModel):
    evidence_name: Optional[str] = None
    description: Optional[str] = None
    is_mandatory: Optional[bool] = None
    validity_days: Optional[int] = None
    is_active: Optional[bool] = None


class MandatoryEvidenceResponse(MandatoryEvidenceBase):
    id: int
    created_date: datetime
    updated_date: datetime

    model_config = ConfigDict(from_attributes=True)


# Data Quality Schemas
class DataQualityResult(BaseModel):
    quality_score: float
    total_evidences: int
    completed_evidences: int
    missing_evidences: List[Dict[str, Any]]
    warnings: List[str]


# Evaluation Schemas
class EvaluationRequest(BaseModel):
    client_id: int
    regime: Optional[str] = None  # If None, evaluate all regimes


class EvaluationResult(BaseModel):
    eligibility_id: int
    is_eligible: bool
    reason: str
    matched_rules: List[Dict[str, Any]]
    unmatched_rules: List[Dict[str, Any]]
    client_attributes: Dict[str, Any]
    evaluated_at: str


class RetriggerResult(BaseModel):
    total_clients: int
    regimes_evaluated: List[str]
    results_by_regime: Dict[str, Dict[str, int]]


# Client Attributes Schemas (for classification)
class ClientAttributesUpdate(BaseModel):
    account_type: Optional[str] = None
    booking_location: Optional[str] = None
    product_grid: Optional[Dict[str, Any]] = None
    additional_attributes: Optional[Dict[str, Any]] = None
