'use client';

import React from 'react';
import {
  Bot,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  Clock,
  ShieldCheck,
  CreditCard,
  Cpu,
} from 'lucide-react';

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  type: 'OBSERVE' | 'RULE_CHECK' | 'MONEY_MOVED' | 'RESTOCK' | 'SECURITY';
  title: string;
  detail: string;
  amountGbp?: number;
  stripeTransferId?: string;
  clauseCited?: string;
  transactionId?: string;
}

interface AgentActivityLogProps {
  logs: ActivityLogItem[];
  isAutoPilotActive: boolean;
  onToggleAutoPilot: () => void;
  onInspectProof: (txId: string) => void;
}

export const AgentActivityLog: React.FC<AgentActivityLogProps> = ({
  logs,
  isAutoPilotActive,
  onToggleAutoPilot,
  onInspectProof,
}) => {
  return (
    <div className="bg-slate-900/60 rounded-3xl p-6 lg:p-8 border border-white/[0.06] space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Autonomous Agent Operating Log
              </h3>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                Human Out of the Loop
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Every observation, spending rule check, and Stripe money movement is immutably logged for audit.
            </p>
          </div>
        </div>

        {/* Auto-Pilot Toggle (Apple Switch Style) */}
        <div className="flex items-center gap-3 bg-slate-950 p-2 px-3.5 rounded-2xl border border-white/[0.08]">
          <span className="text-xs font-semibold text-slate-300">
            Auto-Pilot Mode:
          </span>
          <button
            onClick={onToggleAutoPilot}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
              isAutoPilotActive ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                isAutoPilotActive ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span
            className={`text-[11px] font-bold font-mono ${
              isAutoPilotActive ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {isAutoPilotActive ? 'ACTIVE' : 'PAUSED'}
          </span>
        </div>
      </div>

      {/* Log Feed */}
      {logs.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 space-y-2">
          <Cpu className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
          <p>Agent is quietly observing store telemetry. No spending actions required at this moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-black/30 border border-white/[0.04] hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`p-2 rounded-xl mt-0.5 flex-shrink-0 ${
                    item.type === 'MONEY_MOVED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : item.type === 'SECURITY'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  }`}
                >
                  {item.type === 'MONEY_MOVED' ? (
                    <CreditCard className="w-4 h-4" />
                  ) : item.type === 'SECURITY' ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                </span>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{item.title}</span>
                    <span className="text-[10px] font-mono text-slate-500">{item.timestamp}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-xs">{item.detail}</p>

                  {item.clauseCited && (
                    <div className="text-[10px] font-mono text-emerald-400 pt-0.5">
                      Governed by: {item.clauseCited}
                    </div>
                  )}
                </div>
              </div>

              {/* Action / Proof Trigger */}
              {item.transactionId && (
                <button
                  onClick={() => onInspectProof(item.transactionId!)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 rounded-xl font-medium text-xs border border-sky-500/20 flex items-center gap-1.5 transition-all self-start sm:self-center flex-shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  Why did you pay this?
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
