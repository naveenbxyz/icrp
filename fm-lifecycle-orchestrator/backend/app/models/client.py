from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
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

    # Relationships
    onboarding_stages = relationship("OnboardingStage", back_populates="client", cascade="all, delete-orphan")
    regulatory_classifications = relationship("RegulatoryClassification", back_populates="client", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="client", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="client", cascade="all, delete-orphan")
    regime_eligibilities = relationship("RegimeEligibility", back_populates="client", cascade="all, delete-orphan")
