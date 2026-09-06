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

from app.auth import get_current_user
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


def _corridor_name(code: str) -> str:
    corridor = next((c for c in CORRIDORS if c["code"] == code), None)
    return corridor["name"] if corridor else code


def _format_date(date_str: str) -> str:
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").strftime("%d %b %Y")
    except ValueError:
        return date_str


@router.get("/inputs")
def get_optimization_inputs():
    """
    Pre-run summary the frontend shows before the user hits "Run
    Optimization" -- counts of what the solver would have to work with
    right now, computed live from current task/window/conflict/bundle state.
    """
    pending_tasks = [t for t in TASKS if t["status"] == "Pending"]
    high_priority = [t for t in pending_tasks if t["severity"] in ("High", "Critical")]
    available_windows = [w for w in CORRIDOR_WINDOWS if w["status"] == "Available"]
    open_conflicts = [c for c in CONFLICTS if c["status"] == "Open"]
    candidate_bundles = [b for b in BUNDLES if b["status"] == "Candidate"]
    corridors_covered = {t["corridor"] for t in pending_tasks}

    if pending_tasks:
        dates = sorted(t["requestedDate"] for t in pending_tasks)
        date_range = f"{_format_date(dates[0])} \u2013 {_format_date(dates[-1])}"
    else:
        date_range = ""

    return {
        "totalPendingTasks": len(pending_tasks),
        "highPriorityTasks": len(high_priority),
        "availableWindows": len(available_windows),
        "detectedConflicts": len(open_conflicts),
        "bundleCandidates": len(candidate_bundles),
        "corridorsCovered": len(corridors_covered),
        "targetDateRange": date_range,
    }


@router.post("/run", response_model=OptimizationResponse)
def run_optimization(body: OptimizationRequest):
    started = time.perf_counter()

    # The frontend's "RUN OPTIMIZATION" button doesn't collect a corridor
    # or date-range selection -- it just calls this with an empty body.
    # Default to every corridor, and a date window wide enough to cover
    # every currently Pending task (falling back to "everything" if there
    # are none), so an empty request still does something useful.
    corridors = body.corridors or [c["code"] for c in CORRIDORS]

    if body.dateRange and body.dateRange.start and body.dateRange.end:
        range_start, range_end = body.dateRange.start, body.dateRange.end
    else:
        pending_dates = [t["requestedDate"] for t in TASKS if t["status"] == "Pending"]
        if pending_dates:
            range_start, range_end = min(pending_dates), max(pending_dates)
        else:
            range_start, range_end = "0000-01-01", "9999-12-31"

    eligible_tasks = [
        t for t in TASKS
        if t["status"] == "Pending"
        and t["corridor"] in corridors
        and _in_range(t["requestedDate"], range_start, range_end)
    ]
    eligible_tasks.sort(key=lambda t: t["priorityScore"], reverse=True)

    eligible_windows = [
        w for w in CORRIDOR_WINDOWS
        if w["status"] == "Available"
        and w["corridor"] in corridors
        and _in_range(w["date"], range_start, range_end)
    ]
    eligible_windows.sort(key=lambda w: (w["date"], w["startTime"]))

    # NOTE ON THE CONCURRENCY MODEL: a "shadow bundle" is multiple departments
    # (Engineering, Traction Distribution, S&T, ...) working *simultaneously*
    # under one shared traffic/power block, not one crew after another. So the
    # block only needs to be as long as its longest constituent task, and the
    # downtime saved is (sum of what separate blocks would have cost) minus
    # (that one shared block). This matches the seeded BUN-101 example: three
    # tasks of 3.0h/2.5h/2.0h bundle into a single 3.0h block, saving 4.5h
    # (7.5h - 3.0h) versus running each as its own block.
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
            # A task can only join this block if it fits standalone within
            # the window's capacity -- concurrent work, not stacked work.
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
        speed_restrictions = [t["speedRestrictionKmph"] for t in packed if t["speedRestrictionKmph"]]
        block_speed_restriction = min(speed_restrictions) if speed_restrictions else None

        individual_hours = sum(t["durationHours"] for t in packed)
        block_duration = round(used_hours, 2)
        efficiency_gain = 0.0
        bundle_id = None
        if len(packed) > 1:
            efficiency_gain = round(((individual_hours - block_duration) / individual_hours) * 100, 1) if individual_hours else 0.0
            bundle_id = next_bundle_id()
            new_bundles.append({
                "id": bundle_id,
                "corridor": window["corridor"],
                "date": window["date"],
                "departments": departments,
                "taskIds": task_ids,
                "windowId": window["id"],
                "downtimeSavedHours": round(individual_hours - block_duration, 2),
                "status": "Candidate",
            })

        block = {
            "id": next_block_id(window["date"]),
            "blockCode": next_block_code(),
            "corridor": window["corridor"],
            "corridorName": _corridor_name(window["corridor"]),
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

    scheduled_task_objs = [t for t in eligible_tasks if t["id"] in assigned_task_ids]
    not_scheduled_count = len(eligible_tasks) - len(scheduled_task_objs)

    manual_hours = sum(t["durationHours"] for t in scheduled_task_objs)
    optimized_hours = sum(b["durationHours"] for b in scheduled_blocks)
    saved_hours = round(manual_hours - optimized_hours, 2)
    saved_percent = round((saved_hours / manual_hours) * 100, 1) if manual_hours else 0.0

    # Mark conflicts resolved when every task in the conflict ended up co-scheduled in one block.
    conflicts_resolved = 0
    for conflict in CONFLICTS:
        conflict_task_ids = set(conflict["taskIds"])
        if conflict_task_ids and conflict_task_ids.issubset(assigned_task_ids):
            for block in scheduled_blocks:
                if conflict_task_ids.issubset(set(block["taskIds"])):
                    conflicts_resolved += 1
                    break

    total_window_hours = sum(w["durationHours"] for w in eligible_windows) or 1.0
    utilization = round(min(100.0, (optimized_hours / total_window_hours) * 100), 1)

    for task in scheduled_task_objs:
        task["status"] = "Scheduled"

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

    # Keep it retrievable via GET /api/optimization/{id}.
    OPTIMIZATION_RUNS[optimization_id] = result

    return result


@router.get("/{optimization_id}")
def get_optimization_result(optimization_id: str):
    run = OPTIMIZATION_RUNS.get(optimization_id)
    if run is None:
        raise ProblemException(404, "Not Found", f"Optimization run '{optimization_id}' does not exist.")
    return {
        "id": run["optimizationId"],
        "status": "COMPLETED",
        "summary": run["summary"],
        "scheduledBlocks": run["scheduledBlocks"],
    }