from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class DocumentRequirement(Base):
    """
    Tracks the actual document requirements for a specific client based on their
    applicable regimes. This is the link between MandatoryEvidence (template)
    and actual client documents.
    """
    __tablename__ = "document_requirements"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    regime = Column(String, nullable=False, index=True)
    evidence_id = Column(Integer, ForeignKey("mandatory_evidences.id"), nullable=False)

    # Document linkage
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)

    # Status tracking
    status = Column(String, default="missing")  # missing, uploaded, expired, pending_review, compliant
    requested_date = Column(DateTime, nullable=True)  # When we requested this from client
    received_date = Column(DateTime, nullable=True)  # When client uploaded
    expiry_date = Column(DateTime, nullable=True)  # When document expires
    last_reminder_date = Column(DateTime, nullable=True)
    reminder_count = Column(Integer, default=0)

    # Notes
    notes = Column(Text, nullable=True)

    created_date = Column(DateTime, default=datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    client = relationship("Client", backref="document_requirements")
    evidence = relationship("MandatoryEvidence", backref="requirements")
    document = relationship("Document", backref="requirement_link")
