'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface ActionCardData {
  type: 'RESTOCK_EXECUTED' | 'RESTOCK_PROPOSAL' | 'AUDIT_INSPECT' | 'RULE_UPDATED' | 'DEMO_RESET';
  title: string;
  detail: string;
  amountGbp?: number;
  quantity?: number;
  skuCode?: string;
  skuName?: string;
  supplierName?: string;
  stripeTransferId?: string;
  transactionId?: string;
  mandateClause?: string;
  status?: string;
  canExecute?: boolean;
}

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  time: string;
  actionCard?: ActionCardData;
}

interface OrigamiSidebarProps {
  activeTab: 'overview' | 'stock' | 'payments' | 'rules' | 'bills' | 'agent-api';
  onSelectTab: (tab: 'overview' | 'stock' | 'payments' | 'rules' | 'bills' | 'agent-api') => void;
  onResetDemo: () => Promise<void>;
  onInspectPayment: (txId: string) => void;
  latestTxId?: string;
  onRefreshData: () => Promise<void>;
  operatingMode?: 'in_house' | 'external_mcp' | 'hybrid';
}

export const OrigamiSidebar: React.FC<OrigamiSidebarProps> = ({
  activeTab,
  onSelectTab,
  onResetDemo,
  onInspectPayment,
  latestTxId,
  onRefreshData,
  operatingMode = 'in_house',
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeView, setActiveView] = useState<'suggestions' | 'chat'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      text: "Store health verified. £5,000 cash floor protected. You can restock items or audit payments directly here.",
      time: 'Just now',
      actionCard: {
        type: 'RESTOCK_PROPOSAL',
        title: 'Restock Proposal: Cold Brew',
        detail: 'Stock is at 18 units (1.8 days cover). Pre-approved mandate allows restocking 40 units while preserving the £5,000 floor.',
        amountGbp: 320,
        quantity: 40,
        skuCode: 'SKU-104',
        skuName: 'Organic Cold Brew 250ml',
        supplierName: 'FreshFarm Organics Ltd',
        mandateClause: 'Mandate Clause 2.1 (Under £500 pre-approved)',
        status: 'ready_to_send',
        canExecute: true,
      },
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeView === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending, activeView]);

  const suggestedQuestions = [
    { label: 'Why did we pay FreshFarm £320?', q: 'Why did we pay FreshFarm £320? Audit this payment' },
    { label: 'Can we afford 40 units of Cold Brew?', q: 'Can we afford 40 units of Cold Brew?' },
    { label: 'Move £320 to FreshFarm via Stripe', q: 'Restock 40 units of Cold Brew via Stripe' },
    { label: 'How much safe cash do we have left?', q: 'How much safe cash do we have left?' },
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
    setActiveView('chat');

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
        actionCard: data.actionCard,
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
    <aside className="w-full lg:w-80 flex-shrink-0 border-r border-white/[0.08] bg-[#0c101d] flex flex-col justify-between p-4 h-auto lg:h-screen lg:overflow-hidden sticky top-0 z-20">
      {/* 1. Header & Store Controls (Fixed Top) */}
      <div className="flex-shrink-0 space-y-3 pb-3 border-b border-white/[0.06]">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold text-xs">
              🌸
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight">FinOps</span>
              <span className="text-[9px] text-slate-400 block -mt-0.5">Autonomous Retail Ops</span>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium border ${
              operatingMode === 'in_house'
                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                : operatingMode === 'external_mcp'
                ? 'bg-indigo-950/60 border-indigo-500/30 text-indigo-400'
                : 'bg-purple-950/60 border-purple-500/30 text-purple-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                operatingMode === 'in_house'
                  ? 'bg-emerald-400'
                  : operatingMode === 'external_mcp'
                  ? 'bg-indigo-400'
                  : 'bg-purple-400'
              }`}
            />
            <span>
              {operatingMode === 'in_house'
                ? 'In-House'
                : operatingMode === 'external_mcp'
                ? 'MCP Active'
                : 'Dual-Agent'}
            </span>
          </div>
        </div>

        {/* Store Navigation (Compact & Clear) */}
        <div className="grid grid-cols-2 gap-1">
          <button
            id="nav-tab-overview"
            type="button"
            onClick={() => onSelectTab('overview')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-sky-400" />
            <span className="truncate">Overview</span>
          </button>

          <button
            id="nav-tab-stock"
            type="button"
            onClick={() => onSelectTab('stock')}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">Stock</span>
            </div>
            <span className="text-[8px] bg-rose-500/20 text-rose-300 px-1 rounded-full font-bold">1</span>
          </button>

          <button
            id="nav-tab-payments"
            type="button"
            onClick={() => onSelectTab('payments')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">Stripe Rails</span>
          </button>

          <button
            id="nav-tab-rules"
            type="button"
            onClick={() => onSelectTab('rules')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">Rules</span>
          </button>

          <button
            id="nav-tab-bills"
            type="button"
            onClick={() => onSelectTab('bills')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'bills'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-pink-400" />
            <span className="truncate">3-Way Match</span>
          </button>

          <button
            id="nav-tab-agent-api"
            type="button"
            onClick={() => onSelectTab('agent-api')}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'agent-api'
                ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate">External Agent</span>
            </div>
            <span className="text-[8px] font-mono bg-indigo-500/20 text-indigo-300 px-1 rounded font-bold">MCP</span>
          </button>
        </div>
      </div>

      {/* 2. Middle Section: Harmonized Co-Pilot & Ask / Adjust (Flexible scroll container) */}
      <div className="flex-1 min-h-0 flex flex-col py-3 space-y-2">
        {/* Co-Pilot Header & View Toggle */}
        <div className="flex items-center justify-between px-1 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Store Agent Co-Pilot</span>
          </div>

          <div className="flex items-center gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => setActiveView('suggestions')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                activeView === 'suggestions'
                  ? 'bg-pink-500/20 text-pink-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Suggestions
            </button>
            <button
              type="button"
              onClick={() => setActiveView('chat')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                activeView === 'chat'
                  ? 'bg-pink-500/20 text-pink-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Chat ({messages.length})
            </button>
          </div>
        </div>

        {/* View A: Suggested Questions */}
        {activeView === 'suggestions' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/40 rounded-xl p-3 border border-white/[0.06] space-y-1.5">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
              Ask or Adjust
            </span>
            {suggestedQuestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(item.q)}
                className="w-full text-left p-2 rounded-lg text-[11px] text-slate-300 hover:text-white hover:bg-white/[0.06] flex items-start gap-2 transition-all leading-tight group cursor-pointer"
              >
                <span className="text-[9px] font-mono text-slate-500 group-hover:text-pink-400 mt-0.5">
                  0{idx + 1}
                </span>
                <span className="line-clamp-2">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* View B: Active Chat Stream with Compact Action Cards */}
        {activeView === 'chat' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/60 rounded-xl p-2.5 border border-pink-500/20 space-y-2 text-xs">
            {messages.map((m) => (
              <div key={m.id} className="space-y-1.5">
                {/* Chat Bubble */}
                <div
                  className={`p-2 rounded-xl text-[11px] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-slate-800 text-slate-100 ml-5 rounded-tr-xs border border-slate-700/50'
                      : 'bg-gradient-to-br from-pink-950/30 to-slate-900/60 text-pink-50 border border-pink-500/20 mr-1.5 rounded-tl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[8px] opacity-60 mb-0.5">
                    <span className="font-semibold">{m.sender === 'user' ? 'Store Manager' : 'FinOps Agent'}</span>
                    <span>{m.time}</span>
                  </div>
                  <div>{m.text}</div>
                </div>

                {/* Inline Compact Action Card */}
                {m.actionCard && (
                  <div className="mr-1.5">
                    {/* Proposal Card */}
                    {m.actionCard.type === 'RESTOCK_PROPOSAL' && (
                      <div className="bg-sky-950/30 rounded-lg p-2 border border-sky-500/30 space-y-1.5 text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sky-300 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> {m.actionCard.title}
                          </span>
                          <span className="font-mono font-bold text-white">
                            £{m.actionCard.amountGbp?.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-tight">{m.actionCard.detail}</p>
                        {m.actionCard.canExecute && (
                          <button
                            type="button"
                            disabled={isSending}
                            onClick={() =>
                              handleSendMessage(
                                `Execute restock for ${m.actionCard?.skuName || 'Cold Brew'} ${m.actionCard?.quantity || 40} units`
                              )
                            }
                            className="w-full py-1 px-2 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                          >
                            <CreditCard className="w-2.5 h-2.5" />
                            <span>Disburse £{m.actionCard.amountGbp?.toFixed(2)} via Stripe</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Executed Stripe Card */}
                    {m.actionCard.type === 'RESTOCK_EXECUTED' && (
                      <div className="bg-emerald-950/30 rounded-lg p-2 border border-emerald-500/40 space-y-1.5 text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Paid via Stripe
                          </span>
                          <span className="font-mono font-bold text-emerald-200">
                            £{m.actionCard.amountGbp?.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-tight">{m.actionCard.detail}</p>
                        <div className="flex items-center gap-1 pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (m.actionCard?.transactionId) onInspectPayment(m.actionCard.transactionId);
                              else if (latestTxId) onInspectPayment(latestTxId);
                            }}
                            className="flex-1 py-1 px-2 rounded bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-200 font-semibold text-[9px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <HelpCircle className="w-2.5 h-2.5" />
                            <span>Audit in Cognee</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectTab('payments')}
                            className="py-1 px-2 rounded bg-white/[0.06] hover:bg-white/10 text-slate-300 text-[9px] transition-all cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Cognee Audit Card */}
                    {m.actionCard.type === 'AUDIT_INSPECT' && (
                      <div className="bg-pink-950/30 rounded-lg p-2 border border-pink-500/40 space-y-1.5 text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-pink-300 flex items-center gap-1">
                            <HelpCircle className="w-2.5 h-2.5" /> Cognee Provenance
                          </span>
                          <span className="font-mono font-bold text-pink-200">
                            £{m.actionCard.amountGbp?.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-tight">{m.actionCard.detail}</p>
                        <button
                          type="button"
                          onClick={() => {
                            if (m.actionCard?.transactionId) onInspectPayment(m.actionCard.transactionId);
                            else if (latestTxId) onInspectPayment(latestTxId);
                          }}
                          className="w-full py-1 px-2 rounded bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-slate-950 font-bold text-[10px] flex items-center justify-center gap-1 shadow transition-all cursor-pointer"
                        >
                          <HelpCircle className="w-2.5 h-2.5" />
                          <span>Open Causal Node Graph</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-1 text-[9px] text-pink-400 animate-pulse pl-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Agent reasoning...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* 3. Bottom Docked Input & Controls (Fixed Bottom) */}
      <div className="flex-shrink-0 space-y-2 pt-2 border-t border-white/[0.06]">
        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5">
          <button
            type="button"
            disabled={isSending}
            onClick={() => handleSendMessage('Restock 40 units of Cold Brew via Stripe')}
            className="whitespace-nowrap px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[9px] font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <CreditCard className="w-2 h-2" /> Move £320
          </button>
          <button
            type="button"
            disabled={isSending}
            onClick={() => handleSendMessage('Why did we pay FreshFarm £320? Audit this payment')}
            className="whitespace-nowrap px-2 py-0.5 rounded-full bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-300 text-[9px] font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <HelpCircle className="w-2 h-2" /> Audit £320
          </button>
          <button
            type="button"
            disabled={isSending}
            onClick={() => handleSendMessage('Can we afford 40 units of Cold Brew?')}
            className="whitespace-nowrap px-2 py-0.5 rounded-full bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[9px] font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="w-2 h-2" /> Propose
          </button>
        </div>

        {/* Form Input */}
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
            placeholder="Ask agent or move money..."
            disabled={isSending}
            className="w-full bg-slate-900/90 text-xs text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2 pr-8 border border-white/10 focus:outline-none focus:border-pink-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isSending}
            className="absolute right-1 p-1 bg-pink-500 hover:bg-pink-400 text-slate-950 rounded-md disabled:opacity-30 transition-all cursor-pointer"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>

        {/* Footer controls */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <button
            onClick={onResetDemo}
            className="hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-2.5 h-2.5 text-amber-400" />
            Reset Loop
          </button>

          <span className="font-mono text-[9px] text-slate-500">Flagship Soho</span>
        </div>
      </div>
    </aside>
  );
};
