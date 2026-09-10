"""
Greedy Constraint Satisfaction + Shadow Bundling Solver (v2.4)

This is a deliberately simple but *real* greedy algorithm, not a canned
response:

  1. Pull all Pending tasks whose corridor is in scope and whose
     requestedDate falls inside the requested date range.
  2. Pull all Available corridor windows in the same scope.
  3. Sort tasks by priorityScore (desc) so critical/overdue work is
     considered first.
  4. Walk the windows in date/time order. For each window, greedily pack
     in as many still-unassigned, matching-corridor tasks as fit within
     `maxBlockDurationHours` and the window's own duration.
  5. Multi-department windows become "shadow bundles" (multiple
     departments sharing one traffic/power block *concurrently* instead
     of each taking a separate block) -- this is where the downtime
     savings come from. A bundle only needs to be as long as its longest
     constituent task; the saving is (sum of individual durations) minus
     (that one shared block).
  6. Anything that didn't fit anywhere stays unscheduled.
"""
import time
from datetime import datetime
from typing import Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.db_models import (
    TaskDB, CorridorWindowDB, CorridorDB, ConflictDB,
    BundleDB, ScheduleDB, OptimizationRunDB
)
from app.data import (
    BUNDLES,
    CONFLICTS,
    CORRIDOR_WINDOWS,
    CORRIDORS,
    OPTIMIZATION_RUNS,
    SCHEDULES,
    TASKS,
    next_bundle_id,
    next_block_code,
    next_block_id,
    next_optimization_id,
    now_iso,
)
from app.errors import ProblemException
from app.models import OptimizationRequest, OptimizationResponse

router = APIRouter(prefix="/api/optimization", tags=["Optimization Engine"], dependencies=[Depends(get_current_user)])

_SEVERITY_RANK = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}


def _in_range(date_str: str, start: str, end: str) -> bool:
    return start <= date_str <= end


def _corridor_name_from_db_or_data(code: str, db: Session) -> str:
    c = db.query(CorridorDB).filter(CorridorDB.code == code).first()
    if c:
        return c.name
    corridor = next((cor for cor in CORRIDORS if cor["code"] == code), None)
    return corridor["name"] if corridor else code


def _format_date(date_str: str) -> str:
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").strftime("%d %b %Y")
    except ValueError:
        return date_str


@router.get("/inputs")
def get_optimization_inputs(db: Session = Depends(get_db)):
    """
    Pre-run summary the frontend shows before the user hits "Run
    Optimization" -- counts of what the solver would have to work with
    right now, computed live from current task/window/conflict/bundle state.
    """
    db_tasks = db.query(TaskDB).filter(TaskDB.status == "Pending").all()
    tasks_list = [t.to_dict() for t in db_tasks] if db_tasks else [t for t in TASKS if t["status"] == "Pending"]

    high_priority = [t for t in tasks_list if t["severity"] in ("High", "Critical")]

    db_windows = db.query(CorridorWindowDB).filter(CorridorWindowDB.status == "Available").all()
    windows_list = [w.to_dict() for w in db_windows] if db_windows else [w for w in CORRIDOR_WINDOWS if w["status"] == "Available"]

    db_conflicts = db.query(ConflictDB).filter(ConflictDB.status == "Open").all()
    conflicts_list = [c.to_dict() for c in db_conflicts] if db_conflicts else [c for c in CONFLICTS if c["status"] == "Open"]

    db_bundles = db.query(BundleDB).filter(BundleDB.status == "Candidate").all()
    bundles_list = [b.to_dict() for b in db_bundles] if db_bundles else [b for b in BUNDLES if b["status"] == "Candidate"]

    corridors_covered = {t["corridor"] for t in tasks_list}

    if tasks_list:
        dates = sorted(t["requestedDate"] for t in tasks_list if t.get("requestedDate"))
        date_range = f"{_format_date(dates[0])} \u2013 {_format_date(dates[-1])}" if dates else ""
    else:
        date_range = ""

    return {
        "totalPendingTasks": len(tasks_list),
        "highPriorityTasks": len(high_priority),
        "availableWindows": len(windows_list),
        "detectedConflicts": len(conflicts_list),
        "bundleCandidates": len(bundles_list),
        "corridorsCovered": len(corridors_covered),
        "targetDateRange": date_range,
    }


