import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Train, LockKeyhole, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Login = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password) {
      addToast({
        title: 'Validation Error',
        message: 'Please enter your registered email/username and password.',
        type: 'warning'
      });
      return;
    }

    setSubmitting(true);
    try {
      const loggedUser = await login(emailOrUsername.trim(), password);
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
                    CRIS
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
            <div>
              <h2 className="text-lg font-bold text-slate-900">Operations Console Sign-In</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your registered official email or CRIS username
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Registered Email / Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="e.g. rajesh.sharma@cris.org.in or planner.admin"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rail-700 focus:border-rail-700"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      addToast({
                        title: 'Password Assistance',
                        message: 'Contact your Senior DOM / Divisional IT administrator for credential assistance.',
                        type: 'info'
                      });
                    }}
                    className="text-[11px] text-rail-700 hover:underline"
                  >
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
                    placeholder="Enter account password"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rail-700 focus:border-rail-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="text-[11px] text-slate-500">
                  Database-backed RBAC authentication
                </span>
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  JWT Secured
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-rail-900 hover:bg-rail-800 text-white font-semibold text-xs rounded-md shadow-card hover:shadow-elevated transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{submitting ? 'Authenticating against Central Database...' : 'Sign In to RAILBLOCK'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Footer note */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center text-[11px] text-slate-500">
            Centralized Indian Railways Command • Multi-User Synchronized Architecture
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
