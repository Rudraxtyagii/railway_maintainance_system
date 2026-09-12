# 🚄 RAILBLOCK v3.0 — Complete Operational & User Testing Manual

**Ministry of Railways, Government of India • Centre for Railway Information Systems (CRIS)**  
*Smart India Hackathon (SIH) — PS 26027*

---

## 1. Executive System Architecture

RAILBLOCK is an enterprise-grade, real-time AI block planning and decision-support command system for Indian Railways. It integrates live operational telemetry with regulatory rulebooks to automate maintenance block scheduling, conflict bundling, and safety enforcement without hallucinations.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       RAILBLOCK ENTERPRISE TOPOLOGY                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
    [ Frontend UI (React + Vite) ]              [ Backend API (FastAPI) ]
  • Real-Time Stream Bus (WS / SSE)           • Pure DB Persistence (SQLAlchemy 2.0)
  • HITL Controller Review Center             • 3-Tier COA/TMS Stream Ingestion
  • Grounded RAG Copilot with Citations       • RAG Regulatory Knowledge Base
  • Dynamic KPI & Downtime Dashboards         • HITL Approval State Machine
  • RBAC Persona Clearance Guard              • Salted PBKDF2-SHA256 Auth
                ▲                                             ▲
                │             WebSocket / SSE Events          │
                └─────────────────────────────────────────────┘
                                       │
                                       ▼
                       [ PostgreSQL 16 / SQLite Database ]
            users | tasks | coa_stream_logs | knowledge_chunks |
            hitl_reviews | corridor_windows | schedules | conflicts
```

---

## 2. Authenticated Personnel Accounts (Database RBAC)

All accounts are stored in the PostgreSQL/SQLite database (`users` table) with **salted PBKDF2-HMAC-SHA256** password hashes. **Public sign-up is disabled.** Only authorized administrators (`PLANNER_ADMIN`) can provision or modify railway personnel.

| Username | Standard Password | Name | Role Code | Department | Official Clearance & Permissions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `planner.admin` | `Password123!` | Rajesh Sharma | `PLANNER_ADMIN` | Operating & Planning | Senior DOM: **Review & Approval Authority Only**. Oversees all corridor blocks, executes optimization solvers, modifies windows, accords HITL sanctions, ingests RAG rules. *(Direct block request creation disabled to enforce operational protocol)*. |
| `engineer.ndls` | `Password123!` | Anita Verma | `DEPT_ENGINEER` | Engineering | Senior DEN: **Requisition Submitter**. Submits track maintenance requests (BCM/CSM deep screening, turnouts, tamping) and receives instant notifications upon block sanction. |
| `snt.user` | `Password123!` | Vikramaditya Rao | `SNT_OFFICER` | Signal & Telecom | Senior DSTE: **Requisition Submitter**. Submits signaling, interlocking, and point machine block requests; receives real-time block allocation alerts. |
| `trd.user` | `Password123!` | Pooja Iyer | `TRD_ENGINEER` | Traction Distribution | DEE / TRD: **Requisition Submitter**. Submits 25kV OHE isolation and shadow power block requests (PTW G&SR 17.03); receives real-time allocation alerts. |
| `field.controller` | `Password123!` | Surendra Kumar | `FIELD_CONTROLLER` | Station & Section Control | Chief Section Controller: **Live HITL Approver**. Live block sanction, window adjustment, emergency overrides, Form T/409 caution order signing. |

---

## 3. The 3-Tier Indian Railways Data Stream Format

RAILBLOCK structures live operational and maintenance feeds across three primary operational layers:

```
[Tier 1: Corridor Demand / Plan] ──> [Tier 2: COA Active Block Log] ──> [Tier 3: Actual Execution / Output]
   (TMS / Rolling Block Module)           (Granted vs Denied Lines)            (Downtime Metric & Burst Overrun)
```

### Data Fields Specification:
1. **Block Identification**: `division_id` (e.g. `DLI`), `section_name` (e.g. `NDLS-GZB`), `line_type` (`UP Main`, `DN Main`, `UP Slow`, `DN Slow`, `3rd Line`, `4th Line`), `station_from`, `station_to`, `location`.
2. **Temporal Planning (Rolling Block)**: `nominated_date`, `planned_start_time`, `planned_end_time`, `demanded_time` (e.g. `3.0 hrs`), `demanded_duration_mins`.
3. **Operational Execution Logs**: `demanded_time`, `granted_time`, `actual_start_time`, `actual_end_time`, `burst_duration_mins` (overrun past granted time).
4. **Asset & Department Categorisation**: `requesting_dept` (`Engineering`, `Signal & Telecom`, `Traction Distribution`, `Operating`), `block_purpose` (e.g. `Deep screening`, `BCM machine deployment`, `Turnout renewal`, `25kV OHE inspection`).
5. **Asset Availability Impact & Safety**: `traffic_impact_status` (`Regulated`, `Diverted`, `Cancelled`, `Zero Delay`), `requires_power_block`, `requires_traffic_block`, `speed_restriction_kmph`.
6. **Human-in-the-Loop Governance**: `hitl_status` (`PENDING_REVIEW`, `CONTROLLER_APPROVED`, `CONTROLLER_MODIFIED`, `CONTROLLER_DENIED`, `EMERGENCY_OVERRIDE_APPROVED`), `controller_remarks`, `controller_id`.

---

## 4. End-to-End Testing Guide (CLI & cURL)

Ensure the backend is running locally on port 8080 (`python3 -m uvicorn app.main:app --port 8080` or via Docker).

### Step 1: Authenticate via Database
```bash
# Authenticate as Senior DOM / Planner Admin
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "planner.admin", "password": "Password123!"}'
```
*Response includes JWT token and user profile:*
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "USR-01",
    "username": "planner.admin",
    "name": "Rajesh Sharma",
    "role": "PLANNER_ADMIN",
    "department": "Operating & Traffic Planning"
  }
}
```
*Save your token:*
```bash
export TOKEN="<paste-jwt-token-here>"
```

