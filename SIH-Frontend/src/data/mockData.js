/**
 * RAILBLOCK - Master Domain Dataset & Configuration
 * Smart India Hackathon - Problem Statement 26027
 * Ministry of Railways • Centre for Railway Information Systems (CRIS)
 */

export const DEPARTMENTS = {
  ENGINEERING: 'Engineering',
  TRACTION: 'Traction Distribution',
  SIGNAL: 'Signal & Telecom'
};

export const CORRIDORS = [
  { id: 'NDLS-GZB', code: 'NDLS-GZB', name: 'New Delhi – Ghaziabad (Quadruple Track)', zone: 'Northern Railway (NR)', lengthKm: 28, maxSpeed: 130 },
  { id: 'DDU-PRYJ', code: 'DDU-PRYJ', name: 'Pt. Deen Dayal Upadhyaya – Prayagraj', zone: 'North Central Railway (NCR)', lengthKm: 153, maxSpeed: 130 },
  { id: 'BCT-ST', code: 'BCT-ST', name: 'Mumbai Central – Surat', zone: 'Western Railway (WR)', lengthKm: 263, maxSpeed: 130 },
  { id: 'HWH-KGP', code: 'HWH-KGP', name: 'Howrah – Kharagpur (Triple Track)', zone: 'South Eastern Railway (SER)', lengthKm: 115, maxSpeed: 120 },
];

export const CORRIDOR_WINDOWS = [
  {
    id: 'WIN-NDLS-01',
    corridor: 'NDLS-GZB',
    line: 'UP Main',
    date: '2026-09-08',
    startTime: '01:30',
    endTime: '04:30',
    durationHours: 3.0,
    status: 'Available',
    trafficDensity: 'Low (Night Non-suburban)',
    occupancyBefore: '12424 Rajdhani Express (Departed 01:15)',
    occupancyAfter: '12004 Shatabdi Express (Scheduled 05:40)',
    suitableTasks: [],
    conflictCount: 0
  },
  {
    id: 'WIN-DDU-01',
    corridor: 'DDU-PRYJ',
    line: 'UP Main',
    date: '2026-09-09',
    startTime: '11:00',
    endTime: '14:00',
    durationHours: 3.0,
    status: 'Available',
    trafficDensity: 'Low (Freight Path)',
    occupancyBefore: 'Goods Coal Rake (Departed 10:45)',
    occupancyAfter: '12398 Mahabodhi Express (Scheduled 14:35)',
    suitableTasks: [],
    conflictCount: 0
  },
  {
    id: 'WIN-BCT-01',
    corridor: 'BCT-ST',
    line: 'DN Main',
    date: '2026-09-10',
    startTime: '12:00',
    endTime: '15:30',
    durationHours: 3.5,
    status: 'Available',
    trafficDensity: 'Medium',
    occupancyBefore: 'Container Rake (Cleared 11:40)',
    occupancyAfter: '12952 Mumbai Rajdhani (Scheduled 16:10)',
    suitableTasks: [],
    conflictCount: 0
  }
];

export const MOCK_CORRIDOR_WINDOWS = CORRIDOR_WINDOWS;

// Clean Initial State: Operational queues start at 0
export const MOCK_TASKS = [];
export const MOCK_CONFLICTS = [];
export const MOCK_BUNDLES = [];
export const MOCK_SCHEDULES = [];
export const MOCK_NOTIFICATIONS = [];

export const MOCK_DATA_SYNC_SOURCES = [
  {
    id: 'TMS',
    name: 'Track Management System (TMS)',
    authority: 'Civil Engineering Directorate, Railway Board',
    description: 'Automated track geometry defects, OMS peak reports, and USFD rail flaw logs',
    status: 'Connected',
    lastSyncTime: '2026-09-05T17:45:10Z',
    recordsReceived: 214,
    recordsSuccess: 214,
    recordsFailed: 0,
    frequency: 'Every 15 minutes',
    criticality: 'High',
    format: 'JSON / COA Stream',
    endpoint: 'https://cris.org.in/api/v2/tms-feed'
  },
  {
    id: 'TDMS',
    name: 'Traction Distribution Management System (TDMS)',
    authority: 'Electrical (TRD) Directorate',
    description: '25kV OHE live status, SCADA power isolations, and insulator breakdown alarms',
    status: 'Connected',
    lastSyncTime: '2026-09-05T17:42:00Z',
    recordsReceived: 98,
    recordsSuccess: 91,
    recordsFailed: 7,
    frequency: 'Every 15 minutes',
    criticality: 'Critical (High Voltage)',
    format: 'Telemetry Stream (SCADA / IEC 60870)',
    endpoint: 'https://cris.org.in/api/v2/tdms-feed'
  },
  {
    id: 'SMMS',
    name: 'Signaling & Interlocking System (SMMS)',
    authority: 'Signal & Telecom (S&T) Directorate',
    description: 'Electronic Interlocking (EI), axle counters, track circuit drops, and point motors',
    status: 'Connected',
    lastSyncTime: '2026-09-05T17:48:30Z',
    recordsReceived: 132,
    recordsSuccess: 132,
    recordsFailed: 0,
    frequency: 'Every 15 minutes',
    criticality: 'High',
    format: 'XML / REST Webhook',
    endpoint: 'https://cris.org.in/api/v2/smms-feed'
  },
  {
    id: 'COA',
    name: 'Control Office Application (COA)',
    authority: 'Traffic / Operations Directorate',
    description: 'Live train charting, path vacancies, Section Controller memos, and block grant permissions',
    status: 'Connected',
    lastSyncTime: '2026-09-05T17:50:00Z',
    recordsReceived: 412,
    recordsSuccess: 412,
    recordsFailed: 0,
    frequency: 'Real-time WebSocket Push',
    criticality: 'Critical (Safety & Punctuality)',
    format: 'Real-time Telemetry Stream',
    endpoint: 'wss://cris.org.in/coa-live-feed'
  }
];

