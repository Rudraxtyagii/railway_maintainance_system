import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, ChevronDown, Check, LogOut, Shield, Train, ExternalLink, Sparkles, Bot, Key, LockKeyhole } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { MOCK_NOTIFICATIONS } from '../../data/mockData';

export const Header = () => {
  const { user, switchUser, logout, availableUsers, isPlannerAdmin, currentRole } = useAuth();
  const navigate = useNavigate();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roleRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleRef.current && !roleRef.current.contains(e.target)) setShowRoleMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifMenu(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifs = MOCK_NOTIFICATIONS.filter(n => n.unread);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Government of India Official Top Strip */}
      <div className="bg-rail-950 text-slate-300 text-[11px] px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-rail-900 tracking-wide font-medium">
        <div className="flex items-center gap-3">
          <span className="text-ir-saffron font-bold">भारत सरकार</span>
          <span className="text-slate-500">|</span>
          <span>GOVERNMENT OF INDIA</span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">रेल मंत्रालय • MINISTRY OF RAILWAYS</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span className="hidden md:inline">Centre for Railway Information Systems (CRIS)</span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="bg-rail-900 text-amber-300 px-2 py-0.5 rounded font-mono font-semibold border border-rail-800">
            SIH PS 26027
          </span>
        </div>
      </div>

      {/* Main Control Center Header Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded bg-rail-900 border border-rail-800 flex items-center justify-center text-ir-saffron shadow-sm group-hover:bg-rail-850 transition-colors">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-rail-950 tracking-tight font-mono">
                  RAILBLOCK
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-rail-100 text-rail-800 rounded border border-rail-200">
                  CRIS • IR
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 font-medium tracking-tight -mt-0.5">
                AI-Powered Automatic Block Planning System
              </p>
            </div>
          </Link>
        </div>

        {/* Right Action Tools: Role Switcher, Quick Optimizer Link, Notifs, User Profile */}
        <div className="flex items-center gap-2.5">
          {/* Demo Role Switcher Dropdown */}
          <div className="relative" ref={roleRef}>
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors text-xs text-slate-700"
              title="Switch user role to test departmental isolation & access control"
            >
              <Shield className="w-3.5 h-3.5 text-rail-700" />
              <div className="text-left hidden sm:block">
                <div className="text-[9px] uppercase font-bold text-slate-400 -mb-0.5 leading-none">RBAC Persona</div>
                <div className="font-semibold text-slate-800 font-mono text-[11px]">{currentRole}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-lg shadow-elevated border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Switch Railways Persona</span>
                  <Link to="/rbac" onClick={() => setShowRoleMenu(false)} className="text-rail-700 hover:underline">
                    View Matrix →
                  </Link>
                </div>
                {availableUsers.map((u) => {
                  const active = u.id === user?.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-start justify-between text-xs hover:bg-slate-50 transition-colors ${active ? 'bg-rail-50/70 font-semibold text-rail-900' : 'text-slate-700'}`}
                    >
                      <div>
                        <div className="font-medium flex items-center gap-1.5">
                          {u.name}
                          <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold text-white ${u.badgeColor || 'bg-slate-700'}`}>
                            {u.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">{u.designation}</div>
                      </div>
                      {active ? (
                        <Check className="w-4 h-4 text-rail-700 shrink-0 mt-0.5" />
                      ) : (
                        <LockKeyhole className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-1" title="Security PIN Authorization Required" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick RAIL-GPT Copilot Link */}
          <Link
            to="/ai-copilot"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all hover:shadow"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-200" />
            <span>RAIL-GPT Copilot</span>
          </Link>

          {/* Quick RBAC Matrix Link */}
          <Link
            to="/rbac"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-sm transition-all hover:shadow"
          >
            <Key className="w-3.5 h-3.5 text-amber-300" />
            <span>RBAC Matrix</span>
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white"></span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-lg shadow-elevated border border-slate-200 py-1 z-50">
                <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Notifications</span>
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifMenu(false)}
                    className="text-[11px] text-rail-700 hover:underline font-medium"
                  >
                    View All
                  </Link>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {MOCK_NOTIFICATIONS.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        navigate(n.actionUrl);
                        setShowNotifMenu(false);
                      }}
                      className="px-3.5 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-slate-800">
                        <span className="line-clamp-1">{n.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-rail-900 text-white font-bold text-xs flex items-center justify-center border border-rail-700 font-mono">
                {user?.avatar || 'IR'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-lg shadow-elevated border border-slate-200 py-1 z-50">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <div className="font-semibold text-xs text-slate-900">{user?.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{user?.designation}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{user?.email}</div>
                </div>
                <Link
                  to="/rbac"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>RBAC & Governance</span>
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profile Overview</span>
                </Link>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      navigate('/login');
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
