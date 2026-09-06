import React, { useState, useEffect } from 'react';
import { ListOrdered, AlertCircle, Award, ArrowDown, HelpCircle, Filter } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { DepartmentBadge } from '../components/common/DepartmentBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { priorityService } from '../services/priorityService';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const PriorityScoring = () => {
  const [rankedTasks, setRankedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRanking = async () => {
      setLoading(true);
      try {
        const data = await priorityService.getPriorityScores();
        setRankedTasks(data);
      } finally {
        setLoading(false);
      }
    };
    loadRanking();
  }, []);

  const top3 = rankedTasks.slice(0, 3);

  const columns = [
    {
      header: 'Rank',
      key: 'rank',
      sortable: true,
      className: 'w-16 font-mono font-bold text-slate-800 text-center',
      render: (val) => {
        if (val === 1) return <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold">#1</span>;
        if (val === 2) return <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-bold">#2</span>;
        if (val === 3) return <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold">#3</span>;
        return <span className="text-slate-500 font-mono font-bold">#{val}</span>;
      }
    },
    {
      header: 'Task ID',
      key: 'id',
      sortable: true,
      className: 'w-28 font-mono font-bold text-rail-900',
      render: (val) => val
    },
    {
      header: 'Department',
      key: 'department',
      sortable: true,
      render: (val) => <DepartmentBadge department={val} showIcon={false} />
    },
    {
      header: 'Defect & Location',
      key: 'defectType',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-900 line-clamp-1">{row.defectType}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{row.location} ({row.corridor})</div>
        </div>
      )
    },
    {
      header: 'Severity',
      key: 'severity',
      sortable: true,
      render: (val) => <PriorityBadge severity={val} />
    },
    {
      header: 'Overdue Days',
      key: 'overdueDays',
      sortable: true,
      className: 'text-center font-mono font-semibold',
      render: (val) => `${val} days`
    },
    {
      header: 'Severity Wt',
      key: 'severityWeight',
      sortable: true,
      className: 'text-center font-mono font-bold text-slate-700',
      render: (val) => `× ${val}.0`
    },
    {
      header: 'Priority Score',
      key: 'priorityScore',
      sortable: true,
      className: 'w-28 text-center',
      render: (val) => (
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-10 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs shadow-sm">
            {val}
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (val) => <StatusBadge status={val} />
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Priority Scoring & Ranking Engine"
        subtitle="Objective ranking of maintenance demands calculated dynamically: Priority Score = Overdue Days × Severity Weight, augmented by corridor track classification and passenger impact factors."
        badge="Formula: Overdue Days × Severity Weight"
      />

      {/* Top 3 Visual Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {top3.map((task, idx) => {
          const colors = [
            { border: 'border-rose-400 bg-rose-50/40', badge: 'bg-rose-600', text: 'text-rose-700' },
            { border: 'border-amber-400 bg-amber-50/40', badge: 'bg-amber-600', text: 'text-amber-700' },
            { border: 'border-blue-400 bg-blue-50/40', badge: 'bg-blue-600', text: 'text-blue-700' }
          ][idx];

          return (
            <div
              key={task.id}
              className={`p-4 rounded-lg bg-white border-2 shadow-card flex flex-col justify-between ${colors.border}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded text-white font-mono font-extrabold text-xs ${colors.badge}`}>
                    RANK #{task.rank}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
                    <div className="text-xl font-extrabold font-mono text-slate-900 leading-none">
                      {task.priorityScore}
                    </div>
                  </div>
                </div>

                <div className="font-mono font-bold text-xs text-rail-900 mb-1">{task.id}</div>
                <div className="text-xs font-bold text-slate-800 line-clamp-1">{task.defectType}</div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-800">{task.department}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Overdue Factor:</span>
                  <span className="font-mono font-bold text-slate-800">{task.overdueDays} days ({task.severity} weight {task.severityWeight})</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Formula Explanation Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-rail-800 text-amber-300">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-ir-saffron uppercase tracking-wider text-[11px]">
              Scientific Prioritization Algorithm
            </div>
            <div className="text-slate-300 text-xs mt-0.5">
              Severity Weights: Critical = 4.0, High = 3.0, Medium = 2.0, Low = 1.0. Tasks with score &gt; 80 automatically enter shadow bundling candidates.
            </div>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded bg-rail-950 border border-rail-800 font-mono text-amber-300 font-bold text-xs shrink-0">
          Score = (Weight × 20) + (Overdue × 1.5)
        </div>
      </div>

      {/* Full Priority Table */}
      <DataTable
        columns={columns}
        data={rankedTasks}
        loading={loading}
        pageSize={10}
        searchKeys={['id', 'defectType', 'location', 'department', 'corridor']}
        searchPlaceholder="Search priority table..."
      />
    </div>
  );
};
