# RAILBLOCK — Comprehensive User & Deployment Manual

**AI-Powered Automatic Maintenance Block Planning System**  
**Smart India Hackathon — Problem Statement 26027**  
**Ministry of Railways | Centre for Railway Information Systems (CRIS)**

---

## 1. Executive Summary & Problem Context

In Indian Railways, maintenance of permanent way (Civil Engineering), Overhead Equipment (TRD/Electrical), and signaling systems (S&T) requires taking **traffic and power blocks** (possession of tracks where train movements are suspended or regulated).

### Traditional Bottlenecks
- **Departmental Silos:** Engineering, S&T, and Electrical submit block requests independently via legacy systems (TMS, SMMS, TDMS) without synchronized coordination.
- **Excessive Corridor Closures:** Tracks are blocked repeatedly for separate departmental tasks that could safely be executed concurrently under a shared permit.
- **Punctuality Loss:** Uncoordinated possessions cause severe train delays, congestion, and last-minute cancellations of scheduled maintenance windows.

### The RAILBLOCK Solution
RAILBLOCK is an autonomous decision-support and block optimization system. It aggregates multi-departmental requests, computes dynamic urgency priorities, identifies spatial/electrical clashes, executes a **Constraint Satisfaction + Shadow Bundling Solver**, and leverages **Machine Learning** to predict actual execution durations, overrun risks, and train punctuality impacts.

```
       TMS (Civil) ────────┐
      SMMS (S&T)   ────────┤
      TDMS (TRD)   ────────┼───► Ingestion & NLP Normalization
       COA (Paths) ────────┘                 │
                                             ▼
                                Dynamic Priority Engine
                                             │
                                             ▼
                                Spatial-Temporal Conflict Matrix
                                             │
                                             ▼
                         ML Duration & Overrun Risk Estimator
                                             │
                                             ▼
                         Constraint Optimization Solver (MILP)
                                             │
                                             ▼
                            Consolidated Master Block Schedule
```

---

## 2. System Architecture & Prerequisites

### Technology Architecture
- **Frontend Application:** React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, React Router v7.
- **Backend Application:** Python 3.10+, FastAPI, Pydantic v2, Uvicorn, PyJWT.
- **ML & Solver Engine:** Greedy Constraint Satisfaction, Logistic Overrun Risk Estimator, Multi-Factor MCDM Regressor, Spatial Compatibility Clustering.
- **Deployment Platform:** Docker, Docker Compose, Nginx reverse proxy.

### System Prerequisites
Ensure the following tools are installed on your host system:
1. **Node.js:** v18.0.0 or higher (`node -v`)
2. **npm:** v9.0.0 or higher (`npm -v`)
3. **Python:** v3.10 or higher (`python3 --version`)
4. **pip / venv:** Python package installer (`pip3 --version`)
5. *(Optional for Containerization)* **Docker & Docker Compose** (`docker --version`, `docker compose version`)

---

## 3. Localhost Quickstart Guide

### Step 1: Clone or Navigate to the Repository
```bash
cd /Users/kakulrathi/Documents/SIH
```

---

### Step 2: Start the FastAPI Backend

1. **Navigate to the backend directory:**
   ```bash
   cd railblock-backend
   ```

2. **Create and activate a virtual environment (recommended):**
   ```bash
   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate

   # Windows
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Launch the FastAPI development server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
   ```

5. **Verify backend status:**
   - Health Check: `http://localhost:8080/health`
   - Interactive Swagger API Docs: `http://localhost:8080/docs`
   - ReDoc Documentation: `http://localhost:8080/redoc`

---

### Step 3: Start the React Frontend

1. **Open a new terminal window and navigate to the frontend directory:**
   ```bash
   cd /Users/kakulrathi/Documents/SIH/SIH-Frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Verify `.env` configuration:**
   Ensure `SIH-Frontend/.env` contains:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   VITE_USE_MOCK=false
   VITE_APP_TITLE=RAILBLOCK
   VITE_SIH_PS=26027
   ```

4. **Start the Vite development server:**
   ```bash
   npm run dev
   ```

5. **Access the Portal:**
   Open your browser and navigate to:
   `http://localhost:5173/` (or the URL displayed in the terminal).

---

## 4. Default Credentials, Test Personas & Security PINs

