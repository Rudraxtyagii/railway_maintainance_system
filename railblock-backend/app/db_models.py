"""
SQLAlchemy Database Models for RAILBLOCK
Persists all Indian Railways entities: Users, Corridors, Windows, Tasks, Conflicts,
Bundles, Schedules, OptimizationRuns, SyncSources, SyncHistory, Notifications,
AuditLogs, and DataQualitySamples.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
from app.database import Base

CATEGORY_TO_URL = {
    "Task": "/block-requests",
    "Conflict": "/conflicts",
    "Bundle": "/conflicts",
    "Sync": "/data-sync",
    "Schedule": "/schedule",
    "Optimization": "/optimization",
}


class UserDB(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    role = Column(String(50), index=True, nullable=False)  # PLANNER_ADMIN, DEPT_ENGINEER, SNT_OFFICER, TRD_ENGINEER, FIELD_CONTROLLER
    department = Column(String(100), nullable=False)
    designation = Column(String(200), nullable=False)
    zone = Column(String(100), default="Northern Railway")
    division = Column(String(100), default="Delhi Division")
    avatar = Column(String(10), default="IR")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

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
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None
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
    __tablename__ = "tasks"

    id = Column(String(50), primary_key=True, index=True)
    source = Column(String(50), default="MANUAL")
    department = Column(String(100), index=True, nullable=False)
    defect_type = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(200), index=True, nullable=False)
    corridor = Column(String(50), ForeignKey("corridors.code", ondelete="RESTRICT"), index=True, nullable=False)
    severity = Column(String(50), index=True, default="Medium")
    severity_weight = Column(Integer, default=2)
    overdue_days = Column(Integer, default=0)
    priority_score = Column(Integer, default=50, index=True)
    status = Column(String(50), index=True, default="Pending")
    requested_date = Column(String(50), index=True, nullable=True)
    preferred_window = Column(String(100), nullable=True)
    duration_hours = Column(Float, default=2.0)
    requires_power_block = Column(Boolean, default=False)
    requires_traffic_block = Column(Boolean, default=True)
    speed_restriction_kmph = Column(Integer, default=30)
    notes = Column(Text, nullable=True)
    created_by = Column(String(100), default="system")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "source": self.source,
            "department": self.department,
            "defectType": self.defect_type,
            "description": self.description,
            "location": self.location,
            "corridor": self.corridor,
            "severity": self.severity,
            "severityWeight": self.severity_weight,
            "overdueDays": self.overdue_days,
            "priorityScore": self.priority_score,
            "status": self.status,
            "requestedDate": self.requested_date or "",
            "preferredWindow": self.preferred_window or "",
            "durationHours": self.duration_hours,
            "requiresPowerBlock": self.requires_power_block,
            "requiresTrafficBlock": self.requires_traffic_block,
            "speedRestrictionKmph": self.speed_restriction_kmph,
            "notes": self.notes,
            "createdBy": self.created_by,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
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
