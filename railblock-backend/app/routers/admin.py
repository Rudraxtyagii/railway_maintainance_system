"""
Admin & Database Governance Router (v3.0)
Provides high-privilege administrative utilities for Indian Railways Senior DOM / Central Planners:
- Database Clean Reset (purges operational task backlogs, conflicts, schedules, and notifications while preserving authenticatable users, corridors, windows, and RAG knowledge)
- Live Database Entity Statistics
"""
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.db_models import (
    TaskDB, ConflictDB, BundleDB, ScheduleDB,
    HITLReviewDB, COAStreamLogDB, NotificationDB,
    OptimizationRunDB, AuditLogDB, DataQualitySampleDB,
    UserDB, CorridorDB, CorridorWindowDB, KnowledgeChunkDB, SyncSourceDB
)
from app.realtime import broadcast_event

logger = logging.getLogger("railblock.admin")

router = APIRouter(prefix="/api/admin", tags=["Admin Governance & System Management"], dependencies=[Depends(get_current_user)])


@router.get("/db-stats")
def get_db_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("PLANNER_ADMIN"))
):
    """
    Returns live row counts across all database entities.
    """
    return {
        "users": db.query(UserDB).count(),
        "tasks": db.query(TaskDB).count(),
        "conflicts": db.query(ConflictDB).count(),
        "bundles": db.query(BundleDB).count(),
        "schedules": db.query(ScheduleDB).count(),
        "hitlReviews": db.query(HITLReviewDB).count(),
        "coaStreamLogs": db.query(COAStreamLogDB).count(),
        "notifications": db.query(NotificationDB).count(),
        "optimizationRuns": db.query(OptimizationRunDB).count(),
        "corridors": db.query(CorridorDB).count(),
        "corridorWindows": db.query(CorridorWindowDB).count(),
        "knowledgeChunks": db.query(KnowledgeChunkDB).count(),
        "syncSources": db.query(SyncSourceDB).count(),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@router.post("/reset-database")
def reset_database(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("PLANNER_ADMIN"))
):
    """
    Wipes all dynamic operational data (tasks, conflicts, bundles, schedules,
    HITL decisions, stream logs, notifications, and optimization runs),
    leaving the system in a clean initial state.
    Preserves: Users, Corridors, Windows, Knowledge Chunks (RAG), and Sync Sources.
    """
    admin_name = current_user.get("name", "Senior DOM")
    admin_id = current_user.get("id", "USR-01")

    logger.warning(f"DATABASE RESET INITIATED BY ADMIN: {admin_name} ({admin_id})")

    # 1. Purge dynamic operational tables (Children before Parents to respect Foreign Keys)
    db.query(HITLReviewDB).delete()
    db.query(COAStreamLogDB).delete()
    db.query(ScheduleDB).delete()
    db.query(BundleDB).delete()
    db.query(ConflictDB).delete()
    db.query(TaskDB).delete()
    db.query(NotificationDB).delete()
    db.query(OptimizationRunDB).delete()
    db.query(DataQualitySampleDB).delete()

    # 2. Reset corridor window statuses back to Available
    windows = db.query(CorridorWindowDB).all()
    for w in windows:
        w.status = "Available"
        w.conflict_count = 0

    # 3. Record Audit Log for the reset
    reset_audit = AuditLogDB(
        user_id=admin_id,
        action="DATABASE_RESET",
        resource_type="System",
        resource_id="GLOBAL_DB",
        details=f"Master database cleared to clean state by Senior DOM {admin_name}. All maintenance registers wiped.",
        timestamp=datetime.utcnow()
    )
    db.add(reset_audit)

    # 4. Create an initial system notification informing of the reset
    init_notif = NotificationDB(
        id="NOTIF-SYS-INIT",
        type="info",
        title="Database Initialized to Clean State",
        message="System reset completed. All maintenance registers are fresh. Departmental officers can submit new block requisitions or ingest real-time CRIS COA feeds.",
        timestamp="Just now",
        read=False,
        category="Sync",
        related_id="GLOBAL",
        recipient_role="ALL",
        created_at=datetime.utcnow()
    )
    db.add(init_notif)
    db.commit()

    # 5. Broadcast real-time events to all connected clients
    broadcast_event("DATABASE_RESET", {
        "resetBy": admin_name,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    broadcast_event("REQUEST_UPDATED", {})
    broadcast_event("TASK_DELETED", {"all": True})
    broadcast_event("METRICS_UPDATED", {"reason": "DATABASE_RESET"})
    broadcast_event("NOTIFICATION_CREATED", init_notif.to_dict())

    return {
        "status": "SUCCESS",
        "message": "Railway database wiped and reset to clean state. All dynamic maintenance queues cleared.",
        "clearedTables": [
            "tasks", "conflicts", "bundles", "schedules",
            "hitl_reviews", "coa_stream_logs", "notifications", "optimization_runs"
        ],
        "preservedTables": [
            "users", "corridors", "corridor_windows", "knowledge_chunks", "sync_sources"
        ],
        "resetBy": admin_name,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
