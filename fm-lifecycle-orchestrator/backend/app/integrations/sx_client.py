"""Mock SX System Integration - Legal Entity Data"""
from typing import Dict, Any, Optional


class SXClient:
    """Mock client for SX system (legal entity database)"""

    def __init__(self):
        # Mock data storage
        self.entities = {}

    def get_entity(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Get legal entity data from SX"""
        # Return mock data
        return {
            "entity_id": entity_id,
            "legal_name": f"Entity {entity_id}",
            "jurisdiction": "United Kingdom",
            "entity_type": "Limited Company",
            "registration_number": f"REG{entity_id}",
            "registration_date": "2020-01-15",
            "status": "Active"
        }

    def create_entity(self, entity_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create legal entity in SX"""
        entity_id = entity_data.get("entity_id", f"SX{len(self.entities) + 1:06d}")
        self.entities[entity_id] = entity_data
        return {"entity_id": entity_id, "status": "created", **entity_data}

    def get_entity_documents(self, entity_id: str) -> list[Dict[str, Any]]:
        """Get available documents for a legal entity from SX"""
        # Mock document data
        return [
            {
                "document_type": "registration_certificate",
                "document_name": f"Registration Certificate - {entity_id}",
                "document_url": f"sx://documents/{entity_id}/registration_cert.pdf",
                "last_updated": "2024-01-15",
                "file_size": "245KB"
            },
            {
                "document_type": "articles_of_incorporation",
                "document_name": f"Articles of Incorporation - {entity_id}",
                "document_url": f"sx://documents/{entity_id}/articles.pdf",
                "last_updated": "2024-01-10",
                "file_size": "180KB"
            },
            {
                "document_type": "board_resolution",
                "document_name": f"Board Resolution - {entity_id}",
                "document_url": f"sx://documents/{entity_id}/board_resolution.pdf",
                "last_updated": "2024-02-20",
                "file_size": "95KB"
            }
        ]


# Singleton instance
sx_client = SXClient()
