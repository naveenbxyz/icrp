"""Mock EX System Integration - Workflow Tool"""
from typing import Dict, Any, Optional


class EXClient:
    """Mock client for EX system (operational workflow tool)"""

    def __init__(self):
        self.workflows = {}

    def get_workflow_status(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Get FM Account Opening Request status from EX"""
        return {
            "request_id": request_id,
            "workflow_type": "FM Account Opening",
            "status": "In Progress",
            "current_step": "Static Data Enrichment",
            "assigned_team": "FM Operations",
            "created_date": "2024-09-15",
            "last_updated": "2024-10-02",
            "steps": [
                {
                    "step_name": "Draft Request",
                    "status": "Completed",
                    "completed_by": "Jane Doe",
                    "completed_date": "2024-09-15"
                },
                {
                    "step_name": "Regulatory Classification",
                    "status": "Completed",
                    "completed_by": "Compliance Team",
                    "completed_date": "2024-09-20"
                },
                {
                    "step_name": "Static Data Enrichment",
                    "status": "In Progress",
                    "assigned_to": "FM Ops Team",
                    "started_date": "2024-09-25"
                },
                {
                    "step_name": "Validation",
                    "status": "Pending"
                }
            ]
        }

    def create_workflow(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new workflow in EX"""
        request_id = f"EX{len(self.workflows) + 1:08d}"
        self.workflows[request_id] = workflow_data
        return {"request_id": request_id, "status": "created"}

    def update_workflow_step(self, request_id: str, step_name: str, status: str) -> Dict[str, Any]:
        """Update workflow step status"""
        return {
            "request_id": request_id,
            "step_name": step_name,
            "status": status,
            "updated": True
        }


# Singleton instance
ex_client = EXClient()
