# RAILBLOCK — Technical Stack & System Architecture Specification

**Project:** AI-Powered Automatic Block Planning System  
**Hackathon / Problem ID:** Smart India Hackathon — PS 26027  
**Beneficiary:** Ministry of Railways | Centre for Railway Information Systems (CRIS)

---

## 1. Complete Technology Stack Matrix

| Layer | Component | Technology / Library | Version | Role & Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | UI Framework | **React** | `19.2.8` | Declarative component hierarchy and reactive state management. |
| | Build Tooling | **Vite** | `8.2.2` | Ultra-fast HMR and optimized production bundling (Rolldown engine). |
| | Styling | **Tailwind CSS** | `3.4.19` | Custom railway design system tokens, responsive utilities, and colorways. |
| | Routing | **React Router DOM** | `7.18.3` | Client-side routing with route-guarding (`ProtectedRoute`) and deep linking. |
| | Icons | **Lucide React** | `1.41.0` | Accessible, unified vector iconography for rail assets and status indicators. |
| | Visualizations | **Recharts** | `3.10.1` | Interactive downtime comparison charts, corridor heatmaps, and trend graphs. |
| | Linter / Code Quality | **Oxlint** | `1.79.0` | High-performance JS/JSX linting and safety checks. |
| **Backend** | Web Framework | **FastAPI** | `>=0.115.0` | High-throughput asynchronous REST API framework with automatic OpenAPI/Swagger docs. |
| | ASGI Server | **Uvicorn** (Standard) | `>=0.30.6` | Production ASGI web server for asynchronous request handling. |
| | Data Validation | **Pydantic** | `>=2.10.0` | Schema definition, strong typing, and request/response serialization. |
| | Security / Auth | **PyJWT** | `>=2.9.0` | RFC 7519 JSON Web Token signing (HS256) and claims verification. |
| | Form Handling | **Python-Multipart** | `>=0.0.9` | Multipart form parsing for file/memo uploads. |
| **AI / ML Engine** | Optimization Solver | **Greedy Constraint Satisfaction (CSP)** | Custom v2.4 | Multi-criteria slot allocation and shadow bundling solver. |
| | Generative AI Copilot | **RAIL-GPT Conversational Engine** | Custom v3.0 | Indian Railways operational rulebook, G&SR safety guidance, and timetable query assistant. |
| | Digital Twin | **What-If Timetable Resilience Simulator** | Custom v3.0 | Evaluates real-time train delay impacts under speed restrictions and fog/monsoon. |
| | Duration Estimator | **Gradient-Boosted / Regression Model** | Custom v3.0 | Estimates execution duration variance and machine mobilization overhead. |
| | Risk Classifier | **Logistic Overrun Probability Model** | Custom v3.0 | Calculates $P(\text{overrun})$ and recommends dynamic safety buffer padding. |
| | Compatibility Clustering | **Spatial Synergy Matrix** | Custom v3.0 | Cross-departmental co-working compatibility scoring ($\ge 85\%$ threshold). |
| | NLP Text Parser | **DeepSpeech / Entity Extraction Engine** | Custom | Converts unstructured radio memos into structured defect tickets. |
| **DevOps & Cloud** | Containerization | **Docker** | Multi-stage | Isolated build and runtime containers for frontend and backend. |
| | Orchestration | **Docker Compose** | `3.8` | Multi-container microservice networking, port binding, and restart policies. |
| | Reverse Proxy | **Nginx** | `Alpine` | Static file serving, HTTP/2 termination, and API reverse proxy pass. |

---

## 2. Architectural Blueprint

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                                    │
│  React 19 SPA (Vite) • Tailwind CSS Design System • Recharts • Lucide       │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ Operations   │  │ Block        │  │ Data Sync &  │  │ Optimizer & ML │   │
│  │ Dashboard    │  │ Requests     │  │ NLP Parser   │  │ Intelligence   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────┬───────┘   │
└─────────┼─────────────────┼─────────────────┼───────────────────┼───────────┘
          │                 │                 │                   │
          ▼                 ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API SERVICE LAYER (src/services)                         │
