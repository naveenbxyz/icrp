"""CX Product Approval API - Simulates product approval from CX system"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import Dict, Any
from ..database import get_db
from ..models.client import Client, OnboardingStatus
from ..models.onboarding_stage import OnboardingStage, StageStatus, StageName
from ..services.classification_engine import ClassificationEngine
from datetime import datetime

router = APIRouter(prefix="/api", tags=["cx-approval"])


def _get_applicable_regimes(client: Client) -> list[str]:
    """
    Determine which regimes are applicable to a client based on their attributes.
    This prevents evaluation against irrelevant regimes (e.g., US regimes for Indian clients).
    """
    client_attrs = client.client_attributes or {}
    booking_location = client_attrs.get("booking_location", "")
    country = client.country_of_incorporation or ""

    # Map of regime to applicable booking locations/countries
    regime_mapping = {
        # India regimes
        "RBI": ["India"],
        "RBI Variation Margin": ["India"],
        "India NDDC TR": ["India"],

        # Singapore regimes
        "MAS Margin": ["Singapore"],
        "MAS Clearing": ["Singapore"],
        "MAS Transaction Reporting": ["Singapore"],
        "MAS FAIR Client Classification": ["Singapore"],

        # Hong Kong regimes
        "HKMA Margin": ["Hong Kong"],
        "HKMA Clearing": ["Hong Kong"],
        "HKMA Transaction Reporting": ["Hong Kong"],

        # US regimes
        "Dodd Frank (US Person - CFTC)": ["United States", "US"],
        "Dodd Frank (SEC)": ["United States", "US"],
        "DF Deemed ISDA": ["United States", "US"],

        # EU regimes (can apply to international clients)
        "MIFID": ["international"],
        "EMIR": ["international"],
        "SFTR": ["international"],

        # Australian regimes
        "ASIC TR": ["Australia"],

        # Other regimes
        "Canadian Transaction Reporting(CAD)": ["Canada"],
        "ZAR MR": ["South Africa"],
        "Indonesia Margin Classification": ["Indonesia"],
        "Stays Exempt": ["international"],  # Can apply to any client
    }

    applicable_regimes = []

    for regime, applicable_locations in regime_mapping.items():
        # Check if regime applies to this client based on booking location or country
        if "international" in applicable_locations:
            applicable_regimes.append(regime)
        else:
            # Check booking location
            for location in applicable_locations:
                if booking_location.startswith(location) or country == location:
                    applicable_regimes.append(regime)
                    break

    return applicable_regimes


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
        # Mark the JSON column as modified so SQLAlchemy persists the change
        flag_modified(client, "client_attributes")

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

    # Commit changes and refresh client to ensure classification engine sees updated data
    db.commit()
    db.refresh(client)

    # Step 4: Trigger classification against applicable regimes only
    engine = ClassificationEngine(db)

    # Intelligently filter regimes based on client's booking location and country
    applicable_regimes = _get_applicable_regimes(client)

    classification_results = {}
    eligible_regimes = []

    for regime in applicable_regimes:
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
        "regimes_evaluated": len(applicable_regimes),
        "eligible_regimes": eligible_regimes
    }
