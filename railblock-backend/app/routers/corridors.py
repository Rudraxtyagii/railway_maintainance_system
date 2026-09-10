from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.db_models import CorridorDB, CorridorWindowDB
from app.data import CORRIDOR_WINDOWS, CORRIDORS
from app.models import Corridor, CorridorWindow

router = APIRouter(prefix="/api/corridors", tags=["Corridors"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=List[Corridor])
def list_corridors(db: Session = Depends(get_db)):
    corridors = db.query(CorridorDB).all()
    if corridors:
        return [c.to_dict() for c in corridors]
    return CORRIDORS


@router.get("/windows", response_model=List[CorridorWindow])
def list_corridor_windows(
    corridor: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(CorridorWindowDB)
    if corridor and corridor.upper() != "ALL":
        query = query.filter(CorridorWindowDB.corridor.ilike(f"%{corridor}%"))
    if date:
        query = query.filter(CorridorWindowDB.date == date)
    if status and status.upper() != "ALL":
        query = query.filter(CorridorWindowDB.status.ilike(f"%{status}%"))

    windows = query.all()
    if windows:
        return [w.to_dict() for w in windows]

    results = CORRIDOR_WINDOWS
    if corridor and corridor.upper() != "ALL":
        results = [w for w in results if w["corridor"].lower() == corridor.lower()]
    if date:
        results = [w for w in results if w["date"] == date]
    if status and status.upper() != "ALL":
        results = [w for w in results if w["status"].lower() == status.lower()]
    return results

