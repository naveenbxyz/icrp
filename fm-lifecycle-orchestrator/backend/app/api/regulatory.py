from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import uuid
from ..database import get_db
from ..models.client import Client
from ..models.regime_eligibility import RegimeEligibility
from ..models.regulatory_classification import RegulatoryClassification, ValidationStatus
from ..integrations import cx_client

router = APIRouter(prefix="/api", tags=["regulatory"])


@router.get("/clients/{client_id}/regulatory")
def get_client_regulatory_classifications(client_id: int, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Get all regulatory classifications for a client"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    classifications = db.query(RegulatoryClassification).filter(
        RegulatoryClassification.client_id == client_id
    ).all()

    return [
        {
            "id": c.id,
            "client_id": c.client_id,
            "regime": c.regime,
            "framework": c.framework.value if hasattr(c.framework, 'value') else c.framework,
            "classification": c.classification,
            "validation_status": c.validation_status.value if hasattr(c.validation_status, 'value') else str(c.validation_status),
            "classification_date": c.classification_date.isoformat() if c.classification_date else None,
            "last_review_date": c.last_review_date.isoformat() if c.last_review_date else None,
            "next_review_date": c.next_review_date.isoformat() if c.next_review_date else None,
            "validation_notes": c.validation_notes,
            "document_count": len(c.documents) if hasattr(c, 'documents') else 0,
            "additional_data": {}
        }
        for c in classifications
    ]


