import random
from typing import List

from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.data import SYNC_STATUS, SYNC_HISTORY, next_job_id, now_iso
from app.errors import ProblemException
from app.models import SourceStatus, SyncHistoryEntry, SyncTriggerRequest, SyncTriggerResponse

router = APIRouter(prefix="/api/sync", tags=["Data Ingestion & Sync"], dependencies=[Depends(get_current_user)])

VALID_SOURCES = {"TMS", "SMMS", "TDMS", "COA", "ALL"}


@router.get("/status", response_model=List[SourceStatus])
def sync_status():
    return list(SYNC_STATUS.values())


@router.get("/history", response_model=List[SyncHistoryEntry])
def sync_history():
    # Most recent first
    return sorted(SYNC_HISTORY, key=lambda h: h["started"], reverse=True)


@router.post("/trigger", response_model=SyncTriggerResponse)
def trigger_sync(body: SyncTriggerRequest = SyncTriggerRequest()):
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

        SYNC_STATUS[target]["status"] = "Healthy" if failed == 0 else "Degraded"
        SYNC_STATUS[target]["lastSyncTime"] = started
        SYNC_STATUS[target]["recordsReceived"] = received
        SYNC_STATUS[target]["recordsSuccess"] = success
        SYNC_STATUS[target]["recordsFailed"] = failed

        history_entry = {
            "id": next_job_id(target),
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

    return SyncTriggerResponse(
        updatedSources=list(SYNC_STATUS.values()),
        historyItem=last_history_item,
    )
