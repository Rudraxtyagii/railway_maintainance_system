import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Clock, Database, Radio, Wrench, Zap, ArrowRight, Activity } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { syncService } from '../services/syncService';
import { useToast } from '../context/ToastContext';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const DataSync = () => {
  const { addToast } = useToast();
  const [sources, setSources] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingSource, setSyncingSource] = useState(null);
  const [syncProgress, setSyncProgress] = useState(0);

  const loadSyncData = async () => {
    try {
      setLoading(true);
      const [srcs, hist] = await Promise.all([
        syncService.getSyncStatus(),
        syncService.getSyncHistory()
      ]);
      setSources(srcs);
      setHistory(hist);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSyncData();
  }, []);

  const handleSyncTrigger = async (sourceId = null) => {
    setSyncingSource(sourceId || 'ALL');
    setSyncProgress(10);

    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 150);

    try {
      const res = await syncService.startDataSync(sourceId);
      clearInterval(interval);
      setSyncProgress(100);

      setTimeout(() => {
        setSources(res.updatedSources);
        setHistory(prev => [res.historyItem, ...prev]);
        setSyncingSource(null);
        setSyncProgress(0);
        addToast({
          title: 'Data Ingestion Complete',
          message: `Synchronized ${res.historyItem.records} records from ${res.historyItem.source}.`,
          type: 'success'
        });
      }, 300);
    } catch (err) {
      clearInterval(interval);
      setSyncingSource(null);
      setSyncProgress(0);
      addToast({ title: 'Sync Failed', message: err.message, type: 'error' });
    }
  };

  const getSourceIcon = (id) => {
    if (id === 'TMS') return Wrench;
    if (id === 'TDMS') return Zap;
    if (id === 'SMMS') return Radio;
    return Activity;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Data Ingestion & Synchronization Hub"
        subtitle="Live automated connectors to Indian Railways departmental silos: Track Management System (TMS), Traction Distribution (TDMS), Signal Maintenance (SMMS), and Control Office Application (COA)."
        badge="Multi-Source Ingestion Engine"
        actions={
          <button
            onClick={() => handleSyncTrigger(null)}
            disabled={Boolean(syncingSource)}
            className="flex items-center gap-2 px-4 py-2 bg-rail-900 hover:bg-rail-800 text-white rounded-md text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingSource ? 'animate-spin' : ''}`} />
            <span>{syncingSource ? 'Synchronizing All Feeds...' : 'Sync All Feeds'}</span>
          </button>
        }
      />

      {/* Sync Progress Bar if Active */}
      {syncingSource && (
        <div className="p-4 bg-white rounded-lg border border-rail-200 shadow-card animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-2">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-rail-700 animate-spin" />
              <span>Ingesting Feed from {syncingSource === 'ALL' ? 'All Connected Railways Systems' : syncingSource}...</span>
            </span>
            <span className="font-mono text-rail-900">{syncProgress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rail-700 transition-all duration-200 rounded-full"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Validating schema integrity & running deduplication pipeline...</span>
            <span className="font-mono text-[10px]">REST / WebSocket Channel</span>
          </div>
        </div>
      )}

      {/* 4 Source Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sources.map((src) => {
          const Icon = getSourceIcon(src.id);
          const isThisSyncing = syncingSource === src.id || syncingSource === 'ALL';

          return (
            <div
              key={src.id}
              className="bg-white rounded-lg border border-slate-200 shadow-card p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-rail-900 border border-slate-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  <StatusBadge status={src.status} />
                </div>

                <h3 className="text-sm font-bold text-slate-900 font-mono">{src.id}</h3>
                <div className="text-xs font-medium text-slate-700 mb-1">{src.name}</div>
                <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                  {src.description}
                </p>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Last Synced:</span>
                    <span className="font-medium text-slate-700 font-mono">
                      {new Date(src.lastSyncTime).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Records Ingested:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {src.recordsReceived.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-medium">Successful:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {src.recordsSuccess.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-rose-600 font-medium">Failed / Corrupt:</span>
                    <span className="font-bold text-rose-600 font-mono">
                      {src.recordsFailed}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">{src.frequency}</span>
                <button
                  onClick={() => handleSyncTrigger(src.id)}
                  disabled={Boolean(syncingSource)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-rail-800 hover:bg-rail-50 rounded border border-rail-200 transition-colors disabled:opacity-50"
                >
                  {isThisSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync History Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rail-800" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Sync Execution Log
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Auto-polling interval: 15 minutes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <th className="px-4 py-3">Sync ID</th>
                <th className="px-4 py-3">Source System</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3 text-right">Records Ingested</th>
                <th className="px-4 py-3 text-right">Success</th>
                <th className="px-4 py-3 text-right">Failed</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{h.id}</td>
                  <td className="px-4 py-3 font-semibold text-rail-900">{h.source}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono">{h.started}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono">{h.completed}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{h.records}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">{h.success}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">{h.failed}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={h.status.includes('Success') ? 'Success' : 'Warning'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
