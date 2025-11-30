"""Mock WX System Integration - Workflow/Document Management System"""
from typing import Dict, Any, List


class WXClient:
    """Mock client for WX system (workflow/document management system)"""

    def __init__(self):
        self.workflow_data = {}

    def get_available_documents(self, entity_id: str) -> List[Dict[str, Any]]:
        """Get available documents for an entity from WX"""
        # Mock document data
        return [
            {
                "document_type": "due_diligence_report",
                "document_name": f"Due Diligence Report - {entity_id}",
                "document_url": f"wx://documents/{entity_id}/due_diligence.pdf",
                "last_updated": "2024-02-28",
                "file_size": "850KB"
            },
            {
                "document_type": "financial_statements",
                "document_name": f"Financial Statements - {entity_id}",
                "document_url": f"wx://documents/{entity_id}/financial_statements.pdf",
                "last_updated": "2024-01-20",
                "file_size": "1.1MB"
            },
            {
                "document_type": "compliance_certificate",
                "document_name": f"Compliance Certificate - {entity_id}",
                "document_url": f"wx://documents/{entity_id}/compliance_cert.pdf",
                "last_updated": "2024-03-10",
                "file_size": "450KB"
            },
            {
                "document_type": "risk_assessment",
                "document_name": f"Risk Assessment - {entity_id}",
                "document_url": f"wx://documents/{entity_id}/risk_assessment.pdf",
                "last_updated": "2024-02-05",
                "file_size": "720KB"
            }
        ]

    def get_workflow_status(self, entity_id: str) -> Dict[str, Any]:
        """Get workflow status for an entity"""
        return {
            "entity_id": entity_id,
            "workflow_status": "in_progress",
            "current_stage": "document_review",
            "assigned_to": "Risk Team",
            "last_updated": "2024-03-15"
        }


# Singleton instance
wx_client = WXClient()