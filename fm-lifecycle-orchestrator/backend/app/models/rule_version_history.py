from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class RuleVersionHistory(Base):
    __tablename__ = "rule_version_history"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("classification_rules.id"), nullable=False)
    version = Column(Integer, nullable=False)
    rule_config = Column(JSON, nullable=False)  # Snapshot of rule configuration
    changed_by = Column(String, nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
    change_description = Column(Text, nullable=True)

    # Relationships
    classification_rule = relationship("ClassificationRule", back_populates="version_history")