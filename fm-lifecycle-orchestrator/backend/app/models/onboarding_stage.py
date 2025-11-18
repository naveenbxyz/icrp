from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
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

    # TAT tracking fields
    tat_hours = Column(Float, nullable=True)  # Turnaround time in hours (calculated)
    target_tat_hours = Column(Float, nullable=True)  # Target/SLA TAT in hours

    # Relationships
    client = relationship("Client", back_populates="onboarding_stages")
    tasks = relationship("Task", back_populates="onboarding_stage", cascade="all, delete-orphan")

    @hybrid_property
    def tat_days(self):
        """Calculate TAT in days (for display purposes)"""
        if self.tat_hours is not None:
            return round(self.tat_hours / 24, 1)
        return None

    @hybrid_property
    def is_overdue(self):
        """Check if stage exceeded target TAT"""
        if self.tat_hours is not None and self.target_tat_hours is not None:
            return self.tat_hours > self.target_tat_hours
        return False

    def calculate_tat(self):
        """Calculate TAT based on started_date and completed_date (or current time if in progress)"""
        if self.started_date:
            end_time = self.completed_date if self.completed_date else datetime.utcnow()
            delta = end_time - self.started_date
            self.tat_hours = round(delta.total_seconds() / 3600, 2)  # Convert to hours
        return self.tat_hours
