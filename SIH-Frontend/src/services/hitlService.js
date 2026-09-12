import { apiClient } from './apiClient';

export const hitlService = {
  async getPendingReviews() {
    return await apiClient.get('/hitl/pending');
  },

  async submitReview({ taskId, bundleId, scheduleId, action, modifiedStartTime, modifiedEndTime, modifiedSpeedRestriction, remarks }) {
    return await apiClient.post('/hitl/review', {
      taskId,
      bundleId,
      scheduleId,
      action,
      modifiedStartTime,
      modifiedEndTime,
      modifiedSpeedRestriction,
      remarks: remarks || 'Controller decision entered in compliance with G&SR.'
    });
  },

  async emergencyOverride({ taskId, reason, emergencyJustification, authorizationPasscode }) {
    return await apiClient.post('/hitl/override', {
      taskId,
      reason,
      emergencyJustification,
      authorizationPasscode: authorizationPasscode || 'CRIS@2026'
    });
  },

  async getAuditTrail(limit = 50) {
    return await apiClient.get('/hitl/audit-trail', { limit });
  }
};