When you open `http://localhost:5173/`, you will land directly on the **Operations Sign-In** landing page. You can sign in using standard credentials or use the **Quick Select Persona** buttons for instantaneous evaluation.

| Username | Default Password | Role Code | Department / Persona | Security Clearance & PIN | Statutory Authority (G&SR Chapter XVII) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `planner.admin` | `Password123` | **PLANNER_ADMIN** | Operating & Traffic Planning (Sr. DOM / Chief Controller) | PIN: `1234` / Passcode: `CRIS@2026` | Level 5 (Full Authority) — Execute optimizer, approve master schedules, issue dispatch telegraphs. |
| `engineer.ndls` | `Password123` | **DEPT_ENGINEER** | Civil Engineering (Sr. DEN / AEN P-Way) | PIN: `1234` / Passcode: `CRIS@2026` | Level 3 (Civil Isolation) — Submit track maintenance, tamping, and ultrasonic flaw requests. |
| `snt.officer` | `Password123` | **SNT_OFFICER** | Signaling & Telecom (Sr. DSTE / ASTE) | PIN: `1234` / Passcode: `CRIS@2026` | Level 3 (S&T Isolation) — Interlocking, point machine, and axle counter maintenance. |
| `trd.engineer` | `Password123` | **TRD_ENGINEER** | Traction Distribution (Sr. DEE TRD / AEE) | PIN: `1234` / Passcode: `CRIS@2026` | Level 3+ (PTW Authority) — 25kV OHE power blocks & mandatory Permit-to-Work (PTW) safety certificates. |
| `field.controller` | `Password123` | **FIELD_CONTROLLER** | Section Controller / Station Master (Field Ops) | PIN: `1234` / Passcode: `CRIS@2026` | Level 2 (Field Ops) — Transmit VHF radio memos, emergency defect flags, speed restriction receipts. |

> **Role Assumption & Security Clearance Modal:** When switching personas in the top header bar or via the **RBAC Matrix** page, a CRIS SSO Security Challenge modal appears requiring the officer's security clearance PIN (default: `1234`) or passcode (`CRIS@2026`). For convenience during demonstrations, an **Auto-Fill Passcode** button is provided. All persona transitions are cryptographically signed and logged to the tamper-evident CRIS Security Audit Trail.

---

## 5. End-to-End Module Walkthrough

### 1. Operations Sign-In (Landing Page)
- Official Government of India & Ministry of Railways portal interface.
- JWT-based authentication with token persistence in browser storage.
- One-click Persona Switcher pre-configured for evaluation.

### 2. Operations Control Center (Dashboard)
- **Real-Time KPIs:** Live counts of Pending Block Requests, Available Timetable Slots, Active Spatial Conflicts, and Created Shadow Bundles.
- **Corridor Workload Heatmaps:** High Density Network (HDN) routes (NDLS-GZB, DDU-PRYJ, BCT-ST, HWH-KGP).
- **Downtime Savings Visualizer:** Direct graphical comparison between manual planning (120h) and optimized planning (72h).

### 3. Departmental Block Requests
- Ingests and displays pending maintenance requests from Civil Engineering, Traction, and Signaling.
- Search and multi-criteria filters by Department, Corridor, Severity, and Request Status.
- **Request Submission Modal:** Allows engineers to submit new track possession requests with duration, speed restrictions, and power block requirements.

### 4. Data Ingestion & Sync Hub
- Live connector health for external Indian Railways legacy systems:
  - **TMS (Track Management System):** P-Way defect notices, ultrasonic flaw detections.
  - **SMMS (Signaling Maintenance System):** Interlocking overhaul schedules, point machine logs.
  - **TDMS (Traction Distribution System):** 25kV OHE wire degradation, sub-station maintenance.
  - **COA (Control Office Application):** Real-time train timetable occupancy and freight path availability.
- Interactive manual and automated sync trigger buttons.

### 5. Data Quality & NLP Parser
- AI-driven Natural Language Processing pipeline that parses unstructured telephonic memos, SMS logs, and raw maintenance text into structured schema:
  - Extracts Department, Defect Classification, Track Kilometer Location, and Severity.
  - Generates AI Confidence Scores and detects duplicate maintenance requests.

### 6. Dynamic Priority Scoring
- Transparent Multi-Criteria Decision Analysis (MCDA) ranking formula:
  $$\text{Priority Score} = \min\left(100, \, \text{Severity Weight} \times 20 + \text{Overdue Days} \times 1.5\right)$$
