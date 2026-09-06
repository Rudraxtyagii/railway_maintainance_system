"""
Database Initializer and Seeder for RAILBLOCK
Ensures SQLite schema is created and populated with standard Indian Railways datasets.
"""
import logging
from datetime import datetime
from app.database import engine, SessionLocal, Base
from app.db_models import (
    UserDB, TaskDB, CorridorDB, CorridorWindowDB,
    ConflictDB, BundleDB, ScheduleDB, AuditLogDB
)
from app.data import (
    USERS, TASKS, CORRIDORS, CORRIDOR_WINDOWS,
    CONFLICTS, BUNDLES, SCHEDULES
)

logger = logging.getLogger("railblock.database")


def init_db():
    """
    Creates tables if they don't exist and seeds initial Indian Railways domain data.
    """
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed Users if empty
        if db.query(UserDB).count() == 0:
            logger.info("Seeding Users table...")
            extended_users = [
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
                    "avatar": "RS"
                },
                {
                    "id": "USR-02",
                    "username": "eng.user",
                    "name": "Anil Verma",
                    "email": "anil.verma@ir.gov.in",
                    "role": "DEPT_ENGINEER",
                    "department": "Engineering",
                    "designation": "Senior Divisional Engineer (Sr. DEN / Track)",
                    "zone": "Northern Railway",
                    "division": "Delhi Division",
                    "avatar": "AV"
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
                    "avatar": "VR"
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
                    "avatar": "PI"
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
                    "avatar": "SK"
                }
            ]
            for u in extended_users:
                db.add(UserDB(**u))
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
                    length_km=c.get("lengthKm", 50.0),
                    max_speed=c.get("maxSpeed", 130),
                    track_count=c.get("trackCount", 2)
                ))
            db.commit()

        # 3. Seed Corridor Windows if empty
        if db.query(CorridorWindowDB).count() == 0:
            logger.info("Seeding Corridor Windows table...")
            for w in CORRIDOR_WINDOWS:
                db.add(CorridorWindowDB(
                    id=w["id"],
                    corridor=w["corridor"],
                    date=w.get("date", "2026-09-08"),
                    start_time=w["startTime"],
                    end_time=w["endTime"],
                    duration_hours=w["durationHours"],
                    window_type=w.get("windowType", "Night Corridor"),
                    status=w.get("status", "Available"),
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
                    location=c.get("location", c.get("corridor", "NDLS-GZB") + " Section"),
                    task_ids=c.get("taskIds", []),
                    conflict_type=c.get("type", "Spatial Overlap"),
                    reason=c.get("description", "Cross-departmental overlapping block windows"),
                    severity=c.get("severity", "Critical"),
                    status=c.get("status", "Open"),
                    resolution_method=c.get("resolutionMethod")
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
                    total_downtime_saved=b.get("downtimeSavedHours", 4.5),
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
                    date=s["date"],
                    start_time=s["startTime"],
                    end_time=s["endTime"],
                    duration_hours=s["durationHours"],
                    status=s.get("status", "Scheduled"),
                    departments=s.get("departments", []),
                    task_ids=s.get("taskIds", []),
                    speed_restriction_kmph=s.get("speedRestrictionKmph", 30),
                    ptw_status=s.get("ptwStatus", "Issued"),
                    safety_validated=s.get("safetyValidated", True),
                    caution_order_generated=s.get("cautionOrderGenerated", False)
                ))
            db.commit()

        logger.info("Database initialization completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Database initialization error: {e}")
    finally:
        db.close()
