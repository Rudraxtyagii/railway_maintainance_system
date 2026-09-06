import { apiClient, USE_MOCK } from './apiClient';
import { MOCK_DATA_SYNC_SOURCES, MOCK_SYNC_HISTORY } from '../data/mockData';

let syncSourcesState = [...MOCK_DATA_SYNC_SOURCES];
let syncHistoryState = [...MOCK_SYNC_HISTORY];

export const syncService = {
  async getSyncStatus() {
    if (!USE_MOCK) {
      const res = await apiClient.get('/sync/status');
      if (res) return res;
    }
    await apiClient.simulateDelay(200);
    return syncSourcesState;
  },

  async getSyncHistory() {
    if (!USE_MOCK) {
      const res = await apiClient.get('/sync/history');
      if (res) return res;
    }
    await apiClient.simulateDelay(200);
    return syncHistoryState;
  },

  async startDataSync(sourceId) {
    if (!USE_MOCK) {
      const res = await apiClient.post('/sync/trigger', { source: sourceId });
      if (res) return res;
    }

    // Simulate multi-stage live sync
    await apiClient.simulateDelay(600);
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const syncId = `SYNC-${Math.floor(8100 + Math.random() * 900)}`;

    const newRecordsCount = Math.floor(15 + Math.random() * 45);
    const newHistoryItem = {
      id: syncId,
      source: sourceId || 'ALL SOURCES',
      started: timeStr,
      completed: timeStr,
      records: newRecordsCount,
      success: newRecordsCount,
      failed: 0,
      status: 'Success'
    };

    syncHistoryState = [newHistoryItem, ...syncHistoryState];
    syncSourcesState = syncSourcesState.map(s => {
      if (!sourceId || s.id === sourceId) {
        return {
          ...s,
          lastSyncTime: now.toISOString(),
          recordsReceived: s.recordsReceived + newRecordsCount,
          recordsSuccess: s.recordsSuccess + newRecordsCount
        };
      }
      return s;
    });

    return {
      success: true,
      historyItem: newHistoryItem,
      updatedSources: syncSourcesState
    };
  }
};
