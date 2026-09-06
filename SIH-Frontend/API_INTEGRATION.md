# RAILBLOCK — Backend API Integration Guide

**For:** Spring Boot Backend & Python Scheduling Service Developers  
**Project:** AI-Powered Automatic Block Planning (SIH PS 26027)  
**Organization:** Ministry of Railways, Government of India

---

## 1. Integration Overview

The frontend is architected using a decoupled service layer. UI components **never** make direct HTTP calls; they interact solely with functions in `src/services/`, which delegate to `src/services/apiClient.js`.

To connect your real backend:
1. Update `.env`:
   ```env
   VITE_API_BASE_URL=http://your-backend-host:8080/api
   VITE_USE_MOCK=false
   ```
2. Ensure your backend returns standard JSON matching the contracts documented below.
3. If your team selects alternative endpoint paths, update only the corresponding service file in `src/services/`.

---

## 2. Authentication & JWT Contract

### `POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "username": "planner.admin",
    "password": "Password123"
  }
  ```
- **Response Format (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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
      "avatar": "RS"
    }
  }
  ```
- **Frontend Storage & Transmission:**
  The frontend stores `token` in `localStorage('railblock_token')` and automatically transmits it on all subsequent requests via:
  `Authorization: Bearer <token>`

---

## 3. Departmental Maintenance Block Requests

### `GET /api/tasks`
- **Query Parameters:** `department`, `corridor`, `severity`, `status`, `search`
- **Response Format (200 OK):**
  ```json
  [
    {
      "id": "TSK-ENG-101",
      "source": "TMS",
      "department": "Engineering",
      "description": "Deep screening and ballast tamping between UP Main Km 14/2 - 16/4",
      "location": "Km 14/2 - 16/4, Sahibabad Outer",
      "corridor": "NDLS-GZB",
      "defectType": "Track Geometry / Ballast Deficiency",
      "severity": "Critical",
      "severityWeight": 4,
      "overdueDays": 14,
      "priorityScore": 98,
      "status": "Pending",
      "requestedDate": "2026-09-08",
      "preferredWindow": "01:30 - 04:30",
      "durationHours": 3.0,
      "requiresPowerBlock": false,
      "requiresTrafficBlock": true,
      "speedRestrictionKmph": 45,
      "createdAt": "2026-08-25T08:30:00Z"
    }
  ]
  ```

### `POST /api/tasks`
- **Request Body:**
  ```json
  {
    "department": "Engineering",
    "defectType": "Track Geometry / Ballast Deficiency",
    "description": "Turnout track realignment and packing",
    "location": "Km 18/4, Sahibabad UP Main",
    "corridor": "NDLS-GZB",
    "severity": "High",
    "durationHours": 2.5,
    "preferredDate": "2026-09-12",
    "preferredWindow": "01:30 - 04:00",
    "overdueDays": 7,
    "requiresTrafficBlock": true,
    "requiresPowerBlock": false,
    "speedRestrictionKmph": 30
  }
  ```
- **Response (201 Created):** Returns the created task object with generated `id` and `priorityScore`.

---

## 4. Corridor Timetable Availability

### `GET /api/corridors`
- Returns list of High Density Network (HDN) corridors.

### `GET /api/corridors/windows`
- **Query Parameters:** `corridor`, `date`, `status`
- **Response:**
  ```json
  [
    {
      "id": "WIN-NDLS-01",
      "corridor": "NDLS-GZB",
      "line": "UP Main & UP Slow",
      "date": "2026-09-08",
      "startTime": "01:30",
      "endTime": "04:30",
      "durationHours": 3.0,
      "status": "Available",
      "trafficDensity": "Low (Night non-suburban)",
      "occupancyBefore": "12401 Magadh Express (Departed 01:10)",
      "occupancyAfter": "14055 Brahmaputra Mail (Scheduled 04:55)",
      "suitableTasks": ["TSK-ENG-101", "TSK-TRD-201", "TSK-SNT-301"],
      "conflictCount": 2
    }
  ]
  ```

---

## 5. Conflict Detection & Shadow Bundling

### `GET /api/conflicts`
- Returns active spatial & power overlaps between departments.

