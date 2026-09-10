"""
Database Initializer and Seeder for RAILBLOCK
Ensures database schema is populated with standard Indian Railways datasets.
Seed operations are strictly idempotent (seeds only when individual tables are empty).
"""
import logging
from datetime import datetime
from app.database import engine, SessionLocal, Base
from app.db_models import (
    UserDB, TaskDB, CorridorDB, CorridorWindowDB,
    ConflictDB, BundleDB, ScheduleDB, AuditLogDB,
    SyncSourceDB, SyncHistoryDB, NotificationDB,
    DataQualitySampleDB
)
from app.data import (
    USERS, TASKS, CORRIDORS, CORRIDOR_WINDOWS,
    CONFLICTS, BUNDLES, SCHEDULES, SYNC_STATUS,
    SYNC_HISTORY, NOTIFICATIONS, SAMPLE_UNSTRUCTURED
)

logger = logging.getLogger("railblock.database")


def init_db():
    """
    Creates tables if they don't exist and seeds initial Indian Railways domain data.
    """
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.warning(f"create_all notice (tables may already exist via Alembic): {e}")

    db = SessionLocal()
    try:
        # 1. Seed Users if empty
        if db.query(UserDB).count() == 0:
            logger.info("Seeding Users table...")
            standard_users = [
                {
                    "id": "USR-01",
                    "username": "planner.admin",
                    "name": "Rajesh Sharma",
                    "email": "rajesh.sharma@cris.org.in",
                    "role": "PLANNER_ADMIN",
                    "department": "Operating & Traffic Planning",
                    "designation": "Senior Divisional Operating Manager (Sr. DOM / Planning)",
                    "zone": "Northern Railway",
                    "division": "Delhi Division",
                    "avatar": "RS",
                },
                {
                    "id": "USR-02",
                    "username": "engineer.ndls",
                    "name": "Anita Verma",
                    "email": "anita.verma@cris.org.in",
                    "role": "DEPT_ENGINEER",
                    "department": "Engineering",
                    "designation": "Senior Divisional Engineer (Sr. DEN / Track)",
                    "zone": "Northern Railway",
                    "division": "Delhi Division",
                    "avatar": "AV",
                },
                {
                    "id": "USR-02-B",
                    "username": "eng.user",
                    "name": "Anil Verma",
                    "email": "anil.verma@ir.gov.in",
                    "role": "DEPT_ENGINEER",
                    "department": "Engineering",
                    "designation": "Senior Divisional Engineer (Sr. DEN / Track)",
                    "zone": "Northern Railway",
                    "division": "Delhi Division",
                    "avatar": "AV",
                },
                {
                    "id": "USR-03",
                    "username": "snt.user",
                    "name": "Vikramaditya Rao",
                    "email": "v.rao@ir.gov.in",
                    "role": "SNT_OFFICER",
                    "department": "Signal & Telecom",
                    "designation": "Senior Divisional Signal & Telecom Engineer (Sr. DSTE)",
                    "zone": "South Eastern Railway",
                    "division": "Kharagpur Division",
                    "avatar": "VR",
                },
                {
                    "id": "USR-04",
                    "username": "trd.user",
                    "name": "Pooja Iyer",
                    "email": "pooja.iyer@ir.gov.in",
                    "role": "TRD_ENGINEER",
                    "department": "Traction Distribution",
                    "designation": "Divisional Electrical Engineer (DEE / TRD)",
                    "zone": "Western Railway",
                    "division": "Mumbai Central",
                    "avatar": "PI",
                },
                {
                    "id": "USR-05",
                    "username": "field.user",
                    "name": "Surendra Kumar",
                    "email": "s.kumar@ir.gov.in",
                    "role": "FIELD_CONTROLLER",
                    "department": "Operating & Station Control",
                    "designation": "Section Controller / Station Master (NDLS)",
                    "zone": "Northern Railway",
                    "division": "Delhi Division",
                    "avatar": "SK",
                },
            ]
            for u in standard_users:
                db.add(UserDB(
                    id=u["id"],
                    username=u["username"],
                    name=u["name"],
                    email=u["email"],
                    role=u["role"],
                    department=u["department"],
                    designation=u["designation"],
                    zone=u.get("zone", "Northern Railway"),
                    division=u.get("division", "Delhi Division"),
                    avatar=u.get("avatar", "IR"),
                    is_active=True,
                    created_at=datetime.utcnow()
                ))
            db.commit()


        # 2. Seed Corridors if empty
        if db.query(CorridorDB).count() == 0:
            logger.info("Seeding Corridors table...")
            for c in CORRIDORS:
                db.add(CorridorDB(
                    code=c["code"],
                    name=c["name"],
                    zone=c.get("zone", "Northern Railway"),
                    division=c.get("division", "Delhi Division"),
                    lines=c.get("lines", ["UP Main", "DN Main"]),
                    length_km=c.get("lengthKm", 50.0),
                    max_speed=c.get("maxSpeed", 130),
                    track_count=c.get("trackCount", len(c.get("lines", [])) or 2)
                ))
            db.commit()

        # 3. Seed Corridor Windows if empty
        if db.query(CorridorWindowDB).count() == 0:
            logger.info("Seeding Corridor Windows table...")
            for w in CORRIDOR_WINDOWS:
                db.add(CorridorWindowDB(
                    id=w["id"],
                    corridor=w["corridor"],
                    line=w.get("line", "UP Main"),
                    date=w.get("date", "2026-09-08"),
                    start_time=w.get("startTime", "01:30"),
                    end_time=w.get("endTime", "04:30"),
                    duration_hours=w.get("durationHours", 3.0),
                    window_type=w.get("windowType", "Night Corridor"),
                    status=w.get("status", "Available"),
                    traffic_density=w.get("trafficDensity", "Low (Night non-suburban)"),
                    occupancy_before=w.get("occupancyBefore"),
                    occupancy_after=w.get("occupancyAfter"),
                    suitable_tasks=w.get("suitableTasks", []),
                    conflict_count=w.get("conflictCount", 0),
                    train_impact=w.get("trainImpact", "Low / Zero Passenger Delay")
                ))
            db.commit()

        # 4. Seed Tasks if empty
        if db.query(TaskDB).count() == 0:
            logger.info("Seeding Tasks table...")
            for t in TASKS:
                db.add(TaskDB(
                    id=t["id"],
                    source=t.get("source", "MANUAL"),
                    department=t["department"],
                    defect_type=t.get("defectType", "General Track Maintenance"),
                    description=t["description"],
                    location=t.get("location", "Section Km 20/0"),
                    corridor=t["corridor"],
                    severity=t.get("severity", "Medium"),
                    severity_weight=t.get("severityWeight", 2),
                    overdue_days=t.get("overdueDays", 0),
                    priority_score=t.get("priorityScore", 50),
                    status=t.get("status", "Pending"),
                    requested_date=t.get("requestedDate", "2026-09-08"),
                    preferred_window=t.get("preferredWindow", "01:30 - 04:30"),
                    duration_hours=t.get("durationHours", 2.0),
                    requires_power_block=t.get("requiresPowerBlock", False),
                    requires_traffic_block=t.get("requiresTrafficBlock", True),
                    speed_restriction_kmph=t.get("speedRestrictionKmph", 30),
                    notes=t.get("notes")
                ))
            db.commit()

        # 5. Seed Conflicts if empty
        if db.query(ConflictDB).count() == 0:
            logger.info("Seeding Conflicts table...")
            for c in CONFLICTS:
                db.add(ConflictDB(
                    id=c["id"],
                    corridor=c["corridor"],
                    date=c.get("date", "2026-09-08"),
                    location=c.get("location", c.get("corridor", "NDLS-GZB") + " Section"),
                    task_ids=c.get("taskIds", []),
                    departments=c.get("departments", []),
                    conflict_type=c.get("type", "Spatial Overlap"),
                    reason=c.get("description", "Cross-departmental overlapping block windows"),
                    description=c.get("description", "Cross-departmental overlapping block windows"),
                    severity=c.get("severity", "Critical"),
                    status=c.get("status", "Open"),
                    resolution_method=c.get("resolutionMethod"),
                    resolution=c.get("resolution")
                ))
            db.commit()

        # 6. Seed Bundles if empty
        if db.query(BundleDB).count() == 0:
            logger.info("Seeding Bundles table...")
            for b in BUNDLES:
                db.add(BundleDB(
                    id=b["id"],
                    code=b.get("code", b["id"]),
                    name=b.get("name", f"Integrated Bundle {b['id']}"),
                    corridor=b["corridor"],
                    date=b.get("date", "2026-09-08"),
                    start_time=b.get("startTime", "01:30"),
                    end_time=b.get("endTime", "04:30"),
                    duration_hours=b.get("durationHours", 3.0),
                    task_ids=b.get("taskIds", []),
                    departments=b.get("departments", ["Engineering", "Traction Distribution"]),
                    window_id=b.get("windowId"),
                    downtime_saved_hours=b.get("downtimeSavedHours", 4.5),
                    status=b.get("status", "Candidate")
                ))
            db.commit()

        # 7. Seed Schedules if empty
        if db.query(ScheduleDB).count() == 0:
            logger.info("Seeding Schedules table...")
            for s in SCHEDULES:
                db.add(ScheduleDB(
                    id=s["id"],
                    block_id=s.get("blockId", s["id"]),
                    block_code=s.get("blockCode", f"BLK-{s['id']}"),
                    corridor=s["corridor"],
                    corridor_name=s.get("corridorName", s["corridor"]),
                    date=s["date"],
                    start_time=s["startTime"],
                    end_time=s["endTime"],
                    duration_hours=s["durationHours"],
                    status=s.get("status", "Approved"),
                    departments=s.get("departments", []),
                    task_ids=s.get("taskIds", []),
                    tasks_count=s.get("tasksCount", len(s.get("taskIds", [])) or 1),
                    priority=s.get("priority", "Medium"),
                    bundle_id=s.get("bundleId"),
                    traffic_block_granted=s.get("trafficBlockGranted", False),
                    power_block_granted=s.get("powerBlockGranted", False),
                    controller_approval=s.get("controllerApproval", "Granted (Chief Controller/DLI)"),
                    speed_restriction_kmph=s.get("speedRestrictionKmph", 30),
                    efficiency_gain_percent=s.get("efficiencyGainPercent", 0.0),
                    ptw_status=s.get("ptwStatus", "Issued"),
                    safety_validated=s.get("safetyValidated", True),
                    caution_order_generated=s.get("cautionOrderGenerated", False)
                ))
            db.commit()

        # 8. Seed Sync Sources if empty
        if db.query(SyncSourceDB).count() == 0:
            logger.info("Seeding Sync Sources table...")
            for source_id, src in SYNC_STATUS.items():
                db.add(SyncSourceDB(
                    id=source_id,
                    name=src["name"],
                    description=src.get("description", f"External system feed: {source_id}"),
                    status=src.get("status", "Healthy"),
                    last_sync_time=src.get("lastSyncTime", "2026-09-08 04:15 IST"),
                    records_received=src.get("recordsReceived", 120),
                    records_success=src.get("recordsSuccess", 120),
                    records_failed=src.get("recordsFailed", 0),
                    frequency=src.get("frequency", "Every 15 minutes")
                ))
            db.commit()

        # 9. Seed Sync History if empty
        if db.query(SyncHistoryDB).count() == 0:
            logger.info("Seeding Sync History table...")
            for h in SYNC_HISTORY:
                db.add(SyncHistoryDB(
                    id=h["id"],
                    source=h["source"],
                    started=h["started"],
                    completed=h.get("completed"),
                    records=h.get("records", 0),
                    success=h.get("success", 0),
                    failed=h.get("failed", 0),
                    status=h.get("status", "Success")
                ))
            db.commit()

        # 10. Seed Notifications if empty
        if db.query(NotificationDB).count() == 0:
            logger.info("Seeding Notifications table...")
            for n in NOTIFICATIONS:
                db.add(NotificationDB(
                    id=n["id"],
                    type=n.get("type", "info"),
                    title=n["title"],
                    message=n["message"],
                    timestamp=n["timestamp"],
                    read=n.get("read", False),
                    category=n.get("category", "Task"),
                    related_id=n.get("relatedId")
                ))
            db.commit()

        # 11. Seed Data Quality Samples if empty
        if db.query(DataQualitySampleDB).count() == 0:
            logger.info("Seeding Data Quality Samples table...")
            for s in SAMPLE_UNSTRUCTURED:
                db.add(DataQualitySampleDB(
                    id=s["id"],
                    source=s.get("source", "TMS Free-Text Log"),
                    raw_text=s.get("rawText", ""),
                    parsing_status=s.get("parsingStatus", "AI Parsed"),
                    parsed=s.get("parsed", {})
                ))
            db.commit()

        logger.info("Database initialization and idempotent seeding completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Database initialization error: {e}")
        raise
    finally:
        db.close()

