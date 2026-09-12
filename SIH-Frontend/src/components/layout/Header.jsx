import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, ChevronDown, Check, LogOut, Shield, Train, ExternalLink, Sparkles, Bot, Key, LockKeyhole, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';

export const Header = () => {
  const { user, switchUser, logout, availableUsers, isPlannerAdmin, currentRole, realtimeStatus } = useAuth();
  const navigate = useNavigate();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const roleRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const fetchLiveNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();

    const handleLiveEvent = (e) => {
      const detail = e.detail;
      if (!detail || detail.type === 'NOTIFICATION_CREATED' || detail.type === 'TASK_CREATED' || detail.type === 'HITL_DECISION_ENTERED' || detail.type === 'SCHEDULE_APPROVED') {
        fetchLiveNotifications();
      }
    };

    window.addEventListener('railblock:realtime_event', handleLiveEvent);
    window.addEventListener('railblock:notification_created', handleLiveEvent);

    const handleClickOutside = (e) => {
      if (roleRef.current && !roleRef.current.contains(e.target)) setShowRoleMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifMenu(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('railblock:realtime_event', handleLiveEvent);
      window.removeEventListener('railblock:notification_created', handleLiveEvent);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadNotifs = notifications.filter(n => n.unread || n.read === false);

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
          {/* Real-time Stream Status Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 font-mono">
            <span className={`w-2 h-2 rounded-full ${
              realtimeStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' :
              realtimeStatus === 'CONNECTING' ? 'bg-amber-400 animate-ping' : 'bg-red-500'
            }`}></span>
            <span className={realtimeStatus === 'CONNECTED' ? 'text-emerald-300 font-bold' : 'text-amber-300'}>
              {realtimeStatus === 'CONNECTED' ? 'CRIS REAL-TIME STREAM ACTIVE' : 'CONNECTING STREAM...'}
            </span>
          </div>
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
                AI-Powered Automatic Block Planning & RAG Command System
              </p>
            </div>
          </Link>
        </div>

        {/* Right Action Tools: Role Switcher, Quick Links, Notifs, User Profile */}
        <div className="flex items-center gap-2.5">
          {/* Persona Switcher Dropdown */}
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
                          <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold text-white bg-slate-700">
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

          {/* Conditional Role Action Tools */}
          {isPlannerAdmin ? (
            <>
              {/* Quick HITL Link */}
              <Link
                to="/hitl-review"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all hover:shadow"
              >
                <Shield className="w-3.5 h-3.5 text-amber-200" />
                <span>HITL Review</span>
              </Link>

              {/* Quick RAIL-GPT Copilot Link */}
              <Link
                to="/ai-copilot"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all hover:shadow"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-200" />
                <span>RAIL-GPT (RAG)</span>
              </Link>
            </>
          ) : (
            <>
              {/* Department User: Quick New Block Request */}
              <Link
                to="/block-requests"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <span>+ Create Request</span>
              </Link>

              {/* Department User: Quick Copilot */}
              <Link
                to="/ai-copilot"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-200" />
                <span>RAIL-GPT</span>
              </Link>
            </>
          )}

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-1.5 w-84 bg-white rounded-lg shadow-elevated border border-slate-200 py-1 z-50">
                <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Notifications</span>
                    {unreadNotifs.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">
                        {unreadNotifs.length} new
                      </span>
                    )}
                  </div>
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifMenu(false)}
                    className="text-[11px] text-rail-700 hover:underline font-medium"
                  >
                    View All
                  </Link>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No notifications at this time.
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={async () => {
                          await notificationService.markAsRead(n.id);
                          fetchLiveNotifications();
                          navigate(n.actionUrl || '/block-requests');
                          setShowNotifMenu(false);
                        }}
                        className={`px-3.5 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                          n.unread || n.read === false ? 'bg-amber-50/40 font-medium' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                          <span className="line-clamp-1">{n.title}</span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-normal ml-2">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-2 rounded-md hover:bg-slate-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-rail-800 text-white font-bold flex items-center justify-center text-xs">
                {user?.avatar || 'IR'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-lg shadow-elevated border border-slate-200 py-1 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="font-semibold text-xs text-slate-900">{user?.name}</div>
                  <div className="text-[11px] text-slate-500">{user?.email}</div>
                  <div className="text-[10px] font-mono text-rail-700 font-bold mt-0.5">{user?.role}</div>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Account Profile
                </Link>
                <Link
                  to="/rbac"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Permissions Matrix
                </Link>
                {isPlannerAdmin && (
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-3 py-1.5 text-xs text-amber-800 hover:bg-amber-50 font-medium flex items-center justify-between"
                  >
                    <span>Admin Settings & Reset DB</span>
                    <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-800 rounded font-bold">Admin</span>
                  </Link>
                )}
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