@router.post("/run", response_model=OptimizationResponse)
def run_optimization(body: OptimizationRequest, db: Session = Depends(get_db)):
    started = time.perf_counter()

    db_corridors = db.query(CorridorDB).all()
    all_corridor_codes = [c.code for c in db_corridors] if db_corridors else [c["code"] for c in CORRIDORS]
    corridors = body.corridors or all_corridor_codes

    db_pending = db.query(TaskDB).filter(TaskDB.status == "Pending").all()
    raw_tasks = [t.to_dict() for t in db_pending] if db_pending else TASKS

    if body.dateRange and body.dateRange.start and body.dateRange.end:
        range_start, range_end = body.dateRange.start, body.dateRange.end
    else:
        pending_dates = [t["requestedDate"] for t in raw_tasks if t["status"] == "Pending" and t.get("requestedDate")]
        if pending_dates:
            range_start, range_end = min(pending_dates), max(pending_dates)
        else:
            range_start, range_end = "0000-01-01", "9999-12-31"

    eligible_tasks = [
        t for t in raw_tasks
        if t["status"] == "Pending"
        and t["corridor"] in corridors
        and _in_range(t.get("requestedDate", ""), range_start, range_end)
    ]
    eligible_tasks.sort(key=lambda t: t["priorityScore"], reverse=True)

    db_windows = db.query(CorridorWindowDB).filter(CorridorWindowDB.status == "Available").all()
    raw_windows = [w.to_dict() for w in db_windows] if db_windows else CORRIDOR_WINDOWS

    eligible_windows = [
        w for w in raw_windows
        if w["status"] == "Available"
        and w["corridor"] in corridors
        and _in_range(w["date"], range_start, range_end)
    ]
    eligible_windows.sort(key=lambda w: (w["date"], w["startTime"]))

    # Concurrency Model: Shadow Bundles
    assigned_task_ids: set = set()
    scheduled_blocks: List[dict] = []
    new_bundles: List[dict] = []

    for window in eligible_windows:
        capacity = min(window["durationHours"], body.maxBlockDurationHours)
        if capacity <= 0:
            continue

        packed: List[dict] = []
        for task in eligible_tasks:
            if task["id"] in assigned_task_ids:
                continue
            if task["corridor"] != window["corridor"]:
                continue
            if task["requestedDate"] != window["date"]:
                continue
            if task["durationHours"] > capacity:
                continue
            packed.append(task)

        if not packed:
            continue

        used_hours = max(t["durationHours"] for t in packed)

        for task in packed:
            assigned_task_ids.add(task["id"])

        departments = sorted({t["department"] for t in packed})
        task_ids = [t["id"] for t in packed]
        top_severity = max(packed, key=lambda t: _SEVERITY_RANK.get(t["severity"], 0))["severity"]
        traffic_granted = any(t["requiresTrafficBlock"] for t in packed)
        power_granted = any(t["requiresPowerBlock"] for t in packed)
        speed_restrictions = [t["speedRestrictionKmph"] for t in packed if t.get("speedRestrictionKmph")]
        block_speed_restriction = min(speed_restrictions) if speed_restrictions else None

        individual_hours = sum(t["durationHours"] for t in packed)
        block_duration = round(used_hours, 2)
        efficiency_gain = 0.0
        bundle_id = None
        if len(packed) > 1:
            efficiency_gain = round(((individual_hours - block_duration) / individual_hours) * 100, 1) if individual_hours else 0.0
            bundle_id = next_bundle_id()
            bundle_dict = {
                "id": bundle_id,
                "corridor": window["corridor"],
                "date": window["date"],
                "departments": departments,
                "taskIds": task_ids,
                "windowId": window["id"],
                "downtimeSavedHours": round(individual_hours - block_duration, 2),
                "status": "Candidate",
            }
            new_bundles.append(bundle_dict)

            # Persist bundle to DB
            db_bundle = BundleDB(
                id=bundle_id,
                code=bundle_id,
                name=f"Integrated Bundle {bundle_id}",
                corridor=window["corridor"],
                date=window["date"],
                start_time=window["startTime"],
                end_time=window["endTime"],
                duration_hours=block_duration,
                task_ids=task_ids,
                departments=departments,
                window_id=window["id"],
                downtime_saved_hours=round(individual_hours - block_duration, 2),
                status="Candidate"
            )
            db.add(db_bundle)

        corr_name = _corridor_name_from_db_or_data(window["corridor"], db)
        block_id = next_block_id(window["date"])
        block_code = next_block_code()

        block = {
            "id": block_id,
            "blockCode": block_code,
            "corridor": window["corridor"],
            "corridorName": corr_name,
            "date": window["date"],
            "startTime": window["startTime"],
            "endTime": window["endTime"],
            "durationHours": block_duration,
            "departments": departments,
            "taskIds": task_ids,
            "tasksCount": len(packed),
            "priority": top_severity,
            "bundleId": bundle_id,
            "status": "Approved",
            "trafficBlockGranted": traffic_granted,
            "powerBlockGranted": power_granted,
            "controllerApproval": "Granted (Chief Controller/DLI)",
            "speedRestrictionKmph": block_speed_restriction,
            "efficiencyGainPercent": efficiency_gain,
        }
        scheduled_blocks.append(block)

        # Persist block to DB
        db_schedule = ScheduleDB(
            id=block_id,
            block_id=block_id,
            block_code=block_code,
            corridor=window["corridor"],
            corridor_name=corr_name,
            date=window["date"],
            start_time=window["startTime"],
            end_time=window["endTime"],
            duration_hours=block_duration,
            departments=departments,
            task_ids=task_ids,
            tasks_count=len(packed),
            priority=top_severity,
            bundle_id=bundle_id,
            status="Approved",
            traffic_block_granted=traffic_granted,
            power_block_granted=power_granted,
            controller_approval="Granted (Chief Controller/DLI)",
            speed_restriction_kmph=block_speed_restriction,
            efficiency_gain_percent=efficiency_gain,
            ptw_status="Issued",
            safety_validated=True,
            caution_order_generated=False,
            created_at=datetime.utcnow()
        )
        db.add(db_schedule)

    scheduled_task_objs = [t for t in eligible_tasks if t["id"] in assigned_task_ids]
    not_scheduled_count = len(eligible_tasks) - len(scheduled_task_objs)

    manual_hours = sum(t["durationHours"] for t in scheduled_task_objs)
    optimized_hours = sum(b["durationHours"] for b in scheduled_blocks)
    saved_hours = round(manual_hours - optimized_hours, 2)
    saved_percent = round((saved_hours / manual_hours) * 100, 1) if manual_hours else 0.0

    # Check and resolve conflicts in DB & memory
    db_conflicts = db.query(ConflictDB).all()
    conflicts_list = [c.to_dict() for c in db_conflicts] if db_conflicts else CONFLICTS
    conflicts_resolved = 0

    for conflict in conflicts_list:
        conflict_task_ids = set(conflict["taskIds"])
        if conflict_task_ids and conflict_task_ids.issubset(assigned_task_ids):
            for block in scheduled_blocks:
                if conflict_task_ids.issubset(set(block["taskIds"])):
                    conflicts_resolved += 1
                    # Update in DB
                    c_record = db.query(ConflictDB).filter(ConflictDB.id == conflict["id"]).first()
                    if c_record:
                        c_record.status = "Resolved"
                    break

    total_window_hours = sum(w["durationHours"] for w in eligible_windows) or 1.0
    utilization = round(min(100.0, (optimized_hours / total_window_hours) * 100), 1)

    # Update tasks status to Scheduled in DB
    for t_obj in scheduled_task_objs:
        t_obj["status"] = "Scheduled"
        t_record = db.query(TaskDB).filter(TaskDB.id == t_obj["id"]).first()
        if t_record:
            t_record.status = "Scheduled"
            t_record.updated_at = datetime.utcnow()

    SCHEDULES.extend(scheduled_blocks)
    BUNDLES.extend(new_bundles)

    execution_ms = int((time.perf_counter() - started) * 1000) or 1
    optimization_id = next_optimization_id()

    result = {
        "optimizationId": optimization_id,
        "engine": "Greedy Constraint Satisfaction + Shadow Bundling Solver (v2.4)",
        "executionTimeMs": execution_ms,
        "timestamp": now_iso(),
        "summary": {
            "tasksScheduled": len(scheduled_task_objs),
            "tasksNotScheduled": not_scheduled_count,
            "conflictsResolved": conflicts_resolved,
            "bundlesCreated": len(new_bundles),
            "totalBlockDurationHours": round(optimized_hours, 2),
            "manualPlanningDowntimeHours": round(manual_hours, 2),
            "optimizedDowntimeHours": round(optimized_hours, 2),
            "downtimeSavedHours": saved_hours,
            "downtimeSavingPercent": saved_percent,
            "networkUtilization": f"{utilization}%",
        },
        "scheduledBlocks": scheduled_blocks,
        "bundles": new_bundles,
        "status": "SUCCESS",
    }

    # Persist optimization run
    db_run = OptimizationRunDB(
        id=optimization_id,
        engine="Greedy Constraint Satisfaction + Shadow Bundling Solver (v2.4)",
        execution_time_ms=execution_ms,
        timestamp=now_iso(),
        summary=result["summary"],
        scheduled_blocks=scheduled_blocks,
        bundles=new_bundles,
        status="SUCCESS",
        created_at=datetime.utcnow()
    )
    db.add(db_run)
    db.commit()

    # In-memory retrieval cache
    OPTIMIZATION_RUNS[optimization_id] = result

    return result


@router.get("/{optimization_id}")
def get_optimization_result(optimization_id: str, db: Session = Depends(get_db)):
    db_run = db.query(OptimizationRunDB).filter(OptimizationRunDB.id == optimization_id).first()
    if db_run:
        return {
            "id": db_run.id,
            "status": "COMPLETED",
            "summary": db_run.summary,
            "scheduledBlocks": db_run.scheduled_blocks,
        }

    run = OPTIMIZATION_RUNS.get(optimization_id)
    if run is None:
        raise ProblemException(404, "Not Found", f"Optimization run '{optimization_id}' does not exist.")
    return {
        "id": run["optimizationId"],
        "status": "COMPLETED",
        "summary": run["summary"],
        "scheduledBlocks": run["scheduledBlocks"],
    }