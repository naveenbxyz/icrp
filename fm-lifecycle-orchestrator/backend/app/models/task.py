from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class TaskType(str, enum.Enum):
    MANUAL = "manual"
    AUTOMATED = "automated"
    REVIEW = "review"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    onboarding_stage_id = Column(Integer, ForeignKey("onboarding_stages.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    assigned_to = Column(String, nullable=True)
    assigned_team = Column(String, nullable=True)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING)
    task_type = Column(SQLEnum(TaskType), default=TaskType.MANUAL)
    due_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow)

    # Relationships
    client = relationship("Client", back_populates="tasks")
    onboarding_stage = relationship("OnboardingStage", back_populates="tasks")
