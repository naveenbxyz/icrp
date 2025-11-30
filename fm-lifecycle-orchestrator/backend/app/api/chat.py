from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import joinedload

from ..database import get_db
from ..models.client import Client
from ..models.document import Document
from ..models.onboarding_stage import OnboardingStage
from ..models.regulatory_classification import RegulatoryClassification
from ..models.task import Task
from ..services.ai_service import ai_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    """Request model for chat messages"""
    message: str
    client_id: Optional[int] = None


class ChatResponse(BaseModel):
    """Response model for chat messages"""
    message: str
    suggestions: list[str]
    topic: str
    timestamp: str
    context: Optional[dict] = None


def fetch_full_client_data(client_id: int, db: Session) -> dict:
    """
    Fetch complete client data including all related entities for RAG context.
    """
    client = db.query(Client).options(
        joinedload(Client.documents),
        joinedload(Client.onboarding_stages),
        joinedload(Client.regulatory_classifications),
        joinedload(Client.tasks)
    ).filter(Client.id == client_id).first()

    if not client:
        return None

    # Convert to dictionary with all related data
    client_data = {
        "id": client.id,
        "name": client.name,
        "legal_entity_id": client.legal_entity_id,
        "jurisdiction": client.country_of_incorporation,
        "entity_type": client.entity_type,
        "onboarding_status": client.onboarding_status.value if client.onboarding_status else None,
        "assigned_rm": client.assigned_rm,
        "created_date": client.created_date.isoformat() if client.created_date else None,
        "last_updated": client.last_updated.isoformat() if client.last_updated else None,
        "client_attributes": client.client_attributes,
        "cumulative_tat_hours": client.cumulative_tat_hours,
        "documents": [],
        "onboarding_stages": [],
        "regulatory_classifications": [],
        "tasks": []
    }

    # Add documents
    for doc in client.documents:
        doc_data = {
            "id": doc.id,
            "document_category": doc.document_category.value if doc.document_category else None,
            "ocr_status": doc.ocr_status.value if doc.ocr_status else None,
            "filename": doc.filename,
            "file_type": doc.file_type,
            "upload_date": doc.upload_date.isoformat() if doc.upload_date else None,
            "uploaded_by": doc.uploaded_by,
            "ai_validation_result": doc.ai_validation_result
        }
        client_data["documents"].append(doc_data)

    # Add onboarding stages
    for stage in client.onboarding_stages:
        stage_data = {
            "id": stage.id,
            "stage_name": stage.stage_name.value if stage.stage_name else None,
            "status": stage.status.value if stage.status else None,
            "assigned_team": stage.assigned_team,
            "order": stage.order,
            "tat_hours": stage.tat_hours,
            "target_tat_hours": stage.target_tat_hours,
            "started_date": stage.started_date.isoformat() if stage.started_date else None,
            "completed_date": stage.completed_date.isoformat() if stage.completed_date else None,
            "notes": stage.notes
        }
        client_data["onboarding_stages"].append(stage_data)

    # Add regulatory classifications
    for classification in client.regulatory_classifications:
        class_data = {
            "id": classification.id,
            "regime": classification.regime,
            "framework": classification.framework.value if classification.framework else None,
            "classification": classification.classification,
            "data_quality_score": classification.data_quality_score,
            "validation_status": classification.validation_status.value if classification.validation_status else None,
            "classification_date": classification.classification_date.isoformat() if classification.classification_date else None,
            "last_review_date": classification.last_review_date.isoformat() if classification.last_review_date else None,
            "validation_notes": classification.validation_notes
        }
        client_data["regulatory_classifications"].append(class_data)

    # Add tasks
    for task in client.tasks:
        task_data = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status.value if task.status else None,
            "task_type": task.task_type.value if task.task_type else None,
            "assigned_to": task.assigned_to,
            "assigned_team": task.assigned_team,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "completed_date": task.completed_date.isoformat() if task.completed_date else None,
            "created_date": task.created_date.isoformat() if task.created_date else None
        }
        client_data["tasks"].append(task_data)

    return client_data


@router.post("", response_model=ChatResponse)
def send_chat_message(
    chat_request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Send a message to the AI chat assistant.
    Optionally include client_id for context-aware responses with RAG.
    """
    print(f"📨 Chat request received:")
    print(f"   - Message: {chat_request.message[:50]}...")
    print(f"   - Client ID: {chat_request.client_id}")

    context = {}
    full_client_data = None

    # Fetch full client data if client_id is provided (for RAG)
    if chat_request.client_id:
        print(f"🔍 Fetching full client data for client_id={chat_request.client_id}")
        full_client_data = fetch_full_client_data(chat_request.client_id, db)
        if full_client_data:
            print(f"✅ Client data fetched: {full_client_data.get('name', 'Unknown')}")
        else:
            print(f"❌ Client not found for id={chat_request.client_id}")

        if full_client_data:
            # Simple context for backward compatibility
            context = {
                "client_id": full_client_data["id"],
                "client_name": full_client_data["name"],
                "jurisdiction": full_client_data["jurisdiction"],
                "onboarding_status": full_client_data["onboarding_status"]
            }

    # Get AI response (will use LLM with RAG if enabled and full_client_data is provided)
    ai_response = ai_service.chat_with_assistant(
        message=chat_request.message,
        context=context,
        full_client_data=full_client_data
    )

    return ChatResponse(
        message=ai_response["message"],
        suggestions=ai_response["suggestions"],
        topic=ai_response["topic"],
        timestamp=ai_response["timestamp"],
        context=context if context else None
    )


@router.get("/suggestions", response_model=list[dict])
def get_chat_suggestions(client_id: Optional[int] = None):
    """
    Get suggested chat prompts based on context.
    Returns different suggestions for general vs client-specific context.
    """
    if client_id:
        # Client-specific suggestions
        return [
            {
                "id": "doc-status",
                "text": "What's the document status?",
                "category": "document"
            },
            {
                "id": "onboarding-progress",
                "text": "Show onboarding progress",
                "category": "onboarding"
            },
            {
                "id": "risk-score",
                "text": "What's the compliance risk score?",
                "category": "compliance"
            },
            {
                "id": "missing-docs",
                "text": "What documents are missing?",
                "category": "document"
            },
            {
                "id": "next-steps",
                "text": "What are the next steps?",
                "category": "onboarding"
            }
        ]
    else:
        # General suggestions
        return [
            {
                "id": "help",
                "text": "What can you help me with?",
                "category": "general"
            },
            {
                "id": "ai-validation",
                "text": "How does AI validation work?",
                "category": "document"
            },
            {
                "id": "risk-calculation",
                "text": "How is compliance risk calculated?",
                "category": "compliance"
            },
            {
                "id": "onboarding-stages",
                "text": "What are the onboarding stages?",
                "category": "onboarding"
            },
            {
                "id": "data-quality",
                "text": "How is data quality measured?",
                "category": "client"
            }
        ]
