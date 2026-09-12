import { apiClient, USE_MOCK } from './apiClient';
import { MOCK_USERS } from '../data/mockData';

const AUTH_KEY = 'railblock_user';
const TOKEN_KEY = 'railblock_token';
const AUDIT_KEY = 'railblock_audit_logs';

export const authService = {
  async login(usernameOrEmail, password) {
    try {
      const res = await apiClient.post('/auth/login', { username: usernameOrEmail, password });
      if (res && res.token) {
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(AUTH_KEY, JSON.stringify(res.user));
        this.logAudit('USER_LOGIN', res.user, 'Database-authenticated session created.');
        return res.user;
      }
    } catch (err) {
      if (!USE_MOCK) {
        throw err;
      }
      console.warn('Backend login failed, checking local mock users:', err);
    }

    const matched = MOCK_USERS.find(u => u.username === usernameOrEmail || u.email === usernameOrEmail);
    const user = matched || MOCK_USERS[0];

    const token = `CRIS-AUTH-JWT-${user.id}-${Date.now()}`;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    this.logAudit('USER_LOGIN', user, 'Direct operational authentication (fallback)');
    return user;
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getCurrentUser() {
    const cached = localStorage.getItem(AUTH_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // invalid cache
      }
    }
    return null;
  },

  async fetchCurrentUser() {
    try {
      const res = await apiClient.get('/auth/me');
      if (res && res.id) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(res));
        return res;
      }
    } catch (err) {
      // ignore
    }
    return this.getCurrentUser();
  },

  async getRegisteredUsers() {
    try {
      const res = await apiClient.get('/auth/users');
      if (res && Array.isArray(res) && res.length > 0) {
        return res;
      }
    } catch (err) {
      // fallback
    }
    return MOCK_USERS;
  },

  async createUser(userData) {
    const res = await apiClient.post('/auth/users', userData);
    return res;
  },

  async updateUser(userId, userData) {
    const res = await apiClient.put(`/auth/users/${userId}`, userData);
    return res;
  },

  logout() {
    const user = this.getCurrentUser();
    if (user) {
      this.logAudit('USER_LOGOUT', user, 'User initiated session sign-out');
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_KEY);
    return true;
  },

  getMockUsers() {
    return MOCK_USERS;
  },

  logAudit(action, user, details) {
    try {
      const logs = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
      const newEntry = {
        id: `AUD-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        action,
        userId: user?.id || 'UNKNOWN',
        userName: user?.name || 'Anonymous',
        role: user?.role || 'UNKNOWN',
        department: user?.department || 'Operations',
        details
      };
      localStorage.setItem(AUDIT_KEY, JSON.stringify([newEntry, ...logs].slice(0, 50)));
    } catch (e) {
      console.warn('Audit logging failed:', e);
    }
  },

  getAuditLogs() {
    try {
      return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }
};
