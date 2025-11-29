"""CX Product Approval API - Simulates product approval from CX system"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from ..database import get_db
from ..models.client import Client, OnboardingStatus
from ..models.onboarding_stage import OnboardingStage, StageStatus, StageName
from ..services.classification_engine import ClassificationEngine
from datetime import datetime

router = APIRouter(prefix="/api", tags=["cx-approval"])


@router.post("/clients/{client_id}/simulate-cx-approval")
def simulate_cx_product_approval(client_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Simulate CX product approval and trigger regulatory classification.

    Workflow:
    1. Mark product as approved in client_attributes
    2. Complete Legal Entity Setup stage
    3. Trigger regulatory classification against all regimes (~20)
    4. Update client status
    5. Return classification results
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Step 1: Update product approval status
    if client.client_attributes:
        attrs = client.client_attributes.copy()
        if "product_grid" in attrs:
            attrs["product_grid"]["product_status"] = "approved"
            attrs["product_grid"]["approval_date"] = datetime.now().isoformat()
        client.client_attributes = attrs

    # Step 2: Complete Legal Entity Setup stage
    legal_setup_stage = db.query(OnboardingStage).filter(
        OnboardingStage.client_id == client_id,
        OnboardingStage.stage_name == StageName.LEGAL_ENTITY_SETUP
    ).first()

    if legal_setup_stage:
        legal_setup_stage.status = StageStatus.COMPLETED
        legal_setup_stage.completed_date = datetime.now()
        legal_setup_stage.calculate_tat()
        legal_setup_stage.notes = "Completed via CX product approval simulation"

    # Step 3: Start Regulatory Classification stage
    reg_class_stage = db.query(OnboardingStage).filter(
        OnboardingStage.client_id == client_id,
        OnboardingStage.stage_name == StageName.REG_CLASSIFICATION
    ).first()

    if reg_class_stage:
        reg_class_stage.status = StageStatus.IN_PROGRESS
        reg_class_stage.started_date = datetime.now()

    db.commit()

    # Step 4: Trigger classification against all regimes
    engine = ClassificationEngine(db)

    # Get list of all regimes with active rules
    from ..models.classification_rule import ClassificationRule
    regimes = db.query(ClassificationRule.regime).filter(
        ClassificationRule.is_active == True
    ).distinct().all()
    regime_list = [r[0] for r in regimes]

    classification_results = {}
    eligible_regimes = []

    for regime in regime_list:
        try:
            result = engine.evaluate_client_eligibility(client_id, regime)
            classification_results[regime] = result
            if result.get("is_eligible", False):
                eligible_regimes.append(regime)
        except Exception as e:
            print(f"Error evaluating {regime}: {str(e)}")
            classification_results[regime] = {"error": str(e)}

    # Step 5: Update client status
    client.onboarding_status = OnboardingStatus.IN_PROGRESS
    client.calculate_cumulative_tat()
    db.commit()

    # Step 6: Simulate CX integration call
    cx_sync_result = {
        "cx_system": "synced",
        "client_id": client.legal_entity_id,
        "product_approval_status": "approved",
        "timestamp": datetime.now().isoformat()
    }

    return {
        "message": "CX product approval simulated successfully",
        "client_id": client_id,
        "product_approved": True,
        "legal_entity_setup_completed": True,
        "classification_triggered": True,
        "classification_results": classification_results,
        "cx_sync": cx_sync_result,
        "regimes_evaluated": len(regime_list),
        "eligible_regimes": eligible_regimes
    }
