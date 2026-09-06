import React from 'react';

export const LoadingSkeleton = ({ count = 5, className = '' }) => {
  return (
    <div className={`space-y-3 p-4 bg-white rounded-lg border border-slate-200 ${className}`}>
      <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4"></div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-8 bg-slate-100 rounded animate-pulse w-12 shrink-0"></div>
            <div className="h-8 bg-slate-100 rounded animate-pulse flex-1"></div>
            <div className="h-8 bg-slate-100 rounded animate-pulse w-24 shrink-0"></div>
            <div className="h-8 bg-slate-100 rounded animate-pulse w-16 shrink-0"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
