import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { aiCopilotService } from '../../services/aiCopilotService';
import { useAuth } from '../../context/AuthContext';

export const RailGptWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `### 🤖 RAIL-GPT Copilot Active
I am your 24/7 AI Railway Block Planning Assistant.

**Quick Prompts:**
• *"Analyze NDLS-GZB night corridor block"*
• *"What are G&SR safety rules for 25kV OHE?"*
• *"Which tasks have high overrun risk?"*
• *"Predict delay on Vande Bharat Express"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: 'Analyze Corridor', text: 'Analyze NDLS-GZB night corridor block' },
        { label: 'G&SR Safety Rules', text: 'What are the G&SR safety rules for 25kV OHE work?' },
        { label: 'Open Full AI Hub', action: 'NAVIGATE', target: '/ai-copilot' }
      ]
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (customText = null) => {
    const text = (customText || inputQuery).trim();
    if (!text) return;

    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const reply = await aiCopilotService.sendMessage(text, messages, 'NDLS-GZB');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: reply.suggestedActions
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Failed to reach AI service: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans select-none">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-700 via-indigo-600 to-rail-900 hover:from-indigo-600 hover:to-rail-850 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 border border-indigo-400/40"
          title="Open RAIL-GPT Copilot Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-amber-300" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <span className="text-xs font-bold font-mono tracking-tight">Ask RAIL-GPT</span>
          <span className="bg-amber-400 text-slate-950 font-extrabold text-[9px] px-1.5 py-0.2 rounded uppercase">
            AI
          </span>
        </button>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          className={`bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 ${
            isExpanded ? 'w-[680px] h-[720px]' : 'w-[390px] h-[540px]'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-rail-950 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-900">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-amber-300">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold font-mono flex items-center gap-1.5">
                  <span>RAIL-GPT COPILOT</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <div className="text-[10px] text-indigo-200">G&SR & Timetable AI Assistant</div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai-copilot');
                }}
                className="p-1 rounded hover:bg-rail-800 text-slate-300 hover:text-white transition-colors"
                title="Open full-screen AI Command Center"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() =>
                  setMessages([
                    {
                      role: 'assistant',
                      content: 'Session refreshed. Ready for railway block planning questions.',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  ])
                }
                className="p-1 rounded hover:bg-rail-800 text-slate-300 hover:text-white transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-rail-800 text-slate-300 hover:text-white transition-colors"
                title="Close chatbot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/70 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded bg-rail-900 border border-rail-700 text-ir-saffron flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-mono font-bold">
                    IR
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3 leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'bg-rail-900 text-white font-medium rounded-tr-none text-[11px]'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none text-[11px]'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.content}</div>

                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      {m.suggestedActions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => {
                            if (act.action === 'NAVIGATE') {
                              setIsOpen(false);
                              navigate(act.target);
                            } else if (act.text) {
                              handleSend(act.text);
                            }
                          }}
                          className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-semibold transition-colors flex items-center gap-1"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="text-[8px] font-mono text-slate-400 text-right mt-1">
                    {m.timestamp}
                  </div>
                </div>

                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded bg-indigo-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-mono font-bold">
                    {user?.avatar || 'OP'}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <div className="w-6 h-6 rounded bg-rail-900 text-ir-saffron flex items-center justify-center font-mono text-[10px] animate-spin">
                  IR
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Chips */}
          <div className="px-3 py-1.5 bg-white border-t border-slate-200 flex items-center gap-1 overflow-x-auto text-[10px]">
            {[
              'Analyze NDLS-GZB',
              'G&SR 25kV Rules',
              'Overrun Tasks',
              'Vande Bharat Delay'
            ].map((p, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSend(p)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 border border-slate-200 whitespace-nowrap text-[10px] font-medium transition-colors shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask RAIL-GPT..."
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
