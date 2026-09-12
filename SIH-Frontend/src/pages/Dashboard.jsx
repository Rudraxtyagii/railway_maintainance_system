import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  AlertCircle,
  CalendarDays,
  AlertOctagon,
  Layers,
  Sparkles,
  Hourglass,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  CalendarCheck,
  Zap,
  TrendingDown,
  Activity,
  Bot
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { DepartmentBadge } from '../components/common/DepartmentBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { analyticsService } from '../services/analyticsService';
import { taskService } from '../services/taskService';
import { scheduleService } from '../services/scheduleService';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminService } from '../services/adminService';
import { Trash2, Shield, Plus } from 'lucide-react';

// --- Color lookup maps (presentation concern lives in the frontend,
//     not the API response) ---
const DEPARTMENT_COLORS = {
  'Engineering': '#0d223a',
  'Traction': '#c2410c',
  'Signal & Tel.': '#047857',
  '_default': '#64748b'
};

const PRIORITY_COLORS = {
  'Critical': '#dc2626',
  'High': '#f97316',
  'Medium': '#eab308',
  'Low': '#22c55e',
  '_default': '#94a3b8'
};

const getDepartmentColor = (name) => DEPARTMENT_COLORS[name] ?? DEPARTMENT_COLORS._default;
const getPriorityColor = (name) => PRIORITY_COLORS[name] ?? PRIORITY_COLORS._default;

