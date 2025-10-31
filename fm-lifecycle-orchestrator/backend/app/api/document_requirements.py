from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
from ..database import get_db
from ..models.client import Client
from ..models.document import Document
from ..models.mandatory_evidence import MandatoryEvidence
from ..models.regime_eligibility import RegimeEligibility
from ..models.document_requirement import DocumentRequirement

router = APIRouter(prefix="/api", tags=["document-requirements"])


# Schemas
class DocumentRequirementResponse(BaseModel):
    id: int
    client_id: int
    regime: str
    evidence_id: int
    evidence_name: str
    evidence_type: str
    category: str
    description: Optional[str]
    is_mandatory: bool
    validity_days: Optional[int]
    status: str  # missing, uploaded, expired, pending_review, compliant
    document_id: Optional[int]
    document_filename: Optional[str]
    requested_date: Optional[datetime]
    received_date: Optional[datetime]
    expiry_date: Optional[datetime]
    last_reminder_date: Optional[datetime]
    reminder_count: int
    notes: Optional[str]

    class Config:
        from_attributes = True


class ClientDocumentSummary(BaseModel):
    client_id: int
    client_name: str
    regimes: List[str]
    total_requirements: int
    compliant_count: int
    missing_count: int
    expired_count: int
    pending_review_count: int
    compliance_percentage: float


class RegimeDocumentStatus(BaseModel):
    regime: str
    total_requirements: int
    compliant_count: int
    missing_count: int
    expired_count: int
    requirements: List[DocumentRequirementResponse]


class EmailRequest(BaseModel):
    to_email: EmailStr
    cc_emails: Optional[List[EmailStr]] = []
    subject: str
    body: str
    document_ids: List[int]  # Which documents are being requested


class BulkEmailRequest(BaseModel):
    to_email: EmailStr
    cc_emails: Optional[List[EmailStr]] = []


