import React, { useState, useEffect } from 'react';
import { Plus, Filter, Eye, Edit3, Trash2, CheckCircle, Search, RefreshCw, Train } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { DepartmentBadge } from '../components/common/DepartmentBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { taskService } from '../services/taskService';
import { corridorService } from '../services/corridorService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { CORRIDORS, DEPARTMENTS } from '../data/mockData';

export const BlockRequests = () => {
  const { isPlannerAdmin, userDepartment } = useAuth();
  const { addToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [corridors, setCorridors] = useState([]);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [corridorFilter, setCorridorFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Form State
  const initialForm = {
    department: DEPARTMENTS.ENGINEERING,
    defectType: 'Track Geometry / Ballast Deficiency',
    description: '',
    location: '',
    corridor: 'NDLS-GZB',
    severity: 'High',
    durationHours: 2.5,
    preferredDate: '2026-09-12',
    preferredWindow: '01:30 - 04:00',
    overdueDays: 7,
    requiresTrafficBlock: true,
    requiresPowerBlock: false,
    speedRestrictionKmph: 30,
    notes: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedTasks, fetchedCorridors] = await Promise.all([
        taskService.getTasks({
          department: departmentFilter,
          corridor: corridorFilter,
          severity: severityFilter,
          status: statusFilter
        }),
        corridorService.getCorridors()
      ]);
      setTasks(fetchedTasks);
      setCorridors(fetchedCorridors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleDataChanged = () => {
      loadData();
    };

    window.addEventListener('railblock:task_created', handleDataChanged);
    window.addEventListener('railblock:data_changed', handleDataChanged);

    return () => {
      window.removeEventListener('railblock:task_created', handleDataChanged);
      window.removeEventListener('railblock:data_changed', handleDataChanged);
    };
  }, [departmentFilter, corridorFilter, severityFilter, statusFilter]);

  const [highlightTaskId, setHighlightTaskId] = useState(null);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.location) {
      addToast({ title: 'Validation Error', message: 'Description and Location are mandatory fields.', type: 'warning' });
      return;
    }

    try {
      const created = await taskService.createTask(formData);
      addToast({
        title: 'Block Request Submitted & Live in Register',
        message: `Registered as ${created.id} with Priority Score ${created.priorityScore}.`,
        type: 'success'
      });
      setIsCreateOpen(false);
      setFormData(initialForm);

      // Auto-reset filters so new task is 100% visible
      setDepartmentFilter('ALL');
      setCorridorFilter('ALL');
      setSeverityFilter('ALL');
      setStatusFilter('ALL');

      setHighlightTaskId(created.id);
      setTasks(prev => [created, ...prev.filter(t => t.id !== created.id)]);

      setTimeout(() => {
        loadData();
      }, 400);
    } catch (err) {
      addToast({ title: 'Submission Failed', message: err.message, type: 'error' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await taskService.updateTask(taskToEdit.id, taskToEdit);
      addToast({
        title: 'Request Updated',
        message: `Changes to ${taskToEdit.id} have been saved.`,
        type: 'success'
      });
      setIsEditOpen(false);
      setTaskToEdit(null);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      loadData();
    } catch (err) {
      addToast({ title: 'Update Failed', message: err.message, type: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    try {
      await taskService.deleteTask(taskToDelete.id);
      addToast({
        title: 'Request Removed',
        message: `Block request ${taskToDelete.id} was deleted.`,
        type: 'info'
      });
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
      setTaskToDelete(null);
      loadData();
    } catch (err) {
      addToast({ title: 'Delete Failed', message: err.message, type: 'error' });
    }
  };

  const columns = [
    {
      header: 'Request ID',
      key: 'id',
      sortable: true,
      className: 'w-36 font-mono font-bold text-rail-900',
      render: (val) => (
        <div className="flex items-center gap-1.5">
          <span>{val}</span>
          {highlightTaskId === val && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-600 text-white animate-pulse shadow-sm">
              NEW
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Department',
      key: 'department',
      sortable: true,
      render: (val) => <DepartmentBadge department={val || 'Engineering'} showIcon={false} />
    },
    {
      header: 'Corridor',
      key: 'corridor',
      sortable: true,
      render: (val) => <span className="font-semibold text-slate-800">{val || 'NDLS-GZB'}</span>
    },
    {
      header: 'Defect / Location',
      key: 'defectType',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-800 line-clamp-1">{row.defectType || 'Track Maintenance'}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{row.location || 'Section Track Km'}</div>
        </div>
      )
    },
    {
      header: 'Severity',
      key: 'severity',
      sortable: true,
      render: (val, row) => <PriorityBadge severity={val || 'High'} score={row.priorityScore || 70} />
    },
    {
      header: 'Requested Window',
      key: 'preferredWindow',
      render: (_, row) => (
        <div>
          <div className="font-medium text-slate-700">{row.requestedDate || row.preferredDate || '2026-09-08'}</div>
          <div className="text-[11px] text-slate-500">{row.preferredWindow || '01:30 - 04:30'} ({row.durationHours || 2.5}h)</div>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (val) => <StatusBadge status={val} />
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'w-24 text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedTask(row)}
            className="p-1 text-slate-500 hover:text-rail-800 hover:bg-slate-100 rounded"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setTaskToEdit({ ...row });
              setIsEditOpen(true);
            }}
            className="p-1 text-slate-500 hover:text-amber-700 hover:bg-slate-100 rounded"
            title="Edit Request"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          {isPlannerAdmin && (
            <button
              onClick={() => setTaskToDelete(row)}
              className="p-1 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded"
              title="Delete Request"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Block Requests Register"
        subtitle="Multi-departmental maintenance request backlog from Engineering (TMS), Traction (TDMS), and Signal & Telecom (SMMS)."
        badge="TMS • SMMS • TDMS Feeds"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-sm"
              title="Refresh register"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rail-900 hover:bg-rail-800 text-white rounded-md text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Block Request</span>
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Department
          </label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700 focus:outline-none"
          >
            <option value="ALL">All Departments (3)</option>
            <option value="Engineering">Engineering (TMS)</option>
            <option value="Traction Distribution">Traction Distribution (TDMS)</option>
            <option value="Signal & Telecom">Signal & Telecom (SMMS)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Corridor
          </label>
          <select
            value={corridorFilter}
            onChange={(e) => setCorridorFilter(e.target.value)}
            className="w-full text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700 focus:outline-none"
          >
            <option value="ALL">All HDN Corridors</option>
            {CORRIDORS.map((c) => (
              <option key={c.id} value={c.id}>{c.id} ({c.name.split('(')[0]})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Severity
          </label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical (P1)</option>
            <option value="High">High (P2)</option>
            <option value="Medium">Medium (P3)</option>
            <option value="Low">Low (P4)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={tasks}
        loading={loading}
        pageSize={8}
        searchKeys={['id', 'description', 'location', 'defectType', 'corridor']}
        searchPlaceholder="Search by ID, defect, Km location, or corridor..."
        onRowClick={(row) => setSelectedTask(row)}
      />

      {/* View Detail Modal */}
      {selectedTask && (
        <Modal
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          title={`Block Request Detail: ${selectedTask.id}`}
          subtitle={`Corridor: ${selectedTask.corridor} • Status: ${selectedTask.status}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500">
                Formula Score: <strong className="font-mono text-slate-900">{selectedTask.priorityScore}</strong> ({selectedTask.overdueDays}d overdue × wt {selectedTask.severityWeight})
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-1.5 bg-rail-900 text-white rounded text-xs font-semibold"
              >
                Close View
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Department</div>
                <div className="mt-1"><DepartmentBadge department={selectedTask.department} /></div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Severity</div>
                <div className="mt-1"><PriorityBadge severity={selectedTask.severity} /></div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Requested Date</div>
                <div className="font-semibold text-slate-800 mt-1">{selectedTask.requestedDate}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Duration Required</div>
                <div className="font-semibold text-slate-800 mt-1">{selectedTask.durationHours} Hours</div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Defect Specification</div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 font-medium text-slate-900">
                {selectedTask.defectType}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Detailed Technical Description</div>
              <div className="p-3 bg-slate-100 rounded text-slate-800 leading-relaxed">
                {selectedTask.description}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 rounded border border-slate-200">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Traffic Block</div>
                <div className="font-bold text-slate-800 mt-0.5">{selectedTask.requiresTrafficBlock ? 'Required (Tracks Closed)' : 'Not Required'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">25kV Power Block</div>
                <div className="font-bold text-slate-800 mt-0.5">{selectedTask.requiresPowerBlock ? 'Required (OHE Isolated)' : 'Not Required'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Speed Restriction</div>
                <div className="font-bold text-slate-800 mt-0.5">{selectedTask.speedRestrictionKmph ? `${selectedTask.speedRestrictionKmph} km/h Caution` : 'Normal Speed'}</div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Request Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create New Railway Maintenance Block Request"
          subtitle="Direct departmental submission to unified block planning engine"
          maxWidth="max-w-2xl"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSubmit}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rail-900 hover:bg-rail-800 rounded-md shadow-sm"
              >
                Submit Request
              </button>
            </>
          }
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700 focus:outline-none"
                >
                  <option value={DEPARTMENTS.ENGINEERING}>Engineering (TMS)</option>
                  <option value={DEPARTMENTS.TRACTION}>Traction Distribution (TDMS)</option>
                  <option value={DEPARTMENTS.SIGNAL}>Signal & Telecom (SMMS)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Corridor *
                </label>
                <select
                  value={formData.corridor}
                  onChange={(e) => setFormData({ ...formData, corridor: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700 focus:outline-none"
                >
                  {CORRIDORS.map(c => (
                    <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Defect Type / Maintenance Category *
                </label>
                <input
                  type="text"
                  required
                  value={formData.defectType}
                  onChange={(e) => setFormData({ ...formData, defectType: e.target.value })}
                  placeholder="e.g. Turnout Switch Renewal / Cantilever Repair"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Location (Km / Yard / Cabin) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Km 18/4 - 19/2, Sahibabad UP Line"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Detailed Scope of Work & Machine Requirements *
              </label>
              <textarea
                rows={2}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe track tampers, OHE tower wagons, disconnections required, or specific safety prerequisites..."
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700 focus:outline-none"
                >
                  <option value="Critical">Critical (P1)</option>
                  <option value="High">High (P2)</option>
                  <option value="Medium">Medium (P3)</option>
                  <option value="Low">Low (P4)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Duration (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="6"
                  value={formData.durationHours}
                  onChange={(e) => setFormData({ ...formData, durationHours: parseFloat(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Overdue Days
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.overdueDays}
                  onChange={(e) => setFormData({ ...formData, overdueDays: parseInt(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Preferred Time Window
                </label>
                <input
                  type="text"
                  value={formData.preferredWindow}
                  onChange={(e) => setFormData({ ...formData, preferredWindow: e.target.value })}
                  placeholder="e.g. 01:30 - 04:30"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-md border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.requiresTrafficBlock}
                  onChange={(e) => setFormData({ ...formData, requiresTrafficBlock: e.target.checked })}
                  className="rounded border-slate-300 text-rail-800 focus:ring-rail-700"
                />
                <span>Traffic Block</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.requiresPowerBlock}
                  onChange={(e) => setFormData({ ...formData, requiresPowerBlock: e.target.checked })}
                  className="rounded border-slate-300 text-rail-800 focus:ring-rail-700"
                />
                <span>25kV Power Block</span>
              </label>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Request Modal */}
      {isEditOpen && taskToEdit && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Edit Request: ${taskToEdit.id}`}
          subtitle="Modify operational parameters before automated scheduling"
          maxWidth="max-w-xl"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rail-900 hover:bg-rail-800 rounded-md shadow-sm"
              >
                Save Changes
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={taskToEdit.status}
                onChange={(e) => setTaskToEdit({ ...taskToEdit, status: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
              >
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Severity</label>
              <select
                value={taskToEdit.severity}
                onChange={(e) => setTaskToEdit({ ...taskToEdit, severity: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={taskToEdit.location}
                onChange={(e) => setTaskToEdit({ ...taskToEdit, location: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={taskToEdit.description}
                onChange={(e) => setTaskToEdit({ ...taskToEdit, description: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Block Request"
        message={`Are you sure you want to delete maintenance request ${taskToDelete?.id}? This action will permanently remove it from the optimization pool.`}
        confirmText="Delete Request"
        danger
      />
    </div>
  );
};
