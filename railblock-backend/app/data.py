"""
In-memory "database" for the RAILBLOCK mock backend.

This is intentionally simple (module-level dicts/lists guarded by a lock)
so the service has zero external dependencies. Swap this module out for a
real persistence layer without touching the routers, since routers only
call the functions defined here.
"""
from __future__ import annotations

import itertools
import re
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional

_lock = threading.Lock()

SEVERITY_WEIGHT = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}

# Near your other module-level stores, add:
OPTIMIZATION_RUNS: Dict[str, dict] = {}   # optimizationId -> full run result

# Near your other itertools.count() counters, add:
_bundle_counter = itertools.count(102)

# Near your other next_xxx_id() helpers, add:
def next_bundle_id() -> str:
    return f"BUN-{next(_bundle_counter)}"

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def priority_score(severity_weight: int, overdue_days: int) -> int:
    """Simplified scoring model: severity dominates, overdue days add urgency."""
    score = severity_weight * 20 + overdue_days * 1.5
    return int(min(100, round(score)))


# ---------------------------------------------------------------------------
# Users (for auth)
# ---------------------------------------------------------------------------
USERS: Dict[str, dict] = {
    "planner.admin": {
        "password": "Password123",
        "user": {
            "id": "USR-01",
            "username": "planner.admin",
            "name": "Rajesh Sharma",
            "designation": "Sr. DOM (Planning)",
            "role": "PLANNER_ADMIN",
            "department": "Operating & Traffic Planning",
            "zone": "Northern Railway",
            "division": "Delhi Division",
            "email": "rajesh.sharma@cris.org.in",
            "avatar": "RS",
        },
    },
    "engineer.ndls": {
        "password": "Password123",
        "user": {
            "id": "USR-02",
            "username": "engineer.ndls",
            "name": "Anita Verma",
            "designation": "Sr. DEN",
            "role": "DEPT_ENGINEER",
            "department": "Engineering",
            "zone": "Northern Railway",
            "division": "Delhi Division",
            "email": "anita.verma@cris.org.in",
            "avatar": "AV",
        },
    },
}

# ---------------------------------------------------------------------------
# Corridors
# ---------------------------------------------------------------------------
CORRIDORS: List[dict] = [
    {"code": "NDLS-GZB", "name": "New Delhi – Ghaziabad", "zone": "Northern Railway",
     "lines": ["UP Main", "UP Slow", "DN Main", "DN Slow"]},
    {"code": "DDU-PRYJ", "name": "Pandit Deen Dayal Upadhyaya – Prayagraj", "zone": "North Central Railway",
     "lines": ["UP Main", "DN Main"]},
    {"code": "BCT-ST", "name": "Mumbai Central – Surat", "zone": "Western Railway",
     "lines": ["UP Main", "DN Main"]},
    {"code": "HWH-KGP", "name": "Howrah – Kharagpur", "zone": "South Eastern Railway",
     "lines": ["UP Main", "DN Main"]},
]

# ---------------------------------------------------------------------------
# Corridor timetable windows
# ---------------------------------------------------------------------------
CORRIDOR_WINDOWS: List[dict] = [
    {
        "id": "WIN-NDLS-01", "corridor": "NDLS-GZB", "line": "UP Main & UP Slow",
        "date": "2026-09-08", "startTime": "01:30", "endTime": "04:30", "durationHours": 3.0,
        "status": "Available", "trafficDensity": "Low (Night non-suburban)",
        "occupancyBefore": "12401 Magadh Express (Departed 01:10)",
        "occupancyAfter": "14055 Brahmaputra Mail (Scheduled 04:55)",
        "suitableTasks": ["TSK-ENG-101", "TSK-TRD-201", "TSK-SNT-301"], "conflictCount": 2,
    },
    {
        "id": "WIN-NDLS-02", "corridor": "NDLS-GZB", "line": "DN Main", "date": "2026-09-09",
        "startTime": "02:00", "endTime": "05:00", "durationHours": 3.0,
        "status": "Available", "trafficDensity": "Low (Night non-suburban)",
        "occupancyBefore": "12554 Vaishali Express (Departed 01:40)",
        "occupancyAfter": "12310 Rajdhani Express (Scheduled 05:20)",
        "suitableTasks": ["TSK-ENG-102"], "conflictCount": 0,
    },
    {
        "id": "WIN-DDU-01", "corridor": "DDU-PRYJ", "line": "UP Main", "date": "2026-09-10",
        "startTime": "23:30", "endTime": "02:30", "durationHours": 3.0,
        "status": "Available", "trafficDensity": "Medium",
        "occupancyBefore": "12561 Swatantrata Senani (Departed 23:05)",
        "occupancyAfter": "12397 Mahabodhi Express (Scheduled 02:55)",
        "suitableTasks": ["TSK-TRD-202"], "conflictCount": 1,
    },
]

