from typing import List

from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.data import TASKS
from app.models import Task

router = APIRouter(prefix="/api/priority", tags=["Priority Scoring"], dependencies=[Depends(get_current_user)])


@router.get("/ranking", response_model=List[Task])
def priority_ranking():
    """Returns every departmental task ranked by priorityScore, highest first.
    Mirrors the same TASKS store used by /api/tasks, just pre-sorted."""
    return sorted(TASKS, key=lambda t: t["priorityScore"], reverse=True)
