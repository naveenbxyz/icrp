from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.classification_rule import ClassificationRule
from ..models.regime_eligibility import RegimeEligibility
from ..models.mandatory_evidence import MandatoryEvidence
from ..models.client import Client
from ..schemas.classification import (
    ClassificationRuleCreate,
    ClassificationRuleUpdate,
    ClassificationRuleResponse,
    RegimeEligibilityResponse,
    MandatoryEvidenceCreate,
    MandatoryEvidenceUpdate,
    MandatoryEvidenceResponse,
    DataQualityResult,
    EvaluationResult,
    RetriggerResult,
    ClientAttributesUpdate
)
from ..services.classification_engine import ClassificationEngine

router = APIRouter(prefix="/api", tags=["regimes"])


# Regime Management Endpoints
@router.get("/regimes", response_model=List[str])
def list_regimes(db: Session = Depends(get_db)):
    """Get list of all available regulatory regimes"""
    regimes = db.query(ClassificationRule.regime).distinct().all()
    return [r[0] for r in regimes]


# Classification Rules Endpoints
@router.get("/regimes/{regime}/rules", response_model=List[ClassificationRuleResponse])
def get_regime_rules(
    regime: str,
    active_only: bool = Query(default=True),
    db: Session = Depends(get_db)
):
    """Get all classification rules for a specific regime"""
    query = db.query(ClassificationRule).filter(ClassificationRule.regime == regime)

    if active_only:
        query = query.filter(ClassificationRule.is_active == True)

    rules = query.all()
    return rules


@router.post("/regimes/{regime}/rules", response_model=ClassificationRuleResponse)
def create_classification_rule(
    regime: str,
    rule: ClassificationRuleCreate,
    db: Session = Depends(get_db)
):
    """Create a new classification rule for a regime"""
    # Ensure regime matches
    if rule.regime != regime:
        raise HTTPException(status_code=400, detail="Regime in URL and body must match")

    db_rule = ClassificationRule(**rule.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)

    return db_rule


@router.put("/regimes/{regime}/rules/{rule_id}", response_model=ClassificationRuleResponse)
def update_classification_rule(
    regime: str,
    rule_id: int,
    rule_update: ClassificationRuleUpdate,
    db: Session = Depends(get_db)
):
    """Update a classification rule"""
    db_rule = db.query(ClassificationRule).filter(
        ClassificationRule.id == rule_id,
        ClassificationRule.regime == regime
    ).first()

    if not db_rule:
        raise HTTPException(status_code=404, detail="Classification rule not found")

    update_data = rule_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_rule, field, value)

    # Increment version on config change
    if "rule_config" in update_data:
        db_rule.version += 1

    db.commit()
    db.refresh(db_rule)

    return db_rule


@router.delete("/regimes/{regime}/rules/{rule_id}")
def delete_classification_rule(
    regime: str,
    rule_id: int,
    db: Session = Depends(get_db)
):
    """Delete (deactivate) a classification rule"""
    db_rule = db.query(ClassificationRule).filter(
        ClassificationRule.id == rule_id,
        ClassificationRule.regime == regime
    ).first()

    if not db_rule:
        raise HTTPException(status_code=404, detail="Classification rule not found")

    db_rule.is_active = False
    db.commit()

    return {"message": "Classification rule deactivated"}


# Mandatory Evidence Endpoints
@router.get("/regimes/{regime}/mandatory-evidences", response_model=List[MandatoryEvidenceResponse])
def get_mandatory_evidences(
    regime: str,
    active_only: bool = Query(default=True),
    db: Session = Depends(get_db)
):
    """Get mandatory evidences for a regime"""
    query = db.query(MandatoryEvidence).filter(MandatoryEvidence.regime == regime)

    if active_only:
        query = query.filter(MandatoryEvidence.is_active == True)

    evidences = query.all()
    return evidences


