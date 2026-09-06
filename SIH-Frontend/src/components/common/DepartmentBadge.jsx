import React from 'react';
import { Wrench, Zap, Radio } from 'lucide-react';

export const DepartmentBadge = ({ department, showIcon = true, className = '' }) => {
  const dept = (department || '').toLowerCase();

  let label = department;
  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Wrench;

  if (dept.includes('engineering') || dept.includes('tms')) {
    label = 'Engineering (TMS)';
    styles = 'bg-sky-50 text-sky-800 border-sky-200';
    Icon = Wrench;
  } else if (dept.includes('traction') || dept.includes('trd') || dept.includes('tdms')) {
    label = 'Traction Dist. (TDMS)';
    styles = 'bg-orange-50 text-orange-800 border-orange-200';
    Icon = Zap;
  } else if (dept.includes('signal') || dept.includes('s&t') || dept.includes('smms')) {
    label = 'Signal & Telecom (SMMS)';
    styles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    Icon = Radio;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold border ${styles} ${className}`}>
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{label}</span>
    </span>
  );
};
