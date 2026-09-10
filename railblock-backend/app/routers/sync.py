import random
from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.db_models import SyncSourceDB, SyncHistoryDB
from app.data import SYNC_STATUS, SYNC_HISTORY, next_job_id, now_iso
from app.errors import ProblemException
from app.models import SourceStatus, SyncHistoryEntry, SyncTriggerRequest, SyncTriggerResponse

router = APIRouter(prefix="/api/sync", tags=["Data Ingestion & Sync"], dependencies=[Depends(get_current_user)])

VALID_SOURCES = {"TMS", "SMMS", "TDMS", "COA", "ALL"}


@router.get("/status", response_model=List[SourceStatus])
def sync_status(db: Session = Depends(get_db)):
    sources = db.query(SyncSourceDB).all()
    if sources:
        return [s.to_dict() for s in sources]
    return list(SYNC_STATUS.values())


@router.get("/history", response_model=List[SyncHistoryEntry])
def sync_history(db: Session = Depends(get_db)):
    history = db.query(SyncHistoryDB).order_by(SyncHistoryDB.started.desc()).all()
    if history:
        return [h.to_dict() for h in history]
    return sorted(SYNC_HISTORY, key=lambda h: h["started"], reverse=True)


@router.post("/trigger", response_model=SyncTriggerResponse)
def trigger_sync(body: SyncTriggerRequest = SyncTriggerRequest(), db: Session = Depends(get_db)):
    source = body.source.upper()
    if source not in VALID_SOURCES:
        raise ProblemException(
            400, "Bad Request",
            f"Unknown source '{body.source}'. Expected one of: TMS, SMMS, TDMS, COA, ALL.",
        )

    targets = list(SYNC_STATUS.keys()) if source == "ALL" else [source]
    started = now_iso()
    last_history_item = None

    for target in targets:
        received = random.randint(50, 250)
        failed = random.choice([0, 0, 0, 1, 2])
        success = received - failed
        new_status = "Healthy" if failed == 0 else "Degraded"

        # Update in-memory fallback
        if target in SYNC_STATUS:
            SYNC_STATUS[target]["status"] = new_status
            SYNC_STATUS[target]["lastSyncTime"] = started
            SYNC_STATUS[target]["recordsReceived"] = received
            SYNC_STATUS[target]["recordsSuccess"] = success
            SYNC_STATUS[target]["recordsFailed"] = failed

        # Update or create in DB
        db_src = db.query(SyncSourceDB).filter(SyncSourceDB.id == target).first()
        if db_src:
            db_src.status = new_status
            db_src.last_sync_time = started
            db_src.records_received = received
            db_src.records_success = success
            db_src.records_failed = failed

        job_id = next_job_id(target)
        history_entry = {
            "id": job_id,
            "source": target,
            "started": started,
            "completed": now_iso(),
            "records": received,
            "success": success,
            "failed": failed,
            "status": "Success" if failed == 0 else "Success with Warnings",
        }
        SYNC_HISTORY.insert(0, history_entry)
        last_history_item = history_entry

        # Add to DB
        db_history = SyncHistoryDB(
            id=job_id,
            source=target,
            started=started,
            completed=history_entry["completed"],
            records=received,
            success=success,
            failed=failed,
            status=history_entry["status"],
            created_at=datetime.utcnow()
        )
        db.add(db_history)

    db.commit()

    all_db_sources = db.query(SyncSourceDB).all()
    updated_sources = [s.to_dict() for s in all_db_sources] if all_db_sources else list(SYNC_STATUS.values())

    return SyncTriggerResponse(
        updatedSources=updated_sources,
        historyItem=last_history_item,
    )