### `POST /api/conflicts/{id}/resolve`
- **Request Body:** `{ "resolution": "Issued multi-department shadow permit" }`

### `GET /api/bundles`
- Returns AI multi-disciplinary bundle candidates with calculated downtime savings.

### `POST /api/bundles/{id}/accept` & `POST /api/bundles/{id}/reject`
- Transitions bundle status between `Accepted`, `Candidate`, or `Rejected`.

---

## 6. Optimization Engine API (Python Scheduling Service)

### `POST /api/optimization/run`
- **Request Body:**
  ```json
  {
    "corridors": ["NDLS-GZB", "DDU-PRYJ", "BCT-ST", "HWH-KGP"],
    "dateRange": { "start": "2026-09-08", "end": "2026-09-15" },
    "maxBlockDurationHours": 4.0,
    "safetyBufferMinutes": 15
  }
  ```
- **Response Format (200 OK):**
  ```json
  {
    "optimizationId": "OPT-IR-892102",
    "engine": "Greedy Constraint Satisfaction + Shadow Bundling Solver (v2.4)",
    "executionTimeMs": 1420,
    "timestamp": "2026-09-05T18:30:00Z",
    "summary": {
      "tasksScheduled": 42,
      "tasksNotScheduled": 86,
      "conflictsResolved": 12,
      "bundlesCreated": 8,
      "totalBlockDurationHours": 72,
      "manualPlanningDowntimeHours": 120,
      "optimizedDowntimeHours": 72,
      "downtimeSavedHours": 48,
      "downtimeSavingPercent": 40,
      "networkUtilization": "88.4%"
    },
    "scheduledBlocks": [
      {
        "id": "BLK-2026-0908-01",
        "blockCode": "BLOCK B-201",
        "corridor": "NDLS-GZB",
        "corridorName": "New Delhi – Ghaziabad",
        "date": "2026-09-08",
        "startTime": "01:30",
        "endTime": "04:30",
        "durationHours": 3.0,
        "departments": ["Engineering", "Traction Distribution", "Signal & Telecom"],
        "taskIds": ["TSK-ENG-101", "TSK-TRD-201", "TSK-SNT-301"],
        "tasksCount": 3,
        "priority": "Critical",
        "bundleId": "BUN-101",
        "status": "Approved",
        "trafficBlockGranted": true,
        "powerBlockGranted": true,
        "controllerApproval": "Granted (Chief Controller/DLI)",
        "speedRestrictionKmph": 45,
        "efficiencyGainPercent": 42
      }
    ],
    "status": "SUCCESS"
  }
  ```

---

## 7. Master Block Schedule & Dispatch

### `GET /api/schedules`
- Returns scheduled block list with filters for corridor, date, and status.

### `POST /api/schedules/{id}/approve`
- Moves block to `Approved`.

### `POST /api/schedules/{id}/publish`
- Dispatches block to Control Office Application (COA) and Freight Operations Information System (FOIS).

### `POST /api/schedules/{id}/validate`
- Runs 5 statutory safety checks (timetable clash, corridor free, duration ceiling, 15m buffer, power sync).

---

## 8. Data Ingestion & Sync

### `GET /api/sync/status`
- Health and record counts for TMS, SMMS, TDMS, and COA.

### `POST /api/sync/trigger`
- Triggers live sync job for specified source (`TMS`, `SMMS`, `TDMS`, `COA`, or `ALL`).

---

## 9. Analytics & KPI Feeds

### `GET /api/analytics/dashboard`
- High-level KPIs, department breakdown, priority distribution, and corridor utilization.

### `GET /api/analytics/downtime`
- Manual vs Optimized downtime comparison (120h vs 72h, 48h saved = 40%).

### `GET /api/analytics/performance`
- Algorithm convergence iterations, average processing time, and monthly throughput.

---

## 10. Error Handling Standard

When an error occurs, the backend should return standard RFC 7807 Problem Details:
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Block window conflicts with 12002 Bhopal Shatabdi Express path on DN Main",
  "timestamp": "2026-09-05T18:35:00Z"
}
```
The frontend `apiClient` automatically extracts and surfaces `message` via clean, user-friendly toast notifications.
