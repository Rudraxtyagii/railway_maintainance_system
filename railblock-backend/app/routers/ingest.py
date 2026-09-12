"""
Data Ingestion Layer for Indian Railways CRIS COA & TMS Digital Stream (v3.0)
Processes real-time 3-tier telemetry streams:
  [Tier 1: Corridor Demand / Plan] (TMS / Rolling Block Module)
  [Tier 2: COA Active Block Log] (Granted vs Denied Lines, Live Control Feeds)
  [Tier 3: Actual Execution / Output] (Downtime Metrics, Burst Duration Logs)
"""
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.db_models import TaskDB, COAStreamLogDB, KnowledgeChunkDB, ConflictDB
from app.models import (
    COAStreamBatchRequest,
    COAStreamResponse,
    KnowledgeIngestRequest,
    KnowledgeChunkOut,
    COAStreamItem
)
from app.realtime import broadcast_event

router = APIRouter(prefix="/api/ingest", tags=["Data Ingestion & Real-Time Stream"], dependencies=[Depends(get_current_user)])

SEVERITY_WEIGHT_MAP = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}


def _calc_priority(severity: str, overdue_days: int) -> tuple[int, int]:
    weight = SEVERITY_WEIGHT_MAP.get(severity, 2)
    score = int(min(100, round(weight * 20 + overdue_days * 1.5)))
    return weight, score


