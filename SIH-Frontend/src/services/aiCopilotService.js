import { apiClient, USE_MOCK } from './apiClient';
import { taskService } from './taskService';

export const aiCopilotService = {
  /**
   * Send a natural language query to RAIL-GPT RAG Engine
   */
  async sendMessage(message, history = [], contextCorridor = 'NDLS-GZB') {
    try {
      const res = await apiClient.post('/ai/chat', {
        message,
        conversationHistory: history,
        contextCorridor
      });
      if (res && res.content) return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
      console.warn('Live AI Copilot call failed, using local RAG fallback:', err);
    }

    await apiClient.simulateDelay(250);
    const q = message.toLowerCase();

    if (q.includes('ndls-gzb') || q.includes('delhi') || q.includes('ghaziabad') || q.includes('corridor') || q.includes('analyze') || q.includes('night block') || q.includes('rolling block')) {
      const rec = {
        blockCode: 'BLK-NDLS-20260908-01',
        corridor: 'NDLS-GZB',
        date: '2026-09-08',
        startTime: '01:30',
        endTime: '04:30',
        durationHours: 3.0,
        departments: ['Engineering', 'Traction Distribution', 'Signal & Telecom'],
        taskIds: ['TSK-101', 'TSK-102', 'TSK-103'],
        downtimeSaved: '4.5 hours (60%)',
        trainPunctualityImpact: 'Zero Delay (Night Window)'
      };

      return {
        role: 'assistant',
        content: `### 🚄 Grounded Analysis: New Delhi – Ghaziabad Corridor (NDLS-GZB)

• **Corridor Density:** High Density Network (HDN-1), 4 Lines (UP Main, UP Slow, DN Main, DN Slow).
• **Available Window:** \`01:30 – 04:30 hrs\` (Night non-suburban gap).
• **Active Clashes:** 2 pending tasks detected between UP Main tamping and 25kV OHE wire tensioning.
• **AI Recommendation:** Execute **Shadow Bundle BUN-101**. Merging Civil, S&T, and TRD requests will reduce corridor closure from **7.5 hours down to 3.0 hours** (saving 4.5 hours of downtime with 0% impact on Vande Bharat 22436).`,
        timestamp: new Date().toISOString(),
        citations: [
          {
            manualName: 'ROLLING_BLOCK_2024',
            chapter: 'Ministry of Railways Rolling Block Programme (2024)',
            ruleNumber: 'Clause 3.1',
            title: '52-Week Rolling Corridor Windows & Integrated Mega Block Norms',
            excerpt: 'All departmental requests must be consolidated into integrated mega-blocks during night non-suburban gaps (01:30 - 04:30 hrs) to eliminate daytime speed restrictions.',
            verifiedGroundTruth: true
          },
          {
            manualName: 'BWM',
            chapter: 'Section 8: Tokenless Block Working',
            ruleNumber: 'Rule 8.14',
            title: 'Shadow Bundling and Train Separation Inside Block Section',
            excerpt: 'Multiple departmental maintenance units (P.Way, TRD, S&T) may occupy the same absolute block section under a single Unified Corridor Shadow Block.',
            verifiedGroundTruth: true
          }
        ],
        hallucinationCheckPassed: true,
        suggestedActions: [
          { label: 'Apply to Master Schedule', action: 'APPLY_RECOMMENDATION', payload: rec },
          { label: 'Why did AI choose this?', action: 'EXPLAIN_DECISION', payload: { blockCode: 'BLK-NDLS-20260908-01' } },
          { label: 'Launch Optimizer', action: 'NAVIGATE', target: '/optimization' },
          { label: 'Validate Safety', action: 'NAVIGATE', target: '/validation' }
        ],
        structuredRecommendation: rec
      };
    }

    if (q.includes('g&sr') || q.includes('safety') || q.includes('power') || q.includes('ohe') || q.includes('25kv') || q.includes('ptw')) {
      return {
        role: 'assistant',
        content: `### ⚡ G&SR & Traction Safety Directive (Chapter XVII & ACTM Vol II)

1. **Permit to Work (PTW):** Under G&SR Rule 17.03, no personnel or machine shall foul within **2.0 meters of 25kV live OHE conductors** until an official PTW is issued by the Traction Power Controller (TPC).
2. **Earthing Sequence (G&SR 17.05):** Discharge rods must be clamped on both UP and DN bounds of the work section (max 1000m separation).
3. **Co-working Rules (G&SR 17.08):** Diesel Track Machines (BCM/CSM) may operate concurrently under de-energized OHE with 150m longitudinal separation.`,
        timestamp: new Date().toISOString(),
        citations: [
          {
            manualName: 'G&SR',
            chapter: 'Chapter XVII: Working of Trains on Electrified Sections',
            ruleNumber: 'Rule 17.03',
            title: 'Permit to Work (PTW) & 25kV OHE Minimum Safe Distance',
            excerpt: 'No person, track maintenance machine, or crane shall work within a distance of 2.0 meters from any live 25kV 50Hz AC overhead equipment unless PTW is issued.',
            verifiedGroundTruth: true
          },
          {
            manualName: 'ACTM_VOL_II',
            chapter: 'Chapter IV: Power Blocks and Isolation',
            ruleNumber: 'Section 4.2',
            title: 'Power Block Classification (Emergency, Planned, Shadow)',
            excerpt: 'Shadow Power Blocks are granted concurrently when a Traffic Block is sanctioned for Civil engineering works, maximizing corridor utilization.',
            verifiedGroundTruth: true
          }
        ],
        hallucinationCheckPassed: true,
        suggestedActions: [
          { label: 'Inspect Active Conflicts', action: 'NAVIGATE', target: '/conflicts' },
          { label: 'Verify Safety Checklist', action: 'NAVIGATE', target: '/validation' }
        ]
      };
    }

    return {
      role: 'assistant',
      content: `### 🤖 RAIL-GPT Grounded Operational Intelligence

I have evaluated your query against live Indian Railways database state and verified regulatory rulebooks.

• **Available Knowledge Bases:** G&SR Chapter XVII, ACTM Vol II, IRPWM (Permanent Way), BWM (Block Working), and 2024 Rolling Block Directives.
• **Solver Readiness:** Unified blocks synthesized with 40% downtime reduction.
• **Suggested queries:**
  1. *"Analyze NDLS-GZB night corridor block"*
  2. *"What are the G&SR safety rules for 25kV OHE work?"*
  3. *"What are deep screening tamping tolerances under IRPWM?"*
  4. *"Simulate fog weather impact on passenger punctuality"*`,
      timestamp: new Date().toISOString(),
      citations: [
        {
          manualName: 'G&SR',
          chapter: 'Chapter XV: Permanent Way and Works',
          ruleNumber: 'Rule 15.06',
          title: 'Sanction and Execution of Traffic Blocks',
          excerpt: 'No engineering work interfering with train movement shall commence without prior sanction of the Sr. DOM or Chief Controller.',
          verifiedGroundTruth: true
        }
      ],
      hallucinationCheckPassed: true,
      suggestedActions: [
        { label: 'Run Block Optimization', action: 'NAVIGATE', target: '/optimization' },
        { label: 'Check Corridor Timetable', action: 'NAVIGATE', target: '/corridor-availability' }
      ]
    };
  },

  async applyRecommendation(payload) {
    try {
      const res = await apiClient.post('/ai/apply-recommendation', payload);
      if (res) return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
    }

    await apiClient.simulateDelay(200);
    return {
      status: 'SUCCESS',
      message: `Block ${payload.blockCode || 'BLK-NDLS-20260908-01'} applied to Master Schedule in real time.`,
      block: payload
    };
  },

  async explainDecision(blockCode = 'BLK-NDLS-20260908-01') {
    try {
      const res = await apiClient.post('/ai/explain-decision', { blockCode });
      if (res) return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
    }

    await apiClient.simulateDelay(200);
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
          description: 'Task TSK-101 is overdue with ultrasonic rail flaw index; prioritized at top of queue.',
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

  async simulateScenario(params) {
    try {
      const res = await apiClient.post('/ai/simulate-scenario', params);
      if (res) return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
    }

    await apiClient.simulateDelay(200);
    const basePunctuality = 98.4;
    const weatherPenalty = params.weatherCondition === 'Dense Fog' ? 6.5 : (params.weatherCondition === 'Monsoon' ? 3.2 : 0.0);
    const loss = Number((weatherPenalty + 4.5).toFixed(1));
    const simPunctuality = Number((basePunctuality - loss).toFixed(1));

    return {
      corridor: params.corridor || 'NDLS-GZB',
      baselinePunctuality: basePunctuality,
      simulatedPunctuality: simPunctuality,
      punctualityLossPercent: loss,
      passengerTrainDelays: [
        { trainNumber: '22436', trainName: 'Vande Bharat Express (NDLS-BSB)', scheduledTime: '06:00', predictedDelayMinutes: 0, status: 'On Time' },
        { trainNumber: '12424', trainName: 'Dibrugarh Rajdhani Express', scheduledTime: '16:20', predictedDelayMinutes: 8, status: 'Speed restricted 30 km/h' }
      ],
      freightHoldingMinutes: 35,
      overrunProbabilityPercent: 24.0,
      aiRecommendation: `Recommend shifting non-critical Civil packing to secondary night slot (02:00–04:00) and authorizing 25kV de-energization only after 14055 Brahmaputra Mail clears Ghaziabad.`,
      suggestedMitigationWindow: '02:00 – 04:30 hrs (Night Non-Suburban)',
      safetyBufferAdjustmentMinutes: 15
    };
  },

  async parseVoiceMemo(params) {
    try {
      const res = await apiClient.post('/ai/parse-voice-memo', params);
      if (res) return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
    }

    await apiClient.simulateDelay(200);
    return {
      transcription: params.rawTranscript,
      department: 'Engineering',
      defectType: 'Critical Rail Flaw / Track Fracture',
      location: params.stationLocation || 'Section Km 27/4',
      corridor: params.corridor || 'NDLS-GZB',
      severity: 'Critical',
      priorityScore: 92,
      requiresPowerBlock: false,
      requiresTrafficBlock: true,
      estimatedDurationHours: 3.5,
      confidenceScore: '98.6%',
      generatedTaskId: `TSK-VOICE-${Math.floor(100 + Math.random() * 900)}`,
      status: 'Ingested to TMS/SMMS in Real Time',
      conflictDetected: false
    };
  },

  async generateDispatchOrder(params) {
    try {
      const res = await apiClient.post('/ai/generate-dispatch-order', params);
      if (res) return res;
    } catch (err) {
      if (!USE_MOCK) throw err;
    }

    await apiClient.simulateDelay(200);
    const memo = `IR-CRIS-COA-DLI-20260908-044`;
    return {
      memoNumber: memo,
      generatedTimestamp: '2026-09-08 00:45 IST',
      officialTelegraphText: `================================================================================
                      NORTHERN RAILWAY - DELHI DIVISION                         
                    CONTROL OFFICE APPLICATION (COA) DISPATCH                   
================================================================================
FROM: SR. DOM (PLANNING) / CHIEF CONTROLLER (DLI)
TO:   STATION MASTERS: NDLS, GZB, ANVR, SBB | TPC (DLI) | SSE (P.WAY/TRD/S&T)
MEMO NO: ${memo}                          DATE/TIME: 2026-09-08 00:45 IST
--------------------------------------------------------------------------------
SANCTION IS HEREBY ACCORDED FOR UNIFIED ROLLING MAINTENANCE BLOCK:
  * CORRIDOR SECTION : NDLS-GZB (UP MAIN & UP SLOW LINES)
  * TIME DURATION    : 01:30 TO 04:30 HRS (3.0 HOURS)
  * DEPARTMENTS      : Engineering, Electrical / Traction, Signal & Telecom
  * SPEED RESTRICTION: 30 KMPH AT WORK ZONE
--------------------------------------------------------------------------------
SAFETY & OPERATING DIRECTIVES:
  1. G&SR 17.03: TPC SHALL DE-ENERGIZE 25kV OHE AND ISSUE PTW PRIOR TO CIVIL ENTRY.
  2. G&SR 4.08: ISSUE CAUTION ORDER FORM T/409 TO ALL APPROACHING TRAINS.
  3. BWM 8.14: UNIFIED SHADOW BLOCK GRANTED. LINE CLOSED TO TRAFFIC.
================================================================================
SANCTIONED BY: Rajesh Sharma, Sr. DOM (Planning)
CRYPTOGRAPHIC AUTHENTICATION TOKEN: DIG-SIG-CRIS-774A-9921-DF04
================================================================================`,
      recipientStations: ['NDLS (New Delhi)', 'GZB (Ghaziabad)', 'ANVR (Anand Vihar)', 'SBB (Sahibabad)'],
      safetyClauses: [
        'G&SR Rule 17.03: 25kV OHE Isolation and Earthing PTW',
        'G&SR Rule 4.08: Caution Order T/409 Issuance',
        'BWM Rule 8.14: Multi-Department Unified Shadow Block Working'
      ],
      digitalSignatureToken: 'DIG-SIG-CRIS-774A-9921-DF04'
    };
  },

  async getRbacMatrix() {
    return [
      {
        roleCode: 'PLANNER_ADMIN',
        roleTitle: 'Senior Divisional Operating Manager (Sr. DOM / Planning)',
        branch: 'Operating Branch',
        permissions: {
          'Corridor Possessions': 'Full Authority (Grants, Denies, Revokes)',
          'Mega Blocks & Bundling': 'Full Authority (Runs solver & sanctions)',
          'Safety & PTW': 'Authorizes combined traffic & power block memos',
          'Dispatch Orders': 'Signs Form T/409 & telegraph orders'
        },
        accessibleModules: ['All Modules', 'Master Schedule', 'Optimization Solver', 'HITL Review Center', 'Data Ingestion']
      },
      {
        roleCode: 'DEPT_ENGINEER',
        roleTitle: 'Senior Divisional Engineer (Sr. DEN / Track)',
        branch: 'Civil Engineering (P-Way)',
        permissions: {
          'Corridor Possessions': 'Requisition Civil blocks only',
          'Mega Blocks & Bundling': 'Accept/Reject bundled Civil tasks',
          'Safety & PTW': 'Surrenders track fitness certificate T/1518',
          'Dispatch Orders': 'Receives Caution Order Form T/409'
        },
        accessibleModules: ['Dashboard', 'Block Requests', 'Corridor Availability', 'Priority Scoring', 'RAIL-GPT']
      },
      {
        roleCode: 'SNT_OFFICER',
        roleTitle: 'Senior Divisional Signal & Telecom Engineer (Sr. DSTE)',
        branch: 'Signal & Telecom Branch',
        permissions: {
          'Corridor Possessions': 'Requisition S&T blocks only',
          'Mega Blocks & Bundling': 'Accept/Reject S&T bundle participation',
          'Safety & PTW': 'Disconnection & Reconnection notices',
          'Dispatch Orders': 'Issues S&T fitness memo'
        },
        accessibleModules: ['Dashboard', 'Block Requests', 'Corridor Availability', 'Conflicts & Bundling', 'RAIL-GPT']
      },
      {
        roleCode: 'TRD_ENGINEER',
        roleTitle: 'Divisional Electrical Engineer (DEE / TRD)',
        branch: 'Traction Distribution (Electrical)',
        permissions: {
          'Corridor Possessions': 'Requisition 25kV OHE Power Blocks',
          'Mega Blocks & Bundling': 'Sanctions concurrent shadow power blocks',
          'Safety & PTW': 'Issues & cancels Permit to Work (PTW G&SR 17.03)',
          'Dispatch Orders': 'Verifies discharge rod earthing isolation'
        },
        accessibleModules: ['Dashboard', 'Block Requests', 'Corridor Availability', 'Conflicts & Bundling', 'RAIL-GPT']
      },
      {
        roleCode: 'FIELD_CONTROLLER',
        roleTitle: 'Section Controller / Station Master (NDLS)',
        branch: 'Station & Section Operations',
        permissions: {
          'Corridor Possessions': 'Executes live block entry & exit in Train Register',
          'Mega Blocks & Bundling': 'Human-in-the-loop grant/deny on live control chart',
          'Safety & PTW': 'Issues Caution Order T/409 to Loco Pilots',
          'Dispatch Orders': 'Logs actual start, end, and burst overrun duration'
        },
        accessibleModules: ['Dashboard', 'HITL Review Center', 'Block Schedule', 'Corridor Availability', 'RAIL-GPT']
      }
    ];
  }
};