const EMPTY_STATS = {
  totalBlockRequests: 0,
  pendingRequests: 0,
  highPriorityTasks: 0,
  availableBlockWindows: 0,
  activeConflicts: 0,
  bundleCandidates: 0,
  optimizedBlocks: 0,
  downtimeSavedHours: 0,
  requestsByDepartment: [],
  priorityDistribution: [],
  corridorUtilization: [],
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { isPlannerAdmin, user, userDepartment } = useAuth();
  const { addToast } = useToast();

  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [upcomingBlocks, setUpcomingBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realtimeAlert, setRealtimeAlert] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // Admin DB Reset State in Dashboard
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleExecuteReset = async () => {
    setResetting(true);
    try {
      const res = await adminService.resetDatabase();
      addToast({
        title: 'Database Reset to Clean State',
        message: res.message || 'All dynamic queues wiped from PostgreSQL. 0 tasks active.',
        type: 'success'
      });
      setIsResetConfirmOpen(false);
      window.dispatchEvent(new CustomEvent('railblock:data_changed', { detail: { action: 'DATABASE_RESET' } }));
    } catch (err) {
      addToast({
        title: 'Reset Error',
        message: err.message || 'Failed to reset database.',
        type: 'error'
      });
    } finally {
      setResetting(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [dashStats, tasks, schedules] = await Promise.all([
        analyticsService.getDashboardStats(),
        taskService.getTasks(),
        scheduleService.getSchedules()
      ]);

      const tasksList = tasks || [];
      const schedList = schedules || [];

      setStats({
        totalBlockRequests: dashStats?.totalBlockRequests ?? tasksList.length,
        pendingRequests: dashStats?.pendingRequests ?? tasksList.filter(t => t.status === 'Pending').length,
        highPriorityTasks: dashStats?.highPriorityTasks ?? tasksList.filter(t => (t.priorityScore || 0) >= 80 || t.severity === 'Critical' || t.severity === 'High').length,
        availableBlockWindows: dashStats?.availableBlockWindows ?? 0,
        activeConflicts: dashStats?.activeConflicts ?? 0,
        bundleCandidates: dashStats?.bundleCandidates ?? 0,
        optimizedBlocks: dashStats?.optimizedBlocks ?? schedList.length,
        downtimeSavedHours: dashStats?.downtimeSavedHours ?? 0,
        requestsByDepartment: dashStats?.requestsByDepartment ?? [],
        priorityDistribution: dashStats?.priorityDistribution ?? [],
        corridorUtilization: dashStats?.corridorUtilization ?? [],
      });
      setRecentTasks(tasksList.slice(0, 8));
      setUpcomingBlocks(schedList.slice(0, 4));
    } catch (err) {
      console.error('Dashboard data fetch failed:', err);
      setStats(EMPTY_STATS);
      setRecentTasks([]);
      setUpcomingBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadDashboardData();

    const handleTaskCreated = (e) => {
      const newTask = e.detail;
      if (newTask) {
        setRealtimeAlert({
          task: newTask,
          timestamp: new Date().toLocaleTimeString('en-IN')
        });

        // Instantly prepend to recent tasks and increment stats
        setRecentTasks(prev => [newTask, ...prev.filter(t => t.id !== newTask.id)].slice(0, 8));
        setStats(prev => {
          if (!prev) return prev;
          const isPending = (newTask.status || 'Pending').toLowerCase() === 'pending';
          const isHigh = (newTask.priorityScore || 0) >= 80 || newTask.severity === 'Critical' || newTask.severity === 'High';
          return {
            ...prev,
            totalBlockRequests: prev.totalBlockRequests + 1,
            pendingRequests: isPending ? prev.pendingRequests + 1 : prev.pendingRequests,
            highPriorityTasks: isHigh ? prev.highPriorityTasks + 1 : prev.highPriorityTasks
          };
        });

        // Trigger full sync in background
        setTimeout(() => {
          loadDashboardData();
        }, 300);
      }
    };

    const handleDataChanged = () => {
      loadDashboardData();
    };

    window.addEventListener('railblock:task_created', handleTaskCreated);
    window.addEventListener('railblock:task_updated', handleDataChanged);
    window.addEventListener('railblock:hitl_decision', handleDataChanged);
    window.addEventListener('railblock:database_reset', handleDataChanged);
    window.addEventListener('railblock:data_changed', handleDataChanged);
    window.addEventListener('railblock:metrics_updated', handleDataChanged);
    window.addEventListener('railblock:schedule_approved', handleDataChanged);

    return () => {
      window.removeEventListener('railblock:task_created', handleTaskCreated);
      window.removeEventListener('railblock:task_updated', handleDataChanged);
      window.removeEventListener('railblock:hitl_decision', handleDataChanged);
      window.removeEventListener('railblock:database_reset', handleDataChanged);
      window.removeEventListener('railblock:data_changed', handleDataChanged);
      window.removeEventListener('railblock:metrics_updated', handleDataChanged);
      window.removeEventListener('railblock:schedule_approved', handleDataChanged);
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="Railway Block Planning Control Center" subtitle="Loading operational intelligence..." />
        <LoadingSkeleton count={8} />
      </div>
    );
  }

  const handleQuickIngestSample = async () => {
    try {
      const depts = [
        { d: 'Engineering', desc: 'Ultrasonic flaw detected at rail weld Km 28/4', loc: 'Km 28/4, Sahibabad Outer', dt: 'Rail Fracture Flaw', sev: 'Critical', corr: 'NDLS-GZB' },
        { d: 'Traction Distribution', desc: 'OHE contact wire droppers snapped at Mast 32/14', loc: 'Km 32/14, Ghaziabad Yard', dt: 'OHE Dropper Snap', sev: 'High', corr: 'NDLS-GZB' },
        { d: 'Signal & Telecom', desc: 'Axle counter reset failure on DN Main Line', loc: 'Cabin A, Anand Vihar', dt: 'Axle Counter Failure', sev: 'Critical', corr: 'NDLS-GZB' }
      ];
      const pick = depts[Math.floor(Math.random() * depts.length)];
      await taskService.createTask({
        department: pick.d,
        description: pick.desc,
        location: pick.loc,
        defectType: pick.dt,
        severity: pick.sev,
        corridor: pick.corr,
        preferredDate: new Date().toISOString().slice(0, 10),
        preferredWindow: '01:30 - 04:30',
        durationHours: 2.5,
        overdueDays: Math.floor(3 + Math.random() * 8),
        requiresTrafficBlock: true,
        requiresPowerBlock: pick.d === 'Traction Distribution',
        speedRestrictionKmph: 30
      });
    } catch (err) {
      console.error('Quick ingest error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isPlannerAdmin ? "Railway Central Block Planning & Governance Center" : `${user?.department || 'Departmental'} Maintenance Hub`}
        subtitle={
          isPlannerAdmin
            ? "Operational command center for multi-departmental maintenance synchronization, corridor capacity scheduling, and automatic AI block optimization."
            : `Welcome, ${user?.name || 'Officer'} (${user?.designation || 'Engineer'}). Submit maintenance block requisitions, track sanction approvals, and verify safety protocols with RAIL-GPT.`
        }
        badge={isPlannerAdmin ? "Central Planning • Admin" : `${user?.department || 'Department'} Portal`}
        actions={
          isPlannerAdmin ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleQuickIngestSample}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all"
                title="Test real-time request generation with 1 click"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>+ Quick Ingest Feed</span>
              </button>
              <button
                onClick={() => navigate('/optimization')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-rail-800 hover:bg-rail-900 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Run Block Optimizer</span>
              </button>
              <button
                onClick={() => navigate('/block-requests')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
              >
                <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                <span>Manage Requests</span>
              </button>
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all"
                title="Wipe dynamic data and reset database to clean state"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Database</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/block-requests')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-rail-900 hover:bg-rail-800 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>Create Block Request</span>
              </button>
              <button
                onClick={() => navigate('/ai-copilot')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Bot className="w-3.5 h-3.5 text-amber-300" />
                <span>Ask RAIL-GPT (RAG)</span>
              </button>
              <button
                onClick={() => navigate('/notifications')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
              >
                <span>View Sanction Alerts</span>
              </button>
            </div>
          )
        }
      />

      {/* Admin DB Reset Confirmation Modal */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="⚠️ Reset Railway Operational Database?"
        message="This action will permanently purge all block requests, conflict analyses, and generated schedules from PostgreSQL. Are you sure you want to initialize the database to a clean state?"
        confirmLabel={resetting ? "Purging Queues..." : "Yes, Reset Database"}
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleExecuteReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Real-Time Request Reflection Flash Alert */}
      {realtimeAlert && (
        <div className="bg-gradient-to-r from-emerald-950/90 via-rail-900 to-emerald-950/90 border-2 border-emerald-500/60 rounded-xl p-4 text-white shadow-xl shadow-emerald-950/40 animate-pulse flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  REAL-TIME INGESTION REFLECTED
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  {realtimeAlert.timestamp}
                </span>
              </div>
              <p className="text-sm font-semibold text-white mt-1">
                New Block Request <span className="text-amber-300 font-mono font-bold">[{realtimeAlert.task?.id}]</span> ({realtimeAlert.task?.department}) ingested at <span className="text-slate-200">{realtimeAlert.task?.location}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="px-2 py-1 rounded bg-rail-800 text-xs font-mono font-bold text-amber-300 border border-rail-700">
              Priority: {realtimeAlert.task?.priorityScore}/100
            </span>
            <button
              onClick={() => navigate('/block-requests')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
            >
              View in Requests Queue →
            </button>
            <button
              onClick={() => setRealtimeAlert(null)}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Operational KPI Cards (All 8 for Admin, 4 Department Specific for Department Users) */}
      {isPlannerAdmin ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <KpiCard
            title="Total Requests"
            value={stats.totalBlockRequests}
            subtitle="All 3 depts"
            icon={ClipboardList}
            statusColor="blue"
            onClick={() => navigate('/block-requests')}
          />
          <KpiCard
            title="Pending Requests"
            value={stats.pendingRequests}
            subtitle="Awaiting plan"
            icon={Clock}
            statusColor="amber"
            onClick={() => navigate('/block-requests')}
          />
          <KpiCard
            title="High Priority"
            value={stats.highPriorityTasks}
            subtitle="Critical / High"
            icon={AlertCircle}
            statusColor="red"
            onClick={() => navigate('/priority')}
          />
          <KpiCard
            title="Available Windows"
            value={stats.availableBlockWindows}
            subtitle="Next 7 days"
            icon={CalendarDays}
            statusColor="green"
            onClick={() => navigate('/corridor-availability')}
          />
          <KpiCard
            title="Active Conflicts"
            value={stats.activeConflicts}
            subtitle="Spatial / Power"
            icon={AlertOctagon}
            statusColor="red"
            onClick={() => navigate('/conflicts')}
          />
          <KpiCard
            title="Bundle Candidates"
            value={stats.bundleCandidates}
            subtitle="Multi-disciplinary"
            icon={Layers}
            statusColor="indigo"
            onClick={() => navigate('/conflicts')}
          />
          <KpiCard
            title="Optimized Blocks"
            value={stats.optimizedBlocks}
            subtitle="Automated output"
            icon={Sparkles}
            statusColor="green"
            onClick={() => navigate('/schedule')}
          />
          <KpiCard
            title="Downtime Saved"
            value={`${stats.downtimeSavedHours}h`}
            subtitle="40% net gain"
            icon={Hourglass}
            statusColor="green"
            trend="40% vs manual"
            trendDirection="down"
            onClick={() => navigate('/downtime')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="My Department Requests"
            value={recentTasks.filter(t => t.department === userDepartment || (t.department && userDepartment && t.department.toLowerCase().includes(userDepartment.toLowerCase()))).length}
            subtitle="Total Registered Backlog"
            icon={ClipboardList}
            statusColor="blue"
            onClick={() => navigate('/block-requests')}
          />
          <KpiCard
            title="Pending HITL Review"
            value={recentTasks.filter(t => (t.status === 'Pending' || !t.hitlStatus) && (t.department === userDepartment || (t.department && userDepartment && t.department.toLowerCase().includes(userDepartment.toLowerCase())))).length}
            subtitle="Awaiting Sr. DOM Sanction"
            icon={Clock}
            statusColor="amber"
            onClick={() => navigate('/block-requests')}
          />
          <KpiCard
            title="Approved & Scheduled"
            value={recentTasks.filter(t => (t.status === 'Approved' || t.status === 'Scheduled' || t.hitlStatus === 'CONTROLLER_APPROVED') && (t.department === userDepartment || (t.department && userDepartment && t.department.toLowerCase().includes(userDepartment.toLowerCase())))).length}
            subtitle="Sanctioned Corridors"
            icon={CheckCircle2}
            statusColor="green"
            onClick={() => navigate('/notifications')}
          />
          <KpiCard
            title="Critical Defect Alerts"
            value={recentTasks.filter(t => t.severity === 'Critical' && (t.department === userDepartment || (t.department && userDepartment && t.department.toLowerCase().includes(userDepartment.toLowerCase())))).length}
            subtitle="Urgent Track/OHE/Signal"
            icon={AlertCircle}
            statusColor="red"
            onClick={() => navigate('/block-requests')}
          />
        </div>
      )}

      {/* AI & ML Innovation Command Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-rail-950 text-white rounded-xl border border-indigo-800/60 shadow-elevated p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-amber-300 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-white">RAIL-GPT & AI Digital Twin Hub</span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase">
                Active
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Conversational operational guidance (G&SR rules), "What-If" scenario digital twin, and voice memo NLP ingestion.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          <button
            onClick={() => navigate('/ai-copilot')}
            className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold font-mono transition-all shadow flex items-center justify-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5 text-amber-300" />
            <span>Open RAIL-GPT Copilot</span>
          </button>
          <button
            onClick={() => navigate('/optimization')}
            className="flex-1 md:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold font-mono transition-all border border-slate-700 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>ML Optimizer</span>
          </button>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Visual 1: Requests by Department */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Requests by Department
              </h3>
              <p className="text-[11px] text-slate-400">Engineering vs TRD vs S&T distribution</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {stats.totalBlockRequests} Total
            </span>
          </div>

          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.requestsByDepartment} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis dataKey="department" type="category" width={115} tick={{ fontSize: 10, fill: '#334155' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '11px', color: '#fff' }}
                  formatter={(value) => [`${value} Requests`, 'Count']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.requestsByDepartment.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getDepartmentColor(entry.department)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
            {stats.requestsByDepartment.map((entry) => (
              <div key={entry.department}>
                <div className="font-bold" style={{ color: getDepartmentColor(entry.department) }}>
                  {entry.count}
                </div>
                <div className="text-[10px] text-slate-400">{entry.department}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual 2: Priority Distribution */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Priority & Severity Split
              </h3>
              <p className="text-[11px] text-slate-400">Overdue days × severity weighting</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
              {stats.highPriorityTasks} Critical
            </span>
          </div>

          <div className="h-56 mt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.priorityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.priorityDistribution.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={getPriorityColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '11px', color: '#fff' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
            <span>Critical demands auto-bundle first</span>
            <span className="font-semibold text-slate-700">Priority Engine Active</span>
          </div>
        </div>

        {/* Visual 3: Corridor Utilization */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Corridor Block Utilization
              </h3>
              <p className="text-[11px] text-slate-400">High Density Network corridor efficiency</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
              {stats.corridorUtilization.length > 0
                ? `Avg ${(
                    stats.corridorUtilization.reduce((sum, c) => sum + (c.utilization ?? 0), 0) /
                    stats.corridorUtilization.length
                  ).toFixed(1)}%`
                : 'No data'}
            </span>
          </div>

          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.corridorUtilization} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="corridor" tick={{ fontSize: 10, fill: '#334155' }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '11px', color: '#fff' }}
                  formatter={(val) => [`${val}%`, 'Slot Utilization']}
                />
                <Bar dataKey="utilization" fill="#0d223a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
            <span>
              {stats.corridorUtilization.length > 0
                ? (() => {
                    const top = [...stats.corridorUtilization].sort(
                      (a, b) => (b.utilization ?? 0) - (a.utilization ?? 0)
                    )[0];
                    return `Highest: ${top.corridor} (${top.utilization}%)`;
                  })()
                : 'No corridor data'}
            </span>
            <span className="text-rail-700 font-semibold cursor-pointer hover:underline" onClick={() => navigate('/corridor-availability')}>
              View Timetable →
            </span>
          </div>
        </div>
      </div>

      {/* Lower Split: Recent Maintenance Requests & Upcoming Scheduled Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Recent Requests Table */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-rail-800" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Departmental Maintenance Demands
              </h3>
            </div>
            <button
              onClick={() => navigate('/block-requests')}
              className="text-xs text-rail-700 hover:text-rail-900 font-semibold flex items-center gap-1"
            >
              <span>View All {stats.totalBlockRequests} Requests</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="px-3.5 py-2.5">Request ID</th>
                  <th className="px-3 py-2.5">Department</th>
                  <th className="px-3 py-2.5">Defect / Task</th>
                  <th className="px-3 py-2.5">Location</th>
                  <th className="px-3 py-2.5">Severity</th>
                  <th className="px-3 py-2.5">Priority</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {recentTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3.5 py-6 text-center text-slate-400">
                      No recent requests to display.
                    </td>
                  </tr>
                ) : (
                  recentTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-3.5 py-2.5 font-mono font-bold text-rail-800">
                        {task.id}
                      </td>
                      <td className="px-3 py-2.5">
                        <DepartmentBadge department={task.department} showIcon={false} />
                      </td>
                      <td className="px-3 py-2.5 font-medium max-w-xs truncate text-slate-900" title={task.description}>
                        {task.defectType}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 max-w-[140px] truncate" title={task.location}>
                        {task.location}
                      </td>
                      <td className="px-3 py-2.5">
                        <PriorityBadge severity={task.severity} />
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold">
                        {task.priorityScore}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={task.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Upcoming Approved Maintenance Blocks */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Upcoming Blocks
              </h3>
            </div>
            <button
              onClick={() => navigate('/schedule')}
              className="text-[11px] text-rail-700 hover:underline font-semibold"
            >
              Full Calendar
            </button>
          </div>

          <div className="space-y-2.5 my-3">
            {upcomingBlocks.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-6">
                No upcoming blocks scheduled.
              </div>
            ) : (
              upcomingBlocks.map((blk) => (
                <div
                  key={blk.id}
                  onClick={() => navigate('/schedule')}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs text-rail-900">{blk.blockCode}</span>
                    <StatusBadge status={blk.status} />
                  </div>
                  <div className="text-xs font-semibold text-slate-800 line-clamp-1">{blk.corridorName}</div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                    <span>{blk.date} • {blk.startTime}-{blk.endTime} ({blk.durationHours}h)</span>
                    <span className="text-emerald-700 font-mono font-semibold">+{blk.efficiencyGainPercent}% opt</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick story summary box for SIH Judges */}
          <div className="p-3 rounded-lg bg-rail-900 text-white text-xs">
            <div className="flex items-center gap-1.5 text-ir-saffron font-bold text-[11px] uppercase tracking-wider mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>Operational Innovation</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              Automatic multi-departmental bundling saved <strong>{stats.downtimeSavedHours} hours</strong> of downtime across active High Density corridors this week.
            </p>
          </div>
        </div>
      </div>

      {/* Task Quick Detail Modal */}
      {selectedTask && (
        <Modal
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          title={`Task Specification: ${selectedTask.id}`}
          subtitle={`Source: ${selectedTask.source} • Registered: ${selectedTask.requestedDate}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500">
                Priority Score: <strong className="text-slate-800 font-mono">{selectedTask.priorityScore}</strong>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="px-3.5 py-1.5 bg-rail-900 text-white rounded text-xs font-semibold"
              >
                Close View
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 uppercase font-semibold">Department:</span>
                <div className="mt-0.5"><DepartmentBadge department={selectedTask.department} /></div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Corridor:</span>
                <div className="font-semibold text-slate-800 mt-0.5">{selectedTask.corridor}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Location / Km:</span>
                <div className="font-semibold text-slate-800 mt-0.5">{selectedTask.location}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Preferred Window:</span>
                <div className="font-semibold text-slate-800 mt-0.5">{selectedTask.preferredWindow} ({selectedTask.durationHours}h)</div>
              </div>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-semibold block mb-1">Defect Description:</span>
              <p className="p-3 bg-slate-100 rounded text-slate-800 leading-relaxed">
                {selectedTask.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center p-2.5 bg-slate-50 rounded border border-slate-200">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Traffic Block</div>
                <div className="font-bold text-slate-800">{selectedTask.requiresTrafficBlock ? 'Required' : 'Not Required'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Power Block (25kV)</div>
                <div className="font-bold text-slate-800">{selectedTask.requiresPowerBlock ? 'Required' : 'Not Required'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Speed Restriction</div>
                <div className="font-bold text-slate-800">{selectedTask.speedRestrictionKmph ? `${selectedTask.speedRestrictionKmph} km/h` : 'None'}</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

