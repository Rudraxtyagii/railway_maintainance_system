import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, AlertCircle, AlertTriangle, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { notificationService } from '../services/notificationService';
import { useToast } from '../context/ToastContext';

export const Notifications = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([]);

  const loadNotifs = async () => {
    const data = await notificationService.getNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    addToast({ title: 'Notifications Cleared', message: 'All alerts marked as read.', type: 'info' });
    loadNotifs();
  };

  const handleItemClick = async (notif) => {
    await notificationService.markAsRead(notif.id);
    navigate(notif.actionUrl);
  };

  const getIcon = (type) => {
    if (type === 'critical') return <AlertCircle className="w-5 h-5 text-rose-600" />;
    if (type === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    if (type === 'success') return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    return <Info className="w-5 h-5 text-rail-700" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification & Operational Alerts Center"
        subtitle="Real-time broadcast events including critical track flaws, COA schedule synchronization events, and multi-department conflict triggers."
        badge="Live Telemetry Feed"
        actions={
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-card divide-y divide-slate-100 overflow-hidden">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => handleItemClick(n)}
            className={`p-4 flex items-start gap-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors ${
              n.unread ? 'bg-rail-50/20' : ''
            }`}
          >
            <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">
              {getIcon(n.type)}
            </div>

            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`font-bold text-slate-900 ${n.unread ? 'font-extrabold' : ''}`}>
                  {n.title}
                </span>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {n.timestamp}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed max-w-2xl">
                {n.message}
              </p>
            </div>

            <div className="shrink-0 flex items-center text-rail-700 text-xs font-semibold gap-1 hover:underline">
              <span className="hidden sm:inline">Open</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
