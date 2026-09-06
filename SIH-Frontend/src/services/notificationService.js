import { apiClient, USE_MOCK } from './apiClient';
import { MOCK_NOTIFICATIONS } from '../data/mockData';

let notifsState = [...MOCK_NOTIFICATIONS];

export const notificationService = {
  async getNotifications() {
    if (!USE_MOCK) {
      const res = await apiClient.get('/notifications');
      if (res) return res;
    }
    await apiClient.simulateDelay(100);
    return notifsState;
  },

  async markAsRead(id) {
    if (!USE_MOCK) {
      const res = await apiClient.post(`/notifications/${id}/read`);
      if (res) return res;
    }
    notifsState = notifsState.map(n => n.id === id ? { ...n, unread: false } : n);
    return notifsState;
  },

  async markAllAsRead() {
    if (!USE_MOCK) {
      const res = await apiClient.post('/notifications/read-all');
      if (res) return res;
    }
    notifsState = notifsState.map(n => ({ ...n, unread: false }));
    return notifsState;
  }
};
