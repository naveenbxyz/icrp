from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class ClassificationRule(Base):
    """
    Stores classification rules for different regulatory regimes.
    Rules determine client eligibility based on various criteria.
    """
    __tablename__ = "classification_rules"

    id = Column(Integer, primary_key=True, index=True)
    regime = Column(String, nullable=False, index=True)  # e.g., "RBI", "MAS", "HKMA"
    rule_type = Column(String, nullable=False)  # e.g., "account_type", "booking_location", "product_grid"
    rule_name = Column(String, nullable=False)
    rule_config = Column(JSON, nullable=False)  # Stores rule criteria and values
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    version = Column(Integer, default=1)
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String, nullable=True)

    # Relationships
    version_history = relationship("RuleVersionHistory", back_populates="classification_rule")