export const MOCK_SYNC_HISTORY = [];

export const MOCK_DATA_QUALITY = {
  totalRawRecords: 0,
  cleanRecords: 0,
  duplicateRecords: 0,
  outliers: 0,
  parsedRecords: 0,
  recordsRequiringReview: 0,
  unstructuredLogs: []
};

export const MOCK_DASHBOARD_STATS = {
  totalBlockRequests: 0,
  pendingRequests: 0,
  highPriorityTasks: 0,
  availableBlockWindows: 3,
  activeConflicts: 0,
  bundleCandidates: 0,
  optimizedBlocks: 0,
  downtimeSavedHours: 0,
  downtimeSavingPercent: 0,
  manualPlanningTotalHours: 0,
  optimizedPlanningTotalHours: 0,
  networkCorridorUtilization: '0.0%',
  requestsByDepartment: [],
  priorityDistribution: [],
  corridorUtilization: [
    { corridor: 'NDLS-GZB', utilization: 0, windowCount: 1, conflictCount: 0 },
    { corridor: 'DDU-PRYJ', utilization: 0, windowCount: 1, conflictCount: 0 },
    { corridor: 'BCT-ST', utilization: 0, windowCount: 1, conflictCount: 0 },
    { corridor: 'HWH-KGP', utilization: 0, windowCount: 0, conflictCount: 0 }
  ],
  downtimeComparison: []
};

export const MOCK_USERS = [
  {
    id: 'USR-01',
    username: 'planner.admin',
    name: 'Rajesh Sharma',
    designation: 'Senior Divisional Operating Manager (Sr. DOM / Planning)',
    role: 'PLANNER_ADMIN',
    department: 'Operating & Traffic Planning',
    zone: 'Northern Railway',
    division: 'Delhi Division',
    email: 'rajesh.sharma@cris.org.in',
    employeeId: 'IR-CRIS-DOM-4819',
    clearanceLevel: 'Level 5 (Statutory Schedule Authority)',
    pin: '1234',
    passcode: 'CRIS@2026',
    avatar: 'RS',
    badgeColor: 'bg-emerald-600',
    lastLogin: '2026-09-08 09:30'
  },
  {
    id: 'USR-02',
    username: 'engineer.ndls',
    name: 'Anita Verma',
    designation: 'Senior Divisional Engineer (Sr. DEN / Track)',
    role: 'DEPT_ENGINEER',
    department: 'Engineering',
    zone: 'Northern Railway',
    division: 'Delhi Division',
    email: 'anita.verma@cris.org.in',
    employeeId: 'IR-NR-DEN-7120',
    clearanceLevel: 'Level 3 (Civil Permanent Way Clearance)',
    pin: '1234',
    passcode: 'CRIS@2026',
    avatar: 'AV',
    badgeColor: 'bg-sky-600',
    lastLogin: '2026-09-08 09:15'
  },
  {
    id: 'USR-03',
    username: 'snt.user',
    name: 'Vikramaditya Rao',
    designation: 'Senior Divisional Signal & Telecom Engineer (Sr. DSTE)',
    role: 'SNT_OFFICER',
    department: 'Signal & Telecom',
    zone: 'South Eastern Railway',
    division: 'Kharagpur Division',
    email: 'v.rao@ir.gov.in',
    employeeId: 'IR-SER-DSTE-3391',
    clearanceLevel: 'Level 3 (Signaling & Interlocking Clearance)',
    pin: '1234',
    passcode: 'CRIS@2026',
    avatar: 'VR',
    badgeColor: 'bg-emerald-700',
    lastLogin: '2026-09-08 09:00'
  },
  {
    id: 'USR-04',
    username: 'trd.user',
    name: 'Pooja Iyer',
    designation: 'Divisional Electrical Engineer (DEE / TRD)',
    role: 'TRD_ENGINEER',
    department: 'Traction Distribution',
    zone: 'Western Railway',
    division: 'Mumbai Central',
    email: 'pooja.iyer@ir.gov.in',
    employeeId: 'IR-WR-DEE-5518',
    clearanceLevel: 'Level 3+ (25kV OHE PTW Authority)',
    pin: '1234',
    passcode: 'CRIS@2026',
    avatar: 'PI',
    badgeColor: 'bg-amber-600',
    lastLogin: '2026-09-08 08:45'
  },
  {
    id: 'USR-05',
    username: 'field.controller',
    name: 'Surendra Kumar',
    designation: 'Chief Section Controller / Station Master (NDLS)',
    role: 'FIELD_CONTROLLER',
    department: 'Operating & Station Control',
    zone: 'Northern Railway',
    division: 'Delhi Division',
    email: 's.kumar@ir.gov.in',
    employeeId: 'IR-NR-SM-8902',
    clearanceLevel: 'Level 2 (Field Audio / VHF Dispatch Control)',
    pin: '1234',
    passcode: 'CRIS@2026',
    avatar: 'SK',
    badgeColor: 'bg-purple-600',
    lastLogin: '2026-09-08 09:40'
  }
];
