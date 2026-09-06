import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Cpu,
  Clock,
  Sparkles,
  Layers,
  AlertOctagon,
  BarChart2,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { analyticsService } from '../services/analyticsService';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const Performance = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadPerf = async () => {
      const res = await analyticsService.getPerformanceMetrics();
      setData(res);
    };
    loadPerf();
  }, []);

  if (!data) return <LoadingSkeleton count={6} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Engine Throughput & System Performance"
        subtitle="Mathematical optimization benchmarks, constraint satisfaction convergence rates, and monthly corridor utilization trends."
        badge="MILP Solver Diagnostics"
      />

      {/* 8 Performance KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <KpiCard
          title="Requests"
          value={data.totalRequestsProcessed}
          subtitle="Processed"
          icon={Activity}
          statusColor="blue"
        />
        <KpiCard
          title="Avg Time"
          value={`${data.averageProcessingTimeSeconds}s`}
          subtitle="Sub-second"
          icon={Clock}
          statusColor="green"
        />
        <KpiCard
          title="Blocks"
          value={data.blocksGenerated}
          subtitle="Synthesized"
          icon={Sparkles}
          statusColor="green"
        />
        <KpiCard
          title="Conflicts"
          value={data.conflictsResolved}
          subtitle="Resolved"
          icon={AlertOctagon}
          statusColor="red"
        />
        <KpiCard
          title="Bundles"
          value={data.bundlesCreated}
          subtitle="Created"
          icon={Layers}
          statusColor="indigo"
        />
        <KpiCard
          title="Utilization"
          value={data.scheduleUtilization}
          subtitle="Capacity peak"
          icon={Gauge}
          statusColor="green"
        />
        <KpiCard
          title="Scheduled"
          value={data.tasksScheduled}
          subtitle="Allocated"
          icon={TrendingUp}
          statusColor="green"
        />
        <KpiCard
          title="Pending"
          value={data.tasksPending}
          subtitle="Low urgency"
          icon={Clock}
          statusColor="amber"
        />
      </div>

      {/* Visual Charts: Monthly Utilization & Block Count Reduction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Month by Month Block Utilization Trend */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Corridor Track Slot Utilization Trend
              </h3>
              <p className="text-[11px] text-slate-400">Steady efficiency increase across operational trials</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
              74% → 89%
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trends} margin={{ top: 10, right: 20, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[65, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '11px', color: '#fff' }}
                  formatter={(val) => [`${val}%`, 'Utilization']}
                />
                <Line
                  type="monotone"
                  dataKey="utilization"
                  stroke="#0d223a"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ff7722', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Traditional Manual Blocks vs AI Consolidated Blocks */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Manual Separate Blocks vs Consolidated AI Blocks
              </h3>
              <p className="text-[11px] text-slate-400">Shadow bundling cuts total track traffic interruptions in half</p>
            </div>
            <span className="text-xs font-bold text-rail-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
              ~50% Fewer Closures
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trends} margin={{ top: 10, right: 20, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '11px', color: '#fff' }}
                />
                <Bar dataKey="manualBlocks" name="Separate Manual Closures" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="aiBlocks" name="Consolidated AI Windows" fill="#0d223a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
