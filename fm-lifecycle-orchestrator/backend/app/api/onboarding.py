from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models.onboarding_stage import OnboardingStage, StageStatus
from ..schemas.onboarding import OnboardingStageResponse, OnboardingStageUpdate

router = APIRouter(prefix="/api", tags=["onboarding"])


@router.get("/clients/{client_id}/onboarding", response_model=List[OnboardingStageResponse])
def get_client_onboarding_stages(client_id: int, db: Session = Depends(get_db)):
    """Get all onboarding stages for a client"""
    stages = db.query(OnboardingStage).filter(
        OnboardingStage.client_id == client_id
    ).order_by(OnboardingStage.order).all()

    return stages


@router.put("/onboarding/{stage_id}", response_model=OnboardingStageResponse)
def update_onboarding_stage(
    stage_id: int,
    stage_update: OnboardingStageUpdate,
    db: Session = Depends(get_db)
):
    """Update an onboarding stage"""
    stage = db.query(OnboardingStage).filter(OnboardingStage.id == stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Onboarding stage not found")

    update_data = stage_update.model_dump(exclude_unset=True)

    # Auto-set dates based on status changes
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == StageStatus.IN_PROGRESS and not stage.started_date:
            update_data["started_date"] = datetime.utcnow()
        elif new_status == StageStatus.COMPLETED and not stage.completed_date:
            update_data["completed_date"] = datetime.utcnow()

    for field, value in update_data.items():
        setattr(stage, field, value)

    db.commit()
    db.refresh(stage)
    return stage
