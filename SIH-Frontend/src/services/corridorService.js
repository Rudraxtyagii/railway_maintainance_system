import { apiClient, USE_MOCK } from './apiClient';
import { CORRIDORS, CORRIDOR_WINDOWS } from '../data/mockData';

let windowsState = [...CORRIDOR_WINDOWS];

export const corridorService = {
  async getCorridors() {
    if (!USE_MOCK) {
      const res = await apiClient.get('/corridors');
      if (res) return res;
    }
    return CORRIDORS;
  },

  async getCorridorWindows(filters = {}) {
    if (!USE_MOCK) {
      const res = await apiClient.get('/corridors/windows', filters);
      if (res) return res;
    }

    await apiClient.simulateDelay(200);
    let filtered = [...windowsState];

    if (filters.corridor && filters.corridor !== 'ALL') {
      filtered = filtered.filter(w => w.corridor === filters.corridor);
    }
    if (filters.date) {
      filtered = filtered.filter(w => w.date === filters.date);
    }
    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter(w => w.status.toLowerCase() === filters.status.toLowerCase());
    }

    return filtered;
  },

  async getWindowById(id) {
    if (!USE_MOCK) {
      const res = await apiClient.get(`/corridors/windows/${id}`);
      if (res) return res;
    }

    await apiClient.simulateDelay(150);
    const window = windowsState.find(w => w.id === id);
    if (!window) throw new Error(`Window ${id} not found`);
    return window;
  }
};
