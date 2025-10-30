from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from ..models.onboarding_stage import StageStatus, StageName


class OnboardingStageBase(BaseModel):
    stage_name: StageName
    status: StageStatus
    assigned_team: Optional[str] = None
    notes: Optional[str] = None


class OnboardingStageUpdate(BaseModel):
    status: Optional[StageStatus] = None
    assigned_team: Optional[str] = None
    notes: Optional[str] = None
    started_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None


class OnboardingStageResponse(OnboardingStageBase):
    id: int
    client_id: int
    started_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    order: int

    model_config = ConfigDict(from_attributes=True)
