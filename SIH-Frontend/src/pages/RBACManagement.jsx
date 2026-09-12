import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  LockKeyhole,
  Key,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  RefreshCw,
  History,
  Clock,
  UserPlus,
  X,
  Building,
  MapPin,
  Mail,
  Shield,
  BadgeCheck
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';

export const RBACManagement = () => {
  const {
    user,
    currentRole,
    isPlannerAdmin,
    isCivilEngineer,
    isSntOfficer,
    isTrdEngineer,
    isFieldController
  } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'directory' | 'rules' | 'audit'
  const [auditLogs, setAuditLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);

  const initialUserForm = {
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'DEPT_ENGINEER',
    department: 'Civil Engineering (P-Way)',
    designation: 'Senior Section Engineer (Track)',
    zone: 'Northern Railway',
    division: 'Delhi Division'
  };
  const [newUserForm, setNewUserForm] = useState(initialUserForm);

  const refreshUsers = async () => {
    try {
      const users = await authService.getRegisteredUsers();
      if (users && users.length > 0) {
        setUsersList(users);
      }
    } catch (e) {
      // ignore
    }
  };

  const refreshLogs = () => {
    setAuditLogs(authService.getAuditLogs());
  };

  useEffect(() => {
    refreshLogs();
    refreshUsers();

    const handleUserChanged = () => {
      refreshUsers();
      refreshLogs();
    };

    window.addEventListener('railblock:user_changed', handleUserChanged);
    return () => window.removeEventListener('railblock:user_changed', handleUserChanged);
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.username || !newUserForm.email || !newUserForm.password || !newUserForm.name) {
      addToast({ title: 'Validation Error', message: 'All mandatory fields must be filled.', type: 'warning' });
      return;
    }

    setProvisioning(true);
    try {
      const res = await authService.createUser(newUserForm);
      addToast({
        title: 'Officer Provisioned',
        message: `Registered ${res.name} (${res.role}) in PostgreSQL with active credentials.`,
        type: 'success'
      });
      setIsProvisionModalOpen(false);
      setNewUserForm(initialUserForm);
      await refreshUsers();
      window.dispatchEvent(new CustomEvent('railblock:user_changed'));
    } catch (err) {
      addToast({
        title: 'Provisioning Failed',
        message: err.message || 'Failed to create user.',
        type: 'error'
      });
    } finally {
      setProvisioning(false);
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    setTogglingUserId(targetUser.id);
    try {
      const updated = await authService.updateUser(targetUser.id, {
        isActive: !targetUser.isActive
      });
      addToast({
        title: 'Account Status Updated',
        message: `Officer ${targetUser.name} account is now ${updated.isActive ? 'Active' : 'Suspended'}.`,
        type: updated.isActive ? 'success' : 'warning'
      });
      await refreshUsers();
      window.dispatchEvent(new CustomEvent('railblock:user_changed'));
    } catch (err) {
      addToast({
        title: 'Update Error',
        message: err.message || 'Failed to update user status.',
        type: 'error'
      });
    } finally {
      setTogglingUserId(null);
    }
  };

  const PERMISSIONS_MATRIX = [
    {
      capability: 'Block Request Submission',
      category: 'Operations',
      PLANNER_ADMIN: { status: 'NO', label: 'Prohibited (Admin Review Only)' },
      DEPT_ENGINEER: { status: 'FULL', label: 'Civil Track Requests' },
      SNT_OFFICER: { status: 'FULL', label: 'S&T Interlocking Requests' },
      TRD_ENGINEER: { status: 'FULL', label: 'TRD OHE Requests' },
      FIELD_CONTROLLER: { status: 'FULL', label: 'VHF Emergency Requests' }
    },
    {
      capability: 'HITL Review & Decision Grant',
      category: 'Authority',
      PLANNER_ADMIN: { status: 'FULL', label: 'Full Approval & Grant Authority' },
      DEPT_ENGINEER: { status: 'NO', label: 'View Status' },
      SNT_OFFICER: { status: 'NO', label: 'View Status' },
      TRD_ENGINEER: { status: 'NO', label: 'View Status' },
      FIELD_CONTROLLER: { status: 'LIMITED', label: 'Field Review Authority' }
    },
    {
      capability: 'Emergency Override',
      category: 'Authority',
      PLANNER_ADMIN: { status: 'FULL', label: 'Statutory Direct Override' },
      DEPT_ENGINEER: { status: 'NO', label: 'Prohibited' },
      SNT_OFFICER: { status: 'NO', label: 'Prohibited' },
      TRD_ENGINEER: { status: 'NO', label: 'Prohibited' },
      FIELD_CONTROLLER: { status: 'LIMITED', label: 'Field Emergency Flash' }
    },
    {
      capability: 'AI What-If Digital Twin & Solver',
      category: 'AI & ML',
      PLANNER_ADMIN: { status: 'FULL', label: 'Full Parameter Tuning & Solver' },
      DEPT_ENGINEER: { status: 'READ_ONLY', label: 'Read-Only Twin' },
      SNT_OFFICER: { status: 'READ_ONLY', label: 'Read-Only Twin' },
      TRD_ENGINEER: { status: 'READ_ONLY', label: 'Read-Only Twin' },
      FIELD_CONTROLLER: { status: 'READ_ONLY', label: 'Delay Projections' }
    },
    {
      capability: 'Shadow Bundle Authorization',
      category: 'Planning',
      PLANNER_ADMIN: { status: 'FULL', label: 'Final Approval' },
      DEPT_ENGINEER: { status: 'LIMITED', label: 'Propose Joint Work' },
      SNT_OFFICER: { status: 'LIMITED', label: 'Propose Joint Work' },
      TRD_ENGINEER: { status: 'LIMITED', label: 'Validate Earthing' },
      FIELD_CONTROLLER: { status: 'NO', label: 'View Team List' }
    },
    {
      capability: '25kV Permit-to-Work (PTW) Sign-Off',
      category: 'Safety & G&SR',
      PLANNER_ADMIN: { status: 'FULL', label: 'Co-Signatory' },
      DEPT_ENGINEER: { status: 'NO', label: 'View PTW Status' },
      SNT_OFFICER: { status: 'NO', label: 'View PTW Status' },
      TRD_ENGINEER: { status: 'FULL', label: 'Exclusive Authority' },
      FIELD_CONTROLLER: { status: 'READ_ONLY', label: 'Acknowledge' }
    },
    {
      capability: 'COA / FOIS Dispatch Telegraph Notice',
      category: 'Telegraphy',
      PLANNER_ADMIN: { status: 'FULL', label: 'Generate & Transmit' },
      DEPT_ENGINEER: { status: 'READ_ONLY', label: 'Receive Copy' },
      SNT_OFFICER: { status: 'READ_ONLY', label: 'Receive Copy' },
      TRD_ENGINEER: { status: 'READ_ONLY', label: 'Receive Copy' },
      FIELD_CONTROLLER: { status: 'FULL', label: 'Station Acknowledgment' }
    },
    {
      capability: 'User Provisioning & System Access Control',
      category: 'Administration',
      PLANNER_ADMIN: { status: 'FULL', label: 'Full Provisioning Authority' },
      DEPT_ENGINEER: { status: 'NO', label: 'Prohibited' },
      SNT_OFFICER: { status: 'NO', label: 'Prohibited' },
      TRD_ENGINEER: { status: 'NO', label: 'Prohibited' },
      FIELD_CONTROLLER: { status: 'NO', label: 'Prohibited' }
    }
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case 'PLANNER_ADMIN':
        return { label: 'Sr. DOM / Admin', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'DEPT_ENGINEER':
        return { label: 'Civil Engineer (Sr. DEN)', bg: 'bg-sky-100 text-sky-800 border-sky-300' };
      case 'SNT_OFFICER':
        return { label: 'S&T Officer (Sr. DSTE)', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
      case 'TRD_ENGINEER':
        return { label: 'TRD Engineer (DEE/TRD)', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'FIELD_CONTROLLER':
        return { label: 'Field Controller / SM', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      default:
        return { label: role, bg: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role-Based Access Control (RBAC) & Governance Matrix"
        subtitle="Enforces statutory Indian Railways departmental isolation, Permit-to-Work (PTW) safety gates, and PostgreSQL-backed cryptographic identity governance."
        badge="G&SR Rule Compliance"
      />

      {/* Active Persona Banner */}
      <div className="bg-gradient-to-r from-rail-950 via-rail-900 to-rail-950 border border-rail-800 rounded-xl p-5 shadow-lg text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-rail-800 border border-rail-700 flex items-center justify-center font-mono text-xl font-bold text-amber-300 shadow-inner">
              {user?.avatar || 'IR'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  AUTHENTICATED SESSION: {currentRole}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {user?.zone || 'Northern Railway'} • {user?.division || 'Delhi Division'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                {user?.name} — <span className="text-slate-300 font-normal">{user?.designation}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Department: <span className="text-slate-200 font-medium">{user?.department}</span> • Email: <span className="text-slate-300 font-mono">{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="px-3.5 py-2 rounded-lg bg-rail-800/90 border border-rail-700 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Security Authority Level</span>
              <span className="text-emerald-400 font-bold font-mono">
                {isPlannerAdmin ? 'LEVEL 5 — FULL OPERATING CONTROLLER' : isTrdEngineer ? 'LEVEL 3+ — TRD 25kV PTW SIGNATORY' : 'LEVEL 3 — DEPARTMENTAL ISOLATION'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-200">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'matrix'
              ? 'border-rail-900 text-rail-900 font-bold bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Full Permissions Matrix</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('directory');
            refreshUsers();
          }}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'directory'
              ? 'border-rail-900 text-rail-900 font-bold bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Personnel Directory ({usersList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'border-rail-900 text-rail-900 font-bold bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>G&SR Statutory Guidelines</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('audit');
            refreshLogs();
          }}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-rail-900 text-rail-900 font-bold bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4 text-indigo-600" />
          <span>Security Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: Permissions Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Functional Authorization Matrix</h3>
              <p className="text-xs text-slate-500">Live evaluation of permissions according to Indian Railways operating codes & G&SR.</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Full</span>
              <span className="flex items-center gap-1 text-amber-700 font-semibold"><AlertTriangle className="w-3.5 h-3.5" /> Scoped</span>
              <span className="flex items-center gap-1 text-slate-400"><XCircle className="w-3.5 h-3.5" /> Restricted</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-mono uppercase text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">Operational Capability</th>
                  <th className="py-3 px-3 text-center">Sr. DOM / Admin</th>
                  <th className="py-3 px-3 text-center">Sr. DEN (Civil)</th>
                  <th className="py-3 px-3 text-center">Sr. DSTE (S&T)</th>
                  <th className="py-3 px-3 text-center">DEE (TRD OHE)</th>
                  <th className="py-3 px-3 text-center">Station Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {PERMISSIONS_MATRIX.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{row.capability}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{row.category}</span>
                    </td>

                    {/* Admin */}
                    <td className="py-3 px-3 text-center">
                      {row.PLANNER_ADMIN.status === 'FULL' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {row.PLANNER_ADMIN.label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-50">
                          <XCircle className="w-3 h-3" /> {row.PLANNER_ADMIN.label}
                        </span>
                      )}
                    </td>

                    {/* Civil */}
                    <td className="py-3 px-3 text-center">
                      {row.DEPT_ENGINEER.status === 'FULL' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> {row.DEPT_ENGINEER.label}
                        </span>
                      ) : row.DEPT_ENGINEER.status === 'LIMITED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                          <AlertTriangle className="w-3 h-3 text-sky-600" /> {row.DEPT_ENGINEER.label}
                        </span>
                      ) : row.DEPT_ENGINEER.status === 'READ_ONLY' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          {row.DEPT_ENGINEER.label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-50">
                          <XCircle className="w-3 h-3" /> {row.DEPT_ENGINEER.label}
                        </span>
                      )}
                    </td>

                    {/* S&T */}
                    <td className="py-3 px-3 text-center">
                      {row.SNT_OFFICER.status === 'FULL' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> {row.SNT_OFFICER.label}
                        </span>
                      ) : row.SNT_OFFICER.status === 'LIMITED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <AlertTriangle className="w-3 h-3 text-emerald-700" /> {row.SNT_OFFICER.label}
                        </span>
                      ) : row.SNT_OFFICER.status === 'READ_ONLY' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          {row.SNT_OFFICER.label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-50">
                          <XCircle className="w-3 h-3" /> {row.SNT_OFFICER.label}
                        </span>
                      )}
                    </td>

                    {/* TRD */}
                    <td className="py-3 px-3 text-center">
                      {row.TRD_ENGINEER.status === 'FULL' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Zap className="w-3 h-3 text-amber-600" /> {row.TRD_ENGINEER.label}
                        </span>
                      ) : row.TRD_ENGINEER.status === 'LIMITED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> {row.TRD_ENGINEER.label}
                        </span>
                      ) : row.TRD_ENGINEER.status === 'READ_ONLY' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          {row.TRD_ENGINEER.label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-50">
                          <XCircle className="w-3 h-3" /> {row.TRD_ENGINEER.label}
                        </span>
                      )}
                    </td>

                    {/* Field Controller */}
                    <td className="py-3 px-3 text-center">
                      {row.FIELD_CONTROLLER.status === 'FULL' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                          <CheckCircle2 className="w-3 h-3 text-purple-600" /> {row.FIELD_CONTROLLER.label}
                        </span>
                      ) : row.FIELD_CONTROLLER.status === 'LIMITED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800">
                          <AlertTriangle className="w-3 h-3 text-purple-600" /> {row.FIELD_CONTROLLER.label}
                        </span>
                      ) : row.FIELD_CONTROLLER.status === 'READ_ONLY' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          {row.FIELD_CONTROLLER.label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-50">
                          <XCircle className="w-3 h-3" /> {row.FIELD_CONTROLLER.label}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Personnel Directory */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">PostgreSQL Central User Directory</h3>
              <p className="text-xs text-slate-500">Centralized database accounts for railway engineers and operating controllers.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshUsers}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              {isPlannerAdmin && (
                <button
                  onClick={() => setIsProvisionModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Provision New Officer</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usersList.map((u) => {
              const isCurrent = user?.id === u.id;
              const roleBadge = getRoleBadge(u.role);
              const isActive = u.isActive !== false;
              const isToggling = togglingUserId === u.id;

              return (
                <div
                  key={u.id}
                  className={`bg-white rounded-xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : isActive
                      ? 'border-slate-200 hover:border-slate-300'
                      : 'border-rose-200 bg-rose-50/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {u.username || u.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.bg}`}
                        >
                          {u.role}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isActive ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rail-900 text-amber-300 font-mono font-bold flex items-center justify-center text-sm shadow-inner">
                        {u.avatar || u.name?.slice(0, 2).toUpperCase() || 'IR'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{u.name}</h4>
                        <p className="text-[11px] text-slate-500 leading-tight">{u.designation || 'Railway Official'}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between py-1 border-t border-slate-100">
                        <span className="text-slate-400">Department:</span>
                        <span className="font-medium text-slate-800">{u.department}</span>
                      </div>
                      <div className="flex justify-between py-1 border-t border-slate-100">
                        <span className="text-slate-400">Division:</span>
                        <span className="font-mono text-[11px] text-slate-700">{u.division} ({u.zone})</span>
                      </div>
                      <div className="flex justify-between py-1 border-t border-slate-100">
                        <span className="text-slate-400">Email:</span>
                        <span className="font-mono text-[11px] text-slate-600 truncate max-w-[180px]">{u.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100">
                    {isCurrent ? (
                      <div className="w-full py-2 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs text-center border border-emerald-200 flex items-center justify-center gap-1.5">
                        <BadgeCheck className="w-4 h-4 text-emerald-600" />
                        <span>Your Current Active Session</span>
                      </div>
                    ) : isPlannerAdmin ? (
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        disabled={isToggling}
                        className={`w-full py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                          isActive
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        } disabled:opacity-50`}
                      >
                        {isToggling ? (
                          <span>Updating...</span>
                        ) : isActive ? (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Suspend Officer Access</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Activate Officer Access</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="w-full py-1.5 text-[11px] text-slate-400 text-center font-mono">
                        Managed by Sr. DOM Admin
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: G&SR Rules */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-rail-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold">G&SR Chapter XVII: Working of Trains on Electrified Sections</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Under Indian Railways General & Subsidiary Rule 17.03, whenever maintenance requires heavy track machines (BCM, CSM) or civil workers to operate within 2.0 meters of 25kV overhead conductors, a statutory <strong>Power Block</strong> must be granted and a <strong>Permit to Work (PTW)</strong> issued by the Traction Power Controller (TPC).
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
              <strong>Mandatory Gate:</strong> RAILBLOCK enforces that no joint shadow bundle can be approved without positive PTW verification signed by the TRD Engineer persona.
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-rail-900">
              <Key className="w-5 h-5 text-sky-600" />
              <h3 className="text-sm font-bold">Block Working Manual (BWM): Single Grant Authority</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In accordance with BWM Clause 4.12, only the Operating / Traffic Planning Branch (Sr. DOM or Chief Controller) possesses the statutory power to grant traffic possession and publish caution orders to station masters.
            </p>
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900">
              <strong>Principle:</strong> "AI Recommends, Deterministic Safety Decides, Chief Controller Grants."
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CRIS Security Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span>CRIS Security & Operational Identity Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-500">Tamper-evident operational access ledger tracking role transitions and clearance verifications.</p>
            </div>
            <button
              onClick={refreshLogs}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs text-slate-600 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Log</span>
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No recent security transitions recorded.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                        {log.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${
                        log.action?.includes('AUTHORIZED') || log.action?.includes('PROVISION') ? 'bg-emerald-600' : 'bg-rail-900'
                      }`}>
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-800">{log.userName}</span>
                      <span className="text-[10px] font-mono text-slate-400">[{log.role}]</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{log.details}</p>
                  </div>
                  <div className="text-right shrink-0 text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.timestamp).toLocaleTimeString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Provision New Officer Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rail-950 via-slate-900 to-rail-950 px-6 py-4 text-white border-b border-rail-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Provision Railway Operational Officer</h3>
                  <p className="text-[11px] text-slate-400">Creates a persistent account in PostgreSQL with statutory RBAC credentials.</p>
                </div>
              </div>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. snt_officer_ndls"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rail-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Rao"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rail-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. officer@railnet.gov.in"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rail-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rail-800 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Statutory Operational Role (RBAC) *
                </label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => {
                    const role = e.target.value;
                    let dept = 'Civil Engineering (P-Way)';
                    let desig = 'Senior Section Engineer (Track)';
                    if (role === 'PLANNER_ADMIN') {
                      dept = 'Operating / Traffic Planning';
                      desig = 'Senior Divisional Operations Manager (Sr. DOM)';
                    } else if (role === 'SNT_OFFICER') {
                      dept = 'Signaling & Telecommunications';
                      desig = 'Divisional Signal & Telecom Engineer (Sr. DSTE)';
                    } else if (role === 'TRD_ENGINEER') {
                      dept = 'Electrical / Traction Distribution (TRD)';
                      desig = 'Divisional Electrical Engineer (DEE / TRD)';
                    } else if (role === 'FIELD_CONTROLLER') {
                      dept = 'Operating & Station Control';
                      desig = 'Section Controller / Station Master';
                    }
                    setNewUserForm({
                      ...newUserForm,
                      role,
                      department: dept,
                      designation: desig
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rail-800 focus:bg-white"
                >
                  <option value="PLANNER_ADMIN">PLANNER_ADMIN — Sr. DOM / Chief Traffic Planning Admin</option>
                  <option value="DEPT_ENGINEER">DEPT_ENGINEER — Divisional Civil Engineer (Sr. DEN / P-Way)</option>
                  <option value="SNT_OFFICER">SNT_OFFICER — Signaling & Telecom Engineer (Sr. DSTE)</option>
                  <option value="TRD_ENGINEER">TRD_ENGINEER — Traction Distribution Engineer (DEE TRD)</option>
                  <option value="FIELD_CONTROLLER">FIELD_CONTROLLER — Section Controller / Station Master</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newUserForm.department}
                    onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rail-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={newUserForm.designation}
                    onChange={(e) => setNewUserForm({ ...newUserForm, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rail-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Railway Zone
                  </label>
                  <input
                    type="text"
                    value={newUserForm.zone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, zone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rail-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Division
                  </label>
                  <input
                    type="text"
                    value={newUserForm.division}
                    onChange={(e) => setNewUserForm({ ...newUserForm, division: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rail-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisioning}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{provisioning ? 'Provisioning Officer...' : 'Register in PostgreSQL'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