│  apiClient.js (JWT Bearer Injection • Mock Fallback • Error Normalizer)     │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ HTTP / HTTPS REST
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND TIER                                   │
│  FastAPI Application (app.main) • Uvicorn ASGI Server • RFC 7807 Errors    │
│                                                                             │
│  ┌─────────────────┐   ┌─────────────────┐   ┌──────────────────────────┐   │
│  │ /api/auth       │   │ /api/tasks      │   │ /api/corridors           │   │
│  ├─────────────────┤   ├─────────────────┤   ├──────────────────────────┤   │
│  │ /api/conflicts  │   │ /api/schedules  │   │ /api/sync & quality      │   │
│  ├─────────────────┴───┴─────────────────┴───┴──────────────────────────┤   │
│  │ /api/optimization & /api/optimization/ml                             │   │
│  │ (Constraint Satisfaction + ML Duration & Overrun Risk Regressor)     │   │
│  └──────────────────────────────────┬───────────────────────────────────┘   │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INTEGRATION ADAPTERS                              │
│  TMS Connector      SMMS Connector      TDMS Connector      COA Connector   │
│  (Track P-Way)      (S&T Signals)       (25kV OHE Power)    (Train Paths)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Architecture Deep-Dive

### 1. State Management & React Contexts
- **`AuthContext` (`src/context/AuthContext.jsx`):**
  - Manages authenticated user state, JWT tokens, login/logout transitions, and dynamic persona switching for evaluation.
- **`ToastContext` (`src/context/ToastContext.jsx`):**
  - System-wide non-blocking notification toast queue for operation feedback (Success, Warning, Error, Info).

### 2. Route Protection & Landing Page Flow
- **`ProtectedRoute` (`src/App.jsx`):**
  - Guards all internal operational views (`/dashboard`, `/block-requests`, `/optimization`, `/schedule`, etc.).
  - Automatically redirects unauthenticated users to the **Operations Sign-In landing page (`/login`)**.
  - Upon successful sign-in, seamlessly routes the user to the operational dashboard.

### 3. Service Decoupling Pattern
- All HTTP communication is isolated within `src/services/`. UI components never perform raw `fetch()` calls.
- **`apiClient.js`:** Intercepts outgoing requests to attach `Authorization: Bearer <token>`, manages base URLs, and provides automatic fallback to local seed data if running in standalone offline mode (`VITE_USE_MOCK=true`).

---

## 4. Backend Architecture Deep-Dive

### 1. Modular Router Architecture
- **`app/routers/auth.py`:** JWT login and credentials verification.
- **`app/routers/tasks.py`:** Departmental block request CRUD, query filtering, and dynamic priority scoring.
- **`app/routers/corridors.py`:** HDN corridor metadata and COA timetable window query endpoints.
- **`app/routers/conflicts.py`:** Spatial overlap detection, 25kV traction clash identification, and bundle candidates.
- **`app/routers/optimization.py`:** The core combinatorial Constraint Satisfaction and Shadow Bundling solver.
- **`app/routers/ml_optimization.py`:** The v3.0 Machine Learning predictive intelligence engine.
- **`app/routers/ai_copilot.py`:** RAIL-GPT conversational assistant, digital twin scenario simulator, and dispatch order generator.
- **`app/routers/schedules.py`:** Master schedule management, approval workflows, and 5-point safety validation.
- **`app/routers/sync.py` & `data_quality.py`:** Legacy system synchronization and NLP defect memo parsing.
- **`app/routers/analytics.py` & `priority.py`:** Network KPI aggregation and downtime comparison analytics.

