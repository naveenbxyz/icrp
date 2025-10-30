from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.client import Client, OnboardingStatus
from ..models.onboarding_stage import OnboardingStage, StageStatus
from ..models.document import Document, OCRStatus
from ..models.task import Task, TaskStatus
from ..schemas.client import ClientCreate, ClientUpdate, ClientResponse, ClientListResponse

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