- Color-coded severity indicators (Critical, High, Medium, Low) with automated escalation.

### 7. Corridor Timetable Availability
- Integrates with COA train paths to identify non-suburban night windows and inter-train margins.
- Displays pre-block and post-block train occupancy (e.g. *12401 Magadh Express* departure to *14055 Brahmaputra Mail* arrival).

### 8. Conflict Detection & Shadow Bundling
- **Automated Conflict Identification:** Detects spatial overlaps (two crews on same line) and electrical hazards (diesel track machine during de-energized OHE window).
- **Shadow Bundling Engine:** Automatically synthesizes multi-department joint blocks where Civil, S&T, and TRD share the same track window concurrently, saving up to 40% network downtime.

### 9. Automatic Block Optimizer (Constraint Solver + ML Engine)
- **Constraint Satisfaction Solver:** Remote MILP / Greedy constraint solver allocating optimal corridor slots.
- **Interactive Multi-Stage Progression:** Simulates the 8-stage automated synthesis pipeline.
- **Block Inspector:** Click any synthesized block to view its bundled constituent tasks, controller approval status, and speed restriction limits.

### 10. Machine Learning Predictive Intelligence
- **Duration & Overrun Risk Estimator:** Predicts real execution duration vs requested duration, calculating percentage risk of overrun and recommending dynamic safety buffers (10m to 30m).
- **Spatial Compatibility Clustering:** ML compatibility score evaluating safety and synergy for joint work.
- **Live ML Simulator:** Adjust weather conditions (Clear, Rain, Fog), operational windows (Night vs Day), and track density to see real-time inference updates.

### 11. Master Block Schedule & Dispatch Orders
- Consolidated timeline and calendar view of all approved possession windows.
- One-click Chief Operating Controller approval and FOIS/COA dispatch order publishing.

### 12. Schedule Safety Integrity Validation
- Runs the 5 statutory safety integrity checks:
  1. *Express Timetable Deconfliction* (Zero passenger train clash)
  2. *Corridor Availability Verification* (COA slot confirmed)
  3. *Maximum Duration Ceiling* ($\le 4.0$ hours)
  4. *Statutory Safety Buffer* ($\ge 15$ minutes margin)
  5. *Traction & Power Block Synchronization* (PTW issued)

### 13. RAIL-GPT & AI Command Center (`/ai-copilot`) — Dedicated SIH Innovation Hub
A dedicated, multi-faceted AI & ML command center delivering cutting-edge automation for Indian Railways:
1. **RAIL-GPT Conversational Copilot:** An intelligent operational assistant grounded in G&SR rulebooks, ACTM Vol II, and live corridor timetable constraints. Planners can converse naturally to evaluate block impacts, ask safety rules, diagnose overrun variances, or trigger automated optimizations.
2. **Digital Twin "What-If" Scenario Simulator:** Planners can interactively stress-test corridor resilience by varying caution speeds (PSR 15–110 km/h), weather conditions (Monsoon, Dense Fog), emergency defect injections, and crew mobilization lags. The simulator visualizes live train delays (e.g. Vande Bharat Express, Rajdhani Express) and calculates AI proactive mitigations.
3. **Radio & Voice Memo NLP Ingestion:** Transcribes live walkie-talkie audio and text memos from Section Engineers and Station Masters, auto-extracting structured defect tickets with confidence ratings.
4. **Official Dispatch Order & Caution Telegraph Generator:** Generates standardized Indian Railways telegraphic possession grant orders complete with recipient station routing and digital authorization tokens (`CRIS-SHA256-AUTH`).

---

## 6. Machine Learning & Generative AI Formulations

### 1. Duration Regression Model
$$\hat{D} = D_{\text{base}} \times M_{\text{dept}} \times M_{\text{corridor}} \times M_{\text{weather}} \times M_{\text{time}} \times M_{\text{track}}$$
- $M_{\text{dept}}$: Engineering ($1.14$), TRD ($1.08$), S&T ($0.96$).
- $M_{\text{weather}}$: Clear ($1.00$), Rain/Fog ($1.12$).
- $M_{\text{time}}$: Night shift setup overhead ($1.06$).

