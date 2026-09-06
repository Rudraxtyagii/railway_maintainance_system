import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AICopilot } from './pages/AICopilot';
import { BlockRequests } from './pages/BlockRequests';
import { DataSync } from './pages/DataSync';
import { DataQuality } from './pages/DataQuality';
import { PriorityScoring } from './pages/PriorityScoring';
import { CorridorAvailability } from './pages/CorridorAvailability';
import { ConflictsBundling } from './pages/ConflictsBundling';
import { OptimizationEngine } from './pages/OptimizationEngine';
import { BlockSchedule } from './pages/BlockSchedule';
import { Validation } from './pages/Validation';
import { Performance } from './pages/Performance';
import { DowntimeAnalysis } from './pages/DowntimeAnalysis';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { RBACManagement } from './pages/RBACManagement';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RoleProtectedRoute({ children }) {
  const { user, canAccessRoute, currentRole } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessRoute(location.pathname)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white rounded-2xl border-2 border-red-200 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl font-bold">
          🔒
        </div>
        <div className="space-y-1">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-100 text-red-700">
            G&SR ADMINISTRATIVE BOUNDARY RESTRICTION
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">
            Restricted Operational Section
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Your active persona <strong className="font-mono text-slate-800">[{currentRole}]</strong> does not hold clearance to modify this module.
          </p>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left font-mono space-y-1">
          <div>• User: <span className="text-slate-800">{user.name}</span> ({user.designation})</div>
          <div>• Authority: <span className="text-slate-800">{user.department}</span></div>
          <div>• Required Role: <span className="text-emerald-700 font-bold">PLANNER_ADMIN / Senior DOM</span></div>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <a
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-rail-800 hover:bg-rail-900 text-white text-xs font-bold transition-all shadow-sm"
          >
            ← Return to Permitted Dashboard
          </a>
          <a
            href="/rbac"
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            Inspect RBAC Permissions Matrix
          </a>
        </div>
      </div>
    );
  }

  return children;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Main Application Shell Routes (Protected) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="ai-copilot" element={<AICopilot />} />
              <Route path="rail-gpt" element={<AICopilot />} />
              <Route path="block-requests" element={<BlockRequests />} />
              <Route path="data-sync" element={<RoleProtectedRoute><DataSync /></RoleProtectedRoute>} />
              <Route path="data-quality" element={<RoleProtectedRoute><DataQuality /></RoleProtectedRoute>} />
              <Route path="priority" element={<PriorityScoring />} />
              <Route path="corridor-availability" element={<CorridorAvailability />} />
              <Route path="conflicts" element={<ConflictsBundling />} />
              <Route path="optimization" element={<RoleProtectedRoute><OptimizationEngine /></RoleProtectedRoute>} />
              <Route path="schedule" element={<BlockSchedule />} />
              <Route path="validation" element={<Validation />} />
              <Route path="performance" element={<Performance />} />
              <Route path="downtime" element={<DowntimeAnalysis />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="rbac" element={<RBACManagement />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<RoleProtectedRoute><Settings /></RoleProtectedRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