# ---------------------------------------------------------------------------
# Tasks (departmental block requests)
# ---------------------------------------------------------------------------
TASKS: List[dict] = [
    {
        "id": "TSK-ENG-101", "source": "TMS", "department": "Engineering",
        "description": "Deep screening and ballast tamping between UP Main Km 14/2 - 16/4",
        "location": "Km 14/2 - 16/4, Sahibabad Outer", "corridor": "NDLS-GZB",
        "defectType": "Track Geometry / Ballast Deficiency", "severity": "Critical", "severityWeight": 4,
        "overdueDays": 14, "priorityScore": 98, "status": "Pending", "requestedDate": "2026-09-08",
        "preferredWindow": "01:30 - 04:30", "durationHours": 3.0, "requiresPowerBlock": False,
        "requiresTrafficBlock": True, "speedRestrictionKmph": 45, "createdAt": "2026-08-25T08:30:00Z",
    },
    {
        "id": "TSK-TRD-201", "source": "TDMS", "department": "Traction Distribution",
        "description": "OHE catenary tension re-adjustment near Sahibabad yard throat",
        "location": "Km 15/0, Sahibabad Outer", "corridor": "NDLS-GZB",
        "defectType": "OHE Tension / Catenary Sag", "severity": "High", "severityWeight": 3,
        "overdueDays": 9, "priorityScore": priority_score(3, 9), "status": "Pending",
        "requestedDate": "2026-09-08", "preferredWindow": "01:30 - 04:30", "durationHours": 2.5,
        "requiresPowerBlock": True, "requiresTrafficBlock": True, "speedRestrictionKmph": None,
        "createdAt": "2026-08-26T09:15:00Z",
    },
    {
        "id": "TSK-SNT-301", "source": "SMMS", "department": "Signal & Telecom",
        "description": "Axle counter replacement and cable route re-termination",
        "location": "Km 14/8, Sahibabad Outer", "corridor": "NDLS-GZB",
        "defectType": "Signal Equipment Fault", "severity": "High", "severityWeight": 3,
        "overdueDays": 6, "priorityScore": priority_score(3, 6), "status": "Pending",
        "requestedDate": "2026-09-08", "preferredWindow": "01:30 - 04:30", "durationHours": 2.0,
        "requiresPowerBlock": False, "requiresTrafficBlock": True, "speedRestrictionKmph": None,
        "createdAt": "2026-08-27T11:00:00Z",
    },
    {
        "id": "TSK-ENG-102", "source": "TMS", "department": "Engineering",
        "description": "Rail flaw detection follow-up and thermit weld repair",
        "location": "Km 22/6, Ghaziabad Yard", "corridor": "NDLS-GZB",
        "defectType": "Rail Fracture Risk", "severity": "Medium", "severityWeight": 2,
        "overdueDays": 3, "priorityScore": priority_score(2, 3), "status": "Pending",
        "requestedDate": "2026-09-09", "preferredWindow": "02:00 - 05:00", "durationHours": 2.5,
        "requiresPowerBlock": False, "requiresTrafficBlock": True, "speedRestrictionKmph": 30,
        "createdAt": "2026-08-28T10:00:00Z",
    },
    {
        "id": "TSK-TRD-202", "source": "TDMS", "department": "Traction Distribution",
        "description": "Insulator string replacement, three spans",
        "location": "Km 8/2, Naini Outer", "corridor": "DDU-PRYJ",
        "defectType": "Insulator Degradation", "severity": "Medium", "severityWeight": 2,
        "overdueDays": 5, "priorityScore": priority_score(2, 5), "status": "Pending",
        "requestedDate": "2026-09-10", "preferredWindow": "23:30 - 02:30", "durationHours": 2.0,
        "requiresPowerBlock": True, "requiresTrafficBlock": True, "speedRestrictionKmph": None,
        "createdAt": "2026-08-29T12:00:00Z",
    },
]