@router.get("/clients/{client_id}/document-requirements")
def get_client_document_requirements(
    client_id: int,
    regime: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all document requirements for a client, optionally filtered by regime and status.
    Returns a summary and detailed requirements.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Get client's eligible regimes
    eligibilities = db.query(RegimeEligibility).filter(
        and_(
            RegimeEligibility.client_id == client_id,
            RegimeEligibility.is_eligible == True
        )
    ).all()

    eligible_regimes = [e.regime for e in eligibilities]

    if not eligible_regimes:
        return {
            "client_id": client_id,
            "client_name": client.name,
            "regimes": [],
            "total_requirements": 0,
            "message": "No eligible regimes found for this client"
        }

    # Initialize or sync document requirements for eligible regimes
    _sync_document_requirements(client_id, eligible_regimes, db)

    # Build query
    query = db.query(
        DocumentRequirement,
        MandatoryEvidence
    ).join(
        MandatoryEvidence,
        DocumentRequirement.evidence_id == MandatoryEvidence.id
    ).filter(
        DocumentRequirement.client_id == client_id
    )

    if regime:
        query = query.filter(DocumentRequirement.regime == regime)

    if status:
        query = query.filter(DocumentRequirement.status == status)

    results = query.all()

    # Build response
    requirements_by_regime = {}
    for req, evidence in results:
        if req.regime not in requirements_by_regime:
            requirements_by_regime[req.regime] = []

        # Get document info if linked
        doc_filename = None
        if req.document_id:
            doc = db.query(Document).filter(Document.id == req.document_id).first()
            if doc:
                doc_filename = doc.filename

        requirement_data = DocumentRequirementResponse(
            id=req.id,
            client_id=req.client_id,
            regime=req.regime,
            evidence_id=req.evidence_id,
            evidence_name=evidence.evidence_name,
            evidence_type=evidence.evidence_type,
            category=evidence.category.value,
            description=evidence.description,
            is_mandatory=evidence.is_mandatory,
            validity_days=evidence.validity_days,
            status=req.status,
            document_id=req.document_id,
            document_filename=doc_filename,
            requested_date=req.requested_date,
            received_date=req.received_date,
            expiry_date=req.expiry_date,
            last_reminder_date=req.last_reminder_date,
            reminder_count=req.reminder_count,
            notes=req.notes
        )
        requirements_by_regime[req.regime].append(requirement_data)

    # Calculate statistics
    regime_summaries = []
    total_reqs = 0
    total_compliant = 0
    total_missing = 0
    total_expired = 0
    total_pending = 0

    for regime_name, reqs in requirements_by_regime.items():
        regime_compliant = sum(1 for r in reqs if r.status == "compliant")
        regime_missing = sum(1 for r in reqs if r.status == "missing")
        regime_expired = sum(1 for r in reqs if r.status == "expired")
        regime_pending = sum(1 for r in reqs if r.status == "pending_review")

        regime_summaries.append(RegimeDocumentStatus(
            regime=regime_name,
            total_requirements=len(reqs),
            compliant_count=regime_compliant,
            missing_count=regime_missing,
            expired_count=regime_expired,
            requirements=reqs
        ))

        total_reqs += len(reqs)
        total_compliant += regime_compliant
        total_missing += regime_missing
        total_expired += regime_expired
        total_pending += regime_pending

    compliance_pct = (total_compliant / total_reqs * 100) if total_reqs > 0 else 0

    return {
        "summary": ClientDocumentSummary(
            client_id=client_id,
            client_name=client.name,
            regimes=eligible_regimes,
            total_requirements=total_reqs,
            compliant_count=total_compliant,
            missing_count=total_missing,
            expired_count=total_expired,
            pending_review_count=total_pending,
            compliance_percentage=round(compliance_pct, 2)
        ),
        "regimes": regime_summaries
    }


@router.post("/clients/{client_id}/document-requirements/sync")
def sync_client_document_requirements(client_id: int, db: Session = Depends(get_db)):
    """
    Manually trigger sync of document requirements for a client based on their eligible regimes.
    This should be called when a client's regime eligibility changes.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Get client's eligible regimes
    eligibilities = db.query(RegimeEligibility).filter(
        and_(
            RegimeEligibility.client_id == client_id,
            RegimeEligibility.is_eligible == True
        )
    ).all()

    eligible_regimes = [e.regime for e in eligibilities]
    _sync_document_requirements(client_id, eligible_regimes, db)

    return {"message": f"Synced document requirements for {len(eligible_regimes)} regimes"}


@router.post("/clients/{client_id}/document-requirements/{requirement_id}/link")
def link_document_to_requirement(
    client_id: int,
    requirement_id: int,
    document_id: int,
    db: Session = Depends(get_db)
):
    """Link an uploaded document to a requirement"""
    requirement = db.query(DocumentRequirement).filter(
        and_(
            DocumentRequirement.id == requirement_id,
            DocumentRequirement.client_id == client_id
        )
    ).first()

    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    document = db.query(Document).filter(
        and_(
            Document.id == document_id,
            Document.client_id == client_id
        )
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Link document
    requirement.document_id = document_id
    requirement.received_date = datetime.utcnow()
    requirement.status = "uploaded"

    # Calculate expiry if validity days specified
    evidence = db.query(MandatoryEvidence).filter(
        MandatoryEvidence.id == requirement.evidence_id
    ).first()

    if evidence and evidence.validity_days:
        requirement.expiry_date = datetime.utcnow() + timedelta(days=evidence.validity_days)

    db.commit()
    db.refresh(requirement)

    return {"message": "Document linked successfully", "requirement_id": requirement_id}


@router.post("/clients/{client_id}/document-requirements/{requirement_id}/request")
def mark_document_requested(
    client_id: int,
    requirement_id: int,
    db: Session = Depends(get_db)
):
    """Mark a document as requested from client"""
    requirement = db.query(DocumentRequirement).filter(
        and_(
            DocumentRequirement.id == requirement_id,
            DocumentRequirement.client_id == client_id
        )
    ).first()

    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    requirement.requested_date = datetime.utcnow()
    requirement.last_reminder_date = datetime.utcnow()
    requirement.reminder_count += 1

    db.commit()

    return {"message": "Document marked as requested"}


@router.post("/clients/{client_id}/send-document-request")
def send_document_request_email(
    client_id: int,
    email_request: EmailRequest,
    db: Session = Depends(get_db)
):
    """
    Send email to client requesting specific documents.
    In production, this would integrate with an email service like SendGrid, SES, etc.
    For now, we'll simulate the email and update the tracking.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Mark all requested documents as requested
    for doc_id in email_request.document_ids:
        requirement = db.query(DocumentRequirement).filter(
            and_(
                DocumentRequirement.id == doc_id,
                DocumentRequirement.client_id == client_id
            )
        ).first()

        if requirement:
            requirement.requested_date = datetime.utcnow()
            requirement.last_reminder_date = datetime.utcnow()
            requirement.reminder_count += 1

    db.commit()

    # TODO: Integrate with actual email service
    # For now, just log the email details
    email_log = {
        "to": email_request.to_email,
        "cc": email_request.cc_emails,
        "subject": email_request.subject,
        "body": email_request.body,
        "document_count": len(email_request.document_ids),
        "sent_at": datetime.utcnow().isoformat(),
        "status": "simulated_success"
    }

    return {
        "message": "Email sent successfully (simulated)",
        "email_log": email_log,
        "documents_requested": len(email_request.document_ids)
    }


@router.post("/clients/{client_id}/send-bulk-document-request")
def send_bulk_document_request(
    client_id: int,
    email_request: BulkEmailRequest,
    db: Session = Depends(get_db)
):
    """
    Send email requesting ALL missing mandatory documents from client.
    Auto-generates email content based on missing documents.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Get all missing mandatory documents
    missing_requirements = db.query(
        DocumentRequirement,
        MandatoryEvidence
    ).join(
        MandatoryEvidence,
        DocumentRequirement.evidence_id == MandatoryEvidence.id
    ).filter(
        and_(
            DocumentRequirement.client_id == client_id,
            DocumentRequirement.status == "missing",
            MandatoryEvidence.is_mandatory == True
        )
    ).all()

    if not missing_requirements:
        return {"message": "No missing mandatory documents found"}

    # Build email content
    doc_list = []
    for req, evidence in missing_requirements:
        doc_list.append(f"  - {evidence.evidence_name} ({evidence.category.value}) - {evidence.description or 'Required for ' + req.regime}")

    email_body = f"""
Dear {client.name} Team,

As part of your onboarding process, we require the following mandatory documents to comply with regulatory requirements:

{chr(10).join(doc_list)}

Please upload these documents at your earliest convenience to avoid any delays in account activation.

If you have any questions, please contact your Relationship Manager: {client.assigned_rm}

Best regards,
FM Client Readiness Team
    """.strip()

    subject = f"Action Required: Missing Regulatory Documents for {client.name}"

    # Mark all as requested
    for req, evidence in missing_requirements:
        req.requested_date = datetime.utcnow()
        req.last_reminder_date = datetime.utcnow()
        req.reminder_count += 1

    db.commit()

    email_log = {
        "to": email_request.to_email,
        "cc": email_request.cc_emails,
        "subject": subject,
        "body": email_body,
        "document_count": len(missing_requirements),
        "sent_at": datetime.utcnow().isoformat(),
        "status": "simulated_success"
    }

    return {
        "message": f"Bulk email sent successfully (simulated) - {len(missing_requirements)} documents requested",
        "email_log": email_log
    }


def _sync_document_requirements(client_id: int, regimes: List[str], db: Session):
    """
    Internal helper to sync document requirements for a client.
    Creates DocumentRequirement records for each mandatory evidence applicable to client's regimes.
    """
    for regime in regimes:
        # Get all mandatory evidences for this regime
        evidences = db.query(MandatoryEvidence).filter(
            and_(
                MandatoryEvidence.regime == regime,
                MandatoryEvidence.is_active == True
            )
        ).all()

        for evidence in evidences:
            # Check if requirement already exists
            existing = db.query(DocumentRequirement).filter(
                and_(
                    DocumentRequirement.client_id == client_id,
                    DocumentRequirement.regime == regime,
                    DocumentRequirement.evidence_id == evidence.id
                )
            ).first()

            if not existing:
                # Create new requirement
                requirement = DocumentRequirement(
                    client_id=client_id,
                    regime=regime,
                    evidence_id=evidence.id,
                    status="missing"
                )
                db.add(requirement)

    db.commit()
