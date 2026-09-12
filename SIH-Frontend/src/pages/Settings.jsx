import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Monitor, Palette, Save, Trash2, RefreshCw, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';

export const Settings = () => {
  const { addToast } = useToast();
  const { isPlannerAdmin, user } = useAuth();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalSms, setCriticalSms] = useState(true);
  const [autoRefreshSecs, setAutoRefreshSecs] = useState('30');
  const [density, setDensity] = useState('compact');

  // Database Reset Modal State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    addToast({
      title: 'Preferences Saved',
      message: 'Operational display preferences have been updated.',
      type: 'success'
    });
  };

  const handleExecuteReset = async () => {
    setResetting(true);
    try {
      const res = await adminService.resetDatabase();
      addToast({
        title: 'Database Reset to Clean State',
        message: res.message || 'All dynamic maintenance queues wiped. Foundational users, corridors, and RAG manuals preserved.',
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

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Portal & Telemetry Settings"
        subtitle="Operational console configurations, notification dispatch rules, and system database management."
        badge="System Configuration"
      />

      {/* Admin High-Privilege Database Management Card */}
      {isPlannerAdmin && (
        <div className="bg-gradient-to-br from-slate-900 via-rail-950 to-slate-900 rounded-xl border border-red-900/50 shadow-elevated p-6 text-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Administrative Database Control
                </h3>
                <p className="text-[11px] text-slate-400">
                  Clean-slate purge and system initialization (Senior DOM / Central Planning only)
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 text-[10px] font-mono font-bold border border-red-700">
              HIGH PRIVILEGE
            </span>
          </div>

          <div className="p-3.5 bg-red-950/40 border border-red-900/60 rounded-lg text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2 text-red-400 font-bold text-[11px]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Clean Slate Reset Option:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Resetting the database will <strong>permanently clear all block requests, conflict analyses, bundles, generated schedules, and audit decision logs</strong>.
              All authenticatable railway personnel, corridor definitions, time windows, and official RAG knowledge manuals will remain preserved.
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-slate-400 font-mono">
              Authorized Authority: <span className="text-amber-300 font-semibold">{user?.name || 'Senior DOM'}</span> ({user?.role || 'PLANNER_ADMIN'})
            </div>
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow transition-all hover:shadow-lg"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Database to Clean State</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Reset */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="⚠️ Reset Railway Operational Database?"
        message="This action will permanently wipe all maintenance block requests, conflict logs, and schedules from PostgreSQL. Are you sure you want to initialize the system to a clean state?"
        confirmLabel={resetting ? "Purging Registers..." : "Yes, Reset to Clean State"}
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleExecuteReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Notification Preferences */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200 mb-4">
            <Bell className="w-4 h-4 text-rail-800" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Operational Notification Preferences
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <div>
                <div className="font-semibold text-slate-800">Critical Rail Defect Alerts</div>
                <div className="text-slate-500 text-[11px]">Instant flash alert when IMR rail flaw or OHE flashover risk is detected</div>
              </div>
              <input
                type="checkbox"
                checked={criticalSms}
                onChange={(e) => setCriticalSms(e.target.checked)}
                className="rounded border-slate-300 text-rail-800 focus:ring-rail-700 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
              <div>
                <div className="font-semibold text-slate-800">Schedule Dispatch Confirmations</div>
                <div className="text-slate-500 text-[11px]">Notification whenever a block is published to COA / FOIS train graphs</div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="rounded border-slate-300 text-rail-800 focus:ring-rail-700 w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* Display & Telemetry Preferences */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200 mb-4">
            <Monitor className="w-4 h-4 text-rail-800" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Display & Polling Preferences
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Data Refresh Polling Frequency
              </label>
              <select
                value={autoRefreshSecs}
                onChange={(e) => setAutoRefreshSecs(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700"
              >
                <option value="15">Every 15 seconds (Live Control)</option>
                <option value="30">Every 30 seconds (Standard)</option>
                <option value="60">Every 1 minute</option>
                <option value="0">Manual Polling Only</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Table Grid Density
              </label>
              <select
                value={density}
                onChange={(e) => setDensity(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700"
              >
                <option value="compact">High Density Compact (Control Center)</option>
                <option value="comfortable">Comfortable Grid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-rail-900 hover:bg-rail-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
