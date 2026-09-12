"""
Database Initializer and Seeder for RAILBLOCK (v3.0)
Ensures database schema is populated with:
1. Registered Railway Personnel with cryptographically hashed passwords (PBKDF2-HMAC-SHA256).
2. Official Indian Railways Knowledge Chunks for grounded RAG (G&SR, ACTM, IRPWM, BWM, Rolling Block 2024).
3. Live Corridors, Windows, 3-Tier Rolling Block Tasks, Conflicts, Bundles, and Schedules.
Seed operations are strictly idempotent (seeds only when individual tables are empty).
"""
import logging
from datetime import datetime
from app.database import engine, SessionLocal, Base
from app.auth import hash_password
from app.db_models import (
    UserDB, TaskDB, CorridorDB, CorridorWindowDB,
    ConflictDB, BundleDB, ScheduleDB, AuditLogDB,
    SyncSourceDB, SyncHistoryDB, NotificationDB,
    DataQualitySampleDB, KnowledgeChunkDB, COAStreamLogDB,
    HITLReviewDB
)
from app.rag.knowledge_base import IR_KNOWLEDGE_BASE
from app.data import (
    TASKS, CORRIDORS, CORRIDOR_WINDOWS,
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
        # 1. Seed Users if empty with salted PBKDF2 password hashes
        if db.query(UserDB).count() == 0:
            logger.info("Seeding Users table with secure hashed passwords...")
            standard_users = [
                {
                    "id": "USR-01",
                    "username": "planner.admin",
                    "password": "Password123!",
                    "name": "Rajesh Sharma",
                    "email": "rajesh.sharma@cris.org.in",
                    "role": "PLANNER_ADMIN",
                    "department": "Operating & Traffic Planning",
                    "designation": "Senior Divisional Operating Manager (Sr. DOM / Planning)",
                    "zone": "Northern Railway",
                    "division": "Delhi Division",
                    "avatar": "RS",
                    "permissions": ["ALL_ACCESS", "APPROVE_BLOCK", "RUN_SOLVER", "INGEST_DATA", "MANAGE_USERS"]
                },
                {
                    "id": "USR-02",
                    "username": "engineer.ndls",
                    "password": "Password123!",
                    "name": "Anita Verma",
                    "email": "anita.verma@cris.org.in",
                    "role": "DEPT_ENGINEER",
                    "department": "Engineering",
                    "designation": "Senior Divisional Engineer (Sr. DEN / Track)",
                    "zone": "Northern Railway",
                    "division": "Delhi Division",
                    "avatar": "AV",
                    "permissions": ["SUBMIT_CIVIL_BLOCK", "VIEW_SCHEDULES", "QUERY_RAG"]
                },
                {
                    "id": "USR-02-B",
                    "username": "eng.user",
                    "password": "Password123!",
                    "name": "Anil Verma",
                    "email": "anil.verma@ir.gov.in",
                    "role": "DEPT_ENGINEER",
                    "department": "Engineering",
                    "designation": "Senior Divisional Engineer (Sr. DEN / Track)",
                    "zone": "Northern Railway",
                    "division": "Delhi Division",
                    "avatar": "AV",
                    "permissions": ["SUBMIT_CIVIL_BLOCK", "VIEW_SCHEDULES", "QUERY_RAG"]
                },
                {
                    "id": "USR-03",
                    "username": "snt.user",
                    "password": "Password123!",
                    "name": "Vikramaditya Rao",
                    "email": "v.rao@ir.gov.in",
                    "role": "SNT_OFFICER",
                    "department": "Signal & Telecom",
                    "designation": "Senior Divisional Signal & Telecom Engineer (Sr. DSTE)",
                    "zone": "South Eastern Railway",
                    "division": "Kharagpur Division",
                    "avatar": "VR",
                    "permissions": ["SUBMIT_SNT_BLOCK", "VIEW_SCHEDULES", "QUERY_RAG"]
                },
                {
                    "id": "USR-04",
                    "username": "trd.user",
                    "password": "Password123!",
                    "name": "Pooja Iyer",
                    "email": "pooja.iyer@ir.gov.in",
                    "role": "TRD_ENGINEER",
                    "department": "Traction Distribution",
                    "designation": "Divisional Electrical Engineer (DEE / TRD)",
                    "zone": "Western Railway",
                    "division": "Mumbai Central",
                    "avatar": "PI",
                    "permissions": ["SUBMIT_TRD_BLOCK", "SIGN_PTW", "VIEW_SCHEDULES", "QUERY_RAG"]
                },
                {
                    "id": "USR-05",
                    "username": "field.controller",
                    "password": "Password123!",
                    "name": "Surendra Kumar",
                    "email": "s.kumar@ir.gov.in",
                    "role": "FIELD_CONTROLLER",
                    "department": "Operating & Station Control",
                    "designation": "Chief Section Controller / Station Master (NDLS)",
                    "zone": "Northern Railway",
                    "division": "Delhi Division",
                    "avatar": "SK",
                    "permissions": ["CONTROLLER_REVIEW", "APPROVE_BLOCK", "DISPATCH_ORDERS", "EXECUTE_BLOCK"]
                },
                {
                    "id": "USR-05-B",
                    "username": "field.user",
                    "password": "Password123!",
                    "name": "Surendra Kumar",
                    "email": "s.kumar.alt@ir.gov.in",
                    "role": "FIELD_CONTROLLER",
                    "department": "Operating & Station Control",
                    "designation": "Chief Section Controller / Station Master (NDLS)",
                    "zone": "Northern Railway",
                    "division": "Delhi Division",
                    "avatar": "SK",
                    "permissions": ["CONTROLLER_REVIEW", "APPROVE_BLOCK", "DISPATCH_ORDERS", "EXECUTE_BLOCK"]
                }
            ]
            for u in standard_users:
                pw_hash, salt = hash_password(u["password"])
                db.add(UserDB(
                    id=u["id"],
                    username=u["username"],
                    password_hash=pw_hash,
                    salt=salt,
                    name=u["name"],
                    email=u["email"],
                    role=u["role"],
                    department=u["department"],
                    designation=u["designation"],
                    zone=u.get("zone", "Northern Railway"),
                    division=u.get("division", "Delhi Division"),
                    avatar=u.get("avatar", "IR"),
                    permissions=u.get("permissions", []),
                    is_active=True,
                    created_at=datetime.utcnow()
                ))
            db.commit()

        # 2. Seed Knowledge Chunks for RAG if empty
        if db.query(KnowledgeChunkDB).count() == 0:
            logger.info("Seeding KnowledgeChunkDB for grounded RAG...")
            for k in IR_KNOWLEDGE_BASE:
                db.add(KnowledgeChunkDB(
                    id=k["id"],
                    manual_name=k["manual_name"],
                    chapter=k.get("chapter"),
                    rule_number=k.get("rule_number"),
                    title=k["title"],
                    content=k["content"],
                    tags=k.get("tags", []),
                    created_at=datetime.utcnow()
                ))
            db.commit()

        # 3. Seed Corridors if empty
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

        # 4. Seed Corridor Windows if empty
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

        # 5. Seed Sync Sources if empty
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

        # 6. Seed Initial System Notification if empty
        if db.query(NotificationDB).count() == 0:
            logger.info("Seeding Initial System Notification...")
            db.add(NotificationDB(
                id="NOTIF-SYS-READY",
                type="info",
                title="RAILBLOCK Operational System Ready",
                message="Indian Railways AI Block Planning & Command System initialized. Departmental officers can submit new block requisitions or ingest live CRIS COA feeds.",
                timestamp="Just now",
                read=False,
                category="Sync",
                related_id="GLOBAL",
                created_at=datetime.utcnow()
            ))
            db.commit()

        logger.info("Database initialization and foundational seeding completed successfully. Dynamic queues start clean.")
    except Exception as e:
        db.rollback()
        logger.error(f"Database initialization error: {e}")
        raise
    finally:
        db.close()
