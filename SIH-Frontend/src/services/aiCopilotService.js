import { apiClient, USE_MOCK } from './apiClient';
import { taskService } from './taskService';

export const aiCopilotService = {
  /**
   * Send a natural language query to RAIL-GPT
   */
  async sendMessage(message, history = [], contextCorridor = 'NDLS-GZB') {
    if (!USE_MOCK) {
      const res = await apiClient.post('/ai/chat', {
        message,
        conversationHistory: history,
        contextCorridor
      });
      if (res) return res;
    }

    await apiClient.simulateDelay(400);

    const q = message.toLowerCase();

    if (q.includes('ndls-gzb') || q.includes('delhi') || q.includes('ghaziabad') || q.includes('corridor') || q.includes('analyze') || q.includes('night block')) {
      const rec = {
        blockCode: 'BLK-NDLS-20260908-01',
        corridor: 'NDLS-GZB',
        date: '2026-09-08',
        startTime: '01:30',
        endTime: '04:30',
        durationHours: 3.0,
        departments: ['Engineering', 'Electrical / Traction', 'Signaling & Telecom'],
        taskIds: ['TSK-101', 'TSK-102', 'TSK-103'],
        downtimeSaved: '4.5 hours (60%)',
        trainPunctualityImpact: 'Zero Delay (Night Window)'
      };

      return {
        role: 'assistant',
        content: `### 🚄 Operational Assessment: New Delhi – Ghaziabad Corridor (NDLS-GZB)

• **Corridor Density:** High Density Network (HDN-1), 4 Lines (UP Main, UP Slow, DN Main, DN Slow).
• **Available Window:** \`01:30 – 04:30 hrs\` (Night non-suburban gap).
• **Active Clashes:** 2 pending tasks detected between UP Main tamping and 25kV OHE wire tensioning.
• **AI Recommendation:** Execute **Shadow Bundle BUN-101**. Merging Civil, S&T, and TRD requests will reduce corridor closure from **7.5 hours down to 3.0 hours** (saving 4.5 hours of downtime with 0% impact on Vande Bharat 22436).`,
        timestamp: new Date().toISOString(),
        suggestedActions: [
          { label: 'Apply to Master Schedule', action: 'APPLY_RECOMMENDATION', payload: rec },
          { label: 'Why did AI choose this?', action: 'EXPLAIN_DECISION', payload: { blockCode: 'BLK-NDLS-20260908-01' } },
          { label: 'Launch Optimizer', action: 'NAVIGATE', target: '/optimization' },
          { label: 'Validate Safety', action: 'NAVIGATE', target: '/validation' }
        ],
        structuredRecommendation: rec
      };
    }

    if (q.includes('g&sr') || q.includes('safety') || q.includes('power') || q.includes('ohe') || q.includes('25kv')) {
      return {
        role: 'assistant',
        content: `### 🛡️ G&SR & Traction Safety Directive (Chapter XVII & ACTM Vol II)

1. **Permit to Work (PTW):** Under G&SR 17.03, no personnel or machine shall foul within **2.0 meters of 25kV live OHE conductors** until an official PTW is issued by the Traction Power Controller (TPC).
2. **Earthing Sequence:** Discharge rods must be clamped on both UP and DN bounds of the work section.
3. **Co-working Rules:** Diesel Track Machines (BCM/CSM) may operate concurrently under de-energized OHE provided continuous bonding is verified by the Section Engineer (TRD).`,
        timestamp: new Date().toISOString(),
        suggestedActions: [
          { label: 'Inspect Active Conflicts', action: 'NAVIGATE', target: '/conflicts' },
          { label: 'Verify Safety Checklist', action: 'NAVIGATE', target: '/validation' }
        ]
      };
    }

    if (q.includes('tsk-') || q.includes('overrun') || q.includes('risk') || q.includes('duration')) {
      return {
        role: 'assistant',
        content: `### ⚠️ ML Overrun Risk & Execution Variance Diagnostic

• **High-Risk Flagged Task:** \`TSK-104\` (Ballast Cleaner Machine on DDU-PRYJ).
• **Requested Duration:** 4.0 hrs ➔ **ML Predicted Duration:** 4.6 hrs (+36 mins).
• **Overrun Probability:** **52.0% (High Risk)** due to heavy freight line clearing times and 6 overdue days.
• **Recommended Action:** Allocate a mandatory **30-minute safety buffer** in COA timetable to prevent detention of following Rajdhani Express rake.`,
        timestamp: new Date().toISOString(),
        suggestedActions: [
          { label: 'View Priority Scoring Table', action: 'NAVIGATE', target: '/priority' },
          { label: 'Inspect Master Schedule', action: 'NAVIGATE', target: '/schedule' }
        ]
      };
    }

    if (q.includes('vande bharat') || q.includes('rajdhani') || q.includes('punctuality')) {
      return {
        role: 'assistant',
        content: `### ⏱️ Train Punctuality & Express Route Safeguard Report

• **Overall Punctuality Preservation Index:** **98.4%** across scheduled maintenance blocks.
• **Zero Peak Hour Intrusions:** All heavy corridor possessions are scheduled inside the non-suburban night window (\`01:30 – 04:30 hrs\`).
• **Vande Bharat 22436:** Clear run guaranteed on NDLS-GZB (Scheduled departure: 06:00 hrs, block cleared at 04:30 hrs with 90m buffer).`,
        timestamp: new Date().toISOString(),
        suggestedActions: [
          { label: 'View Performance KPIs', action: 'NAVIGATE', target: '/performance' },
          { label: 'Inspect Master Schedule', action: 'NAVIGATE', target: '/schedule' }
        ]
      };
    }

    // Default conversational response
    return {
      role: 'assistant',
      content: `### 🤖 RAIL-GPT Operational Intelligence

I have evaluated your query against live Indian Railways data (**128 Tasks**, **34 Available Windows**, and **8 Active Bundles**).

• **Current Network Status:** Optimal night corridor windows available on NDLS-GZB and DDU-PRYJ.
• **Solver Readiness:** 14 unified blocks synthesized with 40% downtime reduction.
• **Suggested queries you can ask:**
  1. *"Analyze NDLS-GZB night corridor block"*
  2. *"What are the G&SR safety rules for 25kV OHE work?"*
  3. *"Which tasks have high overrun risk?"*
  4. *"Simulate fog weather impact on passenger punctuality"*
  5. *"Generate official dispatch order telegraph"*`,
      timestamp: new Date().toISOString(),
      suggestedActions: [
        { label: 'Run Block Optimization', action: 'NAVIGATE', target: '/optimization' },
        { label: 'Check Corridor Timetable', action: 'NAVIGATE', target: '/corridor-availability' }
      ]
    };
  },

  /**
   * Directly apply an AI recommendation to the Master Schedule in Real Time
   */
  async applyRecommendation(payload) {
    if (!USE_MOCK) {
      const res = await apiClient.post('/ai/apply-recommendation', payload);
      if (res) return res;
    }

    await apiClient.simulateDelay(300);
    return {
      status: 'SUCCESS',
      message: `Block ${payload.blockCode || 'BLK-NDLS-20260908-01'} applied to Master Schedule in real time.`,
      block: payload
    };
  },

  /**
   * Explainable AI (XAI): Returns transparent mathematical and safety rationale
   */
  async explainDecision(blockCode = 'BLK-NDLS-20260908-01') {
    if (!USE_MOCK) {
      const res = await apiClient.post('/ai/explain-decision', { blockCode });
      if (res) return res;
    }

    await apiClient.simulateDelay(250);
    return {
      blockCode,
      corridor: 'NDLS-GZB',
      summaryRationale: 'Selected optimal 01:30–04:30 night window combining Civil, Electrical, and Signaling requests to eliminate 4.5 hours of redundant daytime track closures with zero passenger train punctuality loss.',
      safetyProof: 'Statutory 15-minute COA clearance buffer and G&SR 17.03 PTW guidelines strictly verified with 0 timetable conflicts.',
      factors: [
        {
          category: 'Defect Criticality & Overdue Urgency',
          score: '96/100',
          weight: '35%',
          description: 'Task TSK-101 is overdue by 4 days with ultrasonic rail flaw index; prioritized at top of queue.',
          status: 'CRITICAL_DRIVER'
        },
        {
          category: 'Cross-Departmental Spatial Synergy',
          score: '94.2%',
          weight: '25%',
          description: 'Civil Track Tamping (TSK-101), TRD OHE Tensioning (TSK-102), and S&T Axle Recalibration (TSK-103) are within 800m on the same UP line.',
          status: 'HIGH_SYNERGY'
        },
        {
          category: 'Train Timetable Non-Intrusion',
          score: '100%',
          weight: '25%',
          description: 'Window 01:30–04:30 occupies non-suburban night gap; 14055 Brahmaputra Mail arrives at 04:55 (25 min safety margin). Vande Bharat 22436 departs at 06:00.',
          status: 'SAFEGUARDED'
        },
        {
          category: '25kV Traction Power Synchronization',
          score: 'Verified',
          weight: '15%',
          description: 'Permit-to-Work (PTW) sequence verified under G&SR 17.03 with dual discharge earthing clamp protection.',
          status: 'APPROVED'
        }
      ],
      alternativesConsidered: [
        { window: '10:00 – 13:00 (Day Slot)', rejectedReason: 'Would cause 48-minute detention to 22436 Vande Bharat Express and 6 suburban EMU locals.' },
        { window: '22:00 – 01:00 (Evening Slot)', rejectedReason: 'Clashes with prime freight container rake path on HDN-1 trunk route.' }
      ]
    };
  },

  /**
   * Run Digital Twin What-If scenario simulation
   */
  async simulateScenario(params) {
    if (!USE_MOCK) {
      const res = await apiClient.post('/ai/simulate-scenario', params);
      if (res) return res;
    }

    await apiClient.simulateDelay(300);

    const basePunctuality = 98.4;
    const weatherPenalty = params.weatherCondition === 'Dense Fog' ? 6.5 : (params.weatherCondition === 'Monsoon' ? 3.2 : 0.0);
    const psrPenalty = Math.max(0, (130 - (params.speedRestrictionKmph || 30)) * 0.06);
    const defectPenalty = params.emergencyDefectInjected ? 8.0 : 0.0;
    const crewPenalty = ((params.crewMobilizationDelayMinutes || 20) / 10.0) * 1.5;

    const simPunctuality = Math.max(68.0, Number((basePunctuality - weatherPenalty - psrPenalty - defectPenalty - crewPenalty).toFixed(1)));
    const loss = Number((basePunctuality - simPunctuality).toFixed(1));

    return {
      corridor: params.corridor || 'NDLS-GZB',
      baselinePunctuality: basePunctuality,
      simulatedPunctuality: simPunctuality,
      punctualityLossPercent: loss,
      passengerTrainDelays: [
        {
          trainNumber: '22436',
          trainName: 'Vande Bharat Express (NDLS-BSB)',
          scheduledTime: '06:00',
          predictedDelayMinutes: simPunctuality > 90 ? 0 : Math.round(loss * 1.8),
          status: simPunctuality > 90 ? 'On Time' : 'Regulated at Sahibabad (SBB)'
        },
        {
          trainNumber: '12424',
          trainName: 'Dibrugarh Rajdhani Express',
          scheduledTime: '16:20',
          predictedDelayMinutes: Math.round(loss * 2.2),
          status: 'Speed restricted 30 km/h'
        },
        {
          trainNumber: '14055',
          trainName: 'Brahmaputra Mail',
          scheduledTime: '04:55',
          predictedDelayMinutes: Math.round(loss * 3.1),
          status: 'Delayed due to block clearance gap'
        }
      ],
      freightHoldingMinutes: Math.round((params.requestedBlockDurationHours || 3.5) * 18 + loss * 4),
      overrunProbabilityPercent: Math.min(92.0, Number((18.5 + weatherPenalty * 3.5 + crewPenalty * 5.0 + (params.emergencyDefectInjected ? 15.0 : 0.0)).toFixed(1))),
      aiRecommendation: `Under ${params.weatherCondition || 'Dense Fog'} and ${params.speedRestrictionKmph || 30} km/h PSR, passenger punctuality drops by ${loss}%. Recommend shifting non-critical Civil packing to secondary night slot (02:00–04:00) and authorizing 25kV de-energization only after 14055 Brahmaputra Mail clears Ghaziabad.`,
      suggestedMitigationWindow: '02:00 – 04:30 hrs (Night Non-Suburban)',
      safetyBufferAdjustmentMinutes: loss > 10 ? 25 : 15
    };
  },

  /**
   * Transcribe audio/radio voice memo to structured defect ticket with Real-Time Ingestion
   */
  async transcribeMemo(rawTranscript, stationLocation = 'Ghaziabad Junction', corridor = 'NDLS-GZB', autoIngestTask = true) {
    if (!USE_MOCK) {
      const res = await apiClient.post('/ai/transcribe-memo', {
        rawTranscript,
        stationLocation,
        corridor,
        autoIngestTask
      });
      if (res) return res;
    }

    await apiClient.simulateDelay(350);
    const text = rawTranscript.toLowerCase();

    let dept = 'Engineering';
    let defect = 'Ballast Tamping & Track Alignment';
    let reqPower = false;
    let duration = 3.5;
    let severity = text.includes('fracture') ? 'Critical' : 'High';
    let priority = severity === 'Critical' ? 96 : 75;

    if (text.includes('ohe') || text.includes('traction') || text.includes('25kv') || text.includes('pantograph')) {
      dept = 'Electrical / Traction';
      defect = '25kV OHE Contact Wire Sag & Tensioning';
      reqPower = true;
      duration = 2.5;
      priority = 84;
    } else if (text.includes('signal') || text.includes('interlocking') || text.includes('point') || text.includes('axle')) {
      dept = 'Signaling & Telecom';
      defect = 'Point Machine 104-B Friction Clutch Overhaul';
      reqPower = false;
      duration = 2.0;
      severity = text.includes('failure') ? 'Critical' : 'Medium';
      priority = severity === 'Critical' ? 92 : 68;
    }

    const generatedId = `TSK-AI-${Math.floor(1000 + Math.random() * 9000)}`;

    if (autoIngestTask) {
      taskService.addDirectTask({
        id: generatedId,
        source: 'VOICE_MEMO_AI',
        department: dept,
        defectType: defect,
        description: `Radio Memo Extracted: ${rawTranscript}`,
        location: `${stationLocation} (Km 27/4 – 28/2)`,
        corridor,
        severity,
        severityWeight: severity === 'Critical' ? 4 : 3,
        overdueDays: severity === 'Critical' ? 4 : 2,
        priorityScore: priority,
        status: 'Pending',
        requestedDate: new Date().toISOString().slice(0, 10),
        preferredWindow: '01:30 - 04:30',
        durationHours: duration,
        requiresPowerBlock: reqPower,
        requiresTrafficBlock: true,
        speedRestrictionKmph: severity === 'Critical' ? 30 : 45,
        createdAt: new Date().toISOString()
      });
    }

    return {
      transcription: rawTranscript,
      department: dept,
      defectType: defect,
      location: `${stationLocation} (Km 27/4 – 28/2)`,
      corridor,
      severity,
      priorityScore: priority,
      requiresPowerBlock: reqPower,
      requiresTrafficBlock: true,
      estimatedDurationHours: duration,
      confidenceScore: '96.8% (DeepSpeech NLP)',
      generatedTaskId: generatedId,
      status: 'Ingested to TMS/SMMS in Real Time',
      conflictDetected: reqPower,
      conflictReason: reqPower ? 'Spatial overlap with UP Main ballast tamper; requires synchronized 25kV power isolation.' : null
    };
  },

  /**
   * Get Role-Based Access Control (RBAC) Matrix
   */
  async getRbacMatrix() {
    if (!USE_MOCK) {
      const res = await apiClient.get('/ai/rbac-matrix');
      if (res) return res;
    }

    await apiClient.simulateDelay(150);
    return [
      {
        roleCode: 'PLANNER_ADMIN',
        roleTitle: 'Operating / Traffic Planning Admin (Sr. DOM / Chief Controller)',
        branch: 'Operating & Traffic Branch',
        permissions: {
          'Request Submission': 'Create, Edit & Delete (All Branches)',
          'Dynamic Priority Override': 'Full Authority (Can force critical override)',
          'AI Scenario Digital Twin': 'Full Simulation & Parameter Tuning',
          'Automated Solver Execution': 'Full Authority to Execute & Reschedule',
          'Shadow Bundle Approval': 'Final Authority to Authorize Joint Permits',
          'Safety Hard Gate Validation': 'Mandatory Chief Controller Sign-Off',
          'Master Schedule Approval': 'Final Granting Authority',
          'COA / FOIS Dispatch Telegraph': 'Publish & Transmit to Field Stations',
          'System & User Management': 'Full Administrative Control'
        },
        accessibleModules: ['Dashboard', 'Block Requests', 'Data Sync', 'Data Quality', 'Priority Scoring', 'Corridor Availability', 'Conflicts & Bundling', 'Optimization Engine', 'Block Schedule', 'Validation', 'Performance', 'Downtime', 'RAIL-GPT Copilot', 'Settings']
      },
      {
        roleCode: 'DEPT_ENGINEER',
        roleTitle: 'Divisional Civil Engineer (Sr. DEN / AEN P-Way)',
        branch: 'Civil Engineering (Permanent Way)',
        permissions: {
          'Request Submission': 'Create & Edit (Civil Engineering Only)',
          'Dynamic Priority Override': 'View & Request Urgency Escalation',
          'AI Scenario Digital Twin': 'Read-Only Simulation Access',
          'Automated Solver Execution': 'View Generated Corridor Slots',
          'Shadow Bundle Approval': 'Propose Joint Work with S&T / TRD',
          'Safety Hard Gate Validation': 'Verify Track Clearance Checklist',
          'Master Schedule Approval': 'View Approved Civil Possession Windows',
          'COA / FOIS Dispatch Telegraph': 'View Station Dispatch Notices',
          'System & User Management': 'Self-Profile Management Only'
        },
        accessibleModules: ['Dashboard', 'Block Requests', 'Priority Scoring', 'Corridor Availability', 'Conflicts & Bundling', 'Block Schedule', 'RAIL-GPT Copilot', 'Profile']
      },
      {
        roleCode: 'SNT_OFFICER',
        roleTitle: 'Signaling & Telecom Engineer (Sr. DSTE / ASTE)',
        branch: 'Signaling & Telecommunications (S&T)',
        permissions: {
          'Request Submission': 'Create & Edit (S&T Interlocking & Axle Counters)',
          'Dynamic Priority Override': 'View & Request Urgency Escalation',
          'AI Scenario Digital Twin': 'Read-Only Simulation Access',
          'Automated Solver Execution': 'View Generated Corridor Slots',
          'Shadow Bundle Approval': 'Propose Joint Work during Track Tamping',
          'Safety Hard Gate Validation': 'Signal Aspect & Route Clearance Verification',
          'Master Schedule Approval': 'View Approved S&T Possession Windows',
          'COA / FOIS Dispatch Telegraph': 'View Station Dispatch Notices',
          'System & User Management': 'Self-Profile Management Only'
        },
        accessibleModules: ['Dashboard', 'Block Requests', 'Priority Scoring', 'Corridor Availability', 'Conflicts & Bundling', 'Block Schedule', 'RAIL-GPT Copilot', 'Profile']
      },
      {
        roleCode: 'TRD_ENGINEER',
        roleTitle: 'Traction Distribution Engineer (Sr. DEE TRD / AEE)',
        branch: 'Electrical / Traction (TRD)',
        permissions: {
          'Request Submission': 'Create & Edit (25kV OHE & Sub-Stations)',
          'Dynamic Priority Override': 'View',
          '25kV Power Block Management': 'Issue / Authorize Permit-to-Work (PTW)',
          'Automated Solver Execution': 'View Generated Corridor Slots',
          'Shadow Bundle Approval': 'Validate Earthing & Co-working Feasibility',
          'Safety Hard Gate Validation': 'Discharge Rod & Earthing Clearance Verification',
          'Master Schedule Approval': 'View Approved Power Blocks',
          'COA / FOIS Dispatch Telegraph': 'View Station Dispatch Notices',
          'System & User Management': 'Self-Profile Management Only'
        },
        accessibleModules: ['Dashboard', 'Block Requests', 'Priority Scoring', 'Corridor Availability', 'Conflicts & Bundling', 'Block Schedule', 'RAIL-GPT Copilot', 'Profile']
      },
      {
        roleCode: 'FIELD_CONTROLLER',
        roleTitle: 'Section Controller / Station Master (Field Operations)',
        branch: 'Station & Section Control',
        permissions: {
          'Request Submission': 'Submit Audio / Radio Voice Memos (VHF)',
          'Dynamic Priority Override': 'Flag Emergency Rail Defect / Flashover',
          'AI Scenario Digital Twin': 'View Passenger Delay Projections',
          'Automated Solver Execution': 'View Active Windows',
          'Shadow Bundle Approval': 'View Joint Work Teams on Section',
          'Safety Hard Gate Validation': 'Acknowledge Speed Restrictions (PSR)',
          'Master Schedule Approval': 'View Real-Time Block Grants',
          'COA / FOIS Dispatch Telegraph': 'Receive & Acknowledge Telegraphic Memo',
          'System & User Management': 'Self-Profile Management Only'
        },
        accessibleModules: ['Dashboard', 'Corridor Availability', 'Block Schedule', 'RAIL-GPT Copilot']
      }
    ];
  },

  /**
   * Generate official Indian Railways dispatch telegraph order
   */
  async generateDispatchOrder(params) {
    if (!USE_MOCK) {
      const res = await apiClient.post('/ai/generate-dispatch-order', params);
      if (res) return res;
    }

    await apiClient.simulateDelay(250);
    const now = new Date();
    const memoNo = `COA/DLI/BLK/${now.toISOString().slice(0, 10).replace(/-/g, '')}/${params.blockCode || 'BLK-NDLS-01'}`;

    const text = `INDIAN RAILWAYS • DELHI DIVISION • OPERATING BRANCH
MEMO NO: ${memoNo}                          DATE/TIME: ${now.toUTCString()}
--------------------------------------------------------------------------------
FROM: CHIEF CONTROLLER / DLI                    TO: SS / NDLS, SS / GZB, SM / SBB
COPY TO: SR. DOM, SR. DEN, SR. DEE (TRD), SR. DSTE, SECTION CONTROLLER (MAIN)
--------------------------------------------------------------------------------
SUBJECT: GRANT OF INTEGRATED MEGA MAINTENANCE BLOCK ON ${params.corridor || 'NDLS-GZB'}

1. PERMISSION IS HEREBY ACCORDED FOR AN INTEGRATED MAINTENANCE BLOCK AS UNDER:
   • CORRIDOR SECTION : ${params.corridor || 'NDLS-GZB'} (UP & DN MAIN LINES)
   • BLOCK CODE       : ${params.blockCode || 'BLK-NDLS-20260908-01'}
   • DATE OF BLOCK    : ${params.date || '2026-09-08'}
   • TIMINGS GRANTED  : ${params.startTime || '01:30'} HRS TO ${params.endTime || '04:30'} HRS
   • DEPARTMENTS      : ${(params.departments || ['Engineering', 'Electrical / Traction', 'Signaling & Telecom']).join(', ')}
   • SPEED RESTRICTION: ${params.speedRestrictionKmph || 30} KM/H ON CLEARANCE

2. SAFETY INSTRUCTIONS (G&SR 17.03 & BLOCK WORKING MANUAL):
   (A) TRACTION POWER CONTROLLER (TPC) TO ISSUE PERMIT-TO-WORK (PTW) BEFORE 01:30 HRS.
   (B) SECTION ENGINEER (P-WAY) TO ENSURE TRACK TAMPING MACHINE CLEARED BY 04:15 HRS.
   (C) S&T SIGNAL TESTING MUST BE SYNCHRONIZED CONCURRENTLY UNDER JOINT SUPERVISION.
   (D) 15-MINUTE SAFETY CLEARANCE BUFFER MANDATORY BEFORE PASSING TRAIN 14055.

ISSUED UNDER THE AUTHORITY OF: ${params.controllerName || 'Rajesh Sharma, Sr. DOM (Planning)'}
DIGITAL DISPATCH TOKEN        : CRIS-SHA256-AUTH-${memoNo.slice(-8)}`;

    return {
      memoNumber: memoNo,
      generatedTimestamp: now.toLocaleString('en-IN'),
      officialTelegraphText: text,
      recipientStations: ['New Delhi (NDLS)', 'Ghaziabad (GZB)', 'Sahibabad (SBB)', 'Anand Vihar (ANVT)'],
      safetyClauses: [
        'G&SR 17.03: 25kV OHE earthing discharge rod clamping verified by TPC',
        'BWM Clause 4.12: Dual detonator & banner flag protection at 1200m',
        'Statutory 15-minute inter-train buffer before express resumption'
      ],
      digitalSignatureToken: `CRIS-SHA256-AUTH-${memoNo.slice(-8)}`
    };
  }
};
