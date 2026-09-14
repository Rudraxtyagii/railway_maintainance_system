# RAILBLOCK v3.0 — Judge Rapid Revision Sheet
**Smart India Hackathon (SIH) — Problem Statement 26027**  
**Ministry of Railways | Centre for Railway Information Systems (CRIS)**  

---

## 1. Architecture in 10 Lines
1. **Frontend:** React 19 SPA (Vite + Tailwind CSS) with route-guarded RBAC and Recharts visual analytics.
2. **Backend:** FastAPI (Python 3.11 ASGI) exposing 16 REST routers with RFC 7807 problem details error handling.
3. **Database:** PostgreSQL 16 relational store with connection pooling, SQLAlchemy 2.0 ORM, and Alembic migrations.
4. **Offline Resilience:** Resilient local SQLite (`railblock.db`) persistent store fallback if PostgreSQL is offline.
5. **Real-Time Stream:** Dual-stack event broker (`app/realtime.py`) broadcasting over WebSockets and Server-Sent Events (SSE).
6. **Data Ingestion:** 3-Tier real-time CRIS COA / TMS digital stream ingestion with automated spatial-temporal clash detection.
7. **Optimization:** 2-Pass Greedy Constraint Satisfaction Solver with Shadow Bundling to consolidate cross-departmental blocks.
8. **Predictive Intelligence:** Multi-factor duration regression and Logistic Sigmoid overrun risk modeling ($P(\text{overrun}) = \frac{1}{1 + e^{-z}}$).
9. **Grounded RAG Copilot:** RAIL-GPT regulatory assistant grounded in G&SR, ACTM, IRPWM, and BWM manuals with verified citations.
10. **Human Governance:** Mandatory Human-in-the-Loop (HITL) Section Controller review with SHA-256 digital signatures and audit logs.

---

## 2. All Important Files at a Glance

| Layer | Key File | Role / Purpose |
| :--- | :--- | :--- |
| **Backend Core** | `app/main.py` | FastAPI app entry point, CORS configuration, Alembic lifespan runner, router registration. |
| | `app/database.py` | PostgreSQL 16 engine, connection pooling, and `get_db` session dependency. |
| | `app/db_models.py` | 16 SQLAlchemy relational models (`users`, `tasks`, `schedules`, `hitl_reviews`, etc.). |
| | `app/auth.py` | Salted PBKDF2-HMAC-SHA256 password hashing and JWT claims verification. |
| | `app/realtime.py` | WebSocket (`/ws/events`) & SSE (`/api/realtime/events`) `ConnectionManager`. |
| | `app/rag/engine.py` | Grounded RAG token scoring (`_score_chunk`), top-$k$ retrieval, and citation builder. |
| **Backend Routers**| `app/routers/ingest.py` | `POST /api/ingest/stream` (3-tier stream ingestion & conflict detection). |
| | `app/routers/hitl.py` | `POST /api/hitl/review` (Approve/Modify/Deny) & `/api/hitl/override` (Emergency). |
| | `app/routers/optimization.py` | `POST /api/optimization/run` (2-pass Greedy CSP Solver & Bundling). |
| | `app/routers/ml_optimization.py`| `POST /api/optimization/ml/predict-duration` (ML regression & overrun risk). |
| | `app/routers/tasks.py` | `POST /api/tasks` (Departmental block CRUD; admin creation blocked). |
| | `app/routers/schedules.py` | `POST /api/schedules/{id}/approve` & `/publish` (Master schedule lifecycle). |
| | `app/routers/admin.py` | `POST /api/admin/reset-database` (Clean-slate reset of dynamic queues). |
| **Frontend Core** | `src/App.jsx` | React Router v7 routes with `RoleProtectedRoute` clearance guard. |
| | `src/context/AuthContext.jsx` | Authenticated user session, role checks, and permission evaluator. |
| | `src/services/apiClient.js` | Axios/fetch client attaching JWT Bearer tokens and managing base URL. |
| | `src/services/realtimeService.js`| Real-time WebSocket/SSE listener dispatching native browser CustomEvents. |
| | `src/pages/HITLReviewCenter.jsx`| Section Controller live review, timing adjustment, and audit trail workspace. |
| | `src/pages/AICopilot.jsx` | RAIL-GPT conversational assistant with verified rule citations. |

