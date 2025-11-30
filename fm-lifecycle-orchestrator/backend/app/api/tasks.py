from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models.task import Task, TaskStatus, TaskType
from ..models.client import Client
from ..schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskWithClientResponse

router = APIRouter(prefix="/api", tags=["tasks"])


@router.get("/tasks", response_model=List[TaskWithClientResponse])
def get_all_tasks(
    status: Optional[TaskStatus] = None,
    assigned_team: Optional[str] = None,
    assigned_to: Optional[str] = None,
    task_type: Optional[TaskType] = None,
    due_date_filter: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all tasks across clients with comprehensive filtering.
    Supports filtering by status, team, assignee, type, due date, and search.
    """
    # Build base query with client join
    query = db.query(Task).join(Client, Task.client_id == Client.id)

    # Apply filters
    if status:
        query = query.filter(Task.status == status)
    if assigned_team:
        query = query.filter(Task.assigned_team == assigned_team)
    if assigned_to:
        query = query.filter(Task.assigned_to.ilike(f"%{assigned_to}%"))
    if task_type:
        query = query.filter(Task.task_type == task_type)

    # Due date filters
    now = datetime.utcnow()
    if due_date_filter == "overdue":
        query = query.filter(
            Task.due_date < now,
            Task.status != TaskStatus.COMPLETED
        )
    elif due_date_filter == "due_this_week":
        week_end = now + timedelta(days=7)
        query = query.filter(
            Task.due_date <= week_end,
            Task.status != TaskStatus.COMPLETED
        )
    elif due_date_filter == "due_this_month":
        month_end = now + timedelta(days=30)
        query = query.filter(
            Task.due_date <= month_end,
            Task.status != TaskStatus.COMPLETED
        )

    # Search across task title, description, and client name
    if search:
        query = query.filter(
            (Task.title.ilike(f"%{search}%")) |
            (Task.description.ilike(f"%{search}%")) |
            (Client.name.ilike(f"%{search}%"))
        )

    # Default ordering by due date (nulls last)
    query = query.order_by(Task.due_date.asc().nullslast())

    # Pagination
    tasks = query.offset(skip).limit(limit).all()

    # Enrich with client data and computed fields
    result = []
    for task in tasks:
        is_overdue = False
        days_until_due = None

        if task.due_date:
            days_until_due = (task.due_date - now).days
            is_overdue = days_until_due < 0 and task.status != TaskStatus.COMPLETED

        task_data = TaskWithClientResponse(
            **task.__dict__,
            client_name=task.client.name,
            client_legal_entity_id=task.client.legal_entity_id,
            client_country=task.client.country_of_incorporation or "Unknown",
            is_overdue=is_overdue,
            days_until_due=days_until_due
        )
        result.append(task_data)

    return result


@router.get("/clients/{client_id}/tasks", response_model=List[TaskResponse])
def get_client_tasks(client_id: int, db: Session = Depends(get_db)):
    """Get all tasks for a client"""
    tasks = db.query(Task).filter(
        Task.client_id == client_id
    ).order_by(Task.created_date.desc()).all()

    return tasks


@router.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task"""
    db_task = Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    """Update a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_update.model_dump(exclude_unset=True)

    # Auto-set completed_date when status changes to completed
    if "status" in update_data and update_data["status"] == TaskStatus.COMPLETED:
        if not task.completed_date:
            update_data["completed_date"] = datetime.utcnow()

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
