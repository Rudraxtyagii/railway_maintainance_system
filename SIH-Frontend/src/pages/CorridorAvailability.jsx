import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Train,
  CheckCircle2,
  Clock,
  Layers,
  AlertTriangle,
  ArrowRight,
  Filter,
  Eye,
  Plus
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { corridorService } from '../services/corridorService';
import { taskService } from '../services/taskService';
import { useToast } from '../context/ToastContext';
import { CORRIDORS } from '../data/mockData';

export const CorridorAvailability = () => {
  const { addToast } = useToast();
  const [selectedCorridor, setSelectedCorridor] = useState('NDLS-GZB');
  const [selectedDate, setSelectedDate] = useState('2026-09-08');
  const [windows, setWindows] = useState([]);
  const [selectedWindow, setSelectedWindow] = useState(null);
  const [loading, setLoading] = useState(true);

  // Time grid from 00:00 to 24:00 in 2-hour increments
  const timeSlots = [
    '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
    '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'
  ];

  // Train timetable simulation data for visual timetable representation
  const timetableSchedule = [
    { type: 'TRAIN', name: '12401 Magadh Exp', time: '00:30 – 01:15', line: 'UP Main', status: 'Passed' },
    { type: 'AVAILABLE', id: 'WIN-NDLS-01', name: 'AVAILABLE MAINTENANCE BLOCK', time: '01:30 – 04:30', duration: '3.0h', suitable: 3, line: 'UP Main & UP Slow' },
    { type: 'TRAIN', name: '14055 Brahmaputra Mail', time: '04:55 – 05:40', line: 'UP Main', status: 'Scheduled' },
    { type: 'TRAIN', name: 'EMU Suburban 64402', time: '06:30 – 08:30', line: 'UP Slow', status: 'Peak Suburban' },
    { type: 'TRAIN', name: '12002 Bhopal Shatabdi', time: '09:00 – 09:45', line: 'DN Main', status: 'Scheduled' },
    { type: 'TRAIN', name: 'CONCOR Container Freight', time: '10:15 – 12:30', line: 'Goods Loop', status: 'Scheduled' },
    { type: 'AVAILABLE', id: 'WIN-NDLS-02', name: 'AVAILABLE MAINTENANCE BLOCK', time: '13:00 – 15:00', duration: '2.0h', suitable: 2, line: 'DN Main' },
    { type: 'TRAIN', name: '12004 Lucknow Shatabdi', time: '15:20 – 16:05', line: 'DN Main', status: 'Scheduled' },
    { type: 'TRAIN', name: 'Evening Peak EMU 64408', time: '17:00 – 19:30', line: 'UP & DN Suburban', status: 'Peak Hours' },
    { type: 'AVAILABLE', id: 'WIN-NDLS-03', name: 'AVAILABLE NIGHT WINDOW', time: '23:30 – 03:00', duration: '3.5h', suitable: 4, line: 'All Lines' }
  ];

  useEffect(() => {
    const loadWindows = async () => {
      setLoading(true);
      try {
        const data = await corridorService.getCorridorWindows({
          corridor: selectedCorridor
        });
        setWindows(data);
      } finally {
        setLoading(false);
      }
    };
    loadWindows();
  }, [selectedCorridor, selectedDate]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corridor Availability & Timetable Visualizer"
        subtitle="Railway timetable-synchronized slot detection. Visualizes passenger/freight train occupancy graphs from COA and identifies available shadow gaps for maintenance blocks."
        badge="Live COA Timetable Graph"
      />

      {/* Corridor & Date Controls */}
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Corridor:</label>
            <select
              value={selectedCorridor}
              onChange={(e) => setSelectedCorridor(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-md font-semibold text-slate-800 focus:ring-1 focus:ring-rail-700 focus:outline-none"
            >
              {CORRIDORS.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-md font-medium text-slate-800 focus:ring-1 focus:ring-rail-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300"></span>
            <span className="text-slate-600">Train Occupancy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600"></span>
            <span className="text-slate-900 font-semibold">Available Block Window</span>
          </div>
        </div>
      </div>

      {/* Timetable Visual Timeline Area */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              24-Hour Corridor Timetable Graph: {selectedCorridor}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Target Date: <strong>{selectedDate}</strong> • Showing train paths vs maintenance intervals
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded font-semibold border border-emerald-200 font-mono">
            {windows.length} Available Block Slots
          </span>
        </div>

        {/* Timetable Vertical/Horizontal Flow */}
        <div className="space-y-3 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
          {timetableSchedule.map((slot, idx) => {
            const isBlock = slot.type === 'AVAILABLE';

            return (
              <div
                key={idx}
                className={`relative pl-14 transition-all ${
                  isBlock ? 'cursor-pointer' : ''
                }`}
                onClick={() => {
                  if (isBlock) {
                    const match = windows.find(w => w.id === slot.id) || windows[0];
                    setSelectedWindow(match);
                  }
                }}
              >
                {/* Node on the timetable track line */}
                <div
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isBlock
                      ? 'bg-emerald-500 border-emerald-600 ring-4 ring-emerald-100'
                      : 'bg-slate-300 border-slate-400'
                  }`}
                />

                {/* Timetable Slot Card */}
                <div
                  className={`p-3.5 rounded-lg border transition-all ${
                    isBlock
                      ? 'bg-emerald-50/80 border-emerald-300 hover:border-emerald-500 hover:shadow-card'
                      : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${isBlock ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {isBlock ? <CalendarDays className="w-4 h-4" /> : <Train className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold font-mono ${isBlock ? 'text-emerald-950' : 'text-slate-800'}`}>
                            {slot.name}
                          </span>
                          {isBlock && (
                            <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                              OPEN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {slot.line} {slot.status && `• ${slot.status}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{slot.time}</span>
                      </div>
                      {isBlock ? (
                        <button
                          onClick={() => {
                            const match = windows.find(w => w.id === slot.id) || windows[0];
                            setSelectedWindow(match);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <span>Slot Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 uppercase font-semibold">Occupied</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Window Detail Drawer / Modal */}
      {selectedWindow && (
        <Modal
          isOpen={Boolean(selectedWindow)}
          onClose={() => setSelectedWindow(null)}
          title={`Available Block Window: ${selectedWindow.id}`}
          subtitle={`Corridor: ${selectedWindow.corridor} • Track: ${selectedWindow.line}`}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500">
                Conflict Count: <strong className="text-rose-600">{selectedWindow.conflictCount}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedWindow(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    addToast({
                      title: 'Window Queued',
                      message: `${selectedWindow.id} added to the upcoming optimization cycle.`,
                      type: 'success'
                    });
                    setSelectedWindow(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rail-900 hover:bg-rail-800 rounded shadow-sm"
                >
                  Add to Planning Run
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Date</div>
                <div className="font-semibold text-slate-800 mt-1">{selectedWindow.date}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Time Window</div>
                <div className="font-semibold text-slate-800 mt-1">{selectedWindow.startTime} – {selectedWindow.endTime}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Duration</div>
                <div className="font-semibold text-emerald-700 mt-1 font-mono text-sm">{selectedWindow.durationHours} Hours</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Traffic Density</div>
                <div className="font-semibold text-slate-800 mt-1">{selectedWindow.trafficDensity}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Adjacent Train Occupancies (COA Feed)</div>
              <div className="text-slate-700 flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <span>Preceding Train Clearance:</span>
                <span className="font-semibold text-slate-900">{selectedWindow.occupancyBefore}</span>
              </div>
              <div className="text-slate-700 flex items-center justify-between pt-0.5">
                <span>Succeeding Train Expected:</span>
                <span className="font-semibold text-slate-900">{selectedWindow.occupancyAfter}</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold mb-2">Suitable Maintenance Tasks for Bundling ({selectedWindow.suitableTasks?.length})</div>
              <div className="space-y-1.5">
                {selectedWindow.suitableTasks?.map(tId => (
                  <div key={tId} className="p-2 rounded bg-slate-100 border border-slate-200 flex items-center justify-between">
                    <span className="font-mono font-bold text-rail-900">{tId}</span>
                    <span className="text-[11px] text-slate-600">Candidate for Shadow Permit</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
