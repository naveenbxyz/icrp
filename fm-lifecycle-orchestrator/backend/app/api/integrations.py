from fastapi import APIRouter
from ..integrations import sx_client, cx_client, ex_client

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


@router.get("/sx/{entity_id}")
def get_sx_entity(entity_id: str):
    """Get legal entity data from SX system (mock)"""
    return sx_client.get_entity(entity_id)


@router.get("/cx/{client_id}")
def get_cx_client(client_id: str):
    """Get client data from CX system (mock)"""
    return cx_client.get_client(client_id)


@router.get("/cx/{client_id}/products")
def get_cx_client_products(client_id: str):
    """Get client products from CX system (mock)"""
    return {"products": cx_client.get_client_products(client_id)}


@router.get("/ex/{request_id}")
def get_ex_workflow(request_id: str):
    """Get workflow status from EX system (mock)"""
    return ex_client.get_workflow_status(request_id)
