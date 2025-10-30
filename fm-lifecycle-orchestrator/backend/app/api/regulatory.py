from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.regulatory_classification import RegulatoryClassification
from ..models.document import Document
from ..schemas.regulatory import RegulatoryClassificationResponse, RegulatoryClassificationUpdate

router = APIRouter(prefix="/api", tags=["regulatory"])


@router.get("/clients/{client_id}/regulatory", response_model=List[RegulatoryClassificationResponse])
@router.get("/clients/{client_id}/regulatory-classifications", response_model=List[RegulatoryClassificationResponse])
def get_client_regulatory_classifications(client_id: int, db: Session = Depends(get_db)):
    """Get all regulatory classifications for a client"""
    classifications = db.query(RegulatoryClassification).filter(
        RegulatoryClassification.client_id == client_id
    ).all()

    # Enrich with document count
    result = []
    for classification in classifications:
        doc_count = db.query(Document).filter(
            Document.regulatory_classification_id == classification.id
        ).count()

        classification_data = RegulatoryClassificationResponse(
            **classification.__dict__,
            document_count=doc_count
        )
        result.append(classification_data)

    return result


@router.put("/regulatory/{classification_id}", response_model=RegulatoryClassificationResponse)
def update_regulatory_classification(
    classification_id: int,
    classification_update: RegulatoryClassificationUpdate,
    db: Session = Depends(get_db)
):
    """Update a regulatory classification"""
    classification = db.query(RegulatoryClassification).filter(
        RegulatoryClassification.id == classification_id
    ).first()

    if not classification:
        raise HTTPException(status_code=404, detail="Regulatory classification not found")

    update_data = classification_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(classification, field, value)

    db.commit()
    db.refresh(classification)

    # Get document count
    doc_count = db.query(Document).filter(
        Document.regulatory_classification_id == classification.id
    ).count()

    return RegulatoryClassificationResponse(
        **classification.__dict__,
        document_count=doc_count
    )


@router.post("/regulatory/{classification_id}/review")
def schedule_review(
    classification_id: int,
    next_review_date: str,
    db: Session = Depends(get_db)
):
    """Schedule a periodic review for a regulatory classification"""
    from datetime import datetime

    classification = db.query(RegulatoryClassification).filter(
        RegulatoryClassification.id == classification_id
    ).first()

    if not classification:
        raise HTTPException(status_code=404, detail="Regulatory classification not found")

    classification.next_review_date = datetime.fromisoformat(next_review_date)
    db.commit()

    return {"message": "Review scheduled successfully", "next_review_date": next_review_date}
