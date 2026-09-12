import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Train, Shield, LockKeyhole, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Login = () => {
  const { user, login, availableUsers } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('planner.admin');
  const [password, setPassword] = useState('••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedUser = await login(username, password);
      addToast({
        title: 'Authentication Successful',
        message: `Welcome, ${loggedUser.name} (${loggedUser.designation || loggedUser.department}).`,
        type: 'success'
      });
      if (loggedUser.role === 'PLANNER_ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/block-requests');
      }
    } catch (err) {
      addToast({
        title: 'Authentication Failed',
        message: err.message || 'Invalid credentials',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickSelect = (u) => {
    setUsername(u.username);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between text-slate-100 selection:bg-ir-saffron selection:text-white">
      {/* Top Gov Strip */}
      <div className="bg-rail-950 px-4 py-2 border-b border-rail-900 text-[11px] text-slate-400 flex items-center justify-between">
        <div>भारत सरकार • GOVERNMENT OF INDIA | रेल मंत्रालय • MINISTRY OF RAILWAYS</div>
        <div className="font-mono text-amber-300">SIH PS 26027 • CRIS</div>
      </div>

      {/* Main Login Box */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-rail-900 px-6 py-6 text-white border-b border-rail-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rail-800 border border-rail-700 flex items-center justify-center text-ir-saffron shadow">
                <Train className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold font-mono tracking-tight text-white">RAILBLOCK</span>
                  <span className="text-[10px] bg-ir-saffron text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    Portal
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  AI-Powered Automatic Block Planning System
                </div>
              </div>
            </div>
          </div>

          {/* Form Area */}
          <div className="p-6 sm:p-8 space-y-6">
            {user && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Active Session</div>
                  <div className="text-xs font-semibold text-emerald-900">{user.name} ({user.role === 'PLANNER_ADMIN' ? 'Planner / Admin' : user.department})</div>
                </div>
                <button
                  onClick={() => navigate(user.role === 'PLANNER_ADMIN' ? '/dashboard' : '/block-requests')}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <span>{user.role === 'PLANNER_ADMIN' ? 'Dashboard' : 'Block Requests'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-slate-900">Operations Sign-In</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sign in using your CRIS credentials or departmental token
              </p>
            </div>

            {/* Quick Demo Switcher */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Shield className="w-3 h-3 text-rail-700" />
                <span>Quick Select Persona for SIH Evaluation:</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u)}
                    className={`px-2 py-1.5 rounded text-left border text-[11px] transition-all ${
                      username === u.username
                        ? 'bg-rail-800 text-white border-rail-800 font-semibold shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="truncate">{u.name}</div>
                    <div className={`text-[10px] truncate ${username === u.username ? 'text-amber-300' : 'text-slate-400'}`}>
                      {u.role === 'PLANNER_ADMIN' ? 'Planner / Admin' : u.department}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  CRIS User ID / Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. planner.admin"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rail-700 focus:border-rail-700"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Password / Token
                  </label>
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); addToast({ title: 'Self-Service Recovery', message: 'Contact your Divisional Telecom/IT administrator.', type: 'info' }); }} className="text-[11px] text-rail-700 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rail-700 focus:border-rail-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-rail-800 focus:ring-rail-700"
                  />
                  <span>Remember my workstation</span>
                </label>
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  JWT Ready
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-rail-900 hover:bg-rail-800 text-white font-semibold text-xs rounded-md shadow-card hover:shadow-elevated transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{submitting ? 'Authenticating...' : 'Sign In to Operations Console'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Footer note */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center text-[11px] text-slate-500">
            National Railway Scheduling Infrastructure • Restricted Government Use
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="p-3 text-center text-xs text-slate-500">
        Smart India Hackathon 2024/2026 • Problem Statement 26027 • Ministry of Railways
      </div>
    </div>
  );
};
