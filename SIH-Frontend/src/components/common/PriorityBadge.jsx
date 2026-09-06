import React from 'react';
import { AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react';

export const PriorityBadge = ({ severity, score, className = '' }) => {
  const sev = (severity || '').toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Clock;
  let code = 'P4';

  if (sev.includes('critical')) {
    styles = 'bg-rose-100 text-rose-800 border-rose-300';
    Icon = AlertCircle;
    code = 'P1';
  } else if (sev.includes('high')) {
    styles = 'bg-amber-100 text-amber-800 border-amber-300';
    Icon = AlertTriangle;
    code = 'P2';
  } else if (sev.includes('medium')) {
    styles = 'bg-blue-100 text-blue-800 border-blue-300';
    Icon = Info;
    code = 'P3';
  } else {
    styles = 'bg-slate-100 text-slate-700 border-slate-300';
    Icon = Clock;
    code = 'P4';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold border ${styles} ${className}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{severity || code}</span>
      {score !== undefined && (
        <span className="ml-1 px-1.5 py-0.2 bg-white/70 rounded text-[10px] font-mono font-bold">
          {score}
        </span>
      )}
    </span>
  );
};
