import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  LockKeyhole
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isPlannerAdmin, user, currentRole, canAccessRoute } = useAuth();

  const navGroups = [
    {
      label: 'OVERVIEW',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      label: 'AI & INTELLIGENCE',
      items: [
        {
          to: '/ai-copilot',
          label: 'RAIL-GPT Copilot',
          icon: Bot,
          highlight: true,
          badge: 'AI Hub'
        }
      ]
    },
    {
      label: 'OPERATIONS',
      items: [
        { to: '/block-requests', label: 'Block Requests', icon: ClipboardList },
        { to: '/data-sync', label: 'Data Sync', icon: RefreshCw },
        { to: '/data-quality', label: 'Data Quality', icon: FileCheck2 },
        { to: '/priority', label: 'Priority Scoring', icon: ListOrdered },
        { to: '/corridor-availability', label: 'Corridor Availability', icon: CalendarDays },
        { to: '/conflicts', label: 'Conflict & Bundling', icon: AlertOctagon, badge: '12' },
        {
          to: '/optimization',
          label: 'Optimization Engine',
          icon: Sparkles,
          highlight: true
        },
        { to: '/schedule', label: 'Block Schedule', icon: CalendarCheck },
        { to: '/validation', label: 'Validation', icon: ShieldCheck }
      ]
    },
    {
      label: 'ANALYTICS',
      items: [
        { to: '/performance', label: 'Performance', icon: Gauge },
        { to: '/downtime', label: 'Downtime Analysis', icon: Hourglass, badge: '40% saved' }
      ]
    },
    {
      label: 'GOVERNANCE & SYSTEM',
      items: [
        { to: '/rbac', label: 'RBAC Matrix', icon: Key, badge: 'IR-Roles' },
        { to: '/notifications', label: 'Notifications', icon: Bell },
        { to: '/profile', label: 'Profile', icon: UserCheck },
        { to: '/settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

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
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">ACTIVE ROLE</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
              {currentRole}
            </span>
          </div>
          <div className="text-xs font-bold text-white truncate mt-1">
            {user?.name || 'Chief Controller'}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {user?.designation || 'Sr. DOM / Planning'}
          </div>
        </div>
      )}

      {/* Top Nav Items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-6">
        {navGroups.map((group, gIdx) => (
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
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-rail-900/80 flex items-center justify-between bg-rail-950/60">
        {!collapsed && (
          <div className="px-2 text-[10px] text-slate-400 truncate">
            <span className="font-semibold text-slate-300">RAILBLOCK v2.4</span>
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
