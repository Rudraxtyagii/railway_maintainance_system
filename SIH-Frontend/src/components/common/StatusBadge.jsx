import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  const normalized = (status || '').toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['approved', 'valid', 'completed', 'available', 'resolved', 'success', 'published'].includes(normalized)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['pending', 'warning', 'review', 'reviewing', 'under review', 'pending approval', 'candidate'].includes(normalized)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['conflict', 'critical', 'error', 'failed', 'rejected', 'new'].includes(normalized)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['active', 'processing', 'scheduled', 'optimized', 'connected', 'ai parsed'].includes(normalized)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (['draft', 'normal', 'inactive', 'closed'].includes(normalized)) {
    styles = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase ${styles} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {status}
    </span>
  );
};
