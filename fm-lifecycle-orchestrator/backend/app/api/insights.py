from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..database import get_db
from ..models.client import Client
from ..models.document import Document
from ..services.ai_service import ai_service

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/summary")
def get_insights_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get AI-powered insights summary for the dashboard.
    Analyzes all clients and documents to provide trends, risks, and recommendations.
    """
    # Fetch all clients
    clients = db.query(Client).all()
    clients_data = [
        {
            "id": client.id,
            "name": client.name,
            "onboarding_status": client.onboarding_status.value if client.onboarding_status else "unknown",
            "jurisdiction": client.jurisdiction,
            "entity_type": client.entity_type
        }
        for client in clients
    ]

    # Fetch all documents
    documents = db.query(Document).all()
    documents_data = [
        {
            "id": doc.id,
            "client_id": doc.client_id,
            "ocr_status": doc.ocr_status.value if doc.ocr_status else "pending",
            "ai_validation_result": doc.ai_validation_result
        }
        for doc in documents
    ]

    # Generate insights using AI service
    insights = ai_service.generate_insights_summary(
        clients_data=clients_data,
        documents_data=documents_data
    )

    return insights
