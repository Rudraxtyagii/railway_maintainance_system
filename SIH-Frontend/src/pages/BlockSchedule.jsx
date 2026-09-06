import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  UploadCloud,
  Filter,
  Eye,
  Train,
  Check
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { DepartmentBadge } from '../components/common/DepartmentBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { scheduleService } from '../services/scheduleService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CORRIDORS } from '../data/mockData';

export const BlockSchedule = () => {
  const { isPlannerAdmin } = useAuth();
  const { addToast } = useToast();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('Timeline'); // 'Day' | 'Week' | 'Month' | 'Timeline'
  const [corridorFilter, setCorridorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await scheduleService.getSchedules({
        corridor: corridorFilter,
        status: statusFilter
      });
      setSchedules(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [corridorFilter, statusFilter]);

  const handleApprove = async (id) => {
    try {
      await scheduleService.approveSchedule(id);
      addToast({
        title: 'Block Approved',
        message: `Maintenance block ${id} approved by operating planning.`,
        type: 'success'
      });
      loadSchedules();
      setSelectedSchedule(null);
    } catch (err) {
      addToast({ title: 'Approval Failed', message: err.message, type: 'error' });
    }
  };

  const handleReject = async (id) => {
    try {
      await scheduleService.rejectSchedule(id, 'Conflict with high-priority freight paths');
      addToast({
        title: 'Block Rescheduled',
        message: `Block ${id} returned to draft status for adjustment.`,
        type: 'warning'
      });
      loadSchedules();
      setSelectedSchedule(null);
    } catch (err) {
      addToast({ title: 'Action Failed', message: err.message, type: 'error' });
    }
  };

  const handlePublishConfirm = async () => {
    if (!publishTarget) return;
    try {
      await scheduleService.publishSchedule(publishTarget.id);
      addToast({
        title: 'Schedule Dispatched',
        message: `${publishTarget.blockCode} published to live COA and FOIS systems.`,
        type: 'success'
      });
      setPublishTarget(null);
      loadSchedules();
      setSelectedSchedule(null);
    } catch (err) {
      addToast({ title: 'Publish Failed', message: err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Block Schedule"
        subtitle="Official railway maintenance timetable. Tracks multi-departmental block permits, traffic/power isolation clearance, and synchronization with COA/FOIS train graphs."
        badge="Live Operating Calendar"
        actions={
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-slate-300 shadow-sm text-xs font-semibold">
            {['Timeline', 'Day', 'Week', 'Month'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === mode
                    ? 'bg-rail-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Corridor Filter:</label>
            <select
              value={corridorFilter}
              onChange={(e) => setCorridorFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded font-medium focus:ring-1 focus:ring-rail-700"
            >
              <option value="ALL">All HDN Corridors</option>
              {CORRIDORS.map(c => (
                <option key={c.id} value={c.id}>{c.id} ({c.name.split('(')[0]})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status Filter:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded font-medium focus:ring-1 focus:ring-rail-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Published">Published (Dispatched to COA)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs">
            Showing <strong className="text-slate-900">{schedules.length}</strong> scheduled block windows
          </span>
        </div>
      </div>

      {/* Timeline View Presentation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Maintenance Blocks Schedule Matrix ({viewMode} View)
          </h2>
          <span className="text-xs text-slate-500">
            Click any block card to open approval drawer
          </span>
        </div>

        <div className="space-y-4">
          {schedules.map((blk) => (
            <div
              key={blk.id}
              onClick={() => setSelectedSchedule(blk)}
              className="p-4 rounded-lg border border-slate-200 hover:border-rail-700 bg-slate-50/60 hover:bg-white shadow-sm hover:shadow-card cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-rail-900 text-white flex items-center justify-center shrink-0 font-mono font-bold text-xs shadow-sm">
                  {blk.corridor.slice(0, 3)}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs text-rail-950 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {blk.blockCode}
                    </span>
                    <span className="font-bold text-xs text-slate-800">{blk.corridorName}</span>
                    <StatusBadge status={blk.status} />
                  </div>

                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{blk.date} • {blk.startTime} – {blk.endTime} ({blk.durationHours} hrs)</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>Speed Caution: <strong className="text-slate-700">{blk.speedRestrictionKmph} km/h</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2">
                    {blk.departments.map(d => (
                      <DepartmentBadge key={d} department={d} showIcon={false} />
                    ))}
                    <span className="text-[11px] text-slate-500 font-mono font-semibold ml-2">
                      {blk.tasksCount} Tasks Bundled
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 text-xs">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Efficiency Gain</div>
                  <div className="font-mono font-bold text-emerald-700 text-sm">+{blk.efficiencyGainPercent}%</div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSchedule(blk);
                  }}
                  className="px-3.5 py-1.5 bg-rail-900 text-white rounded text-xs font-semibold hover:bg-rail-800 transition-colors shadow-sm"
                >
                  Manage Block
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Detail & Approval Drawer / Modal */}
      {selectedSchedule && (
        <Modal
          isOpen={Boolean(selectedSchedule)}
          onClose={() => setSelectedSchedule(null)}
          title={`Block Specification: ${selectedSchedule.blockCode}`}
          subtitle={`${selectedSchedule.corridorName} • Scheduled: ${selectedSchedule.date}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500">
                {selectedSchedule.controllerApproval}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedSchedule(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
                >
                  Close
                </button>

                {isPlannerAdmin && (
                  <>
                    {selectedSchedule.status !== 'Approved' && selectedSchedule.status !== 'Published' && (
                      <button
                        onClick={() => handleApprove(selectedSchedule.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-sm"
                      >
                        Approve Block
                      </button>
                    )}
                    {selectedSchedule.status === 'Approved' && (
                      <button
                        onClick={() => setPublishTarget(selectedSchedule)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rail-900 hover:bg-rail-800 rounded shadow-sm flex items-center gap-1.5"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Publish to COA</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Date</div>
                <div className="font-semibold text-slate-800 mt-1">{selectedSchedule.date}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Allocated Time</div>
                <div className="font-semibold text-slate-800 mt-1">{selectedSchedule.startTime} – {selectedSchedule.endTime}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Duration</div>
                <div className="font-semibold text-emerald-700 mt-1 font-mono">{selectedSchedule.durationHours} Hours</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Status</div>
                <div className="mt-1"><StatusBadge status={selectedSchedule.status} /></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded border border-slate-200">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Traffic Block Status</div>
                <div className="font-bold text-slate-800 mt-0.5">
                  {selectedSchedule.trafficBlockGranted ? 'Granted by Chief Operating Controller' : 'Pending Formal Traffic Permit'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">25kV Power Block Status</div>
                <div className="font-bold text-slate-800 mt-0.5">
                  {selectedSchedule.powerBlockGranted ? 'Power Isolation Permit Approved' : 'No Traction Isolation Required'}
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1.5">Bundled Maintenance Work Orders ({selectedSchedule.taskIds.length})</div>
              <div className="space-y-1.5">
                {selectedSchedule.taskIds.map(tId => (
                  <div key={tId} className="p-2.5 bg-slate-100 rounded border border-slate-200 flex items-center justify-between font-mono">
                    <span className="font-bold text-rail-900">{tId}</span>
                    <span className="text-[11px] text-slate-600">Synchronized Joint Permit</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Publish Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(publishTarget)}
        onClose={() => setPublishTarget(null)}
        onConfirm={handlePublishConfirm}
        title="Publish Maintenance Block to COA / FOIS"
        message={`Are you sure you want to publish ${publishTarget?.blockCode} on corridor ${publishTarget?.corridorName}? This will broadcast the maintenance block to all active railway traffic controllers and crew booking systems.`}
        confirmText="Publish to Live Systems"
      />
    </div>
  );
};
