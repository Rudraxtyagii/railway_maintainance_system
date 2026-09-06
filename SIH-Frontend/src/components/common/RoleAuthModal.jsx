import React, { useState } from 'react';
import {
  ShieldCheck,
  LockKeyhole,
  Key,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  Train,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const RoleAuthModal = () => {
  const {
    isAuthModalOpen,
    pendingTargetUser,
    closeRoleAuthModal,
    authorizeAndSwitch,
    user: currentUser
  } = useAuth();
  const { addToast } = useToast();

  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthModalOpen || !pendingTargetUser) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await authorizeAndSwitch(pinInput);
      addToast({
        title: 'Operational Role Authorized',
        message: `Clearance granted for ${pendingTargetUser.name} [${pendingTargetUser.role}].`,
        type: 'success'
      });
      setPinInput('');
      closeRoleAuthModal();
    } catch (err) {
      setErrorMsg(err.message || 'Authorization failed. Please check PIN or passcode.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    setPinInput(pendingTargetUser.pin || '1234');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-rail-950 via-slate-900 to-rail-950 px-6 py-5 text-white border-b border-rail-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-mono font-bold shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                  CRIS SSO • SECURITY CLEARANCE
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                Role Assumption & Security Authorization
              </h3>
            </div>
          </div>
          <button
            onClick={closeRoleAuthModal}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transition Overview */}
        <div className="p-6 space-y-5">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between text-xs">
            {/* Current */}
            <div className="space-y-0.5 max-w-[42%]">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">CURRENT SESSION</span>
              <div className="font-bold text-slate-800 truncate">{currentUser?.name || 'Guest Officer'}</div>
              <div className="text-[10px] font-mono text-slate-500 truncate">{currentUser?.role || 'UNAUTHENTICATED'}</div>
            </div>

            <div className="p-2 rounded-full bg-slate-200 text-slate-600 shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>

            {/* Target */}
            <div className="space-y-0.5 text-right max-w-[42%]">
              <span className="text-[10px] text-emerald-700 font-mono font-bold uppercase block">TARGET ROLE</span>
              <div className="font-bold text-emerald-900 truncate">{pendingTargetUser.name}</div>
              <div className="text-[10px] font-mono font-bold text-amber-700 truncate">{pendingTargetUser.role}</div>
            </div>
          </div>

          {/* Target Officer Profile Box */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-rail-900/5 to-slate-100 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Designation:</span>
              <span className="font-bold text-slate-900 text-right">{pendingTargetUser.designation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Branch / Department:</span>
              <span className="font-semibold text-slate-800">{pendingTargetUser.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Official Employee ID:</span>
              <span className="font-mono text-slate-700 font-bold">{pendingTargetUser.employeeId || 'IR-CRIS-7740'}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">Statutory Authority:</span>
              <span className="font-mono font-bold text-emerald-700">{pendingTargetUser.clearanceLevel || 'Level 3 Scoped'}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Officer Security Clearance PIN / Passcode *
                </label>
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="text-[11px] font-mono font-bold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Auto-Fill Passcode (1234)</span>
                </button>
              </div>

              <div className="relative">
                <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Enter 4-digit PIN (1234) or CRIS Passcode"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-rail-800 focus:bg-white"
                />
              </div>

              {errorMsg && (
                <div className="mt-2 p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium flex items-center gap-1.5 animate-shake">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* G&SR Legal Advisory */}
            <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Statutory G&SR Rule Advisory (Chapter XVII):</span>
              </div>
              <p>
                Assuming this role transfers operational sign-off power for block granting, PTW validation, and timetable capacity. All activities are cryptographically signed to the CRIS audit trail.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeRoleAuthModal}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !pinInput.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-rail-900 hover:bg-rail-800 rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Key className="w-3.5 h-3.5 text-amber-300" />
                <span>{loading ? 'Verifying Clearance...' : 'Authorize & Assume Role'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
