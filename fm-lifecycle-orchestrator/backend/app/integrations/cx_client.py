"""Mock CX System Integration - Client Data Management Portal"""
from typing import Dict, Any, Optional, List


class CXClient:
    """Mock client for CX system (client data management portal)"""

    def __init__(self):
        self.clients = {}

    def get_client(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get client data from CX"""
        return {
            "client_id": client_id,
            "name": f"Client {client_id}",
            "products": ["FX Derivatives", "Interest Rate Swaps", "Equity Options"],
            "relationship_manager": "John Smith",
            "risk_rating": "Medium",
            "kyc_status": "Approved",
            "last_updated": "2024-10-01"
        }

    def get_client_products(self, client_id: str) -> List[str]:
        """Get products approved for client"""
        return ["FX Derivatives", "Interest Rate Swaps", "Equity Options", "Credit Derivatives"]

    def update_client_products(self, client_id: str, products: List[str]) -> Dict[str, Any]:
        """Update client products in CX"""
        return {
            "client_id": client_id,
            "products": products,
            "status": "updated"
        }

    def get_client_documents(self, client_id: str) -> List[Dict[str, Any]]:
        """Get available documents for a client from CX"""
        # Mock document data
        return [
            {
                "document_type": "kyc_documentation",
                "document_name": f"KYC Package - {client_id}",
                "document_url": f"cx://documents/{client_id}/kyc_package.pdf",
                "last_updated": "2024-03-01",
                "file_size": "1.2MB"
            },
            {
                "document_type": "client_confirmation",
                "document_name": f"Client Confirmation - {client_id}",
                "document_url": f"cx://documents/{client_id}/client_confirmation.pdf",
                "last_updated": "2024-02-15",
                "file_size": "320KB"
            },
            {
                "document_type": "product_agreement",
                "document_name": f"Product Agreement - {client_id}",
                "document_url": f"cx://documents/{client_id}/product_agreement.pdf",
                "last_updated": "2024-01-30",
                "file_size": "540KB"
            }
        ]


# Singleton instance
cx_client = CXClient()
