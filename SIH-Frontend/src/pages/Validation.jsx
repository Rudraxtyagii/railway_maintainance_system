import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  Train,
  Check
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { validationService } from '../services/validationService';
import { useToast } from '../context/ToastContext';

export const Validation = () => {
  const { addToast } = useToast();
  const [report, setReport] = useState(null);
  const [validating, setValidating] = useState(false);

  const runValidationCheck = async () => {
    setValidating(true);
    try {
      const data = await validationService.validateSchedule();
      setReport(data);
      addToast({
        title: 'Validation Completed',
        message: 'Master schedule verified against COA graph. Overall status: VALID.',
        type: 'success'
      });
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    runValidationCheck();
  }, []);

  if (!report) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule Safety & Clash Validation"
        subtitle="Automated 5-point safety verification protocol. Validates generated maintenance blocks against passenger train timetables, statutory duration ceilings, and inter-departmental buffer zones."
        badge="CRIS Statutory Safety Engine"
        actions={
          <button
            onClick={runValidationCheck}
            disabled={validating}
            className="flex items-center gap-2 px-4 py-2 bg-rail-900 hover:bg-rail-800 text-white rounded-md text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${validating ? 'animate-spin' : ''}`} />
            <span>{validating ? 'Re-validating Constraints...' : 'Re-Run Validation'}</span>
          </button>
        }
      />

      {/* Overall Verification Status Banner */}
      <div className={`p-6 rounded-xl border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        report.overallStatus === 'VALID'
          ? 'bg-emerald-900 text-white border-emerald-700'
          : 'bg-rose-900 text-white border-rose-700'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            {report.overallStatus === 'VALID' ? (
              <ShieldCheck className="w-7 h-7 text-emerald-300" />
            ) : (
              <XCircle className="w-7 h-7 text-rose-300" />
            )}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-200">
              System Verification Verdict
            </div>
            <h2 className="text-xl font-bold tracking-tight font-mono">
              {report.overallStatus === 'VALID' ? 'MASTER BLOCK SCHEDULE IS VALID' : 'VALIDATION FAILED'}
            </h2>
            <p className="text-xs text-slate-200 mt-0.5 max-w-2xl leading-relaxed">
              {report.overallMessage}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-emerald-200 block">Validated At</span>
          <span className="font-mono text-xs text-white">
            {new Date(report.validatedAt).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* 5 Core Statutory Checks Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 font-mono">
          5-Point Railway Statutory Verification Matrix
        </h3>

        <div className="space-y-3">
          {report.checks.map((chk) => {
            const isPassed = chk.status === 'Passed';
            const isWarning = chk.status === 'Warning';
            const isFailed = chk.status === 'Failed';

            return (
              <div
                key={chk.id}
                className={`p-4 rounded-lg border transition-all ${
                  isPassed
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : isWarning
                    ? 'bg-amber-50/50 border-amber-300'
                    : 'bg-rose-50/50 border-rose-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isPassed && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                      {isFailed && <XCircle className="w-5 h-5 text-rose-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{chk.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">({chk.id})</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{chk.description}</p>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium italic">
                        {chk.details}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-8 sm:pl-0">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono uppercase ${
                      isPassed
                        ? 'bg-emerald-100 text-emerald-800'
                        : isWarning
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {chk.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advisory & Identified Issues Section */}
      {report.issues.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Actionable Schedule Advisories & Anomalies ({report.issues.length})
            </h3>
          </div>

          <div className="space-y-3">
            {report.issues.map((issue, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-amber-50/60 border border-amber-200 text-xs">
                <div className="flex items-center justify-between font-mono font-bold text-slate-800 mb-1">
                  <span>{issue.blockCode} • {issue.corridor} ({issue.time})</span>
                  <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                    {issue.severity}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 mb-0.5">{issue.problem}</div>
                <div className="text-slate-600 mb-2">{issue.reason}</div>
                <div className="p-2 bg-white rounded border border-amber-200 text-slate-800 flex items-center gap-2">
                  <span className="font-bold text-rail-800">Suggested Action:</span>
                  <span>{issue.suggestedAction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
