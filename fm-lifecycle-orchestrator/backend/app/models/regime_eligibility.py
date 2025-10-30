from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class RegimeEligibility(Base):
    """
    Tracks client eligibility for different regulatory regimes based on classification rules.
    """
    __tablename__ = "regime_eligibilities"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False, index=True)
    regime = Column(String, nullable=False, index=True)  # e.g., "RBI", "MAS", "HKMA"
    is_eligible = Column(Boolean, nullable=False, default=False)
    eligibility_reason = Column(String, nullable=True)  # Why eligible or not
    matched_rules = Column(JSON, nullable=True)  # List of rule IDs that matched
    unmatched_rules = Column(JSON, nullable=True)  # List of rule IDs that didn't match
    client_attributes = Column(JSON, nullable=True)  # Snapshot of client data used for evaluation
    rule_version = Column(Integer, nullable=True)  # Version of rules used for evaluation
    last_evaluated_date = Column(DateTime, default=datetime.utcnow)
    created_date = Column(DateTime, default=datetime.utcnow)

    # Relationships
    client = relationship("Client", back_populates="regime_eligibilities")