# ---------------------------------------------------------------------------
# Conflicts & bundles
# ---------------------------------------------------------------------------
CONFLICTS: List[dict] = [
    {
        "id": "CNF-001", "type": "Spatial Overlap", "corridor": "NDLS-GZB", "date": "2026-09-08",
        "departments": ["Engineering", "Traction Distribution", "Signal & Telecom"],
        "taskIds": ["TSK-ENG-101", "TSK-TRD-201", "TSK-SNT-301"],
        "description": "Three departments have requested overlapping block windows within Km 14/2-16/4.",
        "status": "Open",
    },
    {
        "id": "CNF-002", "type": "Power Block Overlap", "corridor": "DDU-PRYJ", "date": "2026-09-10",
        "departments": ["Traction Distribution"],
        "taskIds": ["TSK-TRD-202"],
        "description": "Requested power block overlaps with scheduled OHE maintenance train movement.",
        "status": "Open",
    },
]

BUNDLES: List[dict] = [
    {
        "id": "BUN-101", "corridor": "NDLS-GZB", "date": "2026-09-08",
        "departments": ["Engineering", "Traction Distribution", "Signal & Telecom"],
        "taskIds": ["TSK-ENG-101", "TSK-TRD-201", "TSK-SNT-301"],
        "windowId": "WIN-NDLS-01", "downtimeSavedHours": 4.5, "status": "Candidate",
    },
]

# ---------------------------------------------------------------------------
# Master schedule (populated by /api/optimization/run and manual approvals)
# ---------------------------------------------------------------------------
SCHEDULES: List[dict] = []

# Completed optimization runs, keyed by optimizationId, so GET /api/optimization/{id} works.
OPTIMIZATION_RUNS: Dict[str, dict] = {}

# ---------------------------------------------------------------------------
# Data source sync status
# ---------------------------------------------------------------------------
SYNC_STATUS: Dict[str, dict] = {
    "TMS": {
        "id": "TMS", "name": "Track Management System", "status": "Healthy",
        "description": "Departmental defect and maintenance-demand register for the Engineering branch.",
        "lastSyncTime": "2026-09-05T18:00:00Z",
        "recordsReceived": 214, "recordsSuccess": 214, "recordsFailed": 0,
        "frequency": "Every 15 minutes",
    },
    "SMMS": {
        "id": "SMMS", "name": "Signal Maintenance Management System", "status": "Healthy",
        "description": "Signal & Telecom equipment fault and maintenance tracking feed.",
        "lastSyncTime": "2026-09-05T17:45:00Z",
        "recordsReceived": 132, "recordsSuccess": 132, "recordsFailed": 0,
        "frequency": "Every 15 minutes",
    },
    "TDMS": {
        "id": "TDMS", "name": "Traction Distribution Management System", "status": "Degraded",
        "description": "OHE and traction power infrastructure condition-monitoring feed.",
        "lastSyncTime": "2026-09-05T15:10:00Z",
        "recordsReceived": 98, "recordsSuccess": 91, "recordsFailed": 7,
        "frequency": "Every 15 minutes",
    },
    "COA": {
        "id": "COA", "name": "Control Office Application", "status": "Healthy",
        "description": "Live train running and section occupancy data from the control office.",
        "lastSyncTime": "2026-09-05T18:10:00Z",
        "recordsReceived": 301, "recordsSuccess": 301, "recordsFailed": 0,
        "frequency": "Every 5 minutes",
    },
}