---

## 3. All Important APIs

| Endpoint | Method | Role Required | Request Body / Key Params | Primary Action |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Public | `{ username, password }` | Authenticates against DB; returns JWT and user profile. |
| `/api/ingest/stream` | `POST` | Any Auth | `{ source_system, stream_id, records: [...] }` | Ingests 3-tier COA stream, creates tasks, flags conflicts. |
| `/api/tasks` | `POST` | Dept Officers | `{ department, corridor, location, durationHours, ... }` | Creates block requisition; admins forbidden (403). |
| `/api/hitl/review` | `POST` | Controller/Admin | `{ taskId, action: "APPROVE"/"MODIFY"/"DENY", ... }` | Sanctions block with SHA-256 digital signature token. |
| `/api/hitl/override` | `POST` | Controller/Admin | `{ taskId, reason, emergencyJustification }` | Escalates task to Priority 100 with immediate sanction. |
| `/api/optimization/run` | `POST` | Any Auth | `{ corridors, dateRange, maxBlockDurationHours }` | Runs 2-pass Greedy CSP solver; creates bundles/schedules. |
| `/api/optimization/ml/predict-duration` | `POST` | Any Auth | `{ taskIds, weatherFactor, nightShift }` | ML duration regression & logistic overrun risk inference. |
| `/api/ai/rag-query` | `POST` | Any Auth | `{ query, corridorContext }` | Queries verified G&SR/ACTM rules with citations. |
| `/api/schedules/{id}/approve` | `POST` | Any Auth | Path `schedule_id` | Approves master corridor schedule block. |
| `/api/schedules/{id}/publish` | `POST` | Any Auth | Path `schedule_id` | Broadcasts block to COA/FOIS live train graph. |
| `/api/admin/reset-database` | `POST` | Admin Only | None | Purges operational queues; preserves config/users/rules. |

---

## 4. AI / ML Stack Breakdown

| Sub-system | Exact Algorithm / Model | Location | Output / Result |
| :--- | :--- | :--- | :--- |
| **Grounded RAG Engine** | Token TF relevance scoring (`_score_chunk`) over 10 verified manual chunks | `app/rag/engine.py` | Grounded citations (`GSR-17-03`, `ACTM-VOL2`, `IRPWM-308`, etc.) with zero hallucination. |
| **Duration Prediction** | Multi-factor linear regression ($D \times M_{\text{dept}} \times M_{\text{corridor}} \times M_{\text{weather}} \times M_{\text{night}}$) | `app/routers/ml_optimization.py` | Predicted duration in hours. |
| **Overrun Risk Model** | Logistic Sigmoid Model ($P = \frac{1}{1 + e^{-z}}$) | `app/routers/ml_optimization.py` | Overrun probability % and dynamic safety buffer (10/15/30 min). |
| **Synergy Clustering** | Multi-Criteria Decision Making (MCDM) Spatial Clustering | `app/routers/ml_optimization.py` | Cross-departmental synergy score % ($\ge 85\%$ threshold). |
| **Block Optimizer** | 2-Pass Greedy Constraint Satisfaction + Shadow Bundling Solver | `app/routers/optimization.py` | Optimized schedules, candidate bundles, $40\%\text{–}60\%$ downtime savings. |
| **Defect NLP Parser** | Regex & keyword heuristic entity extraction | `app/data.py` / `dataQualityService.js` | Extracted department, defect type, location Km, and severity. |

---

## 5. PostgreSQL Database Tables (16 Entities)

