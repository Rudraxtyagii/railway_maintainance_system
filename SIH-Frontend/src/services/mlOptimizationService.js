import { apiClient, USE_MOCK } from './apiClient';

export const mlOptimizationService = {
  /**
   * ML Duration & Overrun Risk Batch Inference
   */
  async predictTaskDurations(params = {}) {
    if (!USE_MOCK) {
      const res = await apiClient.post('/optimization/ml/predict-duration', params);
      if (res) return res;
    }

    await apiClient.simulateDelay(250);
    return {
      highRiskCount: 3,
      averageOverrunRiskPercent: 24.8,
      totalBufferRecommendedMinutes: 195,
      generatedAt: new Date().toISOString(),
      predictions: [
        {
          taskId: 'TSK-101',
          department: 'Engineering',
          corridor: 'NDLS-GZB',
          requestedDurationHours: 3.5,
          predictedDurationHours: 4.1,
          overrunRiskPercent: 48.2,
          riskLevel: 'High',
          confidenceScore: '94.2%',
          recommendedBufferMinutes: 30,
          riskDrivers: [
            'Heavy track tamper mobilization & site clearance buffer required',
            'High-density traffic corridor with narrow inter-train gap margins'
          ]
        },
        {
          taskId: 'TSK-102',
          department: 'Electrical / Traction',
          corridor: 'NDLS-GZB',
          requestedDurationHours: 2.5,
          predictedDurationHours: 2.7,
          overrunRiskPercent: 26.4,
          riskLevel: 'Medium',
          confidenceScore: '96.1%',
          recommendedBufferMinutes: 15,
          riskDrivers: [
            '25kV OHE power de-energization and permit-to-work (PTW) verification'
          ]
        },
        {
          taskId: 'TSK-103',
          department: 'Signaling & Telecom',
          corridor: 'NDLS-GZB',
          requestedDurationHours: 2.0,
          predictedDurationHours: 1.9,
          overrunRiskPercent: 12.1,
          riskLevel: 'Low',
          confidenceScore: '98.0%',
          recommendedBufferMinutes: 10,
          riskDrivers: [
            'Standard electronic interlocking diagnostics verified'
          ]
        },
        {
          taskId: 'TSK-104',
          department: 'Engineering',
          corridor: 'DDU-PRYJ',
          requestedDurationHours: 4.0,
          predictedDurationHours: 4.6,
          overrunRiskPercent: 52.0,
          riskLevel: 'High',
          confidenceScore: '91.8%',
          recommendedBufferMinutes: 30,
          riskDrivers: [
            'Ballast clean machine (BCM) site setup on heavy freight trunk route',
            'Overdue by 6 days'
          ]
        },
        {
          taskId: 'TSK-105',
          department: 'Electrical / Traction',
          corridor: 'BCT-ST',
          requestedDurationHours: 3.0,
          predictedDurationHours: 3.2,
          overrunRiskPercent: 21.5,
          riskLevel: 'Low',
          confidenceScore: '97.2%',
          recommendedBufferMinutes: 10,
          riskDrivers: [
            'Routine OHE cantilever adjustment within daylight gap'
          ]
        }
      ]
    };
  },

  /**
   * ML Multi-Department Spatial Compatibility & Synergy Clustering
   */
  async getMLBundleClusters() {
    if (!USE_MOCK) {
      const res = await apiClient.get('/optimization/ml/cluster-bundles');
      if (res) return res;
    }

    await apiClient.simulateDelay(200);
    return [
      {
        bundleId: 'ML-BUN-201',
        corridor: 'NDLS-GZB',
        date: '2026-09-08',
        departments: ['Engineering', 'Electrical / Traction', 'Signaling & Telecom'],
        taskIds: ['TSK-101', 'TSK-102', 'TSK-103'],
        synergyScorePercent: 94.2,
        savedHours: 4.5,
        safetyIndex: 0.96,
        compatibilityReason: 'Triple-department joint permit: OHE power isolation + track packing + signal relay test'
      },
      {
        bundleId: 'ML-BUN-202',
        corridor: 'DDU-PRYJ',
        date: '2026-09-09',
        departments: ['Engineering', 'Signaling & Telecom'],
        taskIds: ['TSK-104', 'TSK-106'],
        synergyScorePercent: 88.5,
        savedHours: 2.8,
        safetyIndex: 0.93,
        compatibilityReason: 'Track circuit bonding synchronized with rail weld testing'
      }
    ];
  },

  /**
   * ML Timetable Risk & Punctuality Assessment
   */
  async assessBlockRisk(blockData) {
    if (!USE_MOCK) {
      const res = await apiClient.post('/optimization/ml/risk-assessment', blockData);
      if (res) return res;
    }

    await apiClient.simulateDelay(150);
    const isNight = blockData.startTime && blockData.startTime.startsWith('0');
    return {
      punctualityScorePercent: isNight ? 98.4 : 84.2,
      passengerTrainDelayRiskMinutes: isNight ? 0.0 : 18.5,
      freightHoldingEstimatedMinutes: isNight ? 15.0 : 45.0,
      riskCategory: isNight ? 'Low Impact (Recommended Night Slot)' : 'Moderate Impact (Daytime Slot)',
      recommendedAdjustment: isNight
        ? 'Approved. Proceed with standard 15-minute COA safety buffer.'
        : 'Recommend shifting block to night non-suburban window (01:30 - 04:30) to preserve passenger punctuality.'
    };
  },

  /**
   * ML Network-wide Insights
   */
  async getMLInsights() {
    if (!USE_MOCK) {
      const res = await apiClient.get('/optimization/ml/insights');
      if (res) return res;
    }

    await apiClient.simulateDelay(180);
    return {
      totalAnalyzedTasks: 128,
      averageDurationAccuracy: '94.6%',
      predictedDowntimeReductionPercent: 41.8,
      topRiskCorridors: ['NDLS-GZB (High suburban frequency)', 'DDU-PRYJ (Freight density)'],
      highSynergyCombinations: [
        {
          departments: ['Engineering', 'Electrical / Traction'],
          historicalSynergy: '92.4%',
          meanDowntimeSaved: '3.8 hours/block'
        },
        {
          departments: ['Engineering', 'Signaling & Telecom'],
          historicalSynergy: '89.7%',
          meanDowntimeSaved: '2.5 hours/block'
        },
        {
          departments: ['Electrical / Traction', 'Signaling & Telecom'],
          historicalSynergy: '86.1%',
          meanDowntimeSaved: '2.0 hours/block'
        }
      ],
      modelEngine: 'Hybrid Gradient-Boosted Decision Trees + Heuristic MCDM Solver'
    };
  }
};
