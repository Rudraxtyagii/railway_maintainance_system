import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  RefreshCw,
  FileCheck2,
  ListOrdered,
  CalendarDays,
  AlertOctagon,
  Sparkles,
  CalendarCheck,
  ShieldCheck,
  Gauge,
  Hourglass,
  Bell,
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Train,
  Bot,
  Key,
  LockKeyhole,
  CheckCircle2,
  Trash2,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../services/adminService';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isPlannerAdmin, user, currentRole, canAccessRoute } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Admin DB Reset Modal
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleExecuteReset = async () => {
    setResetting(true);
    try {
      const res = await adminService.resetDatabase();
      addToast({
        title: 'Database Reset Successfully',
        message: res.message || 'All operational maintenance queues purged. Clean slate active.',
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

  // Admin Navigation Groups (Full Central System)
  const adminNavGroups = [
    {
      label: 'CENTRAL OPERATIONS',
      items: [
        { to: '/dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
        { to: '/hitl-review', label: 'HITL Review Center', icon: CheckCircle2, highlight: true, badge: 'HITL Live' },
        { to: '/block-requests', label: 'Block Requests Queue', icon: ClipboardList }
      ]
    },
    {
      label: 'AI INTELLIGENCE (RAG)',
      items: [
        {
          to: '/ai-copilot',
          label: 'RAIL-GPT Copilot',
          icon: Bot,
          highlight: true,
          badge: 'G&SR Grounded'
        }
      ]
    },
    {
      label: 'PLANNING & OPTIMIZATION',
      items: [
        { to: '/corridor-availability', label: 'Corridor Availability', icon: CalendarDays },
        { to: '/priority', label: 'Priority Scoring', icon: ListOrdered },
        { to: '/conflicts', label: 'Conflict & Bundling', icon: AlertOctagon, badge: 'Live' },
        {
          to: '/optimization',
          label: 'Optimization Engine',
          icon: Sparkles,
          highlight: true
        },
        { to: '/schedule', label: 'Master Block Schedule', icon: CalendarCheck },
        { to: '/validation', label: 'Safety Validation', icon: ShieldCheck }
      ]
    },
    {
      label: 'TELEMETRY & INGESTION',
      items: [
        { to: '/data-sync', label: 'Data Sync (COA Feed)', icon: RefreshCw },
        { to: '/data-quality', label: 'Data Quality Rules', icon: FileCheck2 }
      ]
    },
    {
      label: 'ANALYTICS & AUDIT',
      items: [
        { to: '/performance', label: 'Performance KPIs', icon: Gauge },
        { to: '/downtime', label: 'Downtime Analysis', icon: Hourglass, badge: 'Saved' }
      ]
    },
    {
      label: 'ADMINISTRATION & SECURITY',
      items: [
        { to: '/rbac', label: 'RBAC Access Matrix', icon: Key, badge: 'IR-Roles' },
        { to: '/settings', label: 'System Settings', icon: Settings },
        { to: '/notifications', label: 'Notifications', icon: Bell },
        { to: '/profile', label: 'Admin Profile', icon: UserCheck }
      ]
    }
  ];

  // Department User Navigation Groups (Streamlined: Only Request Block, Approval Status, Copilot, Profile)
  const departmentNavGroups = [
    {
      label: 'BLOCK REQUISITION',
      items: [
        { to: '/block-requests', label: 'Request a Block', icon: ClipboardList, badge: 'Submit Demand', highlight: true }
      ]
    },
    {
      label: 'SANCTION & APPROVALS',
      items: [
        { to: '/notifications', label: 'Approval Status', icon: Bell, badge: 'Live' }
      ]
    },
    {
      label: 'AI ASSISTANT & PROFILE',
      items: [
        {
          to: '/ai-copilot',
          label: 'RAIL-GPT Copilot',
          icon: Bot,
          highlight: true,
          badge: 'G&SR Rules'
        },
        { to: '/profile', label: 'Officer Profile', icon: UserCheck }
      ]
    }
  ];

  const activeNavGroups = isPlannerAdmin ? adminNavGroups : departmentNavGroups;

  return (
    <aside
      className={`bg-rail-950 text-slate-300 border-r border-rail-900 transition-all duration-300 flex flex-col justify-between shrink-0 select-none z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Active Role Indicator */}
      {!collapsed && (
        <div className="p-3 border-b border-rail-900/80 bg-rail-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">ACTIVE PERSONA</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border ${
              isPlannerAdmin ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
            }`}>
              {currentRole}
            </span>
          </div>
          <div className="text-xs font-bold text-white truncate mt-1">
            {user?.name || 'Authorized Officer'}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {user?.designation || (isPlannerAdmin ? 'Sr. DOM / Central Planning' : user?.department)}
          </div>
        </div>
      )}

      {/* Nav Items List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {activeNavGroups.map((group, gIdx) => (
          <div key={group.label || gIdx}>
            {!collapsed && (
              <div className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isPermitted = canAccessRoute(item.to);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors relative group ${
                        isActive
                          ? 'bg-rail-800 text-white font-semibold shadow-sm'
                          : isPermitted
                          ? 'text-slate-300 hover:bg-rail-900/80 hover:text-white'
                          : 'text-slate-500 hover:bg-rail-900/40'
                      } ${item.highlight && !isActive ? 'text-amber-300 hover:text-amber-200' : ''}`
                    }
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${item.highlight ? 'text-amber-400' : isPermitted ? 'text-slate-400 group-hover:text-white' : 'text-slate-600'}`} />
                    {!collapsed && (
                      <span className="truncate flex-1 tracking-tight">
                        {item.label}
                      </span>
                    )}
                    {!collapsed && !isPermitted && (
                      <LockKeyhole className="w-3 h-3 text-slate-500 shrink-0" title="Restricted Role" />
                    )}
                    {!collapsed && isPermitted && item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rail-900 text-ir-saffron border border-rail-800 font-mono">
                        {item.badge}
                      </span>
                    )}
                    {item.highlight && !collapsed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        {/* Admin Clean-Slate Reset Quick Action in Sidebar */}
        {isPlannerAdmin && !collapsed && (
          <div className="pt-2 px-1">
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-900/60 space-y-2">
              <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-bold uppercase font-mono">
                <Shield className="w-3 h-3" />
                <span>Admin DB Control</span>
              </div>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold transition-all shadow"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset Database</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for DB Reset */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="⚠️ Reset Operational Database to Clean State?"
        message="This action will permanently purge all block requests, conflict analyses, and generated schedules from PostgreSQL. Foundational personnel, corridors, and RAG knowledge manuals will remain intact."
        confirmLabel={resetting ? "Purging Queues..." : "Yes, Purge Database"}
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleExecuteReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-rail-900/80 flex items-center justify-between bg-rail-950/60">
        {!collapsed && (
          <div className="px-2 text-[10px] text-slate-400 truncate">
            <span className="font-semibold text-slate-300">RAILBLOCK v3.0</span>
            <span className="mx-1">•</span>
            <span>IR-CRIS</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-rail-900 text-slate-400 hover:text-white transition-colors ml-auto"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
