from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.db_models import TaskDB
from app.data import TASKS
from app.models import Task

router = APIRouter(prefix="/api/priority", tags=["Priority Scoring"], dependencies=[Depends(get_current_user)])


@router.get("/ranking", response_model=List[Task])
def priority_ranking(db: Session = Depends(get_db)):
    """Returns every departmental task ranked by priorityScore, highest first.
    Mirrors the same TASKS store used by /api/tasks, just pre-sorted."""
    tasks = db.query(TaskDB).order_by(TaskDB.priority_score.desc()).all()
    if tasks:
        return [t.to_dict() for t in tasks]
    return sorted(TASKS, key=lambda t: t["priorityScore"], reverse=True)