---

### Step 2: Ingest a Real-Time 3-Tier COA / TMS Stream Batch
```bash
curl -X POST http://localhost:8080/api/ingest/stream \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_system": "COA",
    "stream_id": "CRIS-COA-STREAM-2026-LIVE",
    "records": [
      {
        "divisionId": "DLI",
        "sectionName": "NDLS-GZB",
        "lineType": "UP Main",
        "stationFrom": "NDLS",
        "stationTo": "GZB",
        "nominatedDate": "2026-09-18",
        "plannedStartTime": "01:30",
        "plannedEndTime": "04:30",
        "demandedTime": "3.0 hrs",
        "requestingDept": "Engineering",
        "blockPurpose": "Mechanized Track Deep Screening & Tamping",
        "description": "BCM Machine deployment Section Km 24/0 to 26/0",
        "trafficImpactStatus": "Zero Passenger Delay / Night Corridor",
        "corridor": "NDLS-GZB",
        "location": "Section Km 24/0",
        "severity": "Critical",
        "overdueDays": 4,
        "requiresPowerBlock": true,
        "requiresTrafficBlock": true,
        "speedRestrictionKmph": 20
      },
      {
        "divisionId": "DLI",
        "sectionName": "NDLS-GZB",
        "lineType": "UP Slow",
        "stationFrom": "ANVR",
        "stationTo": "SBB",
        "nominatedDate": "2026-09-18",
        "plannedStartTime": "02:00",
        "plannedEndTime": "04:00",
        "demandedTime": "2.0 hrs",
        "requestingDept": "Traction Distribution",
        "blockPurpose": "25kV OHE Contact Wire Inspection & Tensioning",
        "description": "OHE dropper replacement & bracket alignment",
        "trafficImpactStatus": "Zero Delay",
        "corridor": "NDLS-GZB",
        "location": "Section Km 25/2",
        "severity": "High",
        "overdueDays": 1,
        "requiresPowerBlock": true,
        "requiresTrafficBlock": false,
        "speedRestrictionKmph": 30
      }
    ]
  }'
```
*Instant Real-Time Result:*
- Records stored in PostgreSQL `tasks` and `coa_stream_logs`.
- Immediate conflict detection evaluated against concurrent track possessions.
- Instant event broadcast sent via WebSockets (`/ws/events`) and SSE (`/api/realtime/events`).

---

### Step 3: Test Grounded Hallucination-Free RAG Copilot
Query the RAG engine regarding 25kV OHE safety rules, Permit-to-Work, or track machine tolerances:
```bash
curl -X POST http://localhost:8080/api/ai/rag-query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the mandatory physical clearance distance from 25kV OHE wires under G&SR and what are discharge rod earthing rules?",
    "corridorContext": "NDLS-GZB"
  }'
```
*Verifiable Citation-Backed Response:*
```json
{
  "query": "What is the mandatory physical clearance distance...",
  "answerMarkdown": "### ⚡ Official Traction Safety & G&SR Regulatory Directives\n\nAccording to **[G&SR Rule 17.03: Permit to Work (PTW) & 25kV OHE Minimum Safe Distance]**:\n> *\"Under G&SR Rule 17.03, no person, track maintenance machine, or crane shall work within a distance of 2.0 meters from any live 25kV 50Hz AC overhead equipment...\"*",
  "citations": [
    {
      "manualName": "G&SR",
      "chapter": "Chapter XVII: Working of Trains on Electrified Sections",
      "ruleNumber": "Rule 17.03",
      "title": "Permit to Work (PTW) & 25kV OHE Minimum Safe Distance",
      "verifiedGroundTruth": true
    }
  ],
  "groundedInRules": true,
  "hallucinationCheckPassed": true
}
```

---

