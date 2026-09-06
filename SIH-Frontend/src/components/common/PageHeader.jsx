import React from 'react';

export const PageHeader = ({
  title,
  subtitle,
  badge,
  actions,
  breadcrumbs
}) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
            {title}
          </h1>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rail-100 text-rail-900 border border-rail-200">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
