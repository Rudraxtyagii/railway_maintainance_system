import React, { useState, useEffect } from 'react';
import {
  Hourglass,
  TrendingDown,
  TrendingUp,
  Award,
  DollarSign,
  Clock,
  ShieldCheck,
  CheckCircle2,
  BarChart2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { analyticsService } from '../services/analyticsService';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const DowntimeAnalysis = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const res = await analyticsService.getDowntimeAnalysis();
      setData(res);
    };
    loadData();
  }, []);

  if (!data) return <LoadingSkeleton count={6} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Downtime Savings & Business Value Analysis"
        subtitle="Direct comparative analysis measuring total track outage hours under fragmented manual planning versus synchronized AI block planning."
        badge="40% Network Downtime Reduction"
      />

      {/* Hero Downtime Comparison KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 border-l-4 border-l-slate-400 shadow-card">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Manual Planning Downtime
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-800 my-2">
            {data.summary.manualPlanningHours} hrs
          </div>
          <div className="text-xs text-slate-400">
            Uncoordinated separate traffic blocks
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 border-l-4 border-l-emerald-600 shadow-card">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Optimized AI Downtime
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-700 my-2">
            {data.summary.optimizedPlanningHours} hrs
          </div>
          <div className="text-xs text-emerald-600 font-semibold">
            Consolidated shadow bundle windows
          </div>
        </div>

        <div className="p-5 rounded-xl bg-emerald-900 text-white shadow-elevated border border-emerald-800">
          <div className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
            Net Downtime Saved
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-300 my-2">
            {data.summary.downtimeSavedHours} hrs
          </div>
          <div className="text-xs font-bold text-emerald-100 flex items-center gap-1">
            <TrendingDown className="w-4 h-4" />
            <span>40.0% Reduction in Track Closures</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 border-l-4 border-l-rail-800 shadow-card">
          <div className="text-xs font-bold text-rail-900 uppercase tracking-wider">
            Monetary Impact Value
          </div>
          <div className="text-3xl font-extrabold font-mono text-rail-950 my-2">
            {data.summary.monetarySavingsEstimateCrores}
          </div>
          <div className="text-xs text-slate-500">
            Punctuality penalty & freight delay savings
          </div>
        </div>
      </div>

      {/* Main Comparative Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Comparison (Manual vs AI) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Day-by-Day Track Outage Hours
              </h3>
              <p className="text-[11px] text-slate-400">Comparing manual isolated hours vs AI bundle hours</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              -48h Net Total
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyComparison} margin={{ top: 10, right: 20, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '11px', color: '#fff' }}
                  formatter={(val, name) => [`${val} Hours`, name === 'manual' ? 'Manual Planning' : 'Optimized Planning']}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="manual" name="Manual Planning (Hours)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="optimized" name="Optimized Planning (Hours)" fill="#0d223a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Department Breakdown of Savings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Downtime Reduction by Department
              </h3>
              <p className="text-[11px] text-slate-400">Engineering, Traction, and Signaling benefits</p>
            </div>
            <span className="text-xs font-mono font-bold text-rail-900 bg-slate-100 px-2 py-0.5 rounded">
              All 3 Depts Benefitted
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byDepartment} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="department" type="category" width={110} tick={{ fontSize: 10, fill: '#334155' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '11px', color: '#fff' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="manualHours" name="Manual Hours" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
                <Bar dataKey="savedHours" name="Hours Saved" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Corridor Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 font-mono">
          Corridor-Level Efficiency Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.corridorSavings.map((c) => (
            <div key={c.corridor} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-mono font-bold text-xs text-rail-900 mb-2">{c.corridor}</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Manual Required:</span>
                  <span className="font-mono font-bold text-slate-700">{c.manual}h</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>AI Scheduled:</span>
                  <span className="font-mono font-bold text-slate-700">{c.optimized}h</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-emerald-700 font-bold">
                  <span>Net Hours Saved:</span>
                  <span className="font-mono">+{c.saved}h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
