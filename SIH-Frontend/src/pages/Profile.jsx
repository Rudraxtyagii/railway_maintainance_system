import React from 'react';
import { User, Shield, Building2, MapPin, Mail, Clock, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';

export const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="User Profile & Departmental Authorization"
        subtitle="Current authenticated identity, jurisdictional authority, and system authorization level."
        badge="CRIS Identity Directory"
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-200">
          <div className="w-16 h-16 rounded-full bg-rail-900 text-white font-bold text-xl flex items-center justify-center font-mono border-2 border-rail-700 shadow-sm">
            {user?.avatar || 'IR'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-rail-100 text-rail-900 border border-rail-200">
                {user?.role}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">{user?.designation}</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</div>
          </div>
          <StatusBadge status="Connected" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-rail-700" />
              <span>Departmental Assignment</span>
            </div>
            <div className="font-semibold text-slate-800 text-sm">{user?.department}</div>
            <div className="text-slate-500">Ministry of Railways, Government of India</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rail-700" />
              <span>Zone & Divisional Jurisdiction</span>
            </div>
            <div className="font-semibold text-slate-800 text-sm">{user?.zone} • {user?.division}</div>
            <div className="text-slate-500">Jurisdiction includes Northern Corridor HDN-1</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rail-700" />
              <span>Last Authenticated Session</span>
            </div>
            <div className="font-mono font-bold text-slate-800 text-sm">{user?.lastLogin} IST</div>
            <div className="text-slate-500">CRIS Secure SSO Portal</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>Authorization Capabilities</span>
            </div>
            <div className="font-semibold text-emerald-700 text-sm">
              {user?.role === 'PLANNER_ADMIN' ? 'Full Authority (Optimizer, Approval, Publish)' : 'Departmental Submitter (View & Request)'}
            </div>
            <div className="text-slate-500">Spring Security Role-Based Access Control</div>
          </div>
        </div>
      </div>
    </div>
  );
};
