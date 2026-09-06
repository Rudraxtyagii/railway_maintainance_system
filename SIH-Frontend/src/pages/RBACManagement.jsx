import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  LockKeyhole,
  Unlock,
  Key,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Zap,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Sliders,
  Award,
  History,
  Clock
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
    isFieldController,
    requestRoleSwitch,
    availableUsers,
    hasPermission
  } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'directory' | 'rules' | 'audit'
  const [auditLogs, setAuditLogs] = useState([]);

  const refreshLogs = () => {
    setAuditLogs(authService.getAuditLogs());
  };

  useEffect(() => {
    refreshLogs();

    const handleRoleSwitched = () => {
      refreshLogs();
    };

    window.addEventListener('railblock:role_switched', handleRoleSwitched);
    return () => window.removeEventListener('railblock:role_switched', handleRoleSwitched);
  }, []);

  const ROLES_INFO = [
    {
      code: 'PLANNER_ADMIN',
      title: 'Operating / Traffic Planning Admin (Sr. DOM / Chief Controller)',
      branch: 'Operating & Traffic Branch',
      color: 'bg-emerald-600',
      badge: 'Level 5 (Full Authority)',
      holder: 'Rajesh Sharma (Sr. DOM)',
      scope: 'Full authority across all divisions, schedule approval, algorithm execution, and telegraph publishing.'
    },
    {
      code: 'DEPT_ENGINEER',
      title: 'Divisional Civil Engineer (Sr. DEN / AEN P-Way)',
      branch: 'Civil Engineering (Permanent Way)',
      color: 'bg-sky-600',
      badge: 'Level 3 (Civil Isolation)',
      holder: 'Anil Verma (Sr. DEN)',
      scope: 'Submit and manage track renewal, tamping, and ultrasonic rail flaw defect requests.'
    },
    {
      code: 'SNT_OFFICER',
      title: 'Signaling & Telecom Engineer (Sr. DSTE / ASTE)',
      branch: 'Signaling & Telecommunications',
      color: 'bg-emerald-700',
      badge: 'Level 3 (S&T Isolation)',
      holder: 'Vikramaditya Rao (Sr. DSTE)',
      scope: 'Submit point machine overhaul, interlocking check, and axle counter maintenance requests.'
    },
    {
      code: 'TRD_ENGINEER',
      title: 'Traction Distribution Engineer (Sr. DEE TRD / AEE)',
      branch: 'Electrical / 25kV Traction',
      color: 'bg-amber-600',
      badge: 'Level 3+ (PTW Authority)',
      holder: 'Pooja Iyer (DEE / TRD)',
      scope: 'Manage 25kV OHE power blocks and issue mandatory Permit-to-Work (PTW) safety certificates.'
    },
    {
      code: 'FIELD_CONTROLLER',
      title: 'Section Controller / Station Master (Field Operations)',
      branch: 'Operating & Station Control',
      color: 'bg-purple-600',
      badge: 'Level 2 (Field Audio / VHF)',
      holder: 'Surendra Kumar (Station Master)',
      scope: 'Submit field audio/radio voice memos and receive real-time dispatch caution notices.'
    }
  ];

  const PERMISSIONS_MATRIX = [
    {
      capability: 'Block Request Submission',
      category: 'Operations',
      PLANNER_ADMIN: { status: 'FULL', label: 'All Branches' },
      DEPT_ENGINEER: { status: 'LIMITED', label: 'Civil Only' },
      SNT_OFFICER: { status: 'LIMITED', label: 'S&T Only' },
      TRD_ENGINEER: { status: 'LIMITED', label: 'TRD OHE Only' },
      FIELD_CONTROLLER: { status: 'LIMITED', label: 'VHF Voice Memo' }
    },
    {
      capability: 'Dynamic Priority Escalation',
      category: 'Operations',
      PLANNER_ADMIN: { status: 'FULL', label: 'Direct Override' },
      DEPT_ENGINEER: { status: 'LIMITED', label: 'Propose Escalation' },
      SNT_OFFICER: { status: 'LIMITED', label: 'Propose Escalation' },
      TRD_ENGINEER: { status: 'LIMITED', label: 'Propose Escalation' },
      FIELD_CONTROLLER: { status: 'LIMITED', label: 'Emergency Flash' }
    },
    {
      capability: 'AI What-If Digital Twin',
      category: 'AI & ML',
      PLANNER_ADMIN: { status: 'FULL', label: 'Full Parameter Tuning' },
      DEPT_ENGINEER: { status: 'READ_ONLY', label: 'Read-Only' },
      SNT_OFFICER: { status: 'READ_ONLY', label: 'Read-Only' },
      TRD_ENGINEER: { status: 'READ_ONLY', label: 'Read-Only' },
      FIELD_CONTROLLER: { status: 'READ_ONLY', label: 'Delay Projections' }
    },
    {
      capability: 'Automated Solver Execution',
      category: 'AI & ML',
      PLANNER_ADMIN: { status: 'FULL', label: 'Execute & Reschedule' },
      DEPT_ENGINEER: { status: 'NO', label: 'View Slots Only' },
      SNT_OFFICER: { status: 'NO', label: 'View Slots Only' },
      TRD_ENGINEER: { status: 'NO', label: 'View Slots Only' },
      FIELD_CONTROLLER: { status: 'NO', label: 'Prohibited' }
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
      capability: 'Master Schedule Grant & Publish',
      category: 'Authority',
      PLANNER_ADMIN: { status: 'FULL', label: 'Statutory Grant' },
      DEPT_ENGINEER: { status: 'NO', label: 'View Approved' },
      SNT_OFFICER: { status: 'NO', label: 'View Approved' },
      TRD_ENGINEER: { status: 'NO', label: 'View Approved' },
      FIELD_CONTROLLER: { status: 'READ_ONLY', label: 'Station Timetable' }
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
      capability: 'System Configuration & User Access',
      category: 'Administration',
      PLANNER_ADMIN: { status: 'FULL', label: 'Full Admin Control' },
      DEPT_ENGINEER: { status: 'NO', label: 'Prohibited' },
      SNT_OFFICER: { status: 'NO', label: 'Prohibited' },
      TRD_ENGINEER: { status: 'NO', label: 'Prohibited' },
      FIELD_CONTROLLER: { status: 'NO', label: 'Prohibited' }
    }
  ];

  const handlePersonaClick = (roleCode) => {
    if (currentRole === roleCode) {
      addToast({
        title: 'Already Active',
        message: `You are currently logged in with ${roleCode} authority.`,
        type: 'info'
      });
      return;
    }
    requestRoleSwitch(roleCode);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role-Based Access Control (RBAC) & Governance Matrix"
        subtitle="Enforces statutory Indian Railways departmental isolation, Permit-to-Work (PTW) safety gates, and multi-tier security authorization."
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
                  ACTIVE SESSION: {currentRole}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {user?.zone} • {user?.division}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                {user?.name} — <span className="text-slate-300 font-normal">{user?.designation}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Department: <span className="text-slate-200 font-medium">{user?.department}</span> • Employee ID: <span className="text-slate-300 font-mono font-bold">{user?.employeeId || 'IR-CRIS-4819'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="px-3 py-2 rounded-lg bg-rail-800/80 border border-rail-700 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Permission Level</span>
              <span className="text-emerald-400 font-bold font-mono">
                {isPlannerAdmin ? 'FULL CHIEF CONTROLLER' : isTrdEngineer ? 'TRD 25kV PTW SIGNATORY' : 'DEPARTMENTAL ISOLATION'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Persona Switcher Bar */}
        <div className="mt-5 pt-4 border-t border-rail-800">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Assume Different Operational Officer (Requires PIN Authorization):</span>
            </div>
            <span className="text-[10px] text-amber-300 font-normal">PIN: 1234</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {ROLES_INFO.map(r => {
              const isCurrent = currentRole === r.code;
              return (
                <button
                  key={r.code}
                  onClick={() => handlePersonaClick(r.code)}
                  className={`p-2.5 rounded-lg border text-left transition-all relative ${
                    isCurrent
                      ? 'bg-amber-400/15 border-amber-400 text-white shadow-md'
                      : 'bg-rail-950/60 border-rail-800 text-slate-300 hover:bg-rail-900 hover:text-white'
                  }`}
                >
                  {isCurrent ? (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Active"></span>
                  ) : (
                    <LockKeyhole className="w-3 h-3 text-slate-500 absolute top-2 right-2" title="Authorization Required" />
                  )}
                  <div className="text-[11px] font-bold truncate text-white">{r.holder}</div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">{r.code}</div>
                  <div className="mt-1 flex items-center gap-1 text-[9px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${r.color}`}></span>
                    <span className="text-slate-300 truncate">{r.badge}</span>
                  </div>
                </button>
              );
            })}
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
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'directory'
              ? 'border-rail-900 text-rail-900 font-bold bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Personnel Directory ({availableUsers?.length || 5})</span>
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
              <p className="text-xs text-slate-500">Live evaluation of permissions according to Indian Railways operating codes.</p>
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {row.PLANNER_ADMIN.label}
                      </span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(availableUsers || []).map(u => {
            const isCurrent = user?.id === u.id;
            return (
              <div
                key={u.id}
                className={`bg-white rounded-xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                  isCurrent ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {u.employeeId || u.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${u.badgeColor || 'bg-slate-700'}`}>
                      {u.role}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rail-900 text-amber-300 font-mono font-bold flex items-center justify-center text-sm">
                      {u.avatar}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{u.name}</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">{u.designation}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between py-1 border-t border-slate-100">
                      <span className="text-slate-400">Department:</span>
                      <span className="font-medium text-slate-800">{u.department}</span>
                    </div>
                    <div className="flex justify-between py-1 border-t border-slate-100">
                      <span className="text-slate-400">Clearance Level:</span>
                      <span className="font-mono text-[11px] text-emerald-700 font-bold">{u.clearanceLevel || 'Level 3'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-t border-slate-100">
                      <span className="text-slate-400">Email:</span>
                      <span className="font-mono text-[11px] text-slate-600">{u.email}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  {isCurrent ? (
                    <div className="w-full py-2 rounded-lg bg-amber-50 text-amber-800 font-bold text-xs text-center border border-amber-200">
                      ✓ Active Operational Officer
                    </div>
                  ) : (
                    <button
                      onClick={() => requestRoleSwitch(u.id)}
                      className="w-full py-2 rounded-lg bg-rail-800 hover:bg-rail-900 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <LockKeyhole className="w-3.5 h-3.5 text-amber-300" />
                      <span>Authenticate & Switch to Officer</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
                        log.action.includes('AUTHORIZED') ? 'bg-emerald-600' : 'bg-rail-900'
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
    </div>
  );
};
