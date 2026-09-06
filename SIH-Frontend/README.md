# RAILBLOCK — AI-Powered Automatic Block Planning

**Smart India Hackathon (SIH 26027)**  
**Organization:** Ministry of Railways, Government of India  
**Development Partner:** Centre for Railway Information Systems (CRIS)

---

## 1. Project Purpose & Architecture

RAILBLOCK is an enterprise-grade operational frontend designed for Indian Railways Operating and Traffic Planning directorates. It resolves the problem of fragmented, uncoordinated maintenance requests from:
- **Engineering (TMS)**: Track geometry, ballast tamping, USFD rail flaws, rail renewals
- **Traction Distribution (TDMS)**: 25kV OHE contact wire wear, cantilever assembly, power blocks
- **Signal & Telecom (SMMS)**: Point machines, electronic interlocking (EI), axle counter testing
- **Control Office Application (COA)**: Live passenger express & freight train graphs

### Unified Operational Workflow
```
DATA SOURCES (TMS, SMMS, TDMS, COA)
     ↓
DATA SYNC & RECONCILIATION
     ↓
DATA QUALITY & NLP PARSING
     ↓
DYNAMIC PRIORITY SCORING (Overdue Days × Severity Weight)
     ↓
CORRIDOR TIMETABLE AVAILABILITY
     ↓
SPATIAL / POWER CONFLICT DETECTION
     ↓
SHADOW BUNDLING
     ↓
★ AI OPTIMIZATION ENGINE
     ↓
5-POINT SAFETY VALIDATION
     ↓
MASTER BLOCK SCHEDULE & COA/FOIS DISPATCH
     ↓
EXECUTIVE DOWNTIME ANALYTICS (40% Outage Reduction)
```

---

## 2. Technology Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS v3 (Curated Indian Railways Enterprise Navy, Saffron, Emerald, and Amber semantic palette)
- **Routing**: React Router v6
- **Data Visualizations**: Recharts (Horizontal bar charts, donut distribution, multi-line trends)
- **Icons**: Lucide React
- **Architecture**: Layered Service Pattern (`Component → Custom Hook → Service → Centralized ApiClient → Backend / Mock API`)

---

## 3. Project Structure

```
SIH-practice/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/             # KpiCard, DataTable, StatusBadge, PriorityBadge, DepartmentBadge, Modal, ConfirmDialog, etc.
│   │   └── layout/             # Header (with Gov of India strip & role switcher), Sidebar, Breadcrumb, AppLayout
│   ├── context/
│   │   ├── AuthContext.jsx     # Role-based authorization & demo persona switching
│   │   └── ToastContext.jsx    # Toast notification queue
│   ├── data/
│   │   └── mockData.js         # 35+ realistic Indian Railways tasks, corridors, windows, conflicts, bundles, schedules
│   ├── services/               # 15 isolated service modules ready for Spring Boot & Python integration
│   │   ├── apiClient.js        # Base URL, JWT interceptors, mock fallback
│   │   ├── authService.js      # JWT authentication contract
│   │   ├── taskService.js      # Maintenance request operations
│   │   ├── blockRequestService.js
│   │   ├── syncService.js      # TMS, SMMS, TDMS, COA feed ingestion
│   │   ├── dataQualityService.js # Free-text NLP parser & data cleaning metrics
│   │   ├── priorityService.js  # Overdue Days × Severity Weight scoring
│   │   ├── corridorService.js  # Corridor slot timetable availability
│   │   ├── conflictService.js  # Spatial / power conflict detection
│   │   ├── bundleService.js    # Shadow bundling & downtime calculations
│   │   ├── optimizationService.js # Multi-stage MILP solver trigger & results
│   │   ├── scheduleService.js  # Master schedule, approval & dispatch
│   │   ├── validationService.js# 5-point statutory safety validation
│   │   ├── analyticsService.js # Executive downtime savings & performance throughput
│   │   └── notificationService.js # Operational alerts
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── BlockRequests.jsx
│   │   ├── DataSync.jsx
│   │   ├── DataQuality.jsx
│   │   ├── PriorityScoring.jsx
│   │   ├── CorridorAvailability.jsx
│   │   ├── ConflictsBundling.jsx
│   │   ├── OptimizationEngine.jsx   # Hero screen for SIH presentation
│   │   ├── BlockSchedule.jsx
│   │   ├── Validation.jsx
│   │   ├── Performance.jsx
│   │   ├── DowntimeAnalysis.jsx
│   │   ├── Notifications.jsx
│   │   ├── Profile.jsx
│   │   └── Settings.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env                        # Centralized backend URL configuration
├── API_INTEGRATION.md          # Full backend contract and integration guide
└── README.md
```

---

## 4. Running Locally

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Startup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production bundle
npm run preview
```

The application will run on `http://localhost:5173` (or the port specified by Vite).

---

## 5. Environment Configuration

Edit `.env` to configure backend connection:
```env
# Spring Boot API Gateway or Backend Base URL
VITE_API_BASE_URL=http://localhost:8080/api

# Set to 'false' when connecting to live backend endpoints
VITE_USE_MOCK=true

VITE_APP_TITLE=RAILBLOCK
VITE_SIH_PS=26027
```

---

## 6. Demo Personas for SIH Evaluation

The top header provides an instant **Role Mode** dropdown for judges and evaluators to test role-based behavior:
1. **Rajesh Sharma (Sr. DOM / Planning)** — Full Planner/Admin privileges: Run Optimization, Approve Blocks, Publish to COA.
2. **Anil Verma (Sr. DEN / Track)** — Engineering department view.
3. **Pooja Iyer (DEE / TRD)** — Traction Distribution department view.
4. **Vikramaditya Rao (Sr. DSTE)** — Signal & Telecom department view.

---

## 7. Backend Integration

See [API_INTEGRATION.md](./API_INTEGRATION.md) for detailed JSON schemas, endpoint specifications, and step-by-step instructions for connecting the Spring Boot backend and Python scheduling service.
