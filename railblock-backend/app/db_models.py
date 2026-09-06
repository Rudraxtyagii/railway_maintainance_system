"""
SQLAlchemy Database Models for RAILBLOCK
Persists all Indian Railways entities: Users, Tasks, Corridors, Windows, Conflicts, Bundles, Schedules, and Audit Logs.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from app.database import Base


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


class TaskDB(Base):
    __tablename__ = "tasks"

    id = Column(String(50), primary_key=True, index=True)
    source = Column(String(50), default="MANUAL")  # TMS, TDMS, SMMS, MANUAL, VOICE_NLP, RAIL_GPT
    department = Column(String(100), index=True, nullable=False)
    defect_type = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(200), index=True, nullable=False)
    corridor = Column(String(50), index=True, nullable=False)
    severity = Column(String(50), index=True, default="Medium")  # Critical, High, Medium, Low
    severity_weight = Column(Integer, default=2)
    overdue_days = Column(Integer, default=0)
    priority_score = Column(Integer, default=50, index=True)
    status = Column(String(50), index=True, default="Pending")  # Pending, Approved, Scheduled, In Progress, Completed, Rejected
    requested_date = Column(String(50), nullable=True)
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
            "requestedDate": self.requested_date,
            "preferredWindow": self.preferred_window,
            "durationHours": self.duration_hours,
            "requiresPowerBlock": self.requires_power_block,
            "requiresTrafficBlock": self.requires_traffic_block,
            "speedRestrictionKmph": self.speed_restriction_kmph,
            "notes": self.notes,
            "createdBy": self.created_by,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }


class CorridorDB(Base):
    __tablename__ = "corridors"

    code = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    zone = Column(String(100), nullable=False)
    division = Column(String(100), default="Delhi Division")
    length_km = Column(Float, default=50.0)
    max_speed = Column(Integer, default=130)
    track_count = Column(Integer, default=2)

    def to_dict(self):
        return {
            "code": self.code,
            "name": self.name,
            "zone": self.zone,
            "division": self.division,
            "lengthKm": self.length_km,
            "maxSpeed": self.max_speed,
            "trackCount": self.track_count
        }


class CorridorWindowDB(Base):
    __tablename__ = "corridor_windows"

    id = Column(String(50), primary_key=True, index=True)
    corridor = Column(String(50), index=True, nullable=False)
    date = Column(String(50), nullable=True)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    duration_hours = Column(Float, nullable=False)
    window_type = Column(String(50), default="Night Corridor")  # Night Corridor, Off-Peak, Sunday Maintenance
    status = Column(String(50), default="Available")  # Available, Reserved, Booked, Restricted
    train_impact = Column(String(100), default="Low / Zero Passenger Delay")

    def to_dict(self):
        return {
            "id": self.id,
            "corridor": self.corridor,
            "date": self.date,
            "startTime": self.start_time,
            "endTime": self.end_time,
            "durationHours": self.duration_hours,
            "windowType": self.window_type,
            "status": self.status,
            "trainImpact": self.train_impact
        }


class ConflictDB(Base):
    __tablename__ = "conflicts"

    id = Column(String(50), primary_key=True, index=True)
    corridor = Column(String(50), index=True, nullable=False)
    location = Column(String(200), nullable=False)
    task_ids = Column(JSON, nullable=False)  # List of task IDs
    conflict_type = Column(String(100), nullable=False)
    reason = Column(Text, nullable=False)
    severity = Column(String(50), default="Critical")
    status = Column(String(50), default="Open")  # Open, Bundled, Resolved, Ignored
    resolution_method = Column(String(150), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "corridor": self.corridor,
            "location": self.location,
            "taskIds": self.task_ids or [],
            "conflictType": self.conflict_type,
            "reason": self.reason,
            "severity": self.severity,
            "status": self.status,
            "resolutionMethod": self.resolution_method
        }


class BundleDB(Base):
    __tablename__ = "bundles"

    id = Column(String(50), primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    corridor = Column(String(50), index=True, nullable=False)
    date = Column(String(50), nullable=False)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    duration_hours = Column(Float, nullable=False)
    task_ids = Column(JSON, nullable=False)
    departments = Column(JSON, nullable=False)
    total_downtime_saved = Column(Float, default=0.0)
    status = Column(String(50), default="Candidate")  # Candidate, Approved, Scheduled

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "corridor": self.corridor,
            "date": self.date,
            "startTime": self.start_time,
            "endTime": self.end_time,
            "durationHours": self.duration_hours,
            "taskIds": self.task_ids or [],
            "departments": self.departments or [],
            "totalDowntimeSaved": self.total_downtime_saved,
            "status": self.status
        }


class ScheduleDB(Base):
    __tablename__ = "schedules"

    id = Column(String(50), primary_key=True, index=True)
    block_id = Column(String(100), unique=True, index=True, nullable=False)
    block_code = Column(String(100), index=True, nullable=False)
    corridor = Column(String(50), index=True, nullable=False)
    date = Column(String(50), nullable=False)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    duration_hours = Column(Float, nullable=False)
    status = Column(String(50), default="Scheduled")  # Scheduled, In Progress, Completed, Cancelled
    departments = Column(JSON, nullable=False)
    task_ids = Column(JSON, nullable=False)
    speed_restriction_kmph = Column(Integer, default=30)
    ptw_status = Column(String(50), default="Issued")  # Required, Issued, Verified, Not Required
    safety_validated = Column(Boolean, default=True)
    caution_order_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "blockId": self.block_id,
            "blockCode": self.block_code,
            "corridor": self.corridor,
            "date": self.date,
            "startTime": self.start_time,
            "endTime": self.end_time,
            "durationHours": self.duration_hours,
            "status": self.status,
            "departments": self.departments or [],
            "taskIds": self.task_ids or [],
            "speedRestrictionKmph": self.speed_restriction_kmph,
            "ptwStatus": self.ptw_status,
            "safetyValidated": self.safety_validated,
            "cautionOrderGenerated": self.caution_order_generated,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }


class AuditLogDB(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

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
