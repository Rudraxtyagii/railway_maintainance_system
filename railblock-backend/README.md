# RAILBLOCK — FastAPI Backend

Reference backend implementation of `API_INTEGRATION.md` for the AI-Powered
Automatic Block Planning project (SIH PS 26027). Pure FastAPI, in-memory
data store, no database required — designed so you can point the React
frontend at it immediately and swap in a real DB / real Python scheduling
service later without touching route signatures.

## Run it

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

Then point the frontend's `.env` at it:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_USE_MOCK=false
```

Interactive API docs: `http://localhost:8080/docs` (Swagger) or `/redoc`.

## Login

Two seeded users (password for both is `Password123`):

| username         | role            |
|------------------|-----------------|
| `planner.admin`  | PLANNER_ADMIN   |
| `engineer.ndls`  | DEPT_ENGINEER   |

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"planner.admin","password":"Password123"}'
```

Use the returned `token` as `Authorization: Bearer <token>` on every other
route — all routes except `/api/auth/login` require it.

## What's implemented

Every endpoint in `API_INTEGRATION.md`, sections 2–9:

- **Auth** — JWT login (`PyJWT`, HS256, 12h expiry).
- **Tasks** — list with `department`/`corridor`/`severity`/`status`/`search`
  filters, create with server-computed `priorityScore` and generated `id`.
- **Corridors** — static HDN corridor list + timetable window availability.
- **Conflicts & bundles** — list, resolve conflicts, accept/reject bundles.
- **Optimization engine** (`POST /api/optimization/run`) — a real greedy
  constraint-satisfaction solver, not a canned response. See the docstring
  at the top of `app/routers/optimization.py` for the concurrency model:
  bundled tasks share one block window concurrently (block duration = the
  longest task in the bundle), which is what actually produces the
  downtime savings the frontend displays.
- **Master schedule** — list, approve, publish (COA/FOIS dispatch stub),
  and a `validate` endpoint that runs the 5 statutory checks (timetable
  clash, corridor free, duration ceiling, safety buffer, power sync).
- **Sync** — TMS/SMMS/TDMS/COA health status + trigger a sync job.
- **Analytics** — dashboard KPIs, downtime comparison, performance metrics.

## Error format

Every error (validation, 404s, 409 conflicts, 401s, uncaught exceptions)
comes back as RFC 7807 Problem Details, matching the contract exactly:

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Human readable message",
  "timestamp": "2026-09-05T18:35:00Z"
}
```

## Project layout

```
app/
  main.py          FastAPI app, CORS, router wiring, error handler registration
  auth.py          JWT create/verify + get_current_user dependency
  errors.py        RFC 7807 exception + handlers
  models.py        Pydantic request/response models
  data.py          In-memory seed data + id/priority-score helpers
  routers/
    auth.py
    tasks.py
    corridors.py
    conflicts.py       (conflicts + bundles)
    optimization.py    (the solver)
    schedules.py
    sync.py
    analytics.py
```

## Notes / where to plug in real logic

- **Persistence**: `app/data.py` holds everything in module-level Python
  lists/dicts. Swap it for a real database by replacing the functions in
  that one file — routers only ever call into `app.data`, never touch
  storage directly.
- **The optimizer**: `app/routers/optimization.py` runs synchronously
  in-process. If your real Python scheduling service is a separate
  microservice, replace the body of `run_optimization` with an HTTP call
  out to it and keep the same response shape.
- **Auth**: a single shared `JWT_SECRET` (env var `RAILBLOCK_JWT_SECRET`)
  signs tokens. Rotate/secure this before any real deployment.
