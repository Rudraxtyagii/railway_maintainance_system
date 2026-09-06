import { apiClient, USE_MOCK } from './apiClient';
import { MOCK_BUNDLES } from '../data/mockData';

let bundlesState = [...MOCK_BUNDLES];

export const bundleService = {
  async getBundleCandidates() {
    if (!USE_MOCK) {
      const res = await apiClient.get('/bundles');
      if (res) return res;
    }
    await apiClient.simulateDelay(200);
    return bundlesState;
  },

  async acceptBundle(id) {
    if (!USE_MOCK) {
      const res = await apiClient.post(`/bundles/${id}/accept`);
      if (res) return res;
    }
    await apiClient.simulateDelay(200);
    bundlesState = bundlesState.map(b => b.id === id ? { ...b, status: 'Accepted' } : b);
    return bundlesState.find(b => b.id === id);
  },

  async rejectBundle(id) {
    if (!USE_MOCK) {
      const res = await apiClient.post(`/bundles/${id}/reject`);
      if (res) return res;
    }
    await apiClient.simulateDelay(200);
    bundlesState = bundlesState.map(b => b.id === id ? { ...b, status: 'Rejected' } : b);
    return bundlesState.find(b => b.id === id);
  }
};
