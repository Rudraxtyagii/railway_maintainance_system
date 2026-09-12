import { apiClient, USE_MOCK } from './apiClient';
import { MOCK_TASKS } from '../data/mockData';

let tasksState = [...MOCK_TASKS];

const normalizeTask = (t) => {
  if (!t) return t;
  const dateVal = t.requestedDate || t.preferredDate || t.nominatedDate || t.requested_date || t.preferred_date || new Date().toISOString().slice(0, 10);
  const windowVal = t.preferredWindow || t.preferred_window || `${t.plannedStartTime || '01:30'} - ${t.plannedEndTime || '04:30'}`;
  const durationVal = Number(t.durationHours || t.duration_hours || 2.5);
  const defectVal = t.defectType || t.defect_type || 'Track Geometry / Ballast Deficiency';
  const priorityVal = Number(t.priorityScore || t.priority_score || 50);

  return {
    ...t,
    divisionId: t.divisionId || t.division_id || 'DLI',
    sectionName: t.sectionName || t.section_name || t.corridor || 'NDLS-GZB',
    lineType: t.lineType || t.line_type || 'UP Main',
    stationFrom: t.stationFrom || t.station_from || 'NDLS',
    stationTo: t.stationTo || t.station_to || 'GZB',
    requestedDate: dateVal,
    preferredDate: dateVal,
    nominatedDate: t.nominatedDate || t.nominated_date || dateVal,
    preferredWindow: windowVal,
    durationHours: durationVal,
    demandedTime: t.demandedTime || t.demanded_time || `${durationVal} hrs`,
    grantedTime: t.grantedTime || t.granted_time || (t.status === 'Scheduled' ? `${durationVal} hrs` : null),
    burstDurationMins: Number(t.burstDurationMins || t.burst_duration_mins || 0),
    defectType: defectVal,
    blockPurpose: t.blockPurpose || t.block_purpose || defectVal,
    priorityScore: priorityVal,
    status: t.status || 'Pending',
    hitlStatus: t.hitlStatus || t.hitl_status || (t.status === 'Scheduled' ? 'CONTROLLER_APPROVED' : 'PENDING_REVIEW'),
    controllerRemarks: t.controllerRemarks || t.controller_remarks,
    controllerId: t.controllerId || t.controller_id,
    trafficImpactStatus: t.trafficImpactStatus || t.traffic_impact_status || 'Zero Delay / Regulated'
  };
};

export const taskService = {
  async getTasks(filters = {}) {
    let rawList = null;
    try {
      const res = await apiClient.get('/tasks', filters);
      if (res && Array.isArray(res)) rawList = res;
    } catch (err) {
      if (USE_MOCK) {
        console.warn('Backend unavailable, using local mock tasks:', err);
      } else {
        throw err;
      }
    }

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
        (t.defectType && t.defectType.toLowerCase().includes(q)) ||
        (t.sectionName && t.sectionName.toLowerCase().includes(q))
      );
    }

    return filtered;
  },

  async getTaskById(id) {
    try {
      const res = await apiClient.get(`/tasks/${id}`);
      if (res) return normalizeTask(res);
    } catch (err) {
      if (!USE_MOCK) throw err;
    }

    const task = tasksState.find(t => t.id === id);
    if (!task) throw new Error(`Task with ID ${id} not found`);
    return normalizeTask(task);
  },

  async createTask(taskData) {
    let created = null;
    try {
      const payload = {
        department: taskData.department || 'Engineering',
        description: taskData.description || 'Maintenance Block Request',
        location: taskData.location || 'Section Km 15/0',
        corridor: taskData.corridor || 'NDLS-GZB',
        divisionId: taskData.divisionId || 'DLI',
        sectionName: taskData.sectionName || taskData.corridor || 'NDLS-GZB',
        lineType: taskData.lineType || 'UP Main',
        stationFrom: taskData.stationFrom || 'NDLS',
        stationTo: taskData.stationTo || 'GZB',
        defectType: taskData.defectType || 'Track Geometry / Ballast Deficiency',
        blockPurpose: taskData.blockPurpose || taskData.defectType || 'Track & Overhead Maintenance',
        severity: taskData.severity || 'High',
        durationHours: Number(taskData.durationHours || 2.5),
        preferredDate: taskData.preferredDate || taskData.requestedDate || new Date().toISOString().slice(0, 10),
        requestedDate: taskData.preferredDate || taskData.requestedDate || new Date().toISOString().slice(0, 10),
        nominatedDate: taskData.nominatedDate || taskData.requestedDate || new Date().toISOString().slice(0, 10),
        plannedStartTime: taskData.plannedStartTime || '01:30',
        plannedEndTime: taskData.plannedEndTime || '04:30',
        preferredWindow: taskData.preferredWindow || '01:30 - 04:30',
        overdueDays: Number(taskData.overdueDays || 0),
        requiresTrafficBlock: Boolean(taskData.requiresTrafficBlock ?? true),
        requiresPowerBlock: Boolean(taskData.requiresPowerBlock ?? false),
        speedRestrictionKmph: Number(taskData.speedRestrictionKmph || 30),
        trafficImpactStatus: taskData.trafficImpactStatus || 'Zero Delay / Regulated',
        notes: taskData.notes || ''
      };

      const res = await apiClient.post('/tasks', payload);
      if (res) created = res;
    } catch (err) {
      if (!USE_MOCK) throw err;
    }

    if (!created) {
      const idNum = Math.floor(100 + Math.random() * 900);
      created = {
        id: `TSK-MOCK-${idNum}`,
        ...taskData,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };
      tasksState.unshift(created);
    }

    return normalizeTask(created);
  },

  async updateTask(id, taskData) {
    let updated = null;
    try {
      const res = await apiClient.put(`/tasks/${id}`, taskData);
      if (res) updated = res;
    } catch (err) {
      if (!USE_MOCK) throw err;
    }

    if (!updated) {
      const idx = tasksState.findIndex(t => t.id === id);
      if (idx !== -1) {
        tasksState[idx] = { ...tasksState[idx], ...taskData };
        updated = tasksState[idx];
      }
    }

    return normalizeTask(updated);
  },

  async deleteTask(id) {
    try {
      await apiClient.delete(`/tasks/${id}`);
    } catch (err) {
      if (!USE_MOCK) throw err;
    }
    tasksState = tasksState.filter(t => t.id !== id);
    return true;
  }
};