# ---------------------------------------------------------------------------
# Sync job history (populated by POST /api/sync/trigger)
# ---------------------------------------------------------------------------
SYNC_HISTORY: List[dict] = [
    {
        "id": "JOB-TMS-0001", "source": "TMS", "started": "2026-09-05T17:58:00Z",
        "completed": "2026-09-05T18:00:00Z", "records": 214, "success": 214, "failed": 0,
        "status": "Success",
    },
    {
        "id": "JOB-SMMS-0001", "source": "SMMS", "started": "2026-09-05T17:43:00Z",
        "completed": "2026-09-05T17:45:00Z", "records": 132, "success": 132, "failed": 0,
        "status": "Success",
    },
    {
        "id": "JOB-TDMS-0001", "source": "TDMS", "started": "2026-09-05T15:08:00Z",
        "completed": "2026-09-05T15:10:00Z", "records": 98, "success": 91, "failed": 7,
        "status": "Success with Warnings",
    },
]

# ---------------------------------------------------------------------------
# Data quality & NLP text-extraction pipeline
# ---------------------------------------------------------------------------
DATA_QUALITY_METRICS: Dict[str, object] = {
    "totalRawRecords": 1842,
    "cleanRecords": 1701,
    "duplicateRecords": 63,
    "outliers": 28,
    "parsedRecords": 512,
    "recordsRequiringReview": 50,
}

SAMPLE_UNSTRUCTURED: List[dict] = [
    {
        "id": "RAW-001", "source": "Station Diary - NDLS",
        "rawText": "urgent ohe spark at mast 21/04 ghaziabad down line contact wire cracked",
        "parsingStatus": "AI Parsed",
        "parsed": {
            "department": "Traction Distribution",
            "defectType": "OHE Wear & Contact Wire Droppers",
            "location": "KM 21/04",
            "severity": "Critical",
            "confidenceScore": "96%",
        },
    },
    {
        "id": "RAW-002", "source": "Control Telegram - GZB",
        "rawText": "rail flaw noted near km 14/2 sahibabad outer needs tamping before monsoon",
        "parsingStatus": "AI Parsed",
        "parsed": {
            "department": "Engineering",
            "defectType": "Track Geometry / Ballast Deficiency",
            "location": "KM 14/2",
            "severity": "High",
            "confidenceScore": "91%",
        },
    },
    {
        "id": "RAW-003", "source": "TMS Free-Text Log",
        "rawText": "point machine interlocking circuit fault yard throat delaying shunting",
        "parsingStatus": "AI Parsed",
        "parsed": {
            "department": "Signal & Telecom",
            "defectType": "Point Machine / Signaling Disconnection",
            "location": "Yard Throat",
            "severity": "Medium",
            "confidenceScore": "88%",
        },
    },
]


def parse_defect_text(raw_text: str) -> dict:
    """Simple heuristic extractor mirroring the frontend's client-side fallback,
    kept in the backend so both mock and real modes behave consistently."""
    text = raw_text.lower()

    department = "Engineering"
    defect_type = "General Track Maintenance"
    severity = "Medium"
    location = "Station Yard Track Section"

    if any(k in text for k in ("mast", "ohe", "wire", "cantilever", "pantograph", "power")):
        department = "Traction Distribution"
        defect_type = "OHE Wear & Contact Wire Droppers"
    elif any(k in text for k in ("signal", "point", "interlocking", "circuit", "axle")):
        department = "Signal & Telecom"
        defect_type = "Point Machine / Signaling Disconnection"
    elif any(k in text for k in ("rail", "ballast", "tamping", "sleeper", "track", "weld")):
        department = "Engineering"
        defect_type = "Track Geometry / Ballast Deficiency"

    if any(k in text for k in ("urgent", "critical", "flaw", "sparking", "failure")):
        severity = "Critical"
    elif any(k in text for k in ("replace", "gap", "overhaul", "high")):
        severity = "High"

    km_match = re.search(r"km\s*\d+(/\d+)?(-\d+(/\d+)?)?", raw_text, re.IGNORECASE)
    if km_match:
        location = km_match.group(0).upper()

    return {
        "department": department,
        "defectType": defect_type,
        "location": location,
        "severity": severity,
        "confidenceScore": "93%",
        "parsingStatus": "AI Parsed",
        "duplicateStatus": "Unique",
    }


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------
_notification_counter = itertools.count(1)


