from typing import List, Optional

from fastapi import APIRouter, Depends, Query

from app.auth import get_current_user
from app.data import CORRIDOR_WINDOWS, CORRIDORS
from app.models import Corridor, CorridorWindow

router = APIRouter(prefix="/api/corridors", tags=["Corridors"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[Corridor])
def list_corridors():
    return CORRIDORS


@router.get("/windows", response_model=List[CorridorWindow])
def list_corridor_windows(
    corridor: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    results = CORRIDOR_WINDOWS
    if corridor:
        results = [w for w in results if w["corridor"].lower() == corridor.lower()]
    if date:
        results = [w for w in results if w["date"] == date]
    if status:
        results = [w for w in results if w["status"].lower() == status.lower()]
    return results
