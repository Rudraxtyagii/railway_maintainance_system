import { apiClient, USE_MOCK } from './apiClient';
import { MOCK_TASKS } from '../data/mockData';

// Maintain in-memory state for mock CRUD operations
let tasksState = [...MOCK_TASKS];

const normalizeTask = (t) => {
  if (!t) return t;
  const dateVal = t.requestedDate || t.preferredDate || t.requested_date || t.preferred_date || new Date().toISOString().slice(0, 10);
  const windowVal = t.preferredWindow || t.preferred_window || '01:30 - 04:30';
  const durationVal = Number(t.durationHours || t.duration_hours || 2.5);
  const defectVal = t.defectType || t.defect_type || 'Track Geometry / Ballast Deficiency';
  const priorityVal = Number(t.priorityScore || t.priority_score || 50);

  return {
    ...t,
    requestedDate: dateVal,
    preferredDate: dateVal,
    preferredWindow: windowVal,
    durationHours: durationVal,
    defectType: defectVal,
    priorityScore: priorityVal,
    status: t.status || 'Pending'
  };
};

const notifyDataChanged = (action, task) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('railblock:task_created', { detail: normalizeTask(task) }));
    window.dispatchEvent(new CustomEvent('railblock:data_changed', { detail: { action, task: normalizeTask(task) } }));
  }
};

export const taskService = {
  async getTasks(filters = {}) {
    let rawList = null;
    if (!USE_MOCK) {
      try {
        const res = await apiClient.get('/tasks', filters);
        if (res && Array.isArray(res)) rawList = res;
      } catch (err) {
        console.warn('Falling back to local tasks state:', err);
      }
    }

    await apiClient.simulateDelay(100);
    if (!rawList) {
      rawList = [...tasksState];
    }

    let filtered = rawList.map(normalizeTask);

    if (filters.department && filters.department !== 'ALL') {
      const d = filters.department.toLowerCase();
      filtered = filtered.filter(t => t.department && t.department.toLowerCase().includes(d));
    }
    if (filters.corridor && filters.corridor !== 'ALL') {
      filtered = filtered.filter(t => t.corridor === filters.corridor);
    }
    if (filters.severity && filters.severity !== 'ALL') {
      filtered = filtered.filter(t => t.severity && t.severity.toLowerCase() === filters.severity.toLowerCase());
    }
    if (filters.status && filters.status !== 'ALL') {
      filtered = filtered.filter(t => t.status && t.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.defectType && t.defectType.toLowerCase().includes(q))
      );
    }

    return filtered;
  },

  async getTaskById(id) {
    if (!USE_MOCK) {
      try {
        const res = await apiClient.get(`/tasks/${id}`);
        if (res) return normalizeTask(res);
      } catch (err) {
        // Fallback
      }
    }

    await apiClient.simulateDelay(80);
    const task = tasksState.find(t => t.id === id);
    if (!task) throw new Error(`Task with ID ${id} not found`);
    return normalizeTask(task);
  },

  async createTask(taskData) {
    let created = null;
    if (!USE_MOCK) {
      try {
        const res = await apiClient.post('/tasks', {
          department: taskData.department || 'Engineering',
          description: taskData.description || 'Maintenance Block Request',
          location: taskData.location || 'Section Km 15/0',
          corridor: taskData.corridor || 'NDLS-GZB',
          defectType: taskData.defectType || 'Track Geometry / Ballast Deficiency',
          severity: taskData.severity || 'High',
          durationHours: Number(taskData.durationHours || 2.5),
          preferredDate: taskData.preferredDate || taskData.requestedDate || new Date().toISOString().slice(0, 10),
          requestedDate: taskData.preferredDate || taskData.requestedDate || new Date().toISOString().slice(0, 10),
          preferredWindow: taskData.preferredWindow || '01:30 - 04:30',
          overdueDays: Number(taskData.overdueDays || 5),
          requiresTrafficBlock: Boolean(taskData.requiresTrafficBlock ?? true),
          requiresPowerBlock: Boolean(taskData.requiresPowerBlock ?? false),
          speedRestrictionKmph: Number(taskData.speedRestrictionKmph || 30),
          notes: taskData.notes || ''
        });
        if (res) created = res;
      } catch (err) {
        console.warn('Backend task creation failed, falling back to local creation:', err);
      }
    }

    if (!created) {
      await apiClient.simulateDelay(150);
      const idNum = Math.floor(100 + Math.random() * 900);
      const prefix = taskData.department?.includes('Traction') ? 'TRD' : taskData.department?.includes('Signal') ? 'SNT' : 'ENG';
      
      const severityMap = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      const weight = severityMap[taskData.severity] || 2;
      const overdue = Number(taskData.overdueDays || 5);
      const score = Math.min(100, Math.round(weight * 20 + overdue * 1.5));
      const dateVal = taskData.preferredDate || taskData.requestedDate || new Date().toISOString().slice(0, 10);

      created = {
        id: `TSK-${prefix}-${idNum}`,
        source: prefix === 'ENG' ? 'TMS' : prefix === 'TRD' ? 'TDMS' : 'SMMS',
        department: taskData.department || 'Engineering',
        defectType: taskData.defectType || 'Track Geometry / Ballast Deficiency',
        description: taskData.description || 'Maintenance Work Order',
        location: taskData.location || 'Section Km 14/0',
        corridor: taskData.corridor || 'NDLS-GZB',
        severity: taskData.severity || 'High',
        status: 'Pending',
        overdueDays: overdue,
        severityWeight: weight,
        priorityScore: score,
        requestedDate: dateVal,
        preferredDate: dateVal,
        preferredWindow: taskData.preferredWindow || '01:30 - 04:30',
        durationHours: Number(taskData.durationHours || 2.5),
        requiresPowerBlock: Boolean(taskData.requiresPowerBlock),
        requiresTrafficBlock: Boolean(taskData.requiresTrafficBlock ?? true),
        speedRestrictionKmph: Number(taskData.speedRestrictionKmph || 30),
        notes: taskData.notes || '',
        createdAt: new Date().toISOString(),
        ...taskData
      };
    }

    const finalNormalized = normalizeTask(created);
    tasksState = [finalNormalized, ...tasksState.filter(t => t.id !== finalNormalized.id)];
    notifyDataChanged('create', finalNormalized);
    return finalNormalized;
  },

  addDirectTask(task) {
    const normalized = normalizeTask(task);
    tasksState = [normalized, ...tasksState.filter(t => t.id !== normalized.id)];
    notifyDataChanged('create', normalized);
    return normalized;
  },

  async updateTask(id, taskData) {
    let updated = null;
    if (!USE_MOCK) {
      try {
        const res = await apiClient.put(`/tasks/${id}`, taskData);
        if (res) updated = res;
      } catch (err) {
        // fallback
      }
    }

    await apiClient.simulateDelay(120);
    tasksState = tasksState.map(t => t.id === id ? normalizeTask({ ...t, ...taskData }) : t);
    updated = updated ? normalizeTask(updated) : tasksState.find(t => t.id === id);
    notifyDataChanged('update', updated);
    return updated;
  },

  async deleteTask(id) {
    if (!USE_MOCK) {
      try {
        await apiClient.delete(`/tasks/${id}`);
      } catch (err) {
        // fallback
      }
    }

    await apiClient.simulateDelay(100);
    const deletedTask = tasksState.find(t => t.id === id);
    tasksState = tasksState.filter(t => t.id !== id);
    notifyDataChanged('delete', deletedTask);
    return true;
  },

  getRawState() {
    return tasksState.map(normalizeTask);
  }
};

export const blockRequestService = taskService;