def next_notification_id() -> str:
    return f"NTF-{next(_notification_counter):04d}"


def build_notifications() -> List[dict]:
    """Derives notifications from live data (critical tasks, open conflicts,
    degraded sync sources) rather than keeping a separately maintained list
    that can drift out of sync with the rest of the app."""
    notifications: List[dict] = []

    for task in TASKS:
        if task["severity"] == "Critical" and task["status"] == "Pending":
            notifications.append({
                "id": next_notification_id(),
                "type": "critical",
                "title": f"Critical task pending: {task['id']}",
                "message": f"{task['defectType']} at {task['location']} ({task['department']}) is unscheduled.",
                "timestamp": task["createdAt"],
                "read": False,
                "category": "Task",
                "relatedId": task["id"],
            })

    for conflict in CONFLICTS:
        if conflict["status"] == "Open":
            notifications.append({
                "id": next_notification_id(),
                "type": "warning",
                "title": f"Unresolved conflict: {conflict['id']}",
                "message": conflict["description"],
                "timestamp": now_iso(),
                "read": False,
                "category": "Conflict",
                "relatedId": conflict["id"],
            })

    for source_id, source in SYNC_STATUS.items():
        if source["status"] == "Degraded":
            notifications.append({
                "id": next_notification_id(),
                "type": "warning",
                "title": f"Data source degraded: {source_id}",
                "message": f"{source['name']} is reporting a degraded sync status ({source['recordsFailed']} records failed).",
                "timestamp": source["lastSyncTime"],
                "read": False,
                "category": "Sync",
                "relatedId": source_id,
            })

    notifications.sort(key=lambda n: n["timestamp"], reverse=True)
    return notifications


NOTIFICATIONS: List[dict] = build_notifications()


# ---------------------------------------------------------------------------
# ID generators
# ---------------------------------------------------------------------------
_task_counter = itertools.count(103)
_block_counter = itertools.count(2)
_opt_counter = itertools.count(892103)
_job_counter = itertools.count(1)
_bundle_counter = itertools.count(102)


def next_task_id(department: str) -> str:
    dept_code = {
        "Engineering": "ENG", "Traction Distribution": "TRD", "Signal & Telecom": "SNT",
        "Operating & Traffic Planning": "OPS", "Mechanical": "MEC", "Electrical": "ELE",
    }.get(department, "GEN")
    return f"TSK-{dept_code}-{next(_task_counter)}"


def next_block_id(date_str: str) -> str:
    return f"BLK-{date_str.replace('-', '')}-{next(_block_counter):02d}"


def next_block_code() -> str:
    return f"BLOCK B-{next(_block_counter):03d}"


def next_optimization_id() -> str:
    return f"OPT-IR-{next(_opt_counter)}"


def next_job_id(source: str) -> str:
    return f"JOB-{source}-{next(_job_counter):04d}"


def next_bundle_id() -> str:
    return f"BUN-{next(_bundle_counter)}"


# ---------------------------------------------------------------------------
# Lookup helpers
# ---------------------------------------------------------------------------
def find_task(task_id: str) -> Optional[dict]:
    return next((t for t in TASKS if t["id"] == task_id), None)


def find_corridor_window(window_id: str) -> Optional[dict]:
    return next((w for w in CORRIDOR_WINDOWS if w["id"] == window_id), None)


def find_conflict(conflict_id: str) -> Optional[dict]:
    return next((c for c in CONFLICTS if c["id"] == conflict_id), None)


def find_bundle(bundle_id: str) -> Optional[dict]:
    return next((b for b in BUNDLES if b["id"] == bundle_id), None)


def find_schedule(schedule_id: str) -> Optional[dict]:
    return next((s for s in SCHEDULES if s["id"] == schedule_id), None)


def find_corridor(code: str) -> Optional[dict]:
    return next((c for c in CORRIDORS if c["code"] == code), None)
