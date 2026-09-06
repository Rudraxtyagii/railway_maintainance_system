import React from 'react';
import { Database } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Database,
  title = 'No records found',
  description = 'There are no active records matching your criteria.',
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-4">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-rail-800 hover:bg-rail-900 rounded-md shadow-sm transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