### 2. Standardized RFC 7807 Error Handling
Every exception (Validation, 404 Not Found, 409 Conflict, 401 Unauthorized) is converted to RFC 7807 Problem Details:
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Spatial overlap detected between TSK-101 (Civil) and TSK-104 (Diesel Machine)",
  "timestamp": "2026-09-06T14:38:00Z"
}
```

---

## 5. Optimization Algorithms & Machine Learning Formulations

### 1. Greedy Constraint Satisfaction Solver (v2.4)
- **Objective Function:**
  $$\max \sum_{b \in \mathcal{B}} \text{EfficiencyGain}(b) - \lambda \sum_{t \notin \mathcal{B}} \text{PriorityScore}(t)$$
- **Concurrency Model (Shadow Bundling):**
  Multiple compatible departments (Engineering, S&T, TRD) share a single traffic/power block concurrently. The block duration equals the longest constituent task:
  $$\text{Duration}_{\text{Bundle}} = \max_{t \in \text{Bundle}} (\text{Duration}_t)$$
  $$\text{Downtime Saved} = \sum_{t \in \text{Bundle}} \text{Duration}_t - \text{Duration}_{\text{Bundle}}$$

### 2. ML Duration & Overrun Risk Regressor (v3.0)
- Predicts execution duration adjusted for department machinery mobilization and environmental factors:
  $$\hat{D}_i = D_i \times M_{\text{dept}} \times M_{\text{corridor}} \times M_{\text{weather}} \times M_{\text{night}}$$
- Logistic Overrun Probability Model:
  $$P(\text{Overrun}_i) = \sigma\left(\beta_0 + \beta_1 D_i + \beta_2 \text{Overdue}_i + \beta_3 \mathbb{I}_{\text{Power}} + \beta_4 \mathbb{I}_{\text{HDN}}\right)$$

### 3. Spatial Compatibility & Synergy Matrix
- Evaluates safety rules:
  - Civil Tamping + S&T Axle Counter: $95\%$ Synergy (Safe co-working)
  - TRD 25kV OHE Isolation + Civil Ballast Regulation: $92\%$ Synergy (Safe co-working)
  - Moving Heavy Diesel Machine on Single Track with Personnel: $0\%$ Synergy (Incompatible)

---

## 6. Directory Structure

```
/Users/kakulrathi/Documents/SIH/
├── docker-compose.yml              # Multi-container local & production orchestration
├── TECH_STACK.md                   # This tech stack specification document
├── USER_MANUAL.md                  # Comprehensive user and deployment manual
│
├── SIH-Frontend/                   # React 19 Frontend Web Application
│   ├── .env                        # Environment variables (API Base URL, Mock flag)
│   ├── Dockerfile                  # Multi-stage production container build (Node + Nginx)
│   ├── nginx.conf                  # Nginx reverse proxy configuration
│   ├── package.json                # Dependencies and scripts
│   ├── vite.config.js              # Vite bundler configuration
│   ├── tailwind.config.js          # Custom railway theme tokens
│   └── src/
│       ├── App.jsx                 # App shell with ProtectedRoute guard
│       ├── main.jsx                # Entry mount point
│       ├── components/
│       │   ├── common/             # Badges, Modals, Tables, KpiCards
│       │   └── layout/             # AppLayout, Header, Sidebar, Breadcrumbs
│       ├── context/                # AuthContext, ToastContext
│       ├── data/                   # Seed mock data for offline simulation
│       ├── pages/                  # Dashboard, BlockRequests, OptimizationEngine, etc.
│       └── services/               # apiClient.js, mlOptimizationService.js, etc.
│
└── railblock-backend/              # FastAPI Python Backend Service
    ├── Dockerfile                  # Production Python 3.11 container build
    ├── requirements.txt            # Python dependencies (FastAPI, Uvicorn, PyJWT, Pydantic)
    └── app/
        ├── main.py                 # FastAPI app entry point & CORS configuration
        ├── auth.py                 # JWT token generation, verification & dependencies
        ├── data.py                 # In-memory operational store & seed database
        ├── models.py               # Pydantic request/response data schemas
        ├── errors.py               # RFC 7807 error handlers
        └── routers/
            ├── auth.py             # Login route
            ├── tasks.py            # Departmental block requests
            ├── corridors.py        # Corridors & timetable windows
            ├── conflicts.py        # Conflicts & shadow bundles
            ├── optimization.py     # Classical Constraint Satisfaction Solver
            ├── ml_optimization.py  # v3.0 Machine Learning Predictive Intelligence
            ├── schedules.py        # Master schedule & statutory safety validation
            ├── sync.py             # TMS/SMMS/TDMS/COA connector sync
            ├── data_quality.py     # NLP defect memo text extraction
            ├── analytics.py        # Network downtime KPIs & analytics
            ├── priority.py         # Dynamic priority rankings
            └── notifications.py    # Operational alerts
```

---
*RAILBLOCK Technical Documentation • Smart India Hackathon PS 26027 • Ministry of Railways*