1. `users` — Railway personnel with salted PBKDF2 hashes & RBAC roles.
2. `tasks` — 3-tier rolling block demands, execution metrics, and burst duration logs.
3. `coa_stream_logs` — Raw JSON telemetry streams ingested from CRIS COA.
4. `knowledge_chunks` — Official G&SR, ACTM, IRPWM, BWM, Rolling Block manual clauses for RAG.
5. `hitl_reviews` — Section Controller review decisions and SHA-256 digital signatures.
6. `corridors` — HDN railway corridor infrastructure (lines, speed, track count).
7. `corridor_windows` — 52-week rolling timetable window slots (Night gaps 01:30–04:30).
8. `conflicts` — Detected spatial-temporal clashes across departments.
9. `bundles` — Multi-departmental shadow block candidates.
10. `schedules` — Master corridor schedule blocks (Draft -> Approved -> Published).
11. `optimization_runs` — Audit logs of solver executions and downtime savings summaries.
12. `sync_sources` — External connector feeds (TMS, SMMS, TDMS, COA).
13. `sync_history` — Synchronization job execution logs.
14. `notifications` — Targeted operational alerts (by user ID, department, and role).
15. `audit_logs` — System-wide security and operational action logs.
16. `data_quality_samples` — Unstructured field defect logs and NLP parsing outputs.

---

## 6. RBAC Roles & Permissions

- `PLANNER_ADMIN` (Sr. DOM / Central Planning): Full system review, runs optimization solver, approves master schedules, provisions users, executes database resets. *(Cannot create block requisitions directly to preserve operational role separation)*.
- `DEPT_ENGINEER` (Sr. DEN / Civil Track): Submits track maintenance requisitions (BCM deep screening, tamping, turnouts); views schedules.
- `SNT_OFFICER` (Sr. DSTE / Signal & Telecom): Submits signal, interlocking, point machine block requisitions.
- `TRD_ENGINEER` (DEE / Traction Distribution): Submits 25kV OHE isolation power block requisitions; issues/verifies Permit to Work (PTW G&SR 17.03).
- `FIELD_CONTROLLER` (Section Master / Chief Controller): Real-time Human-in-the-Loop review, timing/speed adjustments, Emergency Priority 100 overrides, Form T/409 caution order signing.

---

## 7. Real-Time Events & WebSocket Feeds

- `STREAM_INGESTED` — Broadcast when new COA stream batch is committed to DB.
- `TASK_CREATED` / `REQUEST_CREATED` — Broadcast when a departmental officer submits a requisition.
- `HITL_APPROVED` / `HITL_MODIFIED` / `HITL_DENIED` — Broadcast when a controller enters a decision.
- `EMERGENCY_OVERRIDE` — Broadcast when Priority 100 emergency possession is granted.
- `OPTIMIZATION_COMPLETED` — Broadcast when the solver finishes generating schedules.
- `SCHEDULE_APPROVED` / `SCHEDULE_PUBLISHED` — Broadcast when master schedule transitions state.
- `NOTIFICATION_CREATED` — Broadcast targeted alerts to specific users/departments.
- `DATABASE_RESET` — Broadcast when admin resets the system to clean-slate state.

---

## 8. HITL Approval State Machine

$$\text{PENDING\_REVIEW} \xrightarrow{\text{Controller Review}} \begin{cases} \text{CONTROLLER\_APPROVED} & \text{(Sanctioned as requested)} \\ \text{CONTROLLER\_MODIFIED} & \text{(Adjusted start/end time or speed limit)} \\ \text{CONTROLLER\_DENIED} & \text{(Cancelled due to traffic/safety constraints)} \\ \text{EMERGENCY\_OVERRIDE\_APPROVED} & \text{(Priority 100 immediate possession)} \end{cases}$$

---

## 9. Top 20 Judge Questions & Instant 1-Line Answers

1. **Where is AI in your codebase?**  
   *RAG regulatory engine in `app/rag/engine.py`, ML duration/overrun model in `app/routers/ml_optimization.py`, and 2-pass CSP solver in `app/routers/optimization.py`.*
