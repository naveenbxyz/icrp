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


# Singleton instance
sx_client = SXClient()