### Step 4: Human-in-the-Loop (HITL) Controller Review
Section Controller inspects the pending queue, modifies timing/speed parameters, and accords cryptographic digital sanction:
```bash
# 1. Fetch pending reviews
curl -X GET http://localhost:8080/api/hitl/pending \
  -H "Authorization: Bearer $TOKEN"

# 2. Controller enters decision (Modify & Sanction)
curl -X POST http://localhost:8080/api/hitl/review \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "TSK-COA-XXXXXX",
    "action": "MODIFY",
    "modifiedStartTime": "01:45",
    "modifiedEndTime": "04:15",
    "modifiedSpeedRestriction": 25,
    "remarks": "Window adjusted by 15 mins to ensure 100% line clearance buffer for 12424 Rajdhani Express."
  }'
```
*Audit Log Response:*
```json
{
  "reviewId": "HITL-89A1B2C3",
  "action": "MODIFY",
  "status": "CONTROLLER_MODIFIED",
  "controllerName": "Rajesh Sharma",
  "digitalSignature": "IR-CRIS-SIG-USR-01-4F43B6A17F16BFB8",
  "remarks": "Window adjusted by 15 mins..."
}
```

---

### Step 5: Test Emergency Priority 100 Override
```bash
curl -X POST http://localhost:8080/api/hitl/override \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "TSK-COA-XXXXXX",
    "reason": "Severe Rail Fracture / Track Distortion",
    "emergencyJustification": "Ultrasonic car detected transverse rail flaw on UP Main Km 28/4. Immediate traffic block required.",
    "authorizationPasscode": "CRIS@2026"
  }'
```

---

### Step 6: Listen to Real-Time SSE Stream
In a separate terminal or browser:
```bash
curl -N http://localhost:8080/api/realtime/events
```
*Whenever any task is ingested, modified, approved, or deleted, you will receive instant event streams:*
```text
data: {"type": "STREAM_INGESTED", "data": {"streamId": "CRIS-COA-STREAM-2026-LIVE", "tasksCount": 2}}
data: {"type": "HITL_DECISION_ENTERED", "data": {"taskId": "TSK-COA-XXXXXX", "action": "MODIFY"}}
data: {"type": "METRICS_UPDATED", "data": {"reason": "HITL_REVIEW"}}
```

---

### Step 7: Run Automated Verification Test Suite
Run the built-in automated test suite to verify all modules in under 5 seconds:
```bash
cd railblock-backend
python3 scratch/test_railblock_system.py
```
*Expected Output:*
```
================================================================================
            STARTING RAILBLOCK SYSTEM AUTOMATED VERIFICATION SUITE              
================================================================================
[TEST 1] Testing Database RBAC Authentication... (✓ Passed)
[TEST 2] Testing Grounded Hallucination-Free RAG Engine... (✓ Passed)
[TEST 3] Testing Real-Time COA / TMS Stream Ingestion... (✓ Passed)
[TEST 4] Testing Human-in-the-Loop (HITL) Controller Review... (✓ Passed)
[TEST 5] Testing Live Analytics & KPI Feed directly from DB... (✓ Passed)
================================================================================
            ALL 5 VERIFICATION SUITES PASSED PERFECTLY (100% SUCCESS)           
================================================================================
```

---

## 5. UI Walkthrough & Testing in Browser

1. **Launch Backend**: `cd railblock-backend && python3 -m uvicorn app.main:app --port 8080`
2. **Launch Frontend**: `cd SIH-Frontend && npm run dev`
3. Open `http://localhost:5173` in your browser.
4. **Log in** with username `planner.admin` and password `Password123!`.
5. Check top header strip: Notice the pulsing **🟢 CRIS REAL-TIME STREAM ACTIVE** badge.
6. Navigate to **Block Requests**:
   - Click **📡 Ingest Live COA Stream** button. Notice how new 3-tier requests immediately appear in real time without refreshing!
7. Navigate to **HITL Review Center** (sidebar or top header button):
   - Review pending requests, click **⚙ Adjust**, modify the time window or speed restriction, and click **Confirm Decision & Sign**.
   - Check the **Audit Trail** tab to view the SHA-256 cryptographic signature.
8. Navigate to **RAIL-GPT Copilot**:
   - Ask: *"What are the G&SR safety rules for 25kV OHE work?"*
   - Observe the **VERIFIED GROUND TRUTH RULE CITATIONS** card showing `[G&SR Rule 17.03]` and `[ACTM Vol II Section 4.2]`.
9. Navigate to **Dashboard**:
   - View live KPIs computed directly from PostgreSQL (`totalBlockRequests`, `pendingRequests`, `downtimeSavedHours`).

---

## 6. Production Deployment via Docker Compose

To run the entire system (PostgreSQL 16, FastAPI Backend, React Frontend) in containerized production mode:

```bash
# Build and launch containers
docker compose up --build -d

# Check health
docker compose ps

# View live backend logs
docker compose logs -f backend
```

- **Frontend Application**: `http://localhost:3000`
- **Backend Swagger API**: `http://localhost:8080/docs`
- **PostgreSQL Database**: `localhost:5432` (`railblock_db` / user: `railblock`)
