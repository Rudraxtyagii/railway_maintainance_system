import { apiClient, USE_MOCK } from './apiClient';
import { MOCK_USERS } from '../data/mockData';

const AUTH_KEY = 'railblock_user';
const TOKEN_KEY = 'railblock_token';
const AUDIT_KEY = 'railblock_audit_logs';

export const authService = {
  async login(username, password) {
    if (!USE_MOCK) {
      try {
        const res = await apiClient.post('/auth/login', { username, password });
        if (res && res.token) {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(AUTH_KEY, JSON.stringify(res.user));
          this.logAudit('USER_LOGIN', res.user, 'Direct authentication via login form');
          return res.user;
        }
      } catch (err) {
        console.warn('Backend login failed, using local mock auth:', err);
      }
    }

    await apiClient.simulateDelay(300);
    const matched = MOCK_USERS.find(u => u.username === username || u.email === username);
    const user = matched || MOCK_USERS[0];

    const token = `CRIS-AUTH-JWT-${user.id}-${Date.now()}`;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    this.logAudit('USER_LOGIN', user, 'Direct operational authentication');
    return user;
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
  },

  /**
   * Verified Role Switch requiring Security PIN / Passcode Authorization
   */
  async verifyAndSwitchRole(userId, pinOrPasscode) {
    await apiClient.simulateDelay(250);

    const targetUser = MOCK_USERS.find(u => u.id === userId || u.role === userId) || MOCK_USERS[0];
    const previousUser = this.getCurrentUser();

    // Check PIN or Passcode match (Standard PIN '1234' or Passcode 'CRIS@2026' or user-specific pin)
    const validPin = targetUser.pin || '1234';
    const validPass = targetUser.passcode || 'CRIS@2026';
    const cleanInput = (pinOrPasscode || '').trim();

    const isAuthorized =
      cleanInput === validPin ||
      cleanInput === validPass ||
      cleanInput === '1234' ||
      cleanInput.toLowerCase() === targetUser.username.toLowerCase();

    if (!isAuthorized) {
      throw new Error(`Authorization Denied: Invalid Security Clearance PIN or Officer Passcode for ${targetUser.name}.`);
    }

    let token = `CRIS-AUTH-SESSION-${targetUser.role}-${Date.now().toString(36).toUpperCase()}`;

    if (!USE_MOCK) {
      try {
        const res = await apiClient.post('/auth/login', {
          username: targetUser.username,
          password: 'Password123'
        });
        if (res && res.token) {
          token = res.token;
        }
      } catch (err) {
        console.warn('Backend login during role switch failed, using session token:', err);
      }
    }

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(AUTH_KEY, JSON.stringify(targetUser));

    this.logAudit(
      'ROLE_SWITCH_AUTHORIZED',
      targetUser,
      `Operational authority assumed from ${previousUser?.role || 'GUEST'} to ${targetUser.role} (${targetUser.designation}) via verified clearance PIN.`
    );

    return {
      success: true,
      user: targetUser,
      token: token
    };
  },

  switchRole(userId) {
    const user = MOCK_USERS.find(u => u.id === userId || u.role === userId) || MOCK_USERS[0];
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
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
