from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from ..models.task import TaskStatus, TaskType


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_team: Optional[str] = None
    task_type: TaskType = TaskType.MANUAL
    due_date: Optional[datetime] = None


class TaskCreate(TaskBase):
    client_id: int
    onboarding_stage_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_team: Optional[str] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None


class TaskResponse(TaskBase):
    id: int
    client_id: int
    onboarding_stage_id: Optional[int] = None
    status: TaskStatus
    completed_date: Optional[datetime] = None
    created_date: datetime

    model_config = ConfigDict(from_attributes=True)