@router.post("/stream", response_model=COAStreamResponse, status_code=status.HTTP_201_CREATED)
def ingest_coa_stream(
    body: COAStreamBatchRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Ingests real-time CRIS COA / TMS digital stream payloads.
    Stores entries into PostgreSQL TaskDB and raw COAStreamLogDB,
    checks for immediate spatial/temporal clashes, and triggers real-time WebSocket broadcast.
    """
    stream_id = body.stream_id or f"STRM-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
    source_sys = body.source_system or "COA"

    tasks_created = []
    conflicts_detected = 0

    for rec in body.records:
        task_id = f"TSK-COA-{uuid.uuid4().hex[:6].upper()}"
        severity = rec.severity or "High"
        weight, prio = _calc_priority(severity, rec.overdue_days or 0)

        # Parse duration
        duration_h = 2.5
        if rec.demanded_time:
            try:
                duration_h = float(rec.demanded_time.replace("hrs", "").strip())
            except Exception:
                duration_h = 2.5

        req_date = rec.nominated_date or datetime.utcnow().strftime("%Y-%m-%d")

        new_task = TaskDB(
            id=task_id,
            source=source_sys,
            division_id=rec.division_id or "DLI",
            section_name=rec.section_name or "NDLS-GZB",
            line_type=rec.line_type or "UP Main",
            station_from=rec.station_from or "NDLS",
            station_to=rec.station_to or "GZB",
            corridor=rec.corridor or "NDLS-GZB",
            location=rec.location or f"{rec.section_name} Km 20/0",
            nominated_date=req_date,
            requested_date=req_date,
            planned_start_time=rec.planned_start_time or "01:30",
            planned_end_time=rec.planned_end_time or "04:30",
            preferred_window=f"{rec.planned_start_time or '01:30'} - {rec.planned_end_time or '04:30'}",
            demanded_duration_mins=int(duration_h * 60),
            duration_hours=duration_h,
            demanded_time=rec.demanded_time or f"{duration_h} hrs",
            granted_time=rec.granted_time,
            actual_start_time=rec.actual_start_time,
            actual_end_time=rec.actual_end_time,
            burst_duration_mins=rec.burst_duration_mins or 0,
            requesting_dept=rec.requesting_dept or "Engineering",
            department=rec.requesting_dept or "Engineering",
            defect_type=rec.block_purpose or "General Track & OHE Maintenance",
            block_purpose=rec.block_purpose or "Mechanized Track Maintenance",
            description=rec.description or f"Real-time COA block request on {rec.section_name}",
            severity=severity,
            severity_weight=weight,
            overdue_days=rec.overdue_days or 0,
            priority_score=prio,
            traffic_impact_status=rec.traffic_impact_status or "Zero Delay / Regulated",
            requires_power_block=bool(rec.requires_power_block),
            requires_traffic_block=bool(rec.requires_traffic_block),
            speed_restriction_kmph=rec.speed_restriction_kmph or 30,
            hitl_status="PENDING_REVIEW",
            status="Pending",
            created_by=current_user.get("username", "coa.stream.ingest"),
            created_at=datetime.utcnow()
        )

        db.add(new_task)

        # Log to raw stream table
        stream_log = COAStreamLogDB(
            id=f"LOG-{uuid.uuid4().hex[:8].upper()}",
            stream_id=stream_id,
            division_id=rec.division_id or "DLI",
            section_name=rec.section_name or "NDLS-GZB",
            source_system=source_sys,
            raw_payload=rec.dict(by_alias=True),
            parsed_task_id=task_id,
            status="Ingested",
            received_at=datetime.utcnow()
        )
        db.add(stream_log)

        # Check immediate spatial clash with existing pending tasks in same corridor & date
        clashing = db.query(TaskDB).filter(
            TaskDB.corridor == new_task.corridor,
            TaskDB.requested_date == new_task.requested_date,
            TaskDB.id != new_task.id,
            TaskDB.status == "Pending"
        ).all()

        if clashing:
            conflicts_detected += 1
            other_depts = list({t.department for t in clashing} | {new_task.department})
            conf_id = f"CONF-{uuid.uuid4().hex[:6].upper()}"
            new_conflict = ConflictDB(
                id=conf_id,
                corridor=new_task.corridor,
                date=new_task.requested_date,
                location=f"{new_task.section_name} ({new_task.line_type})",
                task_ids=[t.id for t in clashing] + [new_task.id],
                departments=other_depts,
                conflict_type="Spatial & Temporal Overlap",
                reason=f"Concurrent block demands on {new_task.section_name} across {len(other_depts)} departments.",
                description=f"Automated clash flagged on real-time stream ingestion for date {new_task.requested_date}.",
                severity="Critical" if len(other_depts) > 1 else "Medium",
                status="Open"
            )
            db.add(new_conflict)

        tasks_created.append(new_task.to_dict())

    db.commit()

    # Dispatch Real-Time Event to WebSockets / SSE
    broadcast_event("STREAM_INGESTED", {
        "streamId": stream_id,
        "sourceSystem": source_sys,
        "tasksCount": len(tasks_created),
        "conflictsDetected": conflicts_detected,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    broadcast_event("METRICS_UPDATED", {"reason": "COA_STREAM_INGESTION"})

    return COAStreamResponse(
        success=True,
        streamId=stream_id,
        sourceSystem=source_sys,
        recordsIngested=len(tasks_created),
        conflictsDetected=conflicts_detected,
        tasksCreated=tasks_created,
        timestamp=datetime.utcnow().isoformat() + "Z"
    )


@router.post("/knowledge", response_model=KnowledgeChunkOut, status_code=status.HTTP_201_CREATED)
def ingest_knowledge_chunk(
    body: KnowledgeIngestRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("PLANNER_ADMIN"))
):
    """
    Ingests official Indian Railways regulatory clauses, circulars, or manuals into KnowledgeChunkDB.
    Restricted to PLANNER_ADMIN.
    """
    chunk_id = f"KC-{uuid.uuid4().hex[:8].upper()}"
    chunk = KnowledgeChunkDB(
        id=chunk_id,
        manual_name=body.manualName,
        chapter=body.chapter,
        rule_number=body.ruleNumber,
        title=body.title,
        content=body.content,
        tags=body.tags or [body.manualName, "Regulation", "Safety"],
        created_at=datetime.utcnow()
    )
    db.add(chunk)
    db.commit()
    db.refresh(chunk)

    broadcast_event("KNOWLEDGE_BASE_UPDATED", {"chunkId": chunk_id, "title": body.title})
    return chunk.to_dict()


@router.get("/logs", response_model=List[dict])
def list_stream_logs(limit: int = 50, db: Session = Depends(get_db)):
    """Retrieves recent COA stream ingestion logs."""
    logs = db.query(COAStreamLogDB).order_by(COAStreamLogDB.received_at.desc()).limit(limit).all()
    return [l.to_dict() for l in logs]
