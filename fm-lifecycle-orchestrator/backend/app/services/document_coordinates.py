"""
Document Coordinates Service - Provides hardcoded bounding box coordinates for demo documents
"""
from typing import Dict, Optional


# Hardcoded coordinates for demo registration certificate
# These coordinates are based on the generated PDF layout
DEMO_DOCUMENT_COORDINATES = {
    "legal_name": {
        "page": 1,
        "bbox": {"x": 120, "y": 245, "width": 350, "height": 25},
        "search_keywords": ["GLOBAL TRADE SOLUTIONS", "PTE LTD"]
    },
    "jurisdiction": {
        "page": 1,
        "bbox": {"x": 123, "y": 380, "width": 200, "height": 18},
        "search_keywords": ["Singapore"]
    },
    "entity_type": {
        "page": 1,
        "bbox": {"x": 220, "y": 420, "width": 220, "height": 18},
        "search_keywords": ["Private Limited Company"]
    },
    "registration_date": {
        "page": 1,
        "bbox": {"x": 220, "y": 295, "width": 130, "height": 18},
        "search_keywords": ["15 June 2023", "15th day of June, 2023"]
    },
    "expiry_date": {
        "page": 1,
        "bbox": {"x": 200, "y": 510, "width": 120, "height": 18},
        "search_keywords": ["15 June 2026"]
    },
    "registration_number": {
        "page": 1,
        "bbox": {"x": 270, "y": 210, "width": 140, "height": 18},
        "search_keywords": ["RC-2024-12345"]
    },
    "registered_address": {
        "page": 1,
        "bbox": {"x": 123, "y": 355, "width": 300, "height": 40},
        "search_keywords": ["123 Marina Boulevard", "Singapore 018936"]
    }
}


def get_coordinates_for_demo_document(filename: str) -> Optional[Dict]:
    """
    Returns hardcoded coordinates if this is the demo document

    Args:
        filename: Name of the uploaded file

    Returns:
        Dictionary of entity coordinates or None if not a demo document
    """
    # Check if this is a demo/sample document
    demo_keywords = [
        "demo",
        "sample",
        "registration_certificate",
        "demo_registration_certificate",
        "GLOBAL TRADE SOLUTIONS"
    ]

    filename_lower = filename.lower()

    for keyword in demo_keywords:
        if keyword.lower() in filename_lower:
            return DEMO_DOCUMENT_COORDINATES

    return None


def is_demo_document(filename: str, extracted_text: str = None) -> bool:
    """
    Checks if a document is the demo document based on filename or content

    Args:
        filename: Name of the file
        extracted_text: Extracted text content (optional)

    Returns:
        True if this is a demo document
    """
    # Check filename
    if get_coordinates_for_demo_document(filename) is not None:
        return True

    # Check content if provided
    if extracted_text:
        demo_identifiers = [
            "GLOBAL TRADE SOLUTIONS PTE LTD",
            "RC-2024-12345",
            "123 Marina Boulevard"
        ]
        for identifier in demo_identifiers:
            if identifier in extracted_text:
                return True

    return False


# Entity type to display label mapping
ENTITY_LABELS = {
    "legal_name": "Client Name",
    "jurisdiction": "Jurisdiction",
    "entity_type": "Entity Type",
    "registration_date": "Registration Date",
    "expiry_date": "Expiry Date",
    "registration_number": "Registration Number",
    "registered_address": "Registered Address",
    "issue_date": "Issue Date",
    "issuing_authority": "Issuing Authority",
    "authorized_capital": "Authorized Capital"
}


def get_entity_label(entity_type: str) -> str:
    """
    Get display label for an entity type

    Args:
        entity_type: The entity type key

    Returns:
        Human-readable label for the entity
    """
    return ENTITY_LABELS.get(entity_type, entity_type.replace("_", " ").title())
