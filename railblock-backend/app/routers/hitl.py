"""
Human-in-the-Loop (HITL) Controller Review & Authority Router (v3.0)
Provides formal approval workflows, window parameter adjustments, emergency overrides,
and cryptographic digital audit trails for Indian Railways Section Controllers and Sr. DOMs.
"""
import uuid
import hashlib
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.db_models import TaskDB, ScheduleDB, BundleDB, HITLReviewDB, AuditLogDB, NotificationDB
from app.models import (
    HITLReviewActionRequest,
    HITLOverrideRequest,
    HITLReviewResponse
)
from app.realtime import broadcast_event

router = APIRouter(prefix="/api/hitl", tags=["Human-in-the-Loop (HITL) Governance"], dependencies=[Depends(get_current_user)])


def _generate_digital_signature(controller_id: str, action: str, entity_id: str) -> str:
    raw = f"{controller_id}:{action}:{entity_id}:{datetime.utcnow().isoformat()}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16].upper()
    return f"IR-CRIS-SIG-{controller_id}-{digest}"


@router.get("/pending", response_model=List[dict])
def get_pending_hitl_reviews(db: Session = Depends(get_db)):
    """
    Retrieves all corridor block requests currently requiring Section Controller / Sr. DOM review.
    """
    tasks = db.query(TaskDB).filter(
        TaskDB.hitl_status.in_(["PENDING_REVIEW", "REQUIRES_CONTROLLER_ATTENTION"])
    ).order_by(TaskDB.priority_score.desc()).all()

    return [t.to_dict() for t in tasks]


