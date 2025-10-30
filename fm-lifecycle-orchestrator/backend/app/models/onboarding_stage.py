from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class StageStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class StageName(str, enum.Enum):
    LEGAL_ENTITY_SETUP = "Legal Entity Setup"
    REG_CLASSIFICATION = "Regulatory Classification"
    FM_ACCOUNT_REQUEST = "FM Account Request"
    STATIC_DATA_ENRICHMENT = "Static Data Enrichment"
    SSI_VALIDATION = "SSI Validation"
    VALUATION_SETUP = "Valuation Setup"


class OnboardingStage(Base):
    __tablename__ = "onboarding_stages"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    stage_name = Column(SQLEnum(StageName), nullable=False)
    status = Column(SQLEnum(StageStatus), default=StageStatus.NOT_STARTED)
    assigned_team = Column(String)
    started_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    order = Column(Integer, default=0)

    # Relationships
    client = relationship("Client", back_populates="onboarding_stages")
    tasks = relationship("Task", back_populates="onboarding_stage", cascade="all, delete-orphan")
