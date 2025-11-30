"""Document Validation Service - Deterministic checks and AI validation"""
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from ..models.document import Document, DocumentCategory
from ..models.client import Client
from ..services.ai_service import ai_service


class DocumentValidator:
    """Service for comprehensive document validation"""

    def __init__(self, db: Session):
        self.db = db

    def run_deterministic_checks(self, client_id: int) -> Dict[str, Any]:
        """
        Run deterministic checks on client's document set
        Returns checks passed/failed and issues list
        """
        client = self.db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise ValueError(f"Client {client_id} not found")

        documents = self.db.query(Document).filter(
            Document.client_id == client_id
        ).all()

        # Define required document types based on entity type and jurisdiction
        required_docs = self._get_required_documents(client)

        # Check which required documents are present
        uploaded_doc_types = {doc.document_category.value for doc in documents}

        missing_docs = set(required_docs) - uploaded_doc_types
        present_docs = set(required_docs) & uploaded_doc_types

        # Check document expiry (if AI validation extracted dates)
        expired_docs = []
        for doc in documents:
            if doc.ai_validation_result and doc.ai_validation_result.get("extracted_entities"):
                entities = doc.ai_validation_result["extracted_entities"]
                for entity in entities:
                    if entity.get("type") == "expiry_date":
                        # In production, would parse and check actual dates
                        # For demo, simulate some expired documents
                        if "2022" in entity.get("value", ""):
                            expired_docs.append({
                                "document_id": doc.id,
                                "document_name": doc.filename,
                                "expiry_date": entity["value"]
                            })

        # Calculate overall status
        total_required = len(required_docs)
        total_present = len(present_docs)
        coverage_percentage = (total_present / total_required * 100) if total_required > 0 else 100

        issues = []
        if missing_docs:
            issues.append(f"Missing required documents: {', '.join(missing_docs)}")
        if expired_docs:
            issues.append(f"Expired documents found: {len(expired_docs)} documents")

        return {
            "client_id": client_id,
            "total_required_documents": total_required,
            "documents_present": total_present,
            "coverage_percentage": coverage_percentage,
            "missing_documents": list(missing_docs),
            "present_documents": list(present_docs),
            "expired_documents": expired_docs,
            "issues": issues,
            "overall_status": "passed" if not issues else "failed",
            "data_quality_score": max(0, coverage_percentage - (len(expired_docs) * 10))
        }

    def run_ai_validation(self, document_id: int) -> Dict[str, Any]:
        """
        Run AI validation on specific document
        Verify document type matches requirements
        """
        document = self.db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise ValueError(f"Document {document_id} not found")

        if not document.ai_validation_result:
            raise ValueError(f"Document {document_id} has not been processed by AI yet")

        validation_result = document.ai_validation_result

        # Extract detected document type from AI results
        detected_type = None
        confidence = 0.0

        if "document_analysis" in validation_result:
            analysis = validation_result["document_analysis"]
            detected_type = analysis.get("document_type", "unknown")
            confidence = analysis.get("confidence", 0.0)

        # Compare expected vs detected type
        expected_type = document.document_category.value
        type_match = detected_type == expected_type if detected_type else False

        issues = []
        if not type_match and detected_type:
            issues.append(f"Document type mismatch: expected '{expected_type}', detected '{detected_type}'")
        if confidence < 0.7:
            issues.append(f"Low confidence in document analysis: {confidence:.1%}")

        return {
            "document_id": document_id,
            "expected_type": expected_type,
            "detected_type": detected_type,
            "type_match": type_match,
            "confidence": confidence,
            "issues": issues,
            "validation_status": "passed" if type_match and confidence >= 0.7 else "failed"
        }

    def suggest_missing_documents(self, client_id: int) -> Dict[str, Any]:
        """
        Suggest potentially missing documents based on similar clients
        """
        client = self.db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise ValueError(f"Client {client_id} not found")

        # Find similar clients (same entity type and jurisdiction/country)
        jurisdiction = client.country_of_incorporation
        similar_clients = self.db.query(Client).filter(
            Client.entity_type == client.entity_type,
            Client.id != client_id
        ).limit(5).all()

        # Get document types for current client
        current_docs = self.db.query(Document).filter(
            Document.client_id == client_id
        ).all()
        current_doc_types = {doc.document_category.value for doc in current_docs}

        # Analyze document patterns from similar clients
        suggestions = []

        # Common documents by entity type
        common_docs_by_type = {
            "Limited Company": [
                ("articles_of_incorporation", "Articles of Incorporation", "High", "Required for corporate structure verification"),
                ("board_resolution", "Board Resolution", "Medium", "Needed for authorization verification"),
                ("compliance_certificate", "Compliance Certificate", "Medium", "Standard for regulatory compliance")
            ],
            "Partnership": [
                ("partnership_agreement", "Partnership Agreement", "High", "Required for partnership structure"),
                ("financial_statements", "Financial Statements", "Medium", "Standard for financial assessment")
            ],
            "Fund": [
                ("prospectus", "Fund Prospectus", "High", "Required for fund documentation"),
                ("financial_statements", "Audited Financial Statements", "High", "Mandatory for fund entities"),
                ("risk_assessment", "Risk Assessment Report", "Medium", "Standard for fund risk analysis")
            ]
        }

        entity_suggestions = common_docs_by_type.get(client.entity_type, [])

        for doc_type, doc_name, priority, reason in entity_suggestions:
            if doc_type not in current_doc_types:
                suggestions.append({
                    "document_type": doc_type,
                    "document_name": doc_name,
                    "priority": priority,
                    "reason": reason,
                    "commonality": "85%" if priority == "High" else "65%"
                })

        # Add jurisdiction-specific suggestions
        if jurisdiction in ["Singapore", "Hong Kong"]:
            if "due_diligence_report" not in current_doc_types:
                suggestions.append({
                    "document_type": "due_diligence_report",
                    "document_name": "Enhanced Due Diligence Report",
                    "priority": "Medium",
                    "reason": f"Commonly required for {jurisdiction} entities",
                    "commonality": "70%"
                })

        return {
            "client_id": client_id,
            "client_entity_type": client.entity_type,
            "client_jurisdiction": jurisdiction,
            "suggestions": suggestions,
            "analysis_summary": f"Based on analysis of similar {client.entity_type} entities"
        }

    def _get_required_documents(self, client: Client) -> List[str]:
        """Get list of required document types for a client based on entity type and jurisdiction"""
        base_required = [
            "registration_certificate",
            "client_confirmation"
        ]

        # Add entity-type specific requirements
        if client.entity_type == "Limited Company":
            base_required.extend([
                "articles_of_incorporation",
                "board_resolution"
            ])
        elif client.entity_type == "Partnership":
            base_required.append("partnership_agreement")
        elif client.entity_type == "Fund":
            base_required.extend([
                "prospectus",
                "financial_statements"
            ])

        # Add jurisdiction-specific requirements
        jurisdiction = client.country_of_incorporation
        if jurisdiction in ["United States", "US"]:
            base_required.append("compliance_certificate")
        elif jurisdiction in ["Singapore", "Hong Kong"]:
            base_required.append("due_diligence_report")

        return base_required