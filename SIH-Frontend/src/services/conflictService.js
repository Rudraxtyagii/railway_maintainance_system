import { apiClient, USE_MOCK } from './apiClient';
import { MOCK_CONFLICTS } from '../data/mockData';

let conflictsState = [...MOCK_CONFLICTS];

export const conflictService = {
  async getConflicts(filters = {}) {
    if (!USE_MOCK) {
      const res = await apiClient.get('/conflicts', filters);
      if (res) return res;
    }

    await apiClient.simulateDelay(200);
    let filtered = [...conflictsState];

    if (filters.corridor && filters.corridor !== 'ALL') {
      filtered = filtered.filter(c => c.corridor === filters.corridor);
    }
    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter(c => c.status.toLowerCase() === filters.status.toLowerCase());
    }

    return filtered;
  },

  async resolveConflict(id, resolutionProposal) {
    if (!USE_MOCK) {
      const res = await apiClient.post(`/conflicts/${id}/resolve`, { resolution: resolutionProposal });
      if (res) return res;
    }

    await apiClient.simulateDelay(250);
    conflictsState = conflictsState.map(c =>
      c.id === id ? { ...c, status: 'Resolved', resolutionProposal: resolutionProposal || c.resolutionProposal } : c
    );
    return conflictsState.find(c => c.id === id);
  }
};
