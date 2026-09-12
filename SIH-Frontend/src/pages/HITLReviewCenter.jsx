import React, { useState, useEffect } from 'react';
import { hitlService } from '../services/hitlService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function HITLReviewCenter() {
  const { user, isFieldController, isPlannerAdmin, currentRole } = useAuth();
  const { showToast } = useToast();

  const [pendingTasks, setPendingTasks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'AUDIT_TRAIL' | 'OVERRIDE'

  // Selected task for review modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [actionType, setActionType] = useState('APPROVE');
  const [modifiedStartTime, setModifiedStartTime] = useState('');
  const [modifiedEndTime, setModifiedEndTime] = useState('');
  const [modifiedSpeed, setModifiedSpeed] = useState(30);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Emergency override state
  const [overrideTaskId, setOverrideTaskId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideJustification, setOverrideJustification] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pending, audit] = await Promise.all([
        hitlService.getPendingReviews().catch(() => []),
        hitlService.getAuditTrail(30).catch(() => [])
      ]);
      setPendingTasks(pending || []);
      setAuditLogs(audit || []);
    } catch (err) {
      console.warn('Error loading HITL data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleRealtime = () => {
      loadData();
    };

    window.addEventListener('railblock:hitl_decision', handleRealtime);
    window.addEventListener('railblock:task_created', handleRealtime);
    window.addEventListener('railblock:metrics_updated', handleRealtime);

    return () => {
      window.removeEventListener('railblock:hitl_decision', handleRealtime);
      window.removeEventListener('railblock:task_created', handleRealtime);
      window.removeEventListener('railblock:metrics_updated', handleRealtime);
    };
  }, []);

  const openReviewModal = (task, action = 'APPROVE') => {
    setSelectedTask(task);
    setActionType(action);
    setModifiedStartTime(task.plannedStartTime || '01:30');
    setModifiedEndTime(task.plannedEndTime || '04:30');
    setModifiedSpeed(task.speedRestrictionKmph || 30);
    setRemarks(`Sanction accorded by ${user?.name || 'Section Controller'} (${currentRole}) in compliance with G&SR.`);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setSubmitting(true);
    try {
      const res = await hitlService.submitReview({
        taskId: selectedTask.id,
        action: actionType,
        modifiedStartTime: actionType === 'MODIFY' ? modifiedStartTime : null,
        modifiedEndTime: actionType === 'MODIFY' ? modifiedEndTime : null,
        modifiedSpeedRestriction: actionType === 'MODIFY' ? Number(modifiedSpeed) : null,
        remarks: remarks
      });

      showToast(`Block ${selectedTask.id} ${actionType === 'APPROVE' ? 'Sanctioned' : actionType === 'MODIFY' ? 'Modified & Approved' : 'Denied'} successfully! Digital Signature: ${res.digitalSignature?.slice(0, 16)}...`, 'success');
      setSelectedTask(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to submit review decision', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideTaskId || !overrideReason) {
      showToast('Please specify Task ID and Emergency Justification', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await hitlService.emergencyOverride({
        taskId: overrideTaskId,
        reason: overrideReason,
        emergencyJustification: overrideJustification
      });

      showToast(`Emergency Priority Override active on ${overrideTaskId}! Priority set to 100.`, 'success');
      setOverrideTaskId('');
      setOverrideReason('');
      setOverrideJustification('');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Override failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rail-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                G&SR RULE 15.06 & 17.03 GOVERNANCE
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-emerald-400 font-mono font-semibold">HUMAN-IN-THE-LOOP ACTIVE</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">Section Controller & Sr. DOM Review Command</h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Live Human-in-the-Loop sanction queue. No AI-generated or stream-ingested block executes without verified Section Controller authority, window adjustments, and cryptographic audit signatures.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'PENDING' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Pending Reviews ({pendingTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('AUDIT_TRAIL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'AUDIT_TRAIL' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Audit Trail ({auditLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('OVERRIDE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'OVERRIDE' ? 'bg-red-600 text-white shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Emergency Override
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'PENDING' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Corridor Block Requests Requiring Human Sanction</h2>
              <p className="text-xs text-slate-500">Review departmental demands, verify safety clearance, and issue formal block sanctions.</p>
            </div>
            <button
              onClick={loadData}
              className="text-xs font-mono text-indigo-600 hover:text-indigo-800 font-bold"
            >
              ↻ Refresh Live Queue
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-sm">Loading live review queue...</div>
          ) : pendingTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="text-4xl mb-2">✅</div>
              <p className="font-semibold text-slate-700">All corridor block demands have been sanctioned or reviewed.</p>
              <p className="text-xs text-slate-500 mt-1">New incoming COA streams and engineer requests will surface here in real time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                    <th className="p-3">ID & SOURCE</th>
                    <th className="p-3">SECTION & CORRIDOR</th>
                    <th className="p-3">DEPT & WORK TYPE</th>
                    <th className="p-3">TIME WINDOW</th>
                    <th className="p-3">PRIORITY</th>
                    <th className="p-3">TRAFFIC IMPACT</th>
                    <th className="p-3 text-right">CONTROLLER ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {pendingTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="p-3">
                        <div className="font-mono font-bold text-indigo-950">{t.id}</div>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 mt-0.5">
                          {t.source || 'COA'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{t.sectionName || t.corridor}</div>
                        <div className="text-slate-500 text-[11px] font-mono">{t.lineType || 'UP Main'} • {t.location}</div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          t.department?.includes('Civil') || t.department?.includes('Eng') ? 'bg-sky-100 text-sky-800' :
                          t.department?.includes('Traction') ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {t.department}
                        </span>
                        <div className="text-slate-600 mt-0.5 font-medium max-w-xs truncate">{t.defectType || t.description}</div>
                      </td>
                      <td className="p-3 font-mono">
                        <div className="font-bold text-slate-800">{t.preferredWindow || '01:30 - 04:30'}</div>
                        <div className="text-slate-500 text-[11px]">{t.requestedDate} ({t.durationHours} hrs)</div>
                      </td>
                      <td className="p-3 font-mono">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          t.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                          t.severity === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          P-{t.priorityScore} ({t.severity})
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-600">
                        <div>{t.trafficImpactStatus || 'Zero Delay'}</div>
                        {t.requiresPowerBlock && <span className="text-amber-700 font-mono font-bold text-[10px]">⚡ 25kV Power Block</span>}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => openReviewModal(t, 'APPROVE')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          ✓ Sanction
                        </button>
                        <button
                          onClick={() => openReviewModal(t, 'MODIFY')}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          ⚙ Adjust
                        </button>
                        <button
                          onClick={() => openReviewModal(t, 'REJECT')}
                          className="px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs transition-all"
                        >
                          ✕ Deny
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'AUDIT_TRAIL' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cryptographic Controller Action Log</h2>
              <p className="text-xs text-slate-500">Immutable ledger of all approvals, modifications, and emergency overrides.</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
              SHA-256 Verified
            </span>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      log.action === 'APPROVE' || log.action === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      log.action === 'MODIFY' || log.action === 'MODIFIED' ? 'bg-indigo-100 text-indigo-800' :
                      log.action === 'EMERGENCY_OVERRIDE' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-800">{log.taskId || log.scheduleId}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-medium">Controller: {log.controllerName}</span>
                  </div>
                  <p className="text-slate-600 italic">"{log.remarks || 'Standard sanction recorded'}"</p>
                </div>
                <div className="text-right space-y-0.5 font-mono text-[11px]">
                  <div className="text-indigo-600 font-semibold">{log.digitalSignature}</div>
                  <div className="text-slate-400">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Override Tab */}
      {activeTab === 'OVERRIDE' && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6 space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-2 border-b border-red-100 pb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-slate-900">Chief Controller Emergency Override</h2>
            <p className="text-xs text-slate-600">
              Escalate safety-critical defects (e.g. rail fracture, OHE snap, track buckling) to Priority 100 with immediate corridor possession sanction.
            </p>
          </div>

          <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Task ID / Block Request</label>
              <input
                type="text"
                value={overrideTaskId}
                onChange={(e) => setOverrideTaskId(e.target.value)}
                placeholder="e.g. TSK-101 or TSK-COA-1D9715"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Emergency Category</label>
              <select
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-sans text-xs focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="">Select Emergency Reason...</option>
                <option value="Severe Rail Fracture / Track Distortion">Severe Rail Fracture / Track Distortion</option>
                <option value="25kV OHE Contact Wire Breakage / Mast Damage">25kV OHE Contact Wire Breakage / Mast Damage</option>
                <option value="Interlocking Point Machine Complete Failure">Interlocking Point Machine Complete Failure</option>
                <option value="Track Settlement Post Monsoon / Flash Flood">Track Settlement Post Monsoon / Flash Flood</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Detailed Operating Justification</label>
              <textarea
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
                rows={3}
                placeholder="Enter field inspector report, milepost location, and immediate traffic diversion directives..."
                className="w-full p-2.5 rounded-xl border border-slate-300 font-sans text-xs focus:ring-2 focus:ring-red-500"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all"
            >
              {submitting ? 'Authenticating & Sanctioning Override...' : '⚡ Sanction Emergency Priority 100 Override'}
            </button>
          </form>
        </div>
      )}

      {/* Review Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className={`p-4 text-white font-bold text-sm flex items-center justify-between ${
              actionType === 'APPROVE' ? 'bg-emerald-700' : actionType === 'MODIFY' ? 'bg-indigo-700' : 'bg-red-700'
            }`}>
              <span>{actionType === 'APPROVE' ? 'Sanction Corridor Block' : actionType === 'MODIFY' ? 'Adjust & Sanction Window' : 'Deny Block Request'}</span>
              <button onClick={() => setSelectedTask(null)} className="text-white hover:opacity-80">✕</button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-[11px]">
                <div className="font-bold text-slate-900">{selectedTask.id} • {selectedTask.sectionName || selectedTask.corridor}</div>
                <div className="text-slate-600">{selectedTask.department} • {selectedTask.defectType}</div>
                <div className="text-slate-500">Requested: {selectedTask.requestedDate} ({selectedTask.preferredWindow})</div>
              </div>

              {actionType === 'MODIFY' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Adjusted Start Time</label>
                    <input
                      type="text"
                      value={modifiedStartTime}
                      onChange={(e) => setModifiedStartTime(e.target.value)}
                      placeholder="01:30"
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Adjusted End Time</label>
                    <input
                      type="text"
                      value={modifiedEndTime}
                      onChange={(e) => setModifiedEndTime(e.target.value)}
                      placeholder="04:30"
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Speed Restriction (KMPH)</label>
                    <input
                      type="number"
                      value={modifiedSpeed}
                      onChange={(e) => setModifiedSpeed(e.target.value)}
                      min="15"
                      max="110"
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Section Controller Remarks / Directives</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-sans text-xs focus:ring-2 focus:ring-indigo-500"
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 rounded-xl text-white font-bold shadow-md transition-all ${
                    actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    actionType === 'MODIFY' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'Authorizing...' : 'Confirm Decision & Sign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default HITLReviewCenter;
