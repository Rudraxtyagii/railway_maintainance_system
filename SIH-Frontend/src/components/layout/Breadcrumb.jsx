import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS = {
  'dashboard': 'Dashboard',
  'block-requests': 'Block Requests',
  'data-sync': 'Data Sync & Ingestion',
  'data-quality': 'Data Quality Center',
  'priority': 'Priority Scoring & Ranking',
  'corridor-availability': 'Corridor Timetable Availability',
  'conflicts': 'Conflict & Bundling Center',
  'optimization': 'Automatic Block Optimizer',
  'schedule': 'Master Block Schedule',
  'validation': 'Schedule Safety Validation',
  'performance': 'System Performance',
  'downtime': 'Downtime Savings Analysis',
  'notifications': 'Notification Center',
  'profile': 'User Profile',
  'settings': 'System Settings'
};

export const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || pathnames[0] === 'login') return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 py-2.5 px-6 bg-slate-50/70 border-b border-slate-200">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 text-slate-600 hover:text-rail-800 transition-colors font-medium"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Portal</span>
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = ROUTE_LABELS[name] || name;

        return (
          <React.Fragment key={name}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800 tracking-tight">{label}</span>
            ) : (
              <Link to={routeTo} className="hover:text-rail-800 transition-colors">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
