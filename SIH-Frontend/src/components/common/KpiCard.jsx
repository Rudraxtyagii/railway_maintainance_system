import React from 'react';

export const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'up',
  statusColor = 'blue',
  onClick,
  className = ''
}) => {
  const accentColors = {
    blue: 'border-l-rail-700 text-rail-700 bg-rail-50/50',
    amber: 'border-l-amber-500 text-amber-600 bg-amber-50/40',
    red: 'border-l-rose-600 text-rose-600 bg-rose-50/40',
    green: 'border-l-emerald-600 text-emerald-600 bg-emerald-50/40',
    indigo: 'border-l-indigo-600 text-indigo-600 bg-indigo-50/40',
  }[statusColor] || 'border-l-slate-400 text-slate-600 bg-slate-50/40';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-slate-200 border-l-4 p-4 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between ${accentColors} ${onClick ? 'cursor-pointer hover:border-slate-300' : ''} ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </div>
        {Icon && (
          <div className="p-2 rounded-md bg-slate-50 border border-slate-100 text-slate-600">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="my-2">
        <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {subtitle}
          </div>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 pt-1 border-t border-slate-100/80">
          <span className={trendDirection === 'down' ? 'text-emerald-600' : 'text-slate-600'}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );
};
