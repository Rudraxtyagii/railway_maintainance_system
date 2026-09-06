import { apiClient, USE_MOCK } from './apiClient';
import { MOCK_DASHBOARD_STATS } from '../data/mockData';
import { taskService } from './taskService';

export const analyticsService = {
  async getDashboardStats() {
    if (!USE_MOCK) {
      try {
        const res = await apiClient.get('/analytics/dashboard');
        if (res) return res;
      } catch (err) {
        console.warn('Backend analytics fetch failed, calculating dynamic local stats:', err);
      }
    }

    await apiClient.simulateDelay(100);
    const tasks = await taskService.getTasks();

    // Dynamically calculate from real-time tasks list
    const pending = tasks.filter(t => t.status?.toLowerCase() === 'pending').length;
    const highPriority = tasks.filter(t => (t.priorityScore || 0) >= 80 || t.severity === 'Critical' || t.severity === 'High').length;

    const deptMap = {};
    const severityMap = {};

    tasks.forEach(t => {
      const dept = t.department || 'Other';
      deptMap[dept] = (deptMap[dept] || 0) + 1;

      const sev = t.severity || 'Medium';
      severityMap[sev] = (severityMap[sev] || 0) + 1;
    });

    const requestsByDepartment = Object.entries(deptMap).map(([department, count]) => ({
      department,
      count,
      fill: department.includes('Eng') ? '#0ea5e9' : department.includes('Trac') ? '#f97316' : '#10b981'
    }));

    const priorityDistribution = Object.entries(severityMap).map(([name, value]) => ({
      name,
      value,
      fill: name === 'Critical' ? '#e11d48' : name === 'High' ? '#f59e0b' : name === 'Medium' ? '#3b82f6' : '#94a3b8'
    }));

    return {
      totalBlockRequests: tasks.length,
      pendingRequests: pending,
      highPriorityTasks: highPriority,
      availableBlockWindows: MOCK_DASHBOARD_STATS.availableBlockWindows || 34,
      activeConflicts: MOCK_DASHBOARD_STATS.activeConflicts || 12,
      bundleCandidates: MOCK_DASHBOARD_STATS.bundleCandidates || 8,
      optimizedBlocks: MOCK_DASHBOARD_STATS.optimizedBlocks || 14,
      downtimeSavedHours: 48,
      requestsByDepartment: requestsByDepartment.length > 0 ? requestsByDepartment : MOCK_DASHBOARD_STATS.requestsByDepartment,
      priorityDistribution: priorityDistribution.length > 0 ? priorityDistribution : MOCK_DASHBOARD_STATS.priorityDistribution,
      corridorUtilization: MOCK_DASHBOARD_STATS.corridorUtilization || []
    };
  },

  async getDowntimeAnalysis() {
    if (!USE_MOCK) {
      try {
        const res = await apiClient.get('/analytics/downtime');
        if (res) return res;
      } catch (err) {
        // fallback
      }
    }
    await apiClient.simulateDelay(150);
    return {
      summary: {
        manualPlanningHours: 120,
        optimizedPlanningHours: 72,
        downtimeSavedHours: 48,
        savingPercentage: 40,
        trainPunctualityImpactReduction: '64%',
        monetarySavingsEstimateCrores: '₹3.42 Cr'
      },
      weeklyComparison: MOCK_DASHBOARD_STATS.downtimeComparison,
      byDepartment: [
        { department: 'Engineering (TMS)', manualHours: 54, optimizedHours: 32, savedHours: 22, savingPercent: 41 },
        { department: 'Traction Distribution (TDMS)', manualHours: 40, optimizedHours: 24, savedHours: 16, savingPercent: 40 },
        { department: 'Signal & Telecom (SMMS)', manualHours: 26, optimizedHours: 16, savedHours: 10, savingPercent: 38 }
      ],
      corridorSavings: [
        { corridor: 'NDLS-GZB', manual: 34, optimized: 20, saved: 14 },
        { corridor: 'DDU-PRYJ', manual: 32, optimized: 19, saved: 13 },
        { corridor: 'BCT-ST', manual: 30, optimized: 18, saved: 12 },
        { corridor: 'HWH-KGP', manual: 24, optimized: 15, saved: 9 }
      ]
    };
  },

  async getPerformanceMetrics() {
    if (!USE_MOCK) {
      try {
        const res = await apiClient.get('/analytics/performance');
        if (res) return res;
      } catch (err) {
        // fallback
      }
    }
    await apiClient.simulateDelay(150);
    return {
      totalRequestsProcessed: 128,
      averageProcessingTimeSeconds: 1.4,
      blocksGenerated: 14,
      conflictsResolved: 12,
      bundlesCreated: 8,
      scheduleUtilization: '88.4%',
      tasksScheduled: 42,
      tasksPending: 86,
      algorithmConvergenceIterations: 42,
      constraintSatisfactionScore: '99.2%',
      trends: [
        { month: 'Apr', manualBlocks: 28, aiBlocks: 16, utilization: 74 },
        { month: 'May', manualBlocks: 31, aiBlocks: 18, utilization: 78 },
        { month: 'Jun', manualBlocks: 29, aiBlocks: 17, utilization: 82 },
        { month: 'Jul', manualBlocks: 34, aiBlocks: 19, utilization: 85 },
        { month: 'Aug', manualBlocks: 32, aiBlocks: 18, utilization: 87 },
        { month: 'Sep', manualBlocks: 30, aiBlocks: 14, utilization: 89 }
      ]
    };
  }
};
