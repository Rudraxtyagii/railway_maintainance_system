import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Monitor, Palette, Save } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { useToast } from '../context/ToastContext';

export const Settings = () => {
  const { addToast } = useToast();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalSms, setCriticalSms] = useState(true);
  const [autoRefreshSecs, setAutoRefreshSecs] = useState('30');
  const [density, setDensity] = useState('compact');

  const handleSave = (e) => {
    e.preventDefault();
    addToast({
      title: 'Preferences Saved',
      message: 'Operational display preferences have been updated.',
      type: 'success'
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Portal & Telemetry Settings"
        subtitle="Operational console configurations, notification dispatch rules, and polling intervals."
        badge="System Configuration"
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
