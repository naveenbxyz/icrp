from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime
import enum
from ..database import Base


class OnboardingStatus(str, enum.Enum):
    INITIATED = "initiated"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    legal_entity_id = Column(String, unique=True, index=True)
    jurisdiction = Column(String)
    entity_type = Column(String)
    onboarding_status = Column(SQLEnum(OnboardingStatus), default=OnboardingStatus.INITIATED)
    created_date = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    assigned_rm = Column(String)

    # Client attributes for classification rules
    client_attributes = Column(JSON, nullable=True)  # Stores account_type, booking_location, product_grid, etc.

    # TAT tracking fields
    cumulative_tat_hours = Column(Float, nullable=True)  # Total end-to-end onboarding TAT
    expected_completion_date = Column(DateTime, nullable=True)  # Expected completion based on target TATs

    # Relationships
    onboarding_stages = relationship("OnboardingStage", back_populates="client", cascade="all, delete-orphan")
    regulatory_classifications = relationship("RegulatoryClassification", back_populates="client", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="client", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="client", cascade="all, delete-orphan")
    regime_eligibilities = relationship("RegimeEligibility", back_populates="client", cascade="all, delete-orphan")

    @hybrid_property
    def cumulative_tat_days(self):
        """Calculate cumulative TAT in days (for display purposes)"""
        if self.cumulative_tat_hours is not None:
            return round(self.cumulative_tat_hours / 24, 1)
        return None

    def calculate_cumulative_tat(self):
        """Calculate total end-to-end TAT from all completed stages"""
        if not self.onboarding_stages:
            return None

        # Sum up TAT from all stages
        total_hours = 0
        for stage in self.onboarding_stages:
            if stage.tat_hours:
                total_hours += stage.tat_hours

        self.cumulative_tat_hours = round(total_hours, 2) if total_hours > 0 else None
        return self.cumulative_tat_hours
