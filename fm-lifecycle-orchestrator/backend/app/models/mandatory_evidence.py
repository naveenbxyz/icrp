from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Enum as SQLEnum
from datetime import datetime
import enum
from ..database import Base


class EvidenceCategory(str, enum.Enum):
    """Categories of mandatory evidence documents"""
    ACCOUNT_OPENING = "account_opening"
    KYC_DOCUMENTATION = "kyc_documentation"
    PRODUCT_APPROVAL = "product_approval"
    RISK_ASSESSMENT = "risk_assessment"
    REGULATORY_COMPLIANCE = "regulatory_compliance"
    LEGAL_AGREEMENTS = "legal_agreements"
    OTHER = "other"


class MandatoryEvidence(Base):
    """
    Defines mandatory evidence/documentation requirements for each regulatory regime.
    """
    __tablename__ = "mandatory_evidences"

    id = Column(Integer, primary_key=True, index=True)
    regime = Column(String, nullable=False, index=True)  # e.g., "RBI", "MAS", "HKMA"
    evidence_type = Column(String, nullable=False)  # Unique identifier for evidence type
    evidence_name = Column(String, nullable=False)  # Display name
    category = Column(SQLEnum(EvidenceCategory), default=EvidenceCategory.OTHER)
    description = Column(Text, nullable=True)
    is_mandatory = Column(Boolean, default=True)
    validity_days = Column(Integer, nullable=True)  # How long the evidence is valid (null = no expiry)
    is_active = Column(Boolean, default=True)
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
