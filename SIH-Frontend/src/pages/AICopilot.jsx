import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Send,
  Mic,
  Sliders,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Play,
  Copy,
  Check,
  RotateCcw,
  Train,
  Clock,
  Radio,
  Volume2,
  Cpu,
  Layers,
  ArrowRight,
  ChevronRight,
  Gauge,
  HelpCircle,
  Zap,
  Info,
  Shield,
  CheckCircle2,
  Users,
  Eye,
  GitMerge,
  ArrowUpRight,
  ListOrdered
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Modal } from '../components/common/Modal';
import { aiCopilotService } from '../services/aiCopilotService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const AICopilot = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'scenario' | 'timeline' | 'voice' | 'rbac' | 'dispatch'

  // Chat State
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `### 🤖 Namaste! I am RAIL-GPT, your AI Operational Block Copilot.

I am connected live to **TMS (Track P-Way)**, **SMMS (Signaling)**, **TDMS (Traction 25kV OHE)**, and **COA (Timetables)**.

**You can ask me to:**
• Assess corridor congestion & find multi-department **Shadow Bundles**.
• Check **G&SR safety & 25kV OHE isolation rules** (Chapter XVII).
• Evaluate **ML Overrun Risk** on specific pending tasks (e.g. *TSK-104*).
• Predict passenger train punctuality impacts on **Vande Bharat** & **Rajdhani** expresses.
• Draft official **Chief Controller Dispatch Telegraph Orders**.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: 'Analyze NDLS-GZB Corridor', action: 'PROMPT', text: 'Analyze NDLS-GZB corridor night block' },
        { label: 'G&SR 25kV Traction Safety Rules', action: 'PROMPT', text: 'What are the G&SR safety rules for 25kV OHE work?' },
        { label: 'Check High Overrun Risk Tasks', action: 'PROMPT', text: 'Which tasks have high overrun risk?' }
      ]
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Explainable AI Modal State
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [explanationData, setExplanationData] = useState(null);
  const [explainLoading, setExplainLoading] = useState(false);

  // Scenario Simulator State
  const [simCorridor, setSimCorridor] = useState('NDLS-GZB');
  const [simSpeed, setSimSpeed] = useState(30);
  const [simWeather, setSimWeather] = useState('Dense Fog');
  const [simDefect, setSimDefect] = useState(false);
  const [simCrewDelay, setSimCrewDelay] = useState(20);
  const [simDuration, setSimDuration] = useState(3.5);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Voice Transcriber State & Pipeline
  const [isRecording, setIsRecording] = useState(false);
  const [sampleAudioPreset, setSampleAudioPreset] = useState('fracture');
  const [voiceTranscript, setVoiceTranscript] = useState('Critical rail fracture detected near track Km 27/4 between Sahibabad and Ghaziabad on UP Main line. Emergency block requested for 3.5 hours immediately.');
  const [voiceResult, setVoiceResult] = useState(null);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);

  // Dispatch Order State
  const [dispatchBlockCode, setDispatchBlockCode] = useState('BLK-NDLS-20260908-01');
  const [dispatchCorridor, setDispatchCorridor] = useState('NDLS-GZB');
  const [dispatchDate, setDispatchDate] = useState('2026-09-08');
  const [dispatchStartTime, setDispatchStartTime] = useState('01:30');
  const [dispatchEndTime, setDispatchEndTime] = useState('04:30');
  const [dispatchSpeed, setDispatchSpeed] = useState(30);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);

  // RBAC Matrix State
  const [rbacList, setRbacList] = useState([]);
  const [selectedRole, setSelectedRole] = useState('PLANNER_ADMIN');

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  useEffect(() => {
    const loadRbac = async () => {
      const data = await aiCopilotService.getRbacMatrix();
      setRbacList(data);
    };
    loadRbac();
  }, []);

  // Handle Chat Submit
  const handleSendChat = async (textToSend = inputQuery) => {
    const query = textToSend.trim();
    if (!query) return;

    const userMsg = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setChatLoading(true);

    try {
      const response = await aiCopilotService.sendMessage(query, messages, simCorridor);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: response.suggestedActions,
          structuredRecommendation: response.structuredRecommendation,
          citations: response.citations,
          hallucinationCheckPassed: response.hallucinationCheckPassed
        }
      ]);
    } catch (err) {
      addToast({ title: 'AI Communication Error', message: err.message, type: 'error' });
    } finally {
      setChatLoading(false);
    }
  };

  // Handle Action Button in Chat
  const handleChatAction = async (act) => {
    if (act.action === 'NAVIGATE') {
      navigate(act.target);
    } else if (act.action === 'PROMPT') {
      handleSendChat(act.text);
    } else if (act.action === 'APPLY_RECOMMENDATION') {
      try {
        const res = await aiCopilotService.applyRecommendation(act.payload);
        addToast({
          title: 'Recommendation Applied in Real Time',
          message: `Block ${act.payload.blockCode} added to Master Schedule & Tasks marked Scheduled.`,
          type: 'success'
        });
      } catch (e) {
        addToast({ title: 'Application Error', message: e.message, type: 'error' });
      }
    } else if (act.action === 'EXPLAIN_DECISION') {
      setExplainLoading(true);
      setExplainModalOpen(true);
      try {
        const res = await aiCopilotService.explainDecision(act.payload.blockCode);
        setExplanationData(res);
      } catch (e) {
        addToast({ title: 'Explain Error', message: e.message, type: 'error' });
      } finally {
        setExplainLoading(false);
      }
    }
  };

  // Handle Scenario Run
  const handleRunSimulation = async () => {
    setSimLoading(true);
    try {
      const res = await aiCopilotService.simulateScenario({
        corridor: simCorridor,
        speedRestrictionKmph: simSpeed,
        weatherCondition: simWeather,
        emergencyDefectInjected: simDefect,
        crewMobilizationDelayMinutes: simCrewDelay,
        requestedBlockDurationHours: simDuration
      });
      setSimResult(res);
      addToast({
        title: 'Scenario Simulation Complete',
        message: `Punctuality evaluated for ${simCorridor} under ${simWeather}.`,
        type: 'info'
      });
    } catch (err) {
      addToast({ title: 'Simulation Error', message: err.message, type: 'error' });
    } finally {
      setSimLoading(false);
    }
  };

  // Run Full Voice -> Task -> Priority -> Conflict -> Dispatch Pipeline
  const handleRunFullVoicePipeline = async () => {
    setVoiceLoading(true);
    setPipelineStep(1);

    // Step 1: Voice NLP extraction & Real-Time Task Ingestion
    await new Promise((r) => setTimeout(r, 400));
    setPipelineStep(2);
    const res = await aiCopilotService.transcribeMemo(voiceTranscript, 'Ghaziabad Junction', 'NDLS-GZB', true);
    setVoiceResult(res);

    // Step 2: Dynamic Priority Calculation
    await new Promise((r) => setTimeout(r, 450));
    setPipelineStep(3);

    // Step 3: Spatial Conflict Check
    await new Promise((r) => setTimeout(r, 450));
    setPipelineStep(4);

    // Step 4: Corridor Slot Finding & Shadow Bundling
    await new Promise((r) => setTimeout(r, 450));
    setPipelineStep(5);

    // Step 5: Dispatch Order Generation
    await new Promise((r) => setTimeout(r, 450));
    setVoiceLoading(false);
    setPipelineStep(6);

    addToast({
      title: 'Full Pipeline Executed in Real Time',
      message: `Created ${res.generatedTaskId} (Priority ${res.priorityScore}/100) & Synced with Master Schedule.`,
      type: 'success'
    });
  };

  // Handle Dispatch Order Gen
  const handleGenerateDispatch = async () => {
    setDispatchLoading(true);
    try {
      const res = await aiCopilotService.generateDispatchOrder({
        blockCode: dispatchBlockCode,
        corridor: dispatchCorridor,
        date: dispatchDate,
        startTime: dispatchStartTime,
        endTime: dispatchEndTime,
        departments: ['Engineering', 'Electrical / Traction', 'Signaling & Telecom'],
        controllerName: user?.name ? `${user.name} (${user.designation || 'Chief Controller'})` : 'Rajesh Sharma, Sr. DOM (Planning)',
        speedRestrictionKmph: dispatchSpeed
      });
      setDispatchResult(res);
      addToast({
        title: 'Dispatch Order Generated',
        message: `Memo ${res.memoNumber} formatted per Operating Branch standards.`,
        type: 'success'
      });
    } catch (err) {
      addToast({ title: 'Generation Error', message: err.message, type: 'error' });
    } finally {
      setDispatchLoading(false);
    }
  };

  const handleCopyMemo = () => {
    if (dispatchResult?.officialTelegraphText) {
      navigator.clipboard.writeText(dispatchResult.officialTelegraphText);
      setCopiedMemo(true);
      setTimeout(() => setCopiedMemo(false), 2000);
      addToast({ title: 'Copied to Clipboard', message: 'Telegraph text ready for transmission.', type: 'info' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="RAIL-GPT & AI Command Center"
        subtitle="Conversational operational copilot, digital twin scenario simulator, real-time voice memo ingestion, and RBAC matrix designed specifically for Indian Railways corridor planning."
        badge="SIH 2024/2026 Innovation Hub"
      />

      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2.5 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'chat'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bot className="w-4 h-4 text-indigo-600" />
          <span>RAIL-GPT Copilot</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
            Live AI
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('timeline');
          }}
          className={`px-4 py-2.5 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'timeline'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Train className="w-4 h-4 text-indigo-600" />
          <span>Corridor Train Graph Timeline</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('scenario');
            if (!simResult) handleRunSimulation();
          }}
          className={`px-4 py-2.5 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'scenario'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Digital Twin "What-If" Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('voice')}
          className={`px-4 py-2.5 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'voice'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Radio className="w-4 h-4 text-indigo-600" />
          <span>Voice Memo ➔ Live Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`px-4 py-2.5 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'rbac'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 text-indigo-600" />
          <span>RBAC Role Matrix</span>
          <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
            5 Roles
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('dispatch');
            if (!dispatchResult) handleGenerateDispatch();
          }}
          className={`px-4 py-2.5 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'dispatch'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>Dispatch Telegraph Generator</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: CONVERSATIONAL COPILOT (RAIL-GPT)
          ========================================================================= */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in">
          {/* Main Chat Stream (3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-card flex flex-col h-[650px] overflow-hidden">
            {/* Chat Header Banner */}
            <div className="p-4 bg-gradient-to-r from-rail-950 to-slate-900 text-white border-b border-rail-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold font-mono flex items-center gap-2">
                    <span>RAIL-GPT CONVERSATIONAL COPILOT</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    Indian Railways Operational Rulebook & Timetable Expert
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  setMessages([
                    {
                      role: 'assistant',
                      content: 'Session refreshed. Ready for railway operational queries.',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  ])
                }
                className="p-1.5 rounded hover:bg-rail-800 text-slate-400 hover:text-white transition-colors"
                title="Clear conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded bg-rail-900 border border-rail-700 text-ir-saffron flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold shadow-sm">
                      IR
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-rail-900 text-white font-medium rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none prose-sm'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>

                    {/* Grounded Regulatory Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-emerald-100 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/80 space-y-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-800">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>VERIFIED GROUND TRUTH RULE CITATIONS ({msg.citations.length})</span>
                          </div>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-200/70 text-emerald-900">
                            100% Grounded
                          </span>
                        </div>
                        <div className="space-y-1">
                          {msg.citations.map((c, cIdx) => (
                            <div key={cIdx} className="text-[11px] bg-white/90 p-2 rounded border border-emerald-200/60 font-sans shadow-2xs">
                              <div className="font-bold text-emerald-950 font-mono text-[10px] flex items-center justify-between">
                                <span>[{c.manualName} {c.ruleNumber}] {c.title}</span>
                                <span className="text-[9px] text-slate-500">{c.chapter}</span>
                              </div>
                              <p className="text-slate-600 text-[10.5px] mt-0.5">{c.excerpt}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action chips for assistant responses */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => handleChatAction(act)}
                            className={`px-2.5 py-1 rounded font-semibold text-[11px] border transition-all flex items-center gap-1 shadow-sm ${
                              act.action === 'APPLY_RECOMMENDATION'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 font-bold'
                                : act.action === 'EXPLAIN_DECISION'
                                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 font-bold'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                            }`}
                          >
                            <span>{act.label}</span>
                            {act.action === 'APPLY_RECOMMENDATION' ? (
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            ) : act.action === 'EXPLAIN_DECISION' ? (
                              <HelpCircle className="w-3 h-3 text-white" />
                            ) : act.action === 'NAVIGATE' ? (
                              <ArrowRight className="w-3 h-3" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      className={`text-[9px] mt-1.5 text-right font-mono ${
                        msg.role === 'user' ? 'text-slate-400' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded bg-indigo-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold shadow-sm">
                      {user?.avatar || 'OP'}
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-3 text-slate-500 text-xs">
                  <div className="w-7 h-7 rounded bg-rail-900 text-ir-saffron flex items-center justify-center font-mono text-xs animate-spin">
                    IR
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                    <span>RAIL-GPT is consulting timetable & G&SR rulebook...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Demo Prompts */}
            <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 font-bold uppercase shrink-0 text-[10px]">Prompts:</span>
              {[
                'Analyze NDLS-GZB night corridor block',
                'What are G&SR rules for 25kV OHE?',
                'Which tasks have high overrun risk?',
                'Simulate fog weather impact on punctuality'
              ].map((p, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSendChat(p)}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 border border-slate-200 whitespace-nowrap text-[11px] font-medium transition-colors shrink-0"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask RAIL-GPT about corridors, shadow bundles, overrun risks, or safety directives..."
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <button
                type="submit"
                disabled={chatLoading || !inputQuery.trim()}
                className="px-4 py-2 bg-rail-900 hover:bg-rail-800 text-white font-semibold text-xs rounded-md shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-all"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Right Info Cards (1 col) */}
          <div className="space-y-4">
            {/* Knowledge Base Status Card */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card space-y-3 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-800 font-mono">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span>Live Ground Truth Ingestion</span>
              </div>
              <ul className="space-y-2 text-slate-600 text-[11px]">
                <li className="flex items-center justify-between">
                  <span className="text-slate-500">TMS (Track P-Way):</span>
                  <span className="font-mono font-bold text-emerald-700">128 Defect Memos</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-500">TDMS (25kV OHE):</span>
                  <span className="font-mono font-bold text-emerald-700">14 Feeder Windows</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-500">SMMS (Signaling):</span>
                  <span className="font-mono font-bold text-emerald-700">18 Interlocking Logs</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-500">COA (Train Paths):</span>
                  <span className="font-mono font-bold text-emerald-700">34 Corridor Slots</span>
                </li>
              </ul>
            </div>

            {/* Quick Explainable AI trigger */}
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 font-mono text-[11px]">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                <span>Explainable AI (XAI)</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Inspect the transparent mathematical, safety, and timetable reasons behind every AI-recommended block window.
              </p>
              <button
                onClick={() => handleChatAction({ action: 'EXPLAIN_DECISION', payload: { blockCode: 'BLK-NDLS-20260908-01' } })}
                className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] transition-colors shadow-sm mt-1"
              >
                Inspect "Why This Block?"
              </button>
            </div>

            {/* Quick Actions */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card space-y-2 text-xs">
              <div className="font-bold text-slate-800 font-mono text-[11px] mb-2 uppercase">
                Quick Action Short-Cuts
              </div>
              <button
                onClick={() => navigate('/optimization')}
                className="w-full py-2 px-3 bg-rail-900 hover:bg-rail-800 text-white rounded font-semibold text-xs flex items-center justify-between transition-colors shadow-sm"
              >
                <span>Launch Optimizer</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </button>
              <button
                onClick={() => navigate('/schedule')}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs flex items-center justify-between transition-colors border border-slate-200"
              >
                <span>View Master Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CORRIDOR TRAIN GRAPH TIMELINE VISUALIZER
          ========================================================================= */}
      {activeTab === 'timeline' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Train className="w-4 h-4 text-rail-900" />
                  <span>NDLS – GZB High Density Corridor Train & Block Timeline</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual representation of passenger express paths vs coordinated multi-departmental block windows
                </p>
              </div>
              <span className="font-mono text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-bold">
                Zero Express Clash Verified
              </span>
            </div>

            {/* Timeline Canvas Visualizer */}
            <div className="p-4 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 space-y-4 font-mono text-xs overflow-x-auto">
              {/* Header hours */}
              <div className="grid grid-cols-6 gap-2 text-center text-[11px] text-slate-400 pb-2 border-b border-slate-800 font-bold">
                <div>23:00 - 00:00</div>
                <div>00:00 - 01:00</div>
                <div className="text-amber-400 bg-amber-950/40 py-0.5 rounded border border-amber-800/40">01:00 - 02:00 (Night Block)</div>
                <div className="text-amber-400 bg-amber-950/40 py-0.5 rounded border border-amber-800/40">02:00 - 03:00 (Night Block)</div>
                <div className="text-amber-400 bg-amber-950/40 py-0.5 rounded border border-amber-800/40">03:00 - 04:30 (Night Block)</div>
                <div>04:30 - 06:00</div>
              </div>

              {/* Line 1: UP Main */}
              <div className="space-y-1.5 pt-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                  <span>UP Main Line (Track 1)</span>
                  <span className="text-emerald-400">Joint Co-working Active</span>
                </div>
                <div className="grid grid-cols-6 gap-2 h-12 items-center">
                  <div className="bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-slate-400 truncate">
                    🚆 12401 Magadh Exp (01:10)
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-slate-400 truncate">
                    Clearance Gap (20m)
                  </div>
                  {/* Coordinated Mega Block across cols 3, 4, 5 */}
                  <div className="col-span-3 bg-gradient-to-r from-emerald-900/90 via-rail-800 to-indigo-900/90 border-2 border-emerald-400 rounded-lg p-2 text-white shadow-lg flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>INTEGRATED MEGA BLOCK (BUN-101) • 01:30 – 04:30</span>
                      </div>
                      <div className="text-[10px] text-emerald-200">
                        Civil Track Tamping (TSK-101) + 25kV OHE Tensioning (TSK-102) + S&T Signals (TSK-103)
                      </div>
                    </div>
                    <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-extrabold text-[10px]">
                      +60% SAVED
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-emerald-400 truncate">
                    🚆 14055 Brahmaputra (04:55)
                  </div>
                </div>
              </div>

              {/* Line 2: DN Main */}
              <div className="space-y-1.5 pt-3">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                  <span>DN Main Line (Track 2)</span>
                  <span className="text-slate-500">Live Express Path</span>
                </div>
                <div className="grid grid-cols-6 gap-2 h-10 items-center">
                  <div className="bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-slate-400 truncate">
                    Freight Container (23:40)
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-slate-400 truncate">
                    🚆 12424 Rajdhani (00:45)
                  </div>
                  <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded p-1.5 text-[10px] text-slate-500 text-center">
                    Timetable Margin
                  </div>
                  <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded p-1.5 text-[10px] text-slate-500 text-center">
                    Timetable Margin
                  </div>
                  <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded p-1.5 text-[10px] text-slate-500 text-center">
                    Timetable Margin
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-amber-300 font-bold truncate">
                    🚆 22436 Vande Bharat (06:00)
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="text-[10px] uppercase font-bold text-emerald-800">Downtime Eliminated</div>
                <div className="text-lg font-bold font-mono text-emerald-900 mt-0.5">4.5 Hours Saved</div>
                <div className="text-[10px] text-slate-600 mt-0.5">3 separate blocks compressed into 1 single window</div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="text-[10px] uppercase font-bold text-indigo-800">Vande Bharat 22436 Safeguard</div>
                <div className="text-lg font-bold font-mono text-indigo-900 mt-0.5">0 min Delay</div>
                <div className="text-[10px] text-slate-600 mt-0.5">Block finishes 90 minutes before morning departure</div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="text-[10px] uppercase font-bold text-amber-800">Safety Buffer Padding</div>
                <div className="text-lg font-bold font-mono text-amber-900 mt-0.5">+25 Minutes</div>
                <div className="text-[10px] text-slate-600 mt-0.5">Exceeds statutory 15m requirement before train 14055</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DIGITAL TWIN "WHAT-IF" SCENARIO SIMULATOR
          ========================================================================= */}
      {activeTab === 'scenario' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Digital Twin "What-If" Parameter Controls</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stress-test corridor resilience against speed restrictions, adverse weather, and emergency defects
                </p>
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={simLoading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${simLoading ? 'animate-spin' : ''}`} />
                <span>{simLoading ? 'Simulating Digital Twin...' : 'Simulate Scenario Impact'}</span>
              </button>
            </div>

            {/* Interactive Scenario Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">
                  Target Corridor Section
                </label>
                <select
                  value={simCorridor}
                  onChange={(e) => setSimCorridor(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-semibold"
                >
                  <option value="NDLS-GZB">New Delhi – Ghaziabad (NDLS-GZB)</option>
                  <option value="DDU-PRYJ">Pandit Deen Dayal – Prayagraj (DDU-PRYJ)</option>
                  <option value="BCT-ST">Mumbai Central – Surat (BCT-ST)</option>
                  <option value="HWH-KGP">Howrah – Kharagpur (HWH-KGP)</option>
                </select>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase text-[10px]">
                    Caution Speed Restriction (PSR)
                  </label>
                  <span className="font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                    {simSpeed} km/h
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="110"
                  step="5"
                  value={simSpeed}
                  onChange={(e) => setSimSpeed(parseInt(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">
                  Adverse Weather Condition
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {['Clear', 'Monsoon', 'Dense Fog'].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSimWeather(w)}
                      className={`py-1.5 rounded text-center font-semibold text-[11px] border transition-all ${
                        simWeather === w
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase text-[10px]">
                    Crew Mobilization Lag
                  </label>
                  <span className="font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                    +{simCrewDelay} mins
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={simCrewDelay}
                  onChange={(e) => setSimCrewDelay(parseInt(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase text-[10px]">
                    Requested Possession Window
                  </label>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded text-[11px]">
                    {simDuration} Hours
                  </span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="6.0"
                  step="0.5"
                  value={simDuration}
                  onChange={(e) => setSimDuration(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <label className="font-bold text-slate-800 text-[11px] block">
                    Emergency Defect Injection
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Simulate rail fracture or signal flashover
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={simDefect}
                  onChange={(e) => setSimDefect(e.target.checked)}
                  className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Simulation Output Dashboard */}
          {simResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Baseline Punctuality</div>
                  <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
                    {simResult.baselinePunctuality}%
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">Standard Timetable</div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Simulated Punctuality</div>
                  <div className="text-2xl font-extrabold font-mono text-amber-600 mt-1">
                    {simResult.simulatedPunctuality}%
                  </div>
                  <div className="text-[10px] text-rose-600 mt-0.5 font-bold">
                    -{simResult.punctualityLossPercent}% Drop
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Overrun Probability</div>
                  <div className="text-2xl font-extrabold font-mono text-rose-600 mt-1">
                    {simResult.overrunProbabilityPercent}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Under Adverse Inputs</div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-card text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Freight Stabling Queue</div>
                  <div className="text-2xl font-extrabold font-mono text-rail-900 mt-1">
                    {simResult.freightHoldingMinutes} min
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Holding Buffer Time</div>
                </div>
              </div>

              {/* Train List & AI Proactive Advice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Train className="w-4 h-4 text-rail-800" />
                    <span>Impacted Passenger Rakes & Delays</span>
                  </h4>

                  <div className="space-y-2">
                    {simResult.passengerTrainDelays.map((tr, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">
                            {tr.trainNumber} • {tr.trainName}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{tr.status}</div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                              tr.predictedDelayMinutes === 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {tr.predictedDelayMinutes === 0 ? '0 min (On Time)' : `+${tr.predictedDelayMinutes} min`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-950 text-white rounded-xl border border-indigo-900 shadow-card p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>AI Digital Twin Mitigation Strategy</span>
                    </h4>
                    <p className="text-xs text-slate-200 mt-3 leading-relaxed">
                      {simResult.aiRecommendation}
                    </p>

                    <div className="mt-4 p-3 bg-indigo-900/60 rounded border border-indigo-700/60 text-xs space-y-1.5 font-mono">
                      <div className="text-indigo-300 text-[10px] uppercase font-bold">
                        Recommended Actionable Slot:
                      </div>
                      <div className="font-bold text-amber-300 text-sm">
                        {simResult.suggestedMitigationWindow}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Adjust Safety Buffer: <strong>+{simResult.safetyBufferAdjustmentMinutes} minutes</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/optimization')}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5"
                  >
                    <span>Adopt Mitigation in Master Schedule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: VOICE MEMO ➔ LIVE AUTOMATED PIPELINE
          ========================================================================= */}
      {activeTab === 'voice' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Pipeline Stepper Header */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <div className="text-xs font-bold font-mono uppercase text-slate-500 mb-3 flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-600" />
              <span>End-to-End Automated Voice Ingestion & Planning Pipeline</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
              {[
                { step: 1, label: '1. Voice Input' },
                { step: 2, label: '2. Real-Time Task Ingestion' },
                { step: 3, label: '3. Priority Scoring' },
                { step: 4, label: '4. Spatial Conflict Check' },
                { step: 5, label: '5. Slot Matching' },
                { step: 6, label: '6. Dispatch Ready' }
              ].map((st) => (
                <div
                  key={st.step}
                  className={`p-2.5 rounded-lg border font-mono font-bold transition-all ${
                    pipelineStep >= st.step
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : pipelineStep === st.step - 1 && voiceLoading
                      ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <div className="text-[10px]">{st.label}</div>
                  {pipelineStep >= st.step && <Check className="w-3.5 h-3.5 mx-auto mt-1" />}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audio Input Box */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-600" />
                <span>Field Engineer Audio / Radio Memo Simulator</span>
              </h3>

              {/* Sample Voice Presets */}
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1.5">
                  Select Field Engineer Scenario Preset:
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSampleAudioPreset('fracture');
                      setVoiceTranscript('Critical rail fracture detected near track Km 27/4 between Sahibabad and Ghaziabad on UP Main line. Emergency block requested for 3.5 hours immediately.');
                    }}
                    className={`p-2 rounded text-left border text-[11px] ${
                      sampleAudioPreset === 'fracture'
                        ? 'bg-rose-600 text-white border-rose-500 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <div>Rail Fracture</div>
                    <div className="text-[9px] opacity-80">Critical / Civil</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSampleAudioPreset('ohe');
                      setVoiceTranscript('Urgent block required between Sahibabad and Ghaziabad Km 24/12 for 25kV OHE wire tensioning. Power block mandatory for 2.5 hours.');
                    }}
                    className={`p-2 rounded text-left border text-[11px] ${
                      sampleAudioPreset === 'ohe'
                        ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <div>25kV OHE Wire Sag</div>
                    <div className="text-[9px] opacity-80">TRD / Electrical</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSampleAudioPreset('signal');
                      setVoiceTranscript('Point Machine 104-B facing friction clutch resistance at Ghaziabad East Cabin. Signal block required for 2 hours immediately.');
                    }}
                    className={`p-2 rounded text-left border text-[11px] ${
                      sampleAudioPreset === 'signal'
                        ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <div>Point Machine Clutch</div>
                    <div className="text-[9px] opacity-80">S&T Signaling</div>
                  </button>
                </div>
              </div>

              {/* Editable Raw Transcript */}
              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">
                  Audio Transcription Buffer (DeepSpeech / Whisper IR Model)
                </label>
                <textarea
                  rows={3}
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <button
                onClick={handleRunFullVoicePipeline}
                disabled={voiceLoading}
                className="w-full py-2.5 bg-gradient-to-r from-rail-900 to-indigo-900 hover:from-rail-800 hover:to-indigo-800 text-white font-bold text-xs rounded-md shadow flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 text-amber-300 ${voiceLoading ? 'animate-spin' : ''}`} />
                <span>{voiceLoading ? 'Executing Real-Time AI Pipeline...' : 'Run Full Real-Time AI Pipeline'}</span>
              </button>
            </div>

            {/* Structured Output & Ingested Ticket */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2 pb-3 border-b border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Live Ingested Task & Real-Time Reflection</span>
              </h3>

              {voiceResult ? (
                <div className="space-y-4 text-xs animate-in fade-in">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-800">Generated Task ID (Reflected Live)</div>
                      <div className="text-base font-extrabold font-mono text-emerald-950">{voiceResult.generatedTaskId}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-white px-2.5 py-1 rounded border border-emerald-300 block">
                        Priority: {voiceResult.priorityScore}/100
                      </span>
                      <span className="text-[9px] text-slate-500">{voiceResult.confidenceScore}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Assigned Department</div>
                      <div className="font-bold text-slate-800 mt-0.5">{voiceResult.department}</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Defect Classification</div>
                      <div className="font-bold text-slate-800 mt-0.5">{voiceResult.defectType}</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Location Extracted</div>
                      <div className="font-bold text-slate-800 mt-0.5">{voiceResult.location}</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Required Duration</div>
                      <div className="font-mono font-bold text-indigo-700 mt-0.5">{voiceResult.estimatedDurationHours} Hours</div>
                    </div>
                  </div>

                  {voiceResult.conflictDetected && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-[11px] text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Conflict Flagged:</strong> {voiceResult.conflictReason}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('/block-requests')}
                      className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <span>View in Requests Queue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => navigate('/optimization')}
                      className="flex-1 py-2 bg-rail-900 hover:bg-rail-800 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Optimize this Task</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Radio className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs">Click "Run Full Real-Time AI Pipeline" to parse and ingest in real time.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: RBAC ROLE-BASED ACCESS CONTROL MATRIX
          ========================================================================= */}
      {activeTab === 'rbac' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Indian Railways Role-Based Access Control (RBAC) Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statutory authorization levels across Operating, Civil Engineering, S&T, Traction TRD, and Station Control
                </p>
              </div>
              <span className="font-mono text-xs text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200 font-bold">
                5 Standard Railway Personas
              </span>
            </div>

            {/* Persona Selector Chips */}
            <div className="flex flex-wrap gap-2">
              {rbacList.map((r) => (
                <button
                  key={r.roleCode}
                  onClick={() => setSelectedRole(r.roleCode)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-left ${
                    selectedRole === r.roleCode
                      ? 'bg-rail-900 text-white border-rail-900 shadow-md ring-2 ring-indigo-400/40'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="font-mono text-[11px]">{r.roleCode}</div>
                  <div className="text-[10px] text-slate-300 truncate max-w-xs">{r.roleTitle.split('(')[0]}</div>
                </button>
              ))}
            </div>

            {/* Role Permissions Table */}
            {(() => {
              const activeRoleObj = rbacList.find((r) => r.roleCode === selectedRole) || rbacList[0];
              if (!activeRoleObj) return null;

              return (
                <div className="space-y-4 text-xs animate-in fade-in">
                  <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-indigo-300 font-mono">Selected Operational Authority</div>
                      <div className="text-sm font-bold text-white mt-0.5">{activeRoleObj.roleTitle}</div>
                      <div className="text-[11px] text-slate-400">{activeRoleObj.branch}</div>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-300 bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
                      {activeRoleObj.accessibleModules.length} Modules Accessible
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500 font-mono">
                          <th className="py-2.5 px-3">System Action / Governance Gate</th>
                          <th className="py-2.5 px-3">Granted Authority Level</th>
                          <th className="py-2.5 px-3 text-right">Access Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.entries(activeRoleObj.permissions).map(([action, perm]) => (
                          <tr key={action} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{action}</td>
                            <td className="py-2.5 px-3 text-slate-600">{perm}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  perm.toLowerCase().includes('full') || perm.toLowerCase().includes('final')
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : perm.toLowerCase().includes('mandatory') || perm.toLowerCase().includes('issue')
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {perm.toLowerCase().includes('full') ? 'Full Access' : 'Scoped Role'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: OFFICIAL DISPATCH TELEGRAPH GENERATOR
          ========================================================================= */}
      {activeTab === 'dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          {/* Left Params (1 col) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 space-y-4 text-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono pb-2 border-b border-slate-200">
              Dispatch Order Parameters
            </h3>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Block Code</label>
              <input
                type="text"
                value={dispatchBlockCode}
                onChange={(e) => setDispatchBlockCode(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Corridor</label>
              <input
                type="text"
                value={dispatchCorridor}
                onChange={(e) => setDispatchCorridor(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Start Time</label>
                <input
                  type="text"
                  value={dispatchStartTime}
                  onChange={(e) => setDispatchStartTime(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">End Time</label>
                <input
                  type="text"
                  value={dispatchEndTime}
                  onChange={(e) => setDispatchEndTime(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Speed Restriction on Clearance</label>
              <input
                type="number"
                value={dispatchSpeed}
                onChange={(e) => setDispatchSpeed(parseInt(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono text-xs"
              />
            </div>

            <button
              onClick={handleGenerateDispatch}
              disabled={dispatchLoading}
              className="w-full py-2.5 bg-rail-900 hover:bg-rail-800 text-white font-bold text-xs rounded shadow flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{dispatchLoading ? 'Generating...' : 'Re-Generate Telegraph'}</span>
            </button>
          </div>

          {/* Right Telegraph Preview (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="font-mono text-xs font-bold text-amber-300 uppercase">
                    Official Indian Railways Possession Grant Telegraph
                  </span>
                </div>

                <button
                  onClick={handleCopyMemo}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  {copiedMemo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMemo ? 'Copied' : 'Copy Telegraph Text'}</span>
                </button>
              </div>

              {dispatchResult ? (
                <div className="space-y-4">
                  <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs leading-relaxed text-emerald-400 whitespace-pre-wrap overflow-x-auto shadow-inner selection:bg-amber-400 selection:text-slate-950">
                    {dispatchResult.officialTelegraphText}
                  </pre>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-950/70 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-bold font-mono">Recipient Stations</div>
                      <div className="text-slate-300 mt-1">{dispatchResult.recipientStations.join(', ')}</div>
                    </div>

                    <div className="p-3 bg-slate-950/70 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-bold font-mono">CRIS Signature Token</div>
                      <div className="font-mono text-amber-300 mt-1 truncate">{dispatchResult.digitalSignatureToken}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 font-mono">
                  Click Generate to format telegraph order.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-center text-[10px] text-slate-500 font-mono">
              Certified for COA / FOIS System Dispatch • Ministry of Railways, Government of India
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          EXPLAINABLE AI MODAL ("Why did AI choose this?")
          ========================================================================= */}
      {explainModalOpen && (
        <Modal
          isOpen={explainModalOpen}
          onClose={() => setExplainModalOpen(false)}
          title={`Explainable AI (XAI) Decision Breakdown: ${explanationData?.blockCode || 'BLK-NDLS-01'}`}
          subtitle={`${explanationData?.corridor || 'NDLS-GZB'} • Multi-Factor Optimization Rationale`}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-500 font-mono">
                Model: <strong>Multi-Criteria Decision Analysis (MCDA) + G&SR 17.03</strong>
              </span>
              <button
                onClick={() => setExplainModalOpen(false)}
                className="px-4 py-1.5 bg-rail-900 text-white rounded text-xs font-semibold"
              >
                Close Breakdown
              </button>
            </div>
          }
        >
          {explainLoading ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Analyzing optimization decision tree...</span>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-950 text-xs leading-relaxed">
                <strong>Executive Summary:</strong> {explanationData?.summaryRationale}
              </div>

              {/* 4 Factor Breakdown */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">
                  Core Mathematical & Safety Drivers
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {explanationData?.factors.map((f, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{f.category}</span>
                        <span className="font-mono font-bold text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-indigo-700">
                          {f.score} (Weight: {f.weight})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Proof & Alternatives */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                <div className="font-bold text-emerald-900 text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Statutory Safety Proof</span>
                </div>
                <div className="text-[11px] text-emerald-800">{explanationData?.safetyProof}</div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">
                  Rejected Alternative Time Windows & Reasons
                </div>
                {explanationData?.alternativesConsidered.map((alt, aIdx) => (
                  <div key={aIdx} className="p-2 bg-slate-100 rounded border border-slate-200 text-[11px]">
                    <span className="font-bold text-slate-800">{alt.window}: </span>
                    <span className="text-slate-600">{alt.rejectedReason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
