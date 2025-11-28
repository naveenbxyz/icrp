from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from ..database import get_db
from ..models.client import Client, OnboardingStatus
from ..models.onboarding_stage import OnboardingStage, StageStatus
from ..models.document import Document, OCRStatus, DocumentCategory
from ..models.task import Task, TaskStatus
from ..schemas.client import ClientCreate, ClientUpdate, ClientResponse, ClientListResponse
from ..services.ai_service import ai_service

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("", response_model=List[ClientListResponse])
def list_clients(
    status: Optional[OnboardingStatus] = None,
    jurisdiction: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all clients with optional filters"""
    query = db.query(Client)

    if status:
        query = query.filter(Client.onboarding_status == status)
    if jurisdiction:
        query = query.filter(Client.jurisdiction.ilike(f"%{jurisdiction}%"))
    if search:
        query = query.filter(
            (Client.name.ilike(f"%{search}%")) |
            (Client.legal_entity_id.ilike(f"%{search}%"))
        )

    clients = query.all()

    # Enrich with additional info
    result = []
    for client in clients:
        # Find current stage
        in_progress_stage = db.query(OnboardingStage).filter(
            OnboardingStage.client_id == client.id,
            OnboardingStage.status == StageStatus.IN_PROGRESS
        ).first()

        current_stage = in_progress_stage.stage_name.value if in_progress_stage else None

        # Count blocked tasks
        blocked_tasks = db.query(Task).filter(
            Task.client_id == client.id,
            Task.status == TaskStatus.PENDING
        ).count()

        # Count pending documents
        pending_docs = db.query(Document).filter(
            Document.client_id == client.id,
            Document.ocr_status == OCRStatus.PENDING
        ).count()

        client_data = ClientListResponse(
            **client.__dict__,
            current_stage=current_stage,
            blocked_tasks_count=blocked_tasks,
            pending_documents_count=pending_docs
        )
        result.append(client_data)

    return result


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: int, db: Session = Depends(get_db)):
    """Get client details"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.post("", response_model=ClientResponse)
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    """Create a new client"""
    # Check if legal_entity_id already exists
    existing = db.query(Client).filter(Client.legal_entity_id == client.legal_entity_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Client with this legal entity ID already exists")

    db_client = Client(**client.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client


@router.put("/{client_id}", response_model=ClientResponse)
def update_client(client_id: int, client_update: ClientUpdate, db: Session = Depends(get_db)):
    """Update client details"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = client_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db)):
    """Delete a client"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    db.delete(client)
    db.commit()
    return {"message": "Client deleted successfully"}


@router.get("/{client_id}/risk-score")
def get_client_risk_score(client_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get AI-powered compliance risk score for a client.

    Analyzes document completeness, data quality, jurisdiction risk,
    entity complexity, and onboarding status to calculate risk.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Gather document status
    documents = db.query(Document).filter(Document.client_id == client_id).all()
    total_docs = len(documents)
    verified_docs = len([d for d in documents if d.ai_validation_result and
                         d.ai_validation_result.get("validation_status") == "verified"])
    pending_docs = len([d for d in documents if d.ocr_status == OCRStatus.PENDING or
                        (d.ai_validation_result and
                         d.ai_validation_result.get("validation_status") == "needs_review")])

    # Estimate missing docs (simplified - would be based on requirements)
    total_required = 10  # Typical requirement count
    missing_docs = max(0, total_required - total_docs)

    document_status = {
        "total": total_docs,
        "verified": verified_docs,
        "pending": pending_docs,
        "missing_count": missing_docs,
        "pending_count": pending_docs,
        "total_required": total_required
    }

    # Get data quality scores (simplified - would query from regimes API)
    # For demo, simulate reasonable scores
    data_quality_scores = {
        "legal_name": 0.95,
        "jurisdiction": 0.92,
        "entity_type": 0.88,
        "regulatory_classification": 0.85
    }

    # Prepare client data
    client_data = {
        "name": client.name,
        "jurisdiction": client.jurisdiction or "Unknown",
        "entity_type": client.entity_type or "Unknown",
        "onboarding_status": client.onboarding_status.value if client.onboarding_status else "in_progress"
    }

    # Calculate risk score using AI service
    risk_result = ai_service.calculate_compliance_risk_score(
        client_data=client_data,
        document_status=document_status,
        data_quality_scores=data_quality_scores
    )

    return risk_result


@router.get("/{client_id}/consistency-check")
def check_client_consistency(client_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Check document consistency for a client using AI.
    Identifies mismatches in legal names, jurisdictions, and other entities across documents.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Get all documents for this client
    documents = db.query(Document).filter(Document.client_id == client_id).all()

    # Prepare client data
    client_data = {
        "name": client.name,
        "jurisdiction": client.jurisdiction or "Unknown",
        "entity_type": client.entity_type or "Unknown"
    }

    # Prepare documents data
    documents_data = [
        {
            "id": doc.id,
            "ai_validation_result": doc.ai_validation_result
        }
        for doc in documents
    ]

    # Check consistency using AI service
    consistency_result = ai_service.check_document_consistency(
        client_data=client_data,
        documents_data=documents_data
    )

    return consistency_result


@router.post("/search")
def natural_language_search(query_request: dict, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Natural language search for clients using AI-powered query parsing.
    Converts natural language into structured filters.
    """
    query = query_request.get("query", "")

    # Parse natural language query
    parsed_query = ai_service.parse_natural_language_search(query)

    # Note: In a full implementation, we would use the parsed filters to query the database
    # For demo purposes, we return the parsed query structure
    # The frontend can use this to display what the AI understood from the query

    return parsed_query