### 2. Logistic Overrun Probability Regressor
$$P(\text{Overrun}) = \frac{1}{1 + e^{-(\beta_0 + \beta_1 D_{\text{base}} + \beta_2 \text{Overdue} + \beta_3 \mathbb{I}_{\text{Power}} + \beta_4 \mathbb{I}_{\text{HDN}})}}$$
- Categorizes risk into **Low** ($< 22\%$), **Medium** ($22\% - 45\%$), and **High** ($> 45\%$).

### 3. Spatial Compatibility Index
$$\text{Synergy} = \min\left(98.5\%, \, \frac{\sum D_i - \max(D_i)}{\sum D_i} \times 100 + 35\%\right)$$

### 4. Digital Twin Timetable Resilience Formulation
$$\text{Punctuality}_{\text{sim}} = \text{Punctuality}_{\text{base}} - \Delta_{\text{weather}} - \Delta_{\text{PSR}} - \Delta_{\text{defect}} - \Delta_{\text{crew}}$$

## 7. Full Production Deployment Guide

### Option A: One-Command Docker Compose Deployment (Recommended)

From the project root:
```bash
docker compose up --build -d
```
- **Backend API:** Available at `http://localhost:8080` (with healthcheck).
- **Frontend Web App:** Available at `http://localhost:3000`.

To stop containers:
```bash
docker compose down
```

---

### Option B: Cloud VM Deployment (AWS EC2 / DigitalOcean / Linux)

1. **Provision Ubuntu 22.04 LTS / 24.04 LTS Server.**
2. **Install system dependencies:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y python3-pip python3-venv nodejs npm nginx git
   ```
3. **Clone repository and build frontend:**
   ```bash
   cd /var/www/railblock/SIH-Frontend
   npm install
   npm run build
   # Built files are in /var/www/railblock/SIH-Frontend/dist
   ```
4. **Set up Backend Systemd Service:**
   Create `/etc/systemd/system/railblock-backend.service`:
   ```ini
   [Unit]
   Description=RAILBLOCK FastAPI Backend
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/var/www/railblock/railblock-backend
   ExecStart=/var/www/railblock/railblock-backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8080
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now railblock-backend
   ```
5. **Configure Nginx as Reverse Proxy:**
   Create `/etc/nginx/sites-available/railblock`:
   ```nginx
   server {
       listen 80;
       server_name railblock.yourdomain.gov.in;

       # Frontend Static Files
       location / {
           root /var/www/railblock/SIH-Frontend/dist;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       # Backend API Proxy
       location /api/ {
           proxy_pass http://127.0.0.1:8080/api/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   Enable and reload Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/railblock /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
6. **Enable HTTPS with Let's Encrypt Certbot:**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d railblock.yourdomain.gov.in
   ```

---

### Option C: Serverless / Cloud Hosting (Vercel + Render)

- **Frontend on Vercel:**
  - Root directory: `SIH-Frontend`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment Variable: `VITE_API_BASE_URL=https://your-backend.onrender.com/api`
  - Environment Variable: `VITE_USE_MOCK=false`

- **Backend on Render / Railway:**
  - Root directory: `railblock-backend`
  - Build command: `pip install -r requirements.txt`
  - Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8080`
  - Environment Variable: `RAILBLOCK_JWT_SECRET=your-production-secret`

---

## 8. Troubleshooting & FAQ

### Q1: The frontend shows "Network Error" or does not load live data.
- **Cause:** Backend server is not running or CORS is misconfigured.
- **Resolution:** Verify backend is active on port 8080 (`curl http://localhost:8080/health`). Ensure `VITE_API_BASE_URL` in `SIH-Frontend/.env` points to `http://localhost:8080/api`.

### Q2: How do I test the application offline without starting the backend?
- **Resolution:** In `SIH-Frontend/.env`, set `VITE_USE_MOCK=true`. The frontend will automatically switch to client-side simulated data and solver progression.

### Q3: How do I change the JWT token lifetime?
- **Resolution:** In `railblock-backend/app/auth.py`, adjust `EXPIRE_HOURS = 12` to your desired session duration.

### Q4: How do I export or integrate the schedule with CRIS COA / FOIS?
- **Resolution:** Use the **Master Schedule** page -> click **Publish to COA/FOIS Dispatch**. The backend generates standardized JSON payload packets compatible with COA message queues.

---
*RAILBLOCK — Operational Documentation • SIH PS 26027 • Ministry of Railways, Government of India*