@router.post("/regimes/{regime}/mandatory-evidences", response_model=MandatoryEvidenceResponse)
def create_mandatory_evidence(
    regime: str,
    evidence: MandatoryEvidenceCreate,
    db: Session = Depends(get_db)
):
    """Create a mandatory evidence requirement"""
    if evidence.regime != regime:
        raise HTTPException(status_code=400, detail="Regime in URL and body must match")

    db_evidence = MandatoryEvidence(**evidence.model_dump())
    db.add(db_evidence)
    db.commit()
    db.refresh(db_evidence)

    return db_evidence


@router.put("/regimes/{regime}/mandatory-evidences/{evidence_id}", response_model=MandatoryEvidenceResponse)
def update_mandatory_evidence(
    regime: str,
    evidence_id: int,
    evidence_update: MandatoryEvidenceUpdate,
    db: Session = Depends(get_db)
):
    """Update a mandatory evidence requirement"""
    db_evidence = db.query(MandatoryEvidence).filter(
        MandatoryEvidence.id == evidence_id,
        MandatoryEvidence.regime == regime
    ).first()

    if not db_evidence:
        raise HTTPException(status_code=404, detail="Mandatory evidence not found")

    update_data = evidence_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_evidence, field, value)

    db.commit()
    db.refresh(db_evidence)

    return db_evidence


# Client Eligibility Endpoints
@router.post("/clients/{client_id}/evaluate-eligibility", response_model=EvaluationResult)
def evaluate_client_eligibility(
    client_id: int,
    regime: str = Query(..., description="Regime to evaluate"),
    db: Session = Depends(get_db)
):
    """Trigger eligibility evaluation for a client"""
    engine = ClassificationEngine(db)

    try:
        result = engine.evaluate_client_eligibility(client_id, regime)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@router.get("/clients/{client_id}/regime-eligibility", response_model=List[RegimeEligibilityResponse])
def get_client_regime_eligibility(
    client_id: int,
    regime: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get regime eligibility status for a client"""
    query = db.query(RegimeEligibility).filter(RegimeEligibility.client_id == client_id)

    if regime:
        query = query.filter(RegimeEligibility.regime == regime)

    eligibilities = query.all()
    return eligibilities


@router.get("/clients/{client_id}/data-quality", response_model=DataQualityResult)
def get_client_data_quality(
    client_id: int,
    regime: str = Query(..., description="Regime to check"),
    db: Session = Depends(get_db)
):
    """Get data quality score for a client based on mandatory evidences"""
    engine = ClassificationEngine(db)

    try:
        result = engine.calculate_data_quality_score(client_id, regime)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quality check failed: {str(e)}")


@router.put("/clients/{client_id}/attributes")
def update_client_attributes(
    client_id: int,
    attributes: ClientAttributesUpdate,
    db: Session = Depends(get_db)
):
    """Update client attributes used for classification"""
    client = db.query(Client).filter(Client.id == client_id).first()

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Get existing attributes or initialize empty dict
    current_attrs = client.client_attributes or {}

    # Update with new attributes
    update_data = attributes.model_dump(exclude_unset=True)

    # Merge additional_attributes if present
    if "additional_attributes" in update_data:
        additional = update_data.pop("additional_attributes")
        current_attrs.update(additional)

    current_attrs.update(update_data)
    client.client_attributes = current_attrs

    db.commit()
    db.refresh(client)

    return {
        "message": "Client attributes updated",
        "client_id": client_id,
        "attributes": client.client_attributes
    }


@router.post("/regimes/retrigger-evaluation", response_model=RetriggerResult)
def retrigger_all_evaluations(
    regime: Optional[str] = Query(None, description="Specific regime to re-evaluate (None = all)"),
    db: Session = Depends(get_db)
):
    """Re-trigger eligibility evaluation for all clients (useful after rule changes)"""
    engine = ClassificationEngine(db)

    try:
        result = engine.retrigger_all_evaluations(regime)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrigger failed: {str(e)}")
