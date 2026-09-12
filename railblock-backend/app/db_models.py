"""
SQLAlchemy Database Models for RAILBLOCK (v3.0)
Persists all Indian Railways entities:
- Users (Database RBAC with salted password hashes)
- Tasks (3-Tier CRIS COA / TMS Rolling Block Demands & Execution Logs)
- COAStreamLogs (Raw telemetry streams & digital logs)
- KnowledgeChunks (Official G&SR, ACTM, IRPWM, BWM manuals for RAG)
- HITLReviews (Human-in-the-loop review actions & cryptographic audit trail)
- Corridors & Windows
- Conflicts & Bundles
- Schedules & Optimization Runs
- Sync Sources, History, Notifications, Audit Logs, Data Quality Samples
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
)
from app.database import Base

CATEGORY_TO_URL = {
    "Task": "/block-requests",
    "Conflict": "/conflicts",
    "Bundle": "/conflicts",
    "Sync": "/data-sync",
    "Schedule": "/schedule",
    "Optimization": "/optimization",
    "HITL": "/block-requests",
}


class UserDB(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    salt = Column(String(64), nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    role = Column(String(50), index=True, nullable=False)  # PLANNER_ADMIN, DEPT_ENGINEER, SNT_OFFICER, TRD_ENGINEER, FIELD_CONTROLLER
    department = Column(String(100), nullable=False)
    designation = Column(String(200), nullable=False)
    zone = Column(String(100), default="Northern Railway")
    division = Column(String(100), default="Delhi Division")
    avatar = Column(String(10), default="IR")
    permissions = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "department": self.department,
            "designation": self.designation,
            "zone": self.zone,
            "division": self.division,
            "avatar": self.avatar,
            "permissions": self.permissions or [],
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "lastLogin": self.last_login.isoformat() if self.last_login else None
        }


class CorridorDB(Base):
    __tablename__ = "corridors"

    code = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    zone = Column(String(100), nullable=False)
    division = Column(String(100), default="Delhi Division")
    lines = Column(JSON, nullable=False, default=list)
    length_km = Column(Float, default=50.0)
    max_speed = Column(Integer, default=130)
    track_count = Column(Integer, default=2)

    def to_dict(self):
        return {
            "code": self.code,
            "name": self.name,
            "zone": self.zone,
            "division": self.division,
            "lines": self.lines or [],
            "lengthKm": self.length_km,
            "maxSpeed": self.max_speed,
            "trackCount": self.track_count
        }


class CorridorWindowDB(Base):
    __tablename__ = "corridor_windows"

    id = Column(String(50), primary_key=True, index=True)
    corridor = Column(String(50), ForeignKey("corridors.code", ondelete="CASCADE"), index=True, nullable=False)
    line = Column(String(100), default="UP Main")
    date = Column(String(50), index=True, nullable=False)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    duration_hours = Column(Float, nullable=False)
    window_type = Column(String(50), default="Night Corridor")
    status = Column(String(50), default="Available", index=True)
    traffic_density = Column(String(100), default="Low (Night non-suburban)")
    occupancy_before = Column(String(200), nullable=True)
    occupancy_after = Column(String(200), nullable=True)
    suitable_tasks = Column(JSON, default=list)
    conflict_count = Column(Integer, default=0)
    train_impact = Column(String(100), default="Low / Zero Passenger Delay")

    def to_dict(self):
        return {
            "id": self.id,
            "corridor": self.corridor,
            "line": self.line,
            "date": self.date,
            "startTime": self.start_time,
            "endTime": self.end_time,
            "durationHours": self.duration_hours,
            "windowType": self.window_type,
            "status": self.status,
            "trafficDensity": self.traffic_density,
            "occupancyBefore": self.occupancy_before or "",
            "occupancyAfter": self.occupancy_after or "",
            "suitableTasks": self.suitable_tasks or [],
            "conflictCount": self.conflict_count or 0,
            "trainImpact": self.train_impact
        }


class TaskDB(Base):
    """
    3-Tier Indian Railways TMS / COA Rolling Block Model:
    Layer 1: [Corridor Demand / Plan] (TMS / Rolling Block Module)
    Layer 2: [COA Active Block Log] (Granted vs Denied Lines, Live Control Chart Feeds)
    Layer 3: [Actual Execution / Output] (Asset Downtime Metric, Burst Overrun Logs)
    """
    __tablename__ = "tasks"

    id = Column(String(50), primary_key=True, index=True)
    source = Column(String(50), default="MANUAL")  # MANUAL | COA_STREAM | TMS_TELEMETRY | FOIS | VOICE_RADIO

    # 1. Block Identification & Location
    division_id = Column(String(50), default="DLI", index=True)
    section_name = Column(String(150), default="NDLS-GZB", index=True)
    line_type = Column(String(100), default="UP Main")  # UP Main | DN Main | 3rd Line | 4th Line | UP Slow | DN Slow
    station_from = Column(String(100), default="NDLS")
    station_to = Column(String(100), default="GZB")
    corridor = Column(String(50), ForeignKey("corridors.code", ondelete="RESTRICT"), index=True, nullable=False)
    location = Column(String(200), index=True, nullable=False)

    # 2. Temporal Planning (Rolling Block Data)
    nominated_date = Column(String(50), index=True, nullable=True)
    requested_date = Column(String(50), index=True, nullable=True)
    planned_start_time = Column(String(20), default="01:30")
    planned_end_time = Column(String(20), default="04:30")
    preferred_window = Column(String(100), nullable=True)
    demanded_duration_mins = Column(Integer, default=180)
    duration_hours = Column(Float, default=2.5)

    # 3. Operational Execution Logs
    demanded_time = Column(String(50), nullable=True)
    granted_time = Column(String(50), nullable=True)
    actual_start_time = Column(String(50), nullable=True)
    actual_end_time = Column(String(50), nullable=True)
    burst_duration_mins = Column(Integer, default=0)  # Overrun past granted time

    # 4. Asset & Department Categorisation
    requesting_dept = Column(String(100), index=True, nullable=False)  # Engineering | Signal & Telecom | Traction Distribution | Operating
    department = Column(String(100), index=True, nullable=False)
    defect_type = Column(String(150), nullable=False)
    block_purpose = Column(String(200), default="Track & Overhead Maintenance")
    description = Column(Text, nullable=False)
    severity = Column(String(50), index=True, default="Medium")
    severity_weight = Column(Integer, default=2)
    overdue_days = Column(Integer, default=0)
    priority_score = Column(Integer, default=50, index=True)

    # 5. Asset Availability Impact & Safety
    traffic_impact_status = Column(String(100), default="Zero Delay / Regulated")  # Regulated | Diverted | Cancelled | Zero Delay
    requires_power_block = Column(Boolean, default=False)
    requires_traffic_block = Column(Boolean, default=True)
    speed_restriction_kmph = Column(Integer, default=30)
    notes = Column(Text, nullable=True)

    # 6. Human-in-the-Loop (HITL) Controller Review
    hitl_status = Column(String(50), default="PENDING_REVIEW", index=True)  # PENDING_REVIEW | CONTROLLER_APPROVED | CONTROLLER_MODIFIED | CONTROLLER_DENIED | AUTO_APPROVED
    controller_remarks = Column(Text, nullable=True)
    controller_id = Column(String(50), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    # 7. Status & Metadata
    status = Column(String(50), index=True, default="Pending")  # Pending | Scheduled | In-Progress | Completed | Cancelled
    created_by = Column(String(100), default="system")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        req_date = self.requested_date or self.nominated_date or datetime.utcnow().strftime("%Y-%m-%d")
        return {
            "id": self.id,
            "source": self.source,
            "divisionId": self.division_id,
            "sectionName": self.section_name,
            "lineType": self.line_type,
            "stationFrom": self.station_from,
            "stationTo": self.station_to,
            "corridor": self.corridor,
            "location": self.location,
            "nominatedDate": self.nominated_date or req_date,
            "requestedDate": req_date,
            "preferredDate": req_date,
            "plannedStartTime": self.planned_start_time,
            "plannedEndTime": self.planned_end_time,
            "preferredWindow": self.preferred_window or f"{self.planned_start_time} - {self.planned_end_time}",
            "demandedDurationMins": self.demanded_duration_mins or int(self.duration_hours * 60),
            "durationHours": self.duration_hours,
            "demandedTime": self.demanded_time or f"{self.duration_hours} hrs",
            "grantedTime": self.granted_time,
            "actualStartTime": self.actual_start_time,
            "actualEndTime": self.actual_end_time,
            "burstDurationMins": self.burst_duration_mins,
            "requestingDept": self.requesting_dept or self.department,
            "department": self.department,
            "defectType": self.defect_type,
            "blockPurpose": self.block_purpose,
            "description": self.description,
            "severity": self.severity,
            "severityWeight": self.severity_weight,
            "overdueDays": self.overdue_days,
            "priorityScore": self.priority_score,
            "trafficImpactStatus": self.traffic_impact_status,
            "requiresPowerBlock": self.requires_power_block,
            "requiresTrafficBlock": self.requires_traffic_block,
            "speedRestrictionKmph": self.speed_restriction_kmph,
            "notes": self.notes,
            "hitlStatus": self.hitl_status,
            "controllerRemarks": self.controller_remarks,
            "controllerId": self.controller_id,
            "reviewedAt": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "status": self.status,
            "createdBy": self.created_by,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }


class COAStreamLogDB(Base):
    """Stores raw telemetry and digital stream records from CRIS COA/TMS."""
    __tablename__ = "coa_stream_logs"

    id = Column(String(50), primary_key=True, index=True)
    stream_id = Column(String(100), index=True, nullable=False)
    division_id = Column(String(50), index=True, default="DLI")
    section_name = Column(String(150), default="NDLS-GZB")
    source_system = Column(String(50), default="COA")  # COA | TMS | FOIS | ICMS
    raw_payload = Column(JSON, nullable=False)
    parsed_task_id = Column(String(50), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="Ingested")  # Ingested | Failed | Processed
    received_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "streamId": self.stream_id,
            "divisionId": self.division_id,
            "sectionName": self.section_name,
            "sourceSystem": self.source_system,
            "rawPayload": self.raw_payload,
            "parsedTaskId": self.parsed_task_id,
            "status": self.status,
            "receivedAt": self.received_at.isoformat() if self.received_at else None
        }


class KnowledgeChunkDB(Base):
    """Stores chunks of official Indian Railways manuals for grounded, hallucination-free RAG."""
    __tablename__ = "knowledge_chunks"

    id = Column(String(50), primary_key=True, index=True)
    manual_name = Column(String(100), index=True, nullable=False)  # G&SR | ACTM_VOL_II | IRPWM | BWM | ROLLING_BLOCK_2024
    chapter = Column(String(100), nullable=True)
    rule_number = Column(String(50), index=True, nullable=True)
    title = Column(String(250), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "manualName": self.manual_name,
            "chapter": self.chapter,
            "ruleNumber": self.rule_number,
            "title": self.title,
            "content": self.content,
            "tags": self.tags or [],
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }


class HITLReviewDB(Base):
    """Audit log of Human-in-the-Loop controller decisions."""
    __tablename__ = "hitl_reviews"

    id = Column(String(50), primary_key=True, index=True)
    task_id = Column(String(50), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)
    bundle_id = Column(String(50), nullable=True)
    schedule_id = Column(String(50), nullable=True)
    controller_id = Column(String(50), nullable=False)
    controller_name = Column(String(150), nullable=False)
    action = Column(String(50), nullable=False)  # APPROVED | MODIFIED | REJECTED | OVERRIDDEN
    original_params = Column(JSON, default=dict)
    modified_params = Column(JSON, default=dict)
    remarks = Column(Text, nullable=True)
    digital_signature = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "taskId": self.task_id,
            "bundleId": self.bundle_id,
            "scheduleId": self.schedule_id,
            "controllerId": self.controller_id,
            "controllerName": self.controller_name,
            "action": self.action,
            "originalParams": self.original_params or {},
            "modifiedParams": self.modified_params or {},
            "remarks": self.remarks,
            "digitalSignature": self.digital_signature,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }


class ConflictDB(Base):
    __tablename__ = "conflicts"

    id = Column(String(50), primary_key=True, index=True)
    corridor = Column(String(50), ForeignKey("corridors.code", ondelete="CASCADE"), index=True, nullable=False)
    date = Column(String(50), default="2026-09-08", index=True, nullable=False)
    location = Column(String(200), nullable=True)
    task_ids = Column(JSON, nullable=False, default=list)
    departments = Column(JSON, nullable=False, default=list)
    conflict_type = Column(String(100), nullable=False)
    reason = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    severity = Column(String(50), default="Critical")
    status = Column(String(50), default="Open", index=True)
    resolution_method = Column(String(150), nullable=True)
    resolution = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.conflict_type,
            "corridor": self.corridor,
            "date": self.date,
            "departments": self.departments or [],
            "taskIds": self.task_ids or [],
            "description": self.description or self.reason or "",
            "status": self.status,
            "location": self.location,
            "severity": self.severity,
            "resolutionMethod": self.resolution_method,
            "resolution": self.resolution
        }


class BundleDB(Base):
    __tablename__ = "bundles"

    id = Column(String(50), primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=True)
    name = Column(String(200), nullable=True)
    corridor = Column(String(50), ForeignKey("corridors.code", ondelete="CASCADE"), index=True, nullable=False)
    date = Column(String(50), index=True, nullable=False)
    start_time = Column(String(20), nullable=True)
    end_time = Column(String(20), nullable=True)
    duration_hours = Column(Float, default=0.0)
    task_ids = Column(JSON, nullable=False, default=list)
    departments = Column(JSON, nullable=False, default=list)
    window_id = Column(String(50), ForeignKey("corridor_windows.id", ondelete="SET NULL"), nullable=True)
    downtime_saved_hours = Column(Float, default=0.0)
    status = Column(String(50), default="Candidate", index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code or self.id,
            "name": self.name or f"Integrated Bundle {self.id}",
            "corridor": self.corridor,
            "date": self.date,
            "startTime": self.start_time or "01:30",
            "endTime": self.end_time or "04:30",
            "durationHours": self.duration_hours,
            "taskIds": self.task_ids or [],
            "departments": self.departments or [],
            "windowId": self.window_id,
            "downtimeSavedHours": self.downtime_saved_hours,
            "status": self.status
        }


class ScheduleDB(Base):
    __tablename__ = "schedules"

    id = Column(String(50), primary_key=True, index=True)
    block_id = Column(String(100), unique=True, index=True, nullable=False)
    block_code = Column(String(100), index=True, nullable=False)
    corridor = Column(String(50), ForeignKey("corridors.code", ondelete="RESTRICT"), index=True, nullable=False)
    corridor_name = Column(String(150), nullable=False)
    date = Column(String(50), index=True, nullable=False)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    duration_hours = Column(Float, nullable=False)
    status = Column(String(50), default="Approved", index=True)
    departments = Column(JSON, nullable=False, default=list)
    task_ids = Column(JSON, nullable=False, default=list)
    tasks_count = Column(Integer, default=1)
    priority = Column(String(50), default="Medium")
    bundle_id = Column(String(50), ForeignKey("bundles.id", ondelete="SET NULL"), nullable=True)
    traffic_block_granted = Column(Boolean, default=False)
    power_block_granted = Column(Boolean, default=False)
    controller_approval = Column(String(150), default="Granted (Chief Controller/DLI)")
    speed_restriction_kmph = Column(Integer, nullable=True)
    efficiency_gain_percent = Column(Float, default=0.0)
    ptw_status = Column(String(50), default="Issued")
    safety_validated = Column(Boolean, default=True)
    caution_order_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "blockId": self.block_id,
            "blockCode": self.block_code,
            "corridor": self.corridor,
            "corridorName": self.corridor_name,
            "date": self.date,
            "startTime": self.start_time,
            "endTime": self.end_time,
            "durationHours": self.duration_hours,
            "status": self.status,
            "departments": self.departments or [],
            "taskIds": self.task_ids or [],
            "tasksCount": self.tasks_count or len(self.task_ids or []),
            "priority": self.priority,
            "bundleId": self.bundle_id,
            "trafficBlockGranted": self.traffic_block_granted,
            "powerBlockGranted": self.power_block_granted,
            "controllerApproval": self.controller_approval,
            "speedRestrictionKmph": self.speed_restriction_kmph,
            "efficiencyGainPercent": self.efficiency_gain_percent,
            "ptwStatus": self.ptw_status,
            "safetyValidated": self.safety_validated,
            "cautionOrderGenerated": self.caution_order_generated,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }


class OptimizationRunDB(Base):
    __tablename__ = "optimization_runs"

    id = Column(String(50), primary_key=True, index=True)
    engine = Column(String(150), nullable=False)
    execution_time_ms = Column(Integer, nullable=False)
    timestamp = Column(String(50), nullable=False)
    summary = Column(JSON, nullable=False)
    scheduled_blocks = Column(JSON, nullable=False, default=list)
    bundles = Column(JSON, nullable=False, default=list)
    status = Column(String(50), default="SUCCESS")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "optimizationId": self.id,
            "engine": self.engine,
            "executionTimeMs": self.execution_time_ms,
            "timestamp": self.timestamp,
            "summary": self.summary,
            "scheduledBlocks": self.scheduled_blocks,
            "bundles": self.bundles,
            "status": self.status
        }


class SyncSourceDB(Base):
    __tablename__ = "sync_sources"

    id = Column(String(50), primary_key=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Healthy")
    last_sync_time = Column(String(50), nullable=False)
    records_received = Column(Integer, default=0)
    records_success = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    frequency = Column(String(50), default="Every 15 minutes")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "lastSyncTime": self.last_sync_time,
            "recordsReceived": self.records_received,
            "recordsSuccess": self.records_success,
            "recordsFailed": self.records_failed,
            "frequency": self.frequency
        }


class SyncHistoryDB(Base):
    __tablename__ = "sync_history"

    id = Column(String(50), primary_key=True, index=True)
    source = Column(String(50), ForeignKey("sync_sources.id", ondelete="CASCADE"), index=True, nullable=False)
    started = Column(String(50), nullable=False)
    completed = Column(String(50), nullable=True)
    records = Column(Integer, default=0)
    success = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    status = Column(String(50), default="Success")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "source": self.source,
            "started": self.started,
            "completed": self.completed,
            "records": self.records,
            "success": self.success,
            "failed": self.failed,
            "status": self.status
        }


class NotificationDB(Base):
    __tablename__ = "notifications"

    id = Column(String(50), primary_key=True, index=True)
    type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(String(50), nullable=False)
    read = Column(Boolean, default=False, index=True)
    category = Column(String(50), nullable=False)
    related_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "timestamp": self.timestamp,
            "read": self.read,
            "unread": not self.read,
            "actionUrl": CATEGORY_TO_URL.get(self.category, "/notifications"),
            "category": self.category,
            "relatedId": self.related_id
        }


class AuditLogDB(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "action": self.action,
            "resourceType": self.resource_type,
            "resourceId": self.resource_id,
            "details": self.details,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }


class DataQualitySampleDB(Base):
    __tablename__ = "data_quality_samples"

    id = Column(String(50), primary_key=True)
    source = Column(String(50), nullable=False)
    raw_text = Column(Text, nullable=False)
    parsing_status = Column(String(50), default="Parsed")
    parsed = Column(JSON, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "source": self.source,
            "rawText": self.raw_text,
            "parsingStatus": self.parsing_status,
            "parsed": self.parsed
        }