2. **What LLM do you use?**  
   *We use a deterministic, token-scored RAG retrieval engine over verified G&SR/ACTM manuals to guarantee zero hallucinations in critical railway operations.*
3. **How do you remove hallucinations?**  
   *Every answer is programmatically constrained and cited against verified rule chunks in `KnowledgeChunkDB` with `verify_hallucination_and_grounding` validation.*
4. **Why not let AI approve blocks directly?**  
   *Under G&SR Rule 15.06, block sanction is a statutory legal authority reserved for Section Controllers; our system enforces mandatory Human-in-the-Loop clearance.*
5. **How are railway rules grounded?**  
   *Official G&SR, ACTM Vol II, IRPWM, BWM, and 2024 Rolling Block clauses are stored in `KnowledgeChunkDB` and retrieved via weighted term-frequency matching.*
6. **What happens when two departments demand the same window?**  
   *The system flags a spatial clash in `conflicts` and uses shadow bundling to synthesize a shared block where duration equals $\max(\text{durations})$.*
7. **How is spatial conflict detected?**  
   *During stream ingestion, `app/routers/ingest.py` queries `TaskDB` for concurrent pending tasks sharing the same corridor section and date.*
8. **What is simulated versus real?**  
   *The backend REST APIs, PostgreSQL database, RAG engine, ML models, and WebSocket streams are 100% real; external CRIS systems connect via our `/api/ingest/stream` endpoint.*
9. **How does multi-user synchronization work?**  
   *`app/realtime.py` broadcasts WebSocket and SSE events, and `realtimeService.js` dispatches browser CustomEvents to update all connected screens instantly.*
10. **Why PostgreSQL 16?**  
    *For ACID compliance, foreign key relational integrity, JSON column telemetry storage, and sub-millisecond query indexing.*
11. **What happens if the backend or PostgreSQL goes down?**  
    *`app/database.py` automatically falls back to a persistent SQLite store (`railblock.db`), and the frontend reconnects with exponential backoff.*
12. **How are unauthorized users blocked?**  
    *FastAPI `require_roles` dependencies throw 403 Forbidden, and React `RoleProtectedRoute` blocks unpermitted UI routes.*
13. **Can an admin create a block request?**  
    *No. `POST /api/tasks` explicitly blocks `PLANNER_ADMIN` with 403 Forbidden to enforce institutional role separation between demanders and approvers.*
14. **How does the digital signature work?**  
    *`_generate_digital_signature` computes an SHA-256 hash over `controller_id:action:taskId:timestamp` to produce an immutable `IR-CRIS-SIG-...` token.*
15. **What makes this scalable across all 68 divisions?**  
    *Stateless FastAPI ASGI architecture, PostgreSQL connection pooling, multi-tenant division IDs, and lightweight client-side React rendering.*
16. **What is G&SR Rule 17.03?**  
    *Mandates a strict 2.0m physical clearance from live 25kV OHE wires unless an official Permit to Work (PTW) is issued by the Traction Power Controller.*
17. **What is IRPWM Para 308?**  
    *Defines post-maintenance speed relaxation: Day 1 (20 kmph) -> Day 2 (45 kmph) -> Day 3 (75 kmph) -> Day 4 (normal sectional speed).*
18. **How does the system calculate downtime savings?**  
    *$\text{Downtime Saved} = \sum \text{Task Durations} - \max(\text{Task Durations})$ for all bundled tasks within the window.*
19. **What is an Emergency Priority Override?**  
    *Escalates safety-critical track defects to Priority 100 with immediate possession sanction and real-time alert broadcasts.*
20. **What is the 3-Tier Data Format?**  
    *Tier 1: Corridor Demand / Plan (TMS); Tier 2: COA Active Block Log (Granted vs Denied Lines); Tier 3: Actual Execution (Downtime Metrics & Burst Overrun).*

---
*End of Judge Rapid Revision Sheet • RAILBLOCK v3.0 • SIH PS 26027*