@router.post("/clients/{client_id}/publish-classification-to-cx")
def publish_classification_to_cx(client_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Publish client classification results to CX system
    Includes data quality warnings in payload
    """
    # Verify client exists
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Get all RegimeEligibility records for client
    eligibility_records = db.query(RegimeEligibility).filter(
        RegimeEligibility.client_id == client_id
    ).all()

    if not eligibility_records:
        raise HTTPException(
            status_code=400,
            detail="No classification results found for client. Run classification first."
        )

    # Prepare classification data for CX
    classification_results = []
    data_quality_warnings = []

    for eligibility in eligibility_records:
        # Extract data quality info from eligibility record
        data_quality_score = getattr(eligibility, 'data_quality_score', None) or 85.0

        # Add to warnings if quality issues
        if data_quality_score < 90:
            data_quality_warnings.append(f"{eligibility.regime}: Data quality {data_quality_score}%")

        classification_results.append({
            "regime": eligibility.regime,
            "is_eligible": eligibility.is_eligible,
            "eligibility_reason": eligibility.eligibility_reason,
            "matched_rules": eligibility.matched_rules,
            "unmatched_rules": eligibility.unmatched_rules,
            "data_quality_score": data_quality_score,
            "last_evaluated": eligibility.last_evaluated_date.isoformat()
        })

    # Prepare CX payload
    cx_payload = {
        "client_id": client_id,
        "client_name": client.name,
        "country_of_incorporation": client.country_of_incorporation,
        "entity_type": client.entity_type,
        "classification_results": classification_results,
        "data_quality_warnings": data_quality_warnings,
        "published_at": datetime.now().isoformat(),
        "published_by": "FM Lifecycle Orchestrator",
        "publication_version": "1.0"
    }

    try:
        # Simulate CX API call (in production: call actual CX API)
        cx_reference_id = f"CX-{uuid.uuid4().hex[:8].upper()}"

        # In production, this would be:
        # cx_response = cx_client.publish_classification(cx_payload)
        # cx_reference_id = cx_response["reference_id"]

        # Update client CX sync fields
        client.cx_sync_status = "synced"
        client.cx_sync_date = datetime.now()
        client.cx_reference_id = cx_reference_id

        # Add these fields to client_attributes for demo
        if not client.client_attributes:
            client.client_attributes = {}

        client.client_attributes.update({
            "cx_sync_status": "synced",
            "cx_sync_date": datetime.now().isoformat(),
            "cx_reference_id": cx_reference_id
        })

        db.commit()
        db.refresh(client)

        return {
            "message": "Classification published to CX successfully",
            "client_id": client_id,
            "cx_reference_id": cx_reference_id,
            "regimes_published": len(classification_results),
            "data_quality_warnings": data_quality_warnings,
            "publication_status": "success",
            "published_at": datetime.now().isoformat()
        }

    except Exception as e:
        # Update client sync status to failed
        client.cx_sync_status = "failed"
        client.cx_sync_date = datetime.now()

        if not client.client_attributes:
            client.client_attributes = {}

        client.client_attributes.update({
            "cx_sync_status": "failed",
            "cx_sync_date": datetime.now().isoformat(),
            "cx_sync_error": str(e)
        })

        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to publish classification to CX: {str(e)}"
        )


@router.get("/clients/{client_id}/cx-sync-status")
def get_cx_sync_status(client_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get CX synchronization status for a client"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Get sync info from client attributes or direct fields
    client_attrs = client.client_attributes or {}

    sync_status = getattr(client, 'cx_sync_status', None) or client_attrs.get('cx_sync_status', 'not_synced')
    sync_date = getattr(client, 'cx_sync_date', None) or client_attrs.get('cx_sync_date')
    cx_reference_id = getattr(client, 'cx_reference_id', None) or client_attrs.get('cx_reference_id')

    # Get latest classification count
    eligibility_count = db.query(RegimeEligibility).filter(
        RegimeEligibility.client_id == client_id
    ).count()

    return {
        "client_id": client_id,
        "cx_sync_status": sync_status,
        "cx_sync_date": sync_date,
        "cx_reference_id": cx_reference_id,
        "regimes_classified": eligibility_count,
        "last_check": datetime.now().isoformat()
    }


@router.get("/regulatory/compliance-overview")
def get_compliance_overview(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get compliance overview metrics across all clients.
    Returns summary of classifications, upcoming reviews, regime coverage, and data quality.
    """
    # Total clients with classifications
    total_classified = db.query(Client.id).join(
        RegulatoryClassification,
        Client.id == RegulatoryClassification.client_id
    ).distinct().count()

    # Pending classifications (assuming validation_status exists)
    pending = db.query(RegulatoryClassification).filter(
        RegulatoryClassification.validation_status == ValidationStatus.PENDING
    ).count()

    # Upcoming reviews (using RegimeEligibility as source of truth)
    now = datetime.utcnow()

    # Count eligibility records that need review soon
    # Note: RegimeEligibility doesn't have review dates, so we'll use RegulatoryClassification
    reviews_30 = db.query(RegulatoryClassification).filter(
        RegulatoryClassification.next_review_date.isnot(None),
        RegulatoryClassification.next_review_date <= now + timedelta(days=30),
        RegulatoryClassification.next_review_date > now
    ).count()

    reviews_60 = db.query(RegulatoryClassification).filter(
        RegulatoryClassification.next_review_date.isnot(None),
        RegulatoryClassification.next_review_date <= now + timedelta(days=60),
        RegulatoryClassification.next_review_date > now
    ).count()

    reviews_90 = db.query(RegulatoryClassification).filter(
        RegulatoryClassification.next_review_date.isnot(None),
        RegulatoryClassification.next_review_date <= now + timedelta(days=90),
        RegulatoryClassification.next_review_date > now
    ).count()

    # Regime coverage from RegimeEligibility (eligible clients per regime)
    regimes = db.query(
        RegimeEligibility.regime,
        func.count(func.distinct(RegimeEligibility.client_id))
    ).filter(
        RegimeEligibility.is_eligible == True
    ).group_by(RegimeEligibility.regime).all()

    regime_coverage = {regime: count for regime, count in regimes}

    # Data quality summary based on data_quality_score from RegimeEligibility
    excellent = db.query(RegimeEligibility).filter(
        RegimeEligibility.data_quality_score >= 90
    ).count()

    good = db.query(RegimeEligibility).filter(
        RegimeEligibility.data_quality_score >= 70,
        RegimeEligibility.data_quality_score < 90
    ).count()

    needs_improvement = db.query(RegimeEligibility).filter(
        RegimeEligibility.data_quality_score < 70
    ).count()

    return {
        "total_clients_classified": total_classified,
        "pending_classifications": pending,
        "upcoming_reviews": {
            "next_30_days": reviews_30,
            "next_60_days": reviews_60,
            "next_90_days": reviews_90
        },
        "regime_coverage": regime_coverage,
        "data_quality_summary": {
            "excellent": excellent,
            "good": good,
            "needs_improvement": needs_improvement
        },
        "generated_at": datetime.utcnow().isoformat()
    }


@router.get("/regulatory/upcoming-reviews")
def get_upcoming_reviews(
    days: int = Query(30, ge=1, le=365, description="Number of days to look ahead"),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get regulatory classifications due for review within specified days.
    Returns list of classifications with client info and days until review.
    """
    cutoff_date = datetime.utcnow() + timedelta(days=days)
    now = datetime.utcnow()

    # Get classifications with upcoming reviews
    reviews = db.query(RegulatoryClassification, Client).join(
        Client,
        RegulatoryClassification.client_id == Client.id
    ).filter(
        RegulatoryClassification.next_review_date.isnot(None),
        RegulatoryClassification.next_review_date <= cutoff_date,
        RegulatoryClassification.next_review_date > now
    ).order_by(RegulatoryClassification.next_review_date.asc()).all()

    result = []
    for classification, client in reviews:
        days_until = (classification.next_review_date - now).days if classification.next_review_date else None

        # Get data quality score from RegimeEligibility if available
        eligibility = db.query(RegimeEligibility).filter(
            RegimeEligibility.client_id == client.id,
            RegimeEligibility.regime == classification.regime
        ).first()

        data_quality_score = eligibility.data_quality_score if eligibility else None

        result.append({
            "classification_id": classification.id,
            "client_id": client.id,
            "client_name": client.name,
            "client_legal_entity_id": client.legal_entity_id,
            "client_country": client.country_of_incorporation or "Unknown",
            "regime": classification.regime,
            "framework": classification.framework.value if hasattr(classification.framework, 'value') else str(classification.framework),
            "classification": classification.classification,
            "last_review_date": classification.last_review_date.isoformat() if classification.last_review_date else None,
            "next_review_date": classification.next_review_date.isoformat() if classification.next_review_date else None,
            "days_until_review": days_until,
            "validation_status": classification.validation_status.value if hasattr(classification.validation_status, 'value') else str(classification.validation_status),
            "data_quality_score": data_quality_score
        })

    return result


@router.get("/regulatory/data-quality-alerts")
def get_data_quality_alerts(
    threshold: int = Query(85, ge=0, le=100, description="Data quality threshold percentage"),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get clients/regimes with data quality below specified threshold.
    Returns list of regime eligibility records with low data quality scores.
    """
    # Get regime eligibility records below threshold
    alerts = db.query(RegimeEligibility, Client).join(
        Client,
        RegimeEligibility.client_id == Client.id
    ).filter(
        RegimeEligibility.data_quality_score < threshold
    ).order_by(
        Client.name.asc(),
        RegimeEligibility.regime.asc()
    ).all()

    result = []
    for eligibility, client in alerts:
        # Get corresponding regulatory classification if exists
        classification = db.query(RegulatoryClassification).filter(
            RegulatoryClassification.client_id == client.id,
            RegulatoryClassification.regime == eligibility.regime
        ).first()

        result.append({
            "client_id": client.id,
            "client_name": client.name,
            "client_legal_entity_id": client.legal_entity_id,
            "client_country": client.country_of_incorporation or "Unknown",
            "regime": eligibility.regime,
            "is_eligible": eligibility.is_eligible,
            "data_quality_score": eligibility.data_quality_score,
            "matched_rules": eligibility.matched_rules,
            "unmatched_rules": eligibility.unmatched_rules,
            "eligibility_reason": eligibility.eligibility_reason,
            "last_evaluated": eligibility.last_evaluated_date.isoformat() if eligibility.last_evaluated_date else None,
            "classification": classification.classification if classification else None,
            "validation_status": classification.validation_status.value if (classification and hasattr(classification.validation_status, 'value')) else None
        })

    return result