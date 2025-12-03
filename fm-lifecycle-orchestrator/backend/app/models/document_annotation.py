"""
Document Annotation Model - Stores AI-extracted entities with coordinates for visual highlighting
"""
from sqlalchemy import Column, Integer, String, Float, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class DocumentAnnotation(Base):
    """
    Stores extracted entities from documents with bounding box coordinates
    for visual annotation and audit trail
    """
    __tablename__ = "document_annotations"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)

    # Entity information
    entity_type = Column(String, nullable=False)  # legal_name, jurisdiction, registration_date, etc.
    entity_label = Column(String, nullable=False)  # Display name: "Client Name", "Jurisdiction"
    extracted_value = Column(String, nullable=False)  # The actual extracted text
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0

    # Coordinates for visual highlighting
    page_number = Column(Integer, nullable=False)
    bounding_box = Column(JSON, nullable=False)  # {"x": 120, "y": 340, "width": 200, "height": 18}

    # Verification status
    status = Column(String, default="auto_extracted")  # auto_extracted, verified, corrected, rejected
    corrected_value = Column(String, nullable=True)  # User correction if needed
    verified_by = Column(String, nullable=True)  # Username who verified
    verified_at = Column(DateTime, nullable=True)  # When it was verified
    notes = Column(String, nullable=True)  # Any additional notes

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    document = relationship("Document", back_populates="annotations")

    def __repr__(self):
        return f"<DocumentAnnotation(id={self.id}, entity_type='{self.entity_type}', value='{self.extracted_value}', confidence={self.confidence})>"
