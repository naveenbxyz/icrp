from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class DocumentCategory(str, enum.Enum):
    CLIENT_CONFIRMATION = "client_confirmation"
    RM_ATTESTATION = "rm_attestation"
    ENTITY_DOCUMENTATION = "entity_documentation"
    PRODUCT_ELIGIBILITY = "product_eligibility"
    FINANCIAL_STATEMENTS = "financial_statements"
    REGISTRATION_CERTIFICATE = "registration_certificate"
    ARTICLES_OF_INCORPORATION = "articles_of_incorporation"
    BOARD_RESOLUTION = "board_resolution"
    KYC_DOCUMENTATION = "kyc_documentation"
    PRODUCT_AGREEMENT = "product_agreement"
    DUE_DILIGENCE_REPORT = "due_diligence_report"
    COMPLIANCE_CERTIFICATE = "compliance_certificate"
    RISK_ASSESSMENT = "risk_assessment"
    OTHER = "other"


class OCRStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    regulatory_classification_id = Column(Integer, ForeignKey("regulatory_classifications.id"), nullable=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(String)
    document_category = Column(SQLEnum(DocumentCategory), default=DocumentCategory.OTHER)
    ocr_status = Column(SQLEnum(OCRStatus), default=OCRStatus.PENDING)
    extracted_text = Column(Text, nullable=True)
    ai_validation_result = Column(JSON, nullable=True)  # Stores AI analysis results

    # Relationships
    client = relationship("Client", back_populates="documents")
    regulatory_classification = relationship("RegulatoryClassification", back_populates="documents")