@router.post("/review", response_model=HITLReviewResponse)
def submit_hitl_review_decision(
    body: HITLReviewActionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("PLANNER_ADMIN", "FIELD_CONTROLLER"))
):
    """
    Records a human controller decision (Approve, Modify window/speed, or Reject/Deny).
    Updates the database entity, generates targeted persistent notifications, and logs immutable digital signature audit trail.
    """
    task = None
    if body.taskId:
        task = db.query(TaskDB).filter(TaskDB.id == body.taskId).first()
        if not task:
            raise HTTPException(status_code=404, detail=f"Task '{body.taskId}' not found.")

    review_id = f"HITL-{uuid.uuid4().hex[:8].upper()}"
    controller_name = current_user.get("name", "Section Controller")
    controller_id = current_user.get("id", "USR-01")
    action_upper = body.action.upper()
    if action_upper == "DENY":
        action_upper = "REJECT"

    original_params = {}
    modified_params = {}

    if task:
        original_params = {
            "plannedStartTime": task.planned_start_time,
            "plannedEndTime": task.planned_end_time,
            "speedRestrictionKmph": task.speed_restriction_kmph,
            "status": task.status,
            "hitlStatus": task.hitl_status
        }

        if action_upper == "APPROVE":
            task.hitl_status = "CONTROLLER_APPROVED"
            task.status = "Approved"
            task.controller_remarks = body.remarks
            task.controller_id = controller_id
            task.reviewed_at = datetime.utcnow()
        elif action_upper == "MODIFY":
            task.hitl_status = "CONTROLLER_MODIFIED"
            task.status = "Approved"
            if body.modifiedStartTime:
                task.planned_start_time = body.modifiedStartTime
                modified_params["plannedStartTime"] = body.modifiedStartTime
            if body.modifiedEndTime:
                task.planned_end_time = body.modifiedEndTime
                modified_params["plannedEndTime"] = body.modifiedEndTime
            if body.modifiedSpeedRestriction:
                task.speed_restriction_kmph = body.modifiedSpeedRestriction
                modified_params["speedRestrictionKmph"] = body.modifiedSpeedRestriction
            task.preferred_window = f"{task.planned_start_time} - {task.planned_end_time}"
            task.controller_remarks = body.remarks
            task.controller_id = controller_id
            task.reviewed_at = datetime.utcnow()
        elif action_upper in ["REJECT", "DENY"]:
            task.hitl_status = "CONTROLLER_DENIED"
            task.status = "Cancelled"
            task.controller_remarks = body.remarks
            task.controller_id = controller_id
            task.reviewed_at = datetime.utcnow()

        task.updated_at = datetime.utcnow()

    sig = _generate_digital_signature(controller_id, action_upper, body.taskId or "BLOCK")

    # Record in HITL Review DB
    hitl_entry = HITLReviewDB(
        id=review_id,
        task_id=body.taskId,
        bundle_id=body.bundleId,
        schedule_id=body.scheduleId,
        controller_id=controller_id,
        controller_name=controller_name,
        action=action_upper,
        original_params=original_params,
        modified_params=modified_params,
        remarks=body.remarks,
        digital_signature=sig,
        timestamp=datetime.utcnow()
    )
    db.add(hitl_entry)

    # Record in Audit Log
    audit = AuditLogDB(
        user_id=controller_id,
        action=f"HITL_REVIEW_{action_upper}",
        resource_type="Task" if task else "Schedule",
        resource_id=body.taskId or body.scheduleId,
        details=f"{controller_name} ({current_user.get('role')}) reviewed block {body.taskId} with action {action_upper}. Remarks: {body.remarks}. Sig: {sig}",
        timestamp=datetime.utcnow()
    )
    db.add(audit)

    # Persistent targeted notification for request owner & department
    if task:
        notif_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
        if action_upper == "APPROVE":
            notif_type = "success"
            notif_title = f"Corridor Block Allocated: {task.id}"
            notif_msg = (
                f"Your block request {task.id} has been approved by the controller ({controller_name}). "
                f"Sanctioned for window {task.planned_start_time} - {task.planned_end_time} on {task.nominated_date or task.requested_date}. "
                f"Digital Signature: {sig[:14]}..."
            )
            event_name = "HITL_APPROVED"
        elif action_upper == "MODIFY":
            notif_type = "warning"
            notif_title = f"Corridor Block Window Adjusted & Sanctioned: {task.id}"
            notif_msg = (
                f"Your block request {task.id} has been modified by the controller ({controller_name}). "
                f"Review updated block details: Window {task.planned_start_time} - {task.planned_end_time}, "
                f"Speed Restriction: {task.speed_restriction_kmph} km/h. Sanctioned with Sig: {sig[:14]}..."
            )
            event_name = "HITL_MODIFIED"
        else:
            notif_type = "critical"
            notif_title = f"Corridor Block Denied: {task.id}"
            notif_msg = (
                f"Your block request {task.id} has been denied by the controller ({controller_name}). "
                f"Remarks: {body.remarks or 'Line capacity and passenger safety constraints.'}"
            )
            event_name = "HITL_DENIED"

        notif_entry = NotificationDB(
            id=notif_id,
            type=notif_type,
            title=notif_title,
            message=notif_msg,
            timestamp="Just now",
            read=False,
            category="Task",
            related_id=task.id,
            recipient_user_id=task.created_by_user_id,
            recipient_department=task.department,
            recipient_role=None,
            created_at=datetime.utcnow()
        )
        db.add(notif_entry)

    db.commit()

    # Broadcast Real-time Events
    if task:
        task_dict = task.to_dict()
        broadcast_event("REQUEST_UPDATED", task_dict)
        broadcast_event("TASK_UPDATED", task_dict)
        broadcast_event(event_name, {"taskId": task.id, "reviewId": review_id, "action": action_upper})
        broadcast_event("NOTIFICATION_CREATED", notif_entry.to_dict())

    broadcast_event("HITL_DECISION_ENTERED", {
        "reviewId": review_id,
        "taskId": body.taskId,
        "action": action_upper,
        "controllerName": controller_name,
        "digitalSignature": sig,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    broadcast_event("METRICS_UPDATED", {"reason": "HITL_REVIEW"})

    return HITLReviewResponse(
        reviewId=review_id,
        entityId=body.taskId or body.scheduleId or "N/A",
        action=action_upper,
        status=task.hitl_status if task else "RECORDED",
        controllerName=controller_name,
        digitalSignature=sig,
        timestamp=datetime.utcnow().isoformat() + "Z",
        remarks=body.remarks
    )


@router.post("/override", response_model=HITLReviewResponse)
def emergency_priority_override(
    body: HITLOverrideRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("PLANNER_ADMIN", "FIELD_CONTROLLER"))
):
    """
    Emergency Priority Override for safety-critical defects or track fractures.
    Escalates task to priority 100 and marks as CONTROLLER_APPROVED for immediate block allocation.
    """
    task = db.query(TaskDB).filter(TaskDB.id == body.taskId).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task '{body.taskId}' not found.")

    controller_id = current_user.get("id", "USR-01")
    controller_name = current_user.get("name", "Senior DOM (Planning)")

    task.priority_score = 100
    task.severity = "Critical"
    task.severity_weight = 4
    task.hitl_status = "EMERGENCY_OVERRIDE_APPROVED"
    task.status = "Approved"
    task.controller_remarks = f"EMERGENCY OVERRIDE: {body.reason} - Justification: {body.emergencyJustification}"
    task.controller_id = controller_id
    task.reviewed_at = datetime.utcnow()
    task.updated_at = datetime.utcnow()

    sig = _generate_digital_signature(controller_id, "EMERGENCY_OVERRIDE", body.taskId)

    review_id = f"HITL-OVR-{uuid.uuid4().hex[:8].upper()}"
    hitl_entry = HITLReviewDB(
        id=review_id,
        task_id=body.taskId,
        controller_id=controller_id,
        controller_name=controller_name,
        action="EMERGENCY_OVERRIDE",
        original_params={"priorityScore": task.priority_score},
        modified_params={"priorityScore": 100, "severity": "Critical"},
        remarks=task.controller_remarks,
        digital_signature=sig,
        timestamp=datetime.utcnow()
    )
    db.add(hitl_entry)

    audit = AuditLogDB(
        user_id=controller_id,
        action="EMERGENCY_OVERRIDE",
        resource_type="Task",
        resource_id=body.taskId,
        details=f"EMERGENCY OVERRIDE sanctioned by {controller_name}. Reason: {body.reason}",
        timestamp=datetime.utcnow()
    )
    db.add(audit)

    # Generate Targeted Emergency Block Notification for request owner and department
    notif_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
    notif_entry = NotificationDB(
        id=notif_id,
        type="critical",
        title=f"🚨 Emergency Override Approved: {task.id}",
        message=f"Priority 100 Emergency Corridor Block granted on {task.section_name} ({task.corridor}) for {task.department}. Authorized by {controller_name}. Immediate track possession permitted.",
        timestamp="Just now",
        read=False,
        category="Task",
        related_id=task.id,
        recipient_user_id=task.created_by_user_id,
        recipient_department=task.department,
        recipient_role=None,
        created_at=datetime.utcnow()
    )
    db.add(notif_entry)
    db.commit()

    task_dict = task.to_dict()
    broadcast_event("NOTIFICATION_CREATED", notif_entry.to_dict())
    broadcast_event("EMERGENCY_OVERRIDE", {
        "taskId": body.taskId,
        "controllerName": controller_name,
        "reason": body.reason,
        "priorityScore": 100
    })
    broadcast_event("EMERGENCY_OVERRIDE_TRIGGERED", {
        "taskId": body.taskId,
        "controllerName": controller_name,
        "reason": body.reason,
        "priorityScore": 100
    })
    broadcast_event("REQUEST_UPDATED", task_dict)
    broadcast_event("TASK_UPDATED", task_dict)
    broadcast_event("METRICS_UPDATED", {"reason": "EMERGENCY_OVERRIDE"})

    return HITLReviewResponse(
        reviewId=review_id,
        entityId=body.taskId,
        action="EMERGENCY_OVERRIDE",
        status="EMERGENCY_OVERRIDE_APPROVED",
        controllerName=controller_name,
        digitalSignature=sig,
        timestamp=datetime.utcnow().isoformat() + "Z",
        remarks=task.controller_remarks
    )


@router.get("/audit-trail", response_model=List[dict])
def get_hitl_audit_trail(limit: int = 50, db: Session = Depends(get_db)):
    """Retrieves live audit trail of all Human-in-the-Loop controller decisions."""
    reviews = db.query(HITLReviewDB).order_by(HITLReviewDB.timestamp.desc()).limit(limit).all()
    return [r.to_dict() for r in reviews]
