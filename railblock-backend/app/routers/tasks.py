from typing import List, Optional
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.auth import get_current_user
from app.database import get_db
from app.db_models import TaskDB, ConflictDB
from app.models import Task, TaskCreate
from app.realtime import broadcast_event

router = APIRouter(prefix="/api/tasks", tags=["Tasks"], dependencies=[Depends(get_current_user)])

SEVERITY_WEIGHT = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}


def priority_score(weight: int, overdue_days: int) -> int:
    return int(min(100, round(weight * 20 + overdue_days * 1.5)))


@router.get("", response_model=List[dict])
def list_tasks(
    department: Optional[str] = Query(None),
    corridor: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status_: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns tasks directly from the PostgreSQL TaskDB table.
    """
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
                TaskDB.defect_type.ilike(s),
                TaskDB.section_name.ilike(s),
                TaskDB.block_purpose.ilike(s)
            )
        )

    tasks = query.order_by(TaskDB.priority_score.desc()).all()
    return [t.to_dict() for t in tasks]


@router.get("/{task_id}", response_model=dict)
def get_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found in database.")
    return task.to_dict()


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_task(body: TaskCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_role = current_user.get("role", "")
    if user_role == "PLANNER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin planners (Sr. DOM / Central Planners) review and approve block requisitions; maintenance requests must be submitted by Departmental Officers (Engineering, S&T, TRD)."
        )

    weight = SEVERITY_WEIGHT.get(body.severity, 2)
    calc_priority = priority_score(weight, body.overdueDays or 0)
    new_id = f"TSK-{uuid.uuid4().hex[:6].upper()}"

    req_date = body.requestedDate or body.preferredDate or body.nominatedDate or datetime.utcnow().strftime("%Y-%m-%d")
    dur_hours = body.durationHours or 2.5
    dept = body.department or current_user.get("department") or "Engineering"

    new_task = TaskDB(
        id=new_id,
        source="MANUAL",
        division_id=body.divisionId or "DLI",
        section_name=body.sectionName or body.corridor or "NDLS-GZB",
        line_type=body.lineType or "UP Main",
        station_from=body.stationFrom or "NDLS",
        station_to=body.stationTo or "GZB",
        corridor=body.corridor,
        location=body.location,
        nominated_date=req_date,
        requested_date=req_date,
        planned_start_time=body.plannedStartTime or "01:30",
        planned_end_time=body.plannedEndTime or "04:30",
        preferred_window=body.preferredWindow or f"{body.plannedStartTime or '01:30'} - {body.plannedEndTime or '04:30'}",
        demanded_duration_mins=int(dur_hours * 60),
        duration_hours=dur_hours,
        demanded_time=f"{dur_hours} hrs",
        burst_duration_mins=0,
        requesting_dept=dept,
        department=dept,
        defect_type=body.defectType or "Track Geometry / Ballast Deficiency",
        block_purpose=body.blockPurpose or "Track & Overhead Maintenance",
        description=body.description,
        severity=body.severity or "High",
        severity_weight=weight,
        overdue_days=body.overdueDays or 0,
        priority_score=calc_priority,
        status="Pending",
        hitl_status="PENDING_REVIEW",
        traffic_impact_status=body.trafficImpactStatus or "Zero Delay / Regulated",
        requires_power_block=bool(body.requiresPowerBlock),
        requires_traffic_block=bool(body.requiresTrafficBlock),
        speed_restriction_kmph=body.speedRestrictionKmph or 30,
        notes=body.notes,
        created_by=current_user.get("username", "dept.engineer"),
        created_at=datetime.utcnow()
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # Broadcast real-time update
    broadcast_event("TASK_CREATED", new_task.to_dict())
    broadcast_event("METRICS_UPDATED", {"reason": "TASK_CREATED"})

    return new_task.to_dict()


@router.put("/{task_id}", response_model=dict)
def update_task(task_id: str, body: dict, db: Session = Depends(get_db)):
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found in database.")

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
        task.demanded_duration_mins = int(task.duration_hours * 60)
        task.demanded_time = f"{task.duration_hours} hrs"
    if "preferredWindow" in body:
        task.preferred_window = body["preferredWindow"]
    if "speedRestrictionKmph" in body:
        task.speed_restriction_kmph = int(body["speedRestrictionKmph"])
    if "hitlStatus" in body:
        task.hitl_status = body["hitlStatus"]

    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)

    broadcast_event("TASK_UPDATED", task.to_dict())
    broadcast_event("METRICS_UPDATED", {"reason": "TASK_UPDATED"})

    return task.to_dict()


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found in database.")

    db.delete(task)
    db.commit()

    broadcast_event("TASK_DELETED", {"id": task_id})
    broadcast_event("METRICS_UPDATED", {"reason": "TASK_DELETED"})
    return None
