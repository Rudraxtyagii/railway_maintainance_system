import { apiClient, USE_MOCK } from './apiClient';
import { MOCK_SCHEDULES } from '../data/mockData';

let schedulesState = [...MOCK_SCHEDULES];

export const scheduleService = {
  async getSchedules(filters = {}) {
    if (!USE_MOCK) {
      const res = await apiClient.get('/schedules', filters);
      if (res) return res;
    }

    await apiClient.simulateDelay(200);
    let filtered = [...schedulesState];

    if (filters.corridor && filters.corridor !== 'ALL') {
      filtered = filtered.filter(s => s.corridor === filters.corridor);
    }
    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter(s => s.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.date) {
      filtered = filtered.filter(s => s.date === filters.date);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(s =>
        s.blockCode.toLowerCase().includes(q) ||
        s.corridorName.toLowerCase().includes(q) ||
        s.departments.some(d => d.toLowerCase().includes(q))
      );
    }

    return filtered;
  },

  async getScheduleById(id) {
    if (!USE_MOCK) {
      const res = await apiClient.get(`/schedules/${id}`);
      if (res) return res;
    }
    await apiClient.simulateDelay(150);
    const schedule = schedulesState.find(s => s.id === id);
    if (!schedule) throw new Error(`Schedule ${id} not found`);
    return schedule;
  },

  async approveSchedule(id) {
    if (!USE_MOCK) {
      const res = await apiClient.post(`/schedules/${id}/approve`);
      if (res) return res;
    }
    await apiClient.simulateDelay(200);
    schedulesState = schedulesState.map(s =>
      s.id === id ? { ...s, status: 'Approved', trafficBlockGranted: true, controllerApproval: 'Approved by Operating Planning' } : s
    );
    return schedulesState.find(s => s.id === id);
  },

  async rejectSchedule(id, reason) {
    if (!USE_MOCK) {
      const res = await apiClient.post(`/schedules/${id}/reject`, { reason });
      if (res) return res;
    }
    await apiClient.simulateDelay(200);
    schedulesState = schedulesState.map(s =>
      s.id === id ? { ...s, status: 'Draft', controllerApproval: `Rejected: ${reason || 'Rescheduling required'}` } : s
    );
    return schedulesState.find(s => s.id === id);
  },

  async publishSchedule(id) {
    if (!USE_MOCK) {
      const res = await apiClient.post(`/schedules/${id}/publish`);
      if (res) return res;
    }
    await apiClient.simulateDelay(250);
    schedulesState = schedulesState.map(s =>
      s.id === id ? { ...s, status: 'Published', controllerApproval: 'Published to COA / FOIS Live Timetable' } : s
    );
    return schedulesState.find(s => s.id === id);
  }
};
