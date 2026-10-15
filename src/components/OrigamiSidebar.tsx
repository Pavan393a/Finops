'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  Package,
  CreditCard,
  ShieldCheck,
  FileText,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  X,
  Cpu,
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  time: string;
}

interface OrigamiSidebarProps {
  activeTab: 'overview' | 'stock' | 'payments' | 'rules' | 'bills' | 'agent-api';
  onSelectTab: (tab: 'overview' | 'stock' | 'payments' | 'rules' | 'bills' | 'agent-api') => void;
  onResetDemo: () => Promise<void>;
  onInspectPayment: (txId: string) => void;
  latestTxId?: string;
  onRefreshData: () => Promise<void>;
}

export const OrigamiSidebar: React.FC<OrigamiSidebarProps> = ({
  activeTab,
  onSelectTab,
  onResetDemo,
  onInspectPayment,
  latestTxId,
  onRefreshData,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      text: "Hi Pavan 👋 I'm your store AI agent. I continuously monitor your stock and cash. How can I help you today?",
      time: 'Just now',
    },
  ]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const suggestedQuestions = [
    'Why did we pay FreshFarm £320?',
    'Can we afford 40 units of Cold Brew?',
    'What happens if weekend sales spike 2x?',
    'How much safe cash do we have left?',
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsSending(true);
    setIsChatOpen(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to chat with agent');

      const agentMsg: Message = {
        id: Math.random().toString(),
        sender: 'agent',
        text: data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);

      if (data.action) {
        toast.success(data.action.message);
        await onRefreshData();
      }
    } catch (err: any) {
      toast.error(`Agent error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 border-r border-white/[0.08] bg-[#0c101d] flex flex-col justify-between p-5 space-y-6 h-auto lg:h-screen lg:overflow-y-auto sticky top-0 custom-scrollbar z-20">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold text-sm">
              🌸
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">Tillwise</span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">Autonomous Retail Ops</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-2 block mb-1">
            Store Controls
          </span>

          <button
            id="nav-tab-overview"
            type="button"
            onClick={() => onSelectTab('overview')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bot className="w-4 h-4 text-sky-400" />
              <span>Store Overview</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </button>

          <button
            id="nav-tab-stock"
            type="button"
            onClick={() => onSelectTab('stock')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Inventory & Stock</span>
            </div>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded-full font-bold">
              1 Alert
            </span>
          </button>

          <button
            id="nav-tab-payments"
            type="button"
            onClick={() => onSelectTab('payments')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Money Moved (Stripe)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </button>

          <button
            id="nav-tab-rules"
            type="button"
            onClick={() => onSelectTab('rules')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Spending Rules</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </button>

          <button
            id="nav-tab-bills"
            type="button"
            onClick={() => onSelectTab('bills')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'bills'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-pink-400" />
              <span>3-Way Match & Bills</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </button>

          <button
            id="nav-tab-agent-api"
            type="button"
            onClick={() => onSelectTab('agent-api')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'agent-api'
                ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>External Agent Interop</span>
            </div>
            <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">
              MCP
            </span>
          </button>
        </div>

        {/* "Ask or adjust" Section (Just like the Origami screenshot) */}
        <div className="bg-slate-900/60 rounded-2xl p-4 border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <HelpCircle className="w-3.5 h-3.5 text-pink-400" />
              <span>Ask or adjust</span>
            </div>
            <span className="text-[10px] text-slate-400">Agent Co-Pilot</span>
          </div>

          <div className="space-y-1.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="w-full text-left p-2 rounded-xl text-[11px] text-slate-300 hover:text-white hover:bg-white/[0.06] flex items-start gap-2 transition-all leading-tight group"
              >
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-pink-400 mt-0.5">
                  {idx + 1}
                </span>
                <span className="line-clamp-2">{q}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Conversation Stream (collapsible) */}
        {isChatOpen && (
          <div className="bg-slate-950 rounded-2xl p-3 border border-pink-500/20 max-h-48 overflow-y-auto space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <span className="text-[10px] font-bold text-pink-400 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Agent Conversation
              </span>
              <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-2 rounded-xl text-[11px] leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-slate-800 text-slate-100 ml-4'
                    : 'bg-pink-950/40 text-pink-100 border border-pink-500/20 mr-2'
                }`}
              >
                {m.text}
              </div>
            ))}
            {isSending && (
              <div className="text-[10px] text-slate-400 animate-pulse pl-1">
                Agent is thinking...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Docked Chat Input (Origami-style) & Reset Button */}
      <div className="space-y-3 pt-3 border-t border-white/[0.06]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputQuery);
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask the agent..."
            disabled={isSending}
            className="w-full bg-slate-900/90 text-xs text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2.5 pr-10 border border-white/10 focus:outline-none focus:border-pink-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isSending}
            className="absolute right-1.5 p-1.5 bg-pink-500 hover:bg-pink-400 text-slate-950 rounded-lg disabled:opacity-30 transition-all"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <button
            onClick={onResetDemo}
            className="hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            Reset Demo Loop
          </button>

          <span className="text-[10px] font-mono text-slate-400">Flagship Soho</span>
        </div>
      </div>
    </aside>
  );
};
