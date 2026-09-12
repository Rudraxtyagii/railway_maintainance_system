import { apiClient } from './apiClient';

export const ingestService = {
  async ingestStreamBatch(records, sourceSystem = 'COA', streamId = null) {
    return await apiClient.post('/ingest/stream', {
      source_system: sourceSystem,
      stream_id: streamId,
      records: records
    });
  },

  async ingestKnowledge(chunk) {
    return await apiClient.post('/ingest/knowledge', {
      manualName: chunk.manualName,
      chapter: chunk.chapter,
      ruleNumber: chunk.ruleNumber,
      title: chunk.title,
      content: chunk.content,
      tags: chunk.tags || []
    });
  },

  async getStreamLogs(limit = 50) {
    return await apiClient.get('/ingest/logs', { limit });
  }
};
