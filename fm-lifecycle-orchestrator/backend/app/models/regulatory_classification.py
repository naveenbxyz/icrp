from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class RegulatoryFramework(str, enum.Enum):
    MIFID_II = "MiFID II"
    EMIR = "EMIR"
    DODD_FRANK = "Dodd-Frank"
    RBI = "RBI"  # Reserve Bank of India
    MAS = "MAS"  # Monetary Authority of Singapore
    HKMA = "HKMA"  # Hong Kong Monetary Authority


class ValidationStatus(str, enum.Enum):
    PENDING = "pending"
    VALIDATED = "validated"
    REJECTED = "rejected"


class RegulatoryClassification(Base):
    __tablename__ = "regulatory_classifications"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    regime = Column(String, nullable=True, index=True)  # e.g., "RBI", "MAS", "HKMA" (for new regimes)
    framework = Column(SQLEnum(RegulatoryFramework), nullable=False)
    classification = Column(String, nullable=False)
    classification_date = Column(DateTime, default=datetime.utcnow)
    last_review_date = Column(DateTime, nullable=True)
    next_review_date = Column(DateTime, nullable=True)
    validation_status = Column(SQLEnum(ValidationStatus), default=ValidationStatus.PENDING)
    validation_notes = Column(Text, nullable=True)
    additional_data = Column(JSON, nullable=True)  # For additional framework-specific data

    # Data quality tracking
    data_quality_score = Column(Float, nullable=True)  # 0-100 score for completeness
    missing_evidences = Column(JSON, nullable=True)  # List of missing mandatory evidence IDs

    # Link to regime eligibility
    regime_eligibility_id = Column(Integer, ForeignKey("regime_eligibilities.id"), nullable=True)

    # Relationships
    client = relationship("Client", back_populates="regulatory_classifications")
    documents = relationship("Document", back_populates="regulatory_classification", cascade="all, delete-orphan")
