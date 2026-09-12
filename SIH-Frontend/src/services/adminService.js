import { apiClient, USE_MOCK } from './apiClient';

export const adminService = {
  async resetDatabase() {
    if (!USE_MOCK) {
      const res = await apiClient.post('/admin/reset-database');
      if (res) return res;
    }
    await apiClient.simulateDelay(300);
    return {
      status: 'SUCCESS',
      message: 'Database reset to clean slate (mock mode).'
    };
  },

  async getDatabaseStats() {
    if (!USE_MOCK) {
      const res = await apiClient.get('/admin/db-stats');
      if (res) return res;
    }
    await apiClient.simulateDelay(100);
    return {
      users: 5,
      tasks: 0,
      conflicts: 0,
      bundles: 0,
      schedules: 0,
      corridors: 4,
      corridorWindows: 3,
      knowledgeChunks: 8
    };
  }
};
