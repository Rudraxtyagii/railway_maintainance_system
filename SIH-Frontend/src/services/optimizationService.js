import { apiClient, USE_MOCK } from './apiClient';
import { MOCK_SCHEDULES, MOCK_DASHBOARD_STATS, MOCK_BUNDLES } from '../data/mockData';

export const optimizationService = {
  async getOptimizationInputs() {
    if (!USE_MOCK) {
      const res = await apiClient.get('/optimization/inputs');
      if (res) return res;
    }
    await apiClient.simulateDelay(150);
    return {
      totalPendingTasks: 128,
      highPriorityTasks: 18,
      availableWindows: 34,
      detectedConflicts: 12,
      bundleCandidates: 8,
      corridorsCovered: 4,
      targetDateRange: '08 Sep 2026 – 15 Sep 2026'
    };
  },

  async runOptimization(params = {}) {
    if (!USE_MOCK) {
      const res = await apiClient.post('/optimization/run', params);
      if (res) return res;
    }

    // Delay simulates remote Python solver / MILP execution
    await apiClient.simulateDelay(800);

    return {
      optimizationId: `OPT-IR-${Date.now().toString().slice(-6)}`,
      engine: 'Greedy Constraint Satisfaction + Shadow Bundling Solver (v2.4)',
      executionTimeMs: 1420,
      timestamp: new Date().toISOString(),
      summary: {
        tasksScheduled: 42,
        tasksNotScheduled: 86,
        conflictsResolved: 12,
        bundlesCreated: 8,
        totalBlockDurationHours: 72,
        manualPlanningDowntimeHours: 120,
        optimizedDowntimeHours: 72,
        downtimeSavedHours: 48,
        downtimeSavingPercent: 40,
        networkUtilization: '88.4%'
      },
      scheduledBlocks: MOCK_SCHEDULES,
      bundles: MOCK_BUNDLES,
      status: 'SUCCESS'
    };
  },

  async getOptimizationResult(id) {
    if (!USE_MOCK) {
      const res = await apiClient.get(`/optimization/${id}`);
      if (res) return res;
    }
    await apiClient.simulateDelay(200);
    return {
      id,
      status: 'COMPLETED',
      summary: MOCK_DASHBOARD_STATS,
      scheduledBlocks: MOCK_SCHEDULES
    };
  }
};
