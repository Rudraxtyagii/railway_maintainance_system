import { apiClient, USE_MOCK } from './apiClient';
import { taskService } from './taskService';

export const priorityService = {
  async getPriorityScores() {
    if (!USE_MOCK) {
      const res = await apiClient.get('/priority/ranking');
      if (res) return res;
    }

    const tasks = await taskService.getTasks();
    // Sort descending by priority score
    const sorted = [...tasks].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

    // Assign dynamic rank #1, #2, #3...
    return sorted.map((task, idx) => ({
      ...task,
      rank: idx + 1,
      formulaExplanation: `Overdue (${task.overdueDays}d) × Severity Weight (${task.severityWeight}) + Base Urgency Factor = ${task.priorityScore}`
    }));
  },

  calculateScore(overdueDays, severityWeight) {
    const overdue = Math.max(1, Number(overdueDays) || 1);
    const weight = Math.max(1, Number(severityWeight) || 1);
    // Normalized out of 100 for clear visualization
    return Math.min(100, Math.round((weight * 20) + (overdue * 1.5)));
  }
};
