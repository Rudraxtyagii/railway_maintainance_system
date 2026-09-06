from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.auth import get_current_user
from app.database import get_db
from app.db_models import TaskDB
from app.data import next_task_id, priority_score, SEVERITY_WEIGHT, now_iso, TASKS
from app.models import Task, TaskCreate

router = APIRouter(prefix="/api/tasks", tags=["Tasks"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[dict])
def list_tasks(
    department: Optional[str] = Query(None),
    corridor: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status_: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(TaskDB)

    if department and department.upper() != "ALL":
        query = query.filter(TaskDB.department.ilike(f"%{department}%"))
    if corridor and corridor.upper() != "ALL":
        query = query.filter(TaskDB.corridor == corridor)
    if severity and severity.upper() != "ALL":
        query = query.filter(TaskDB.severity.ilike(f"%{severity}%"))
    if status_ and status_.upper() != "ALL":
        query = query.filter(TaskDB.status.ilike(f"%{status_}%"))
    if search:
        s = f"%{search.lower()}%"
        query = query.filter(
            or_(
                TaskDB.description.ilike(s),
                TaskDB.location.ilike(s),
                TaskDB.id.ilike(s),
                TaskDB.defect_type.ilike(s)
            )
        )

    # Order by priority score descending
    tasks = query.order_by(TaskDB.priority_score.desc()).all()
    return [t.to_dict() for t in tasks]


@router.get("/{task_id}", response_model=dict)
def get_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task.to_dict()


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_task(body: TaskCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    weight = SEVERITY_WEIGHT.get(body.severity, 2)
    new_id = next_task_id(body.department)
    calc_priority = priority_score(weight, body.overdueDays)

    new_task = TaskDB(
        id=new_id,
        source="MANUAL",
        department=body.department,
        description=body.description,
        location=body.location,
        corridor=body.corridor,
        defect_type=body.defectType or "Track Geometry / Ballast Deficiency",
        severity=body.severity or "High",
        severity_weight=weight,
        overdue_days=body.overdueDays or 0,
        priority_score=calc_priority,
        status="Pending",
        requested_date=body.preferredDate or body.requestedDate or datetime.utcnow().strftime("%Y-%m-%d"),
        preferred_window=body.preferredWindow or "01:30 - 04:30",
        duration_hours=body.durationHours or 2.5,
        requires_power_block=bool(body.requiresPowerBlock),
        requires_traffic_block=bool(body.requiresTrafficBlock),
        speed_restriction_kmph=body.speedRestrictionKmph or 30,
        notes=body.notes,
        created_by=current_user.get("username", "planner.admin"),
        created_at=datetime.utcnow()
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # Also keep in-memory TASKS synced for fallback
    TASKS.insert(0, new_task.to_dict())

    return new_task.to_dict()


@router.put("/{task_id}", response_model=dict)
def update_task(task_id: str, body: dict, db: Session = Depends(get_db)):
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    if "description" in body:
        task.description = body["description"]
    if "location" in body:
        task.location = body["location"]
    if "severity" in body:
        task.severity = body["severity"]
        task.severity_weight = SEVERITY_WEIGHT.get(body["severity"], 2)
        task.priority_score = priority_score(task.severity_weight, task.overdue_days)
    if "status" in body:
        task.status = body["status"]
    if "durationHours" in body:
        task.duration_hours = float(body["durationHours"])
    if "preferredWindow" in body:
        task.preferred_window = body["preferredWindow"]

    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)

    return task.to_dict()


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    db.delete(task)
    db.commit()
    return None
