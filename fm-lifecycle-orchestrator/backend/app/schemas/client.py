from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from ..models.client import OnboardingStatus


class ClientBase(BaseModel):
    name: str
    legal_entity_id: str
    country_of_incorporation: Optional[str] = None
    entity_type: Optional[str] = None
    assigned_rm: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    country_of_incorporation: Optional[str] = None
    entity_type: Optional[str] = None
    onboarding_status: Optional[OnboardingStatus] = None
    assigned_rm: Optional[str] = None


class ClientResponse(ClientBase):
    id: int
    onboarding_status: OnboardingStatus
    created_date: datetime
    last_updated: datetime
    cumulative_tat_hours: Optional[float] = None
    cumulative_tat_days: Optional[float] = None
    expected_completion_date: Optional[datetime] = None
    cx_sync_status: Optional[str] = None
    cx_sync_date: Optional[datetime] = None
    cx_reference_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ClientListResponse(ClientResponse):
    """Extended response for list view with aggregated info"""
    current_stage: Optional[str] = None
    blocked_tasks_count: int = 0
    pending_documents_count: int = 0

    model_config = ConfigDict(from_attributes=True)
