import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  CalendarDays
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { DepartmentBadge } from '../components/common/DepartmentBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { Modal } from '../components/common/Modal';
import { conflictService } from '../services/conflictService';
import { bundleService } from '../services/bundleService';
import { useToast } from '../context/ToastContext';

export const ConflictsBundling = () => {
  const { addToast } = useToast();
  const [conflicts, setConflicts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [confs, buns] = await Promise.all([
        conflictService.getConflicts(),
        bundleService.getBundleCandidates()
      ]);
      setConflicts(confs);
      setBundles(buns);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveConflict = async (conflictId) => {
    try {
      await conflictService.resolveConflict(conflictId, 'Approved for multi-department shadow permit window');
      addToast({
        title: 'Conflict Resolved',
        message: `${conflictId} resolved via integrated multi-department permit.`,
        type: 'success'
      });
      loadData();
      setSelectedConflict(null);
    } catch (err) {
      addToast({ title: 'Action Failed', message: err.message, type: 'error' });
    }
  };

  const handleAcceptBundle = async (bundleId) => {
    try {
      await bundleService.acceptBundle(bundleId);
      addToast({
        title: 'Bundle Accepted',
        message: `${bundleId} approved and committed to master schedule.`,
        type: 'success'
      });
      loadData();
    } catch (err) {
      addToast({ title: 'Action Failed', message: err.message, type: 'error' });
    }
  };

  const handleRejectBundle = async (bundleId) => {
    try {
      await bundleService.rejectBundle(bundleId);
      addToast({
        title: 'Bundle Rejected',
        message: `${bundleId} dissolved. Tasks will be scheduled individually.`,
        type: 'info'
      });
      loadData();
    } catch (err) {
      addToast({ title: 'Action Failed', message: err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conflict Center & Shadow Bundling Engine"
        subtitle="Detects spatial overlaps, traction power vs diesel track machine clashes, and synthesizes multi-departmental maintenance bundles to collapse total network downtime."
        badge="Spatial & Temporal De-confliction"
      />

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Conflicts"
          value="12"
          subtitle="Spatial / Power clashes"
          icon={AlertOctagon}
          statusColor="red"
        />
        <KpiCard
          title="Critical Conflicts"
          value="4"
          subtitle="Direct block collisions"
          icon={ShieldAlert}
          statusColor="red"
        />
        <KpiCard
          title="Bundle Candidates"
          value="8"
          subtitle="35% - 42% downtime reduction"
          icon={Layers}
          statusColor="indigo"
        />
        <KpiCard
          title="Resolved Clashes"
          value="4"
          subtitle="Joint work permits issued"
          icon={CheckCircle2}
          statusColor="green"
        />
      </div>

      {/* Section 1: Bundle Candidates (Top Priority Presentation) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              AI Multi-Disciplinary Bundle Candidates
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Shadow Bundling collapses parallel demands into single block windows
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bundles.map((bundle) => {
            const isAccepted = bundle.status === 'Accepted';
            const isRejected = bundle.status === 'Rejected';

            return (
              <div
                key={bundle.id}
                className="p-5 bg-white rounded-lg border border-slate-200 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-rail-900">{bundle.id}</span>
                        <StatusBadge status={bundle.status} />
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 mt-1">{bundle.title}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                        -{bundle.potentialDowntimeSavingPercent}% DOWNTIME
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    {bundle.description}
                  </p>

                  {/* Bundled Department Tasks */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2 mb-3">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Bundled Operations:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {bundle.departments.map(dept => (
                        <DepartmentBadge key={dept} department={dept} showIcon={false} />
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono flex items-center gap-2">
                      <span>Tasks:</span>
                      <span className="font-bold text-slate-800">{bundle.taskIds.join(', ')}</span>
                    </div>
                  </div>

                  {/* Duration Metrics: Manual vs Bundled */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-100/70 rounded text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Manual Total</div>
                      <div className="font-mono font-bold text-slate-600 line-through">{bundle.manualDurationTotalHours}h</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-700 font-semibold">Bundled Window</div>
                      <div className="font-mono font-bold text-emerald-800">{bundle.bundledDurationHours}h</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-700 font-semibold">Net Hours Saved</div>
                      <div className="font-mono font-bold text-emerald-800">+{bundle.hoursSaved}h</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Slot: {bundle.suggestedWindow}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedBundle(bundle)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded border border-slate-300 font-semibold text-[11px]"
                    >
                      View
                    </button>
                    {!isAccepted && !isRejected && (
                      <>
                        <button
                          onClick={() => handleRejectBundle(bundle.id)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 font-semibold text-[11px]"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAcceptBundle(bundle.id)}
                          className="px-3 py-1 bg-rail-900 hover:bg-rail-800 text-white rounded font-semibold text-[11px] shadow-sm"
                        >
                          Accept Bundle
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Active Conflicts Register */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Active Inter-Departmental Conflicts Register
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Click row to review conflict resolution protocol
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                <th className="px-4 py-3">Conflict ID</th>
                <th className="px-4 py-3">Corridor</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Involved Departments</th>
                <th className="px-4 py-3">Conflict Classification</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {conflicts.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedConflict(c)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-bold text-rose-700">{c.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{c.corridor}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono">
                    {c.date} • {c.startTime}-{c.endTime}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.departments.map(d => (
                        <span key={d} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium border border-slate-200">
                          {d}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">
                    {c.conflictType}
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge severity={c.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {c.status !== 'Resolved' ? (
                      <button
                        onClick={() => handleResolveConflict(c.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                      >
                        Resolve
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolved
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conflict Review Modal */}
      {selectedConflict && (
        <Modal
          isOpen={Boolean(selectedConflict)}
          onClose={() => setSelectedConflict(null)}
          title={`Conflict Protocol: ${selectedConflict.id}`}
          subtitle={`${selectedConflict.conflictType} on ${selectedConflict.corridor}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500">Status: <strong>{selectedConflict.status}</strong></span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedConflict(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
                >
                  Close
                </button>
                {selectedConflict.status !== 'Resolved' && (
                  <button
                    onClick={() => handleResolveConflict(selectedConflict.id)}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-sm"
                  >
                    Accept Shadow Resolution
                  </button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
              <div className="text-[10px] uppercase font-bold text-rose-700 mb-1">Operational Clash Description:</div>
              <p className="text-slate-800 leading-relaxed">{selectedConflict.description}</p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-[10px] uppercase font-bold text-emerald-800 mb-1">AI Recommended Shadow Resolution:</div>
              <p className="text-slate-800 leading-relaxed font-medium">{selectedConflict.resolutionProposal}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500">Involved Task IDs:</span>
              <span className="font-mono font-bold text-slate-800">{selectedConflict.taskIds.join(' , ')}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Bundle Details Modal */}
      {selectedBundle && (
        <Modal
          isOpen={Boolean(selectedBundle)}
          onClose={() => setSelectedBundle(null)}
          title={`Bundle Details: ${selectedBundle.id}`}
          subtitle={selectedBundle.title}
          footer={
            <button
              onClick={() => setSelectedBundle(null)}
              className="px-4 py-1.5 bg-rail-900 text-white rounded text-xs font-semibold"
            >
              Close
            </button>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-700 leading-relaxed">
              {selectedBundle.description}
            </p>
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-100 rounded">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Suggested Time:</span>
                <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">{selectedBundle.suggestedWindow}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Downtime Reduction:</span>
                <div className="font-mono font-bold text-emerald-700 text-sm mt-0.5">-{selectedBundle.potentialDowntimeSavingPercent}% ({selectedBundle.hoursSaved}h saved)</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
