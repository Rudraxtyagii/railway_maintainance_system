import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Sparkles,
  ArrowDown,
  Search,
  Eye,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { DepartmentBadge } from '../components/common/DepartmentBadge';
import { Modal } from '../components/common/Modal';
import { dataQualityService } from '../services/dataQualityService';
import { useToast } from '../context/ToastContext';

export const DataQuality = () => {
  const { addToast } = useToast();
  const [qualityData, setQualityData] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [customText, setCustomText] = useState('');
  const [customParsed, setCustomParsed] = useState(null);
  const [parsingActive, setParsingActive] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const data = await dataQualityService.getDataQuality();
      setQualityData(data);
      if (data.sampleUnstructured.length > 0) {
        setSelectedRecord(data.sampleUnstructured[0]);
      }
    };
    loadData();
  }, []);

  const handleTestParse = async (e) => {
    e.preventDefault();
    if (!customText.trim()) return;
    setParsingActive(true);
    try {
      const parsed = await dataQualityService.parseUnstructuredDefect(customText);
      setCustomParsed(parsed);
      addToast({
        title: 'NLP Extraction Complete',
        message: `Extracted ${parsed.defectType} with confidence ${parsed.confidenceScore}.`,
        type: 'success'
      });
    } finally {
      setParsingActive(false);
    }
  };

  if (!qualityData) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Quality Center & NLP Text Extraction"
        subtitle="Deduplication, outlier detection, and natural language structured attribute parsing from raw, informal station diaries, control telegrams, and TMS maintenance logs."
        badge="NLP Parser Engine"
      />

      {/* 6 Quality Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          title="Total Raw Records"
          value={qualityData.totalRawRecords.toLocaleString()}
          subtitle="All input streams"
          icon={FileCheck2}
          statusColor="blue"
        />
        <KpiCard
          title="Clean Records"
          value={qualityData.cleanRecords.toLocaleString()}
          subtitle="Schema compliant"
          icon={CheckCircle2}
          statusColor="green"
        />
        <KpiCard
          title="Duplicate Records"
          value={qualityData.duplicateRecords}
          subtitle="Merged / Suppressed"
          icon={Copy}
          statusColor="amber"
        />
        <KpiCard
          title="Outliers"
          value={qualityData.outliers}
          subtitle="Statistical anomalies"
          icon={AlertTriangle}
          statusColor="red"
        />
        <KpiCard
          title="Parsed Records"
          value={qualityData.parsedRecords.toLocaleString()}
          subtitle="Auto NLP tagged"
          icon={Sparkles}
          statusColor="green"
        />
        <KpiCard
          title="Needs Review"
          value={qualityData.recordsRequiringReview}
          subtitle="Human validation"
          icon={AlertTriangle}
          statusColor="amber"
        />
      </div>

      {/* Free Text Parsing Visual Breakdown (Hero Section for SIH) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-card p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-rail-800" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Unstructured Defect Text Parsing Pipeline
              </h2>
              <p className="text-xs text-slate-500">
                Transforms informal station controller notes into structured parameters for the optimization algorithm
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 bg-rail-50 text-rail-800 rounded font-semibold border border-rail-200">
            Transformer / Regex Heuristics
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Stage 1: Raw Note */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between h-full">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>1. Original Raw Description</span>
                <span className="text-[10px] text-slate-400 font-mono">Source: {selectedRecord?.source}</span>
              </div>
              <p className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed italic">
                "{selectedRecord?.rawText}"
              </p>
            </div>
            <div className="text-[10px] text-slate-400 mt-3">
              Informal notation with missing capitalization and shorthand keywords.
            </div>
          </div>

          {/* Stage 2: Parsing Process Indicator */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50/70 rounded-lg border border-dashed border-slate-300 text-center">
            <div className="w-10 h-10 rounded-full bg-rail-800 text-amber-300 flex items-center justify-center mb-2 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900 mb-1">
              Natural Language Parsing
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs mb-3">
              Entity recognition extracts location, defect classification, severity weight, and responsible department.
            </p>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confidence: {selectedRecord?.parsed?.confidenceScore}</span>
            </div>
          </div>

          {/* Stage 3: Structured Normalized Output */}
          <div className="p-4 rounded-lg bg-rail-950 text-white flex flex-col justify-between h-full">
            <div>
              <div className="text-[11px] font-bold text-ir-saffron uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>2. Structured Attributes</span>
                <span className="text-[10px] bg-rail-900 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                  {selectedRecord?.parsingStatus}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-rail-900/80 rounded border border-rail-800">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-white">{selectedRecord?.parsed?.department}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-rail-900/80 rounded border border-rail-800">
                  <span className="text-slate-400">Defect Type:</span>
                  <span className="font-semibold text-white truncate max-w-[150px]">{selectedRecord?.parsed?.defectType}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-rail-900/80 rounded border border-rail-800">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-semibold text-white font-mono">{selectedRecord?.parsed?.location}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-rail-900/80 rounded border border-rail-800">
                  <span className="text-slate-400">Severity:</span>
                  <span className="font-bold text-rose-400">{selectedRecord?.parsed?.severity}</span>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-rail-900">
              Ready for priority scoring engine and shadow bundling.
            </div>
          </div>
        </div>

        {/* Quick selector of other samples */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] text-slate-500 font-semibold shrink-0">Try Other Raw Samples:</span>
          {qualityData.sampleUnstructured.map((rec) => (
            <button
              key={rec.id}
              onClick={() => setSelectedRecord(rec)}
              className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
                selectedRecord?.id === rec.id
                  ? 'bg-rail-800 text-white font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {rec.id}: {rec.source}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Free-Text Tester for Live SIH Demonstrations */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-card p-5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
          Interactive Live Text Parser Test
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Type or paste an informal railway defect message to test the parsing extractor in real-time.
        </p>

        <form onSubmit={handleTestParse} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. urgent ohe spark at mast 21/04 ghaziabad down line contact wire cracked"
              className="flex-1 p-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-rail-700 focus:outline-none"
            />
            <button
              type="submit"
              disabled={parsingActive || !customText.trim()}
              className="px-4 py-2 bg-rail-900 hover:bg-rail-800 text-white rounded-md text-xs font-semibold shrink-0 shadow-sm disabled:opacity-50"
            >
              {parsingActive ? 'Parsing...' : 'Parse Text'}
            </button>
          </div>

          {customParsed && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs animate-in fade-in">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Department:</span>
                <div className="font-bold text-slate-800">{customParsed.department}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Defect Type:</span>
                <div className="font-bold text-slate-800 truncate">{customParsed.defectType}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Location:</span>
                <div className="font-mono font-bold text-slate-800">{customParsed.location}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Severity:</span>
                <div className="font-bold text-rose-600">{customParsed.severity}</div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
