'use client';

import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface SpendingRulesViewProps {
  onSyncMandate: () => Promise<void>;
  isSyncing: boolean;
}

export const SpendingRulesView: React.FC<SpendingRulesViewProps> = ({
  onSyncMandate,
  isSyncing,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Store Spending Rules & Authority
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            These rules tell the store AI agent what it can pay automatically and when it must stop to ask you.
          </p>
        </div>

        <button
          onClick={onSyncMandate}
          disabled={isSyncing}
          className="flex items-center gap-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-2xl border border-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Rules with Cognee'}
        </button>
      </div>

      {/* The 5 Plain-English Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rule 1: Cash Floor */}
        <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Rule 1.1 — £5,000 Safety Buffer
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full">
              Protected
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The store operating bank account must keep at least <strong>£5,000</strong> at all times. Any order that would push the balance below £5,000 is automatically blocked to guarantee payroll and rent.
          </p>
        </div>

        {/* Rule 2: Autonomous Auto-Spend */}
        <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Rule 2.1 — Orders Under £500 Pre-Approved
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full">
              Autonomous
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            If a fast-selling product has less than 3 days of stock left, the agent can autonomously order and pay up to <strong>£500</strong> immediately without waiting for human permission.
          </p>
        </div>

        {/* Rule 3: Manager Sign-off */}
        <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Rule 2.2 — Orders Between £500 & £2,500
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full">
              Requires 1-Click
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Any order between <strong>£500 and £2,500</strong> automatically pauses. The agent prepares the exact plan and renders an Action Card on your screen for you to authorize with 1 click.
          </p>
        </div>

        {/* Rule 4: Anti-Fraud Bank Change Defense */}
        <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Rule 3.1 — 3-Day Anti-Fraud Hold
            </span>
            <span className="text-[10px] font-mono text-rose-400 bg-rose-950 px-2 py-0.5 rounded-full">
              Security
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            If an inbound invoice or email requests payment to a new bank account or sort code, the platform freezes payouts for <strong>3 days</strong> to prevent invoice phishing attacks.
          </p>
        </div>
      </div>
    </div>
  );
};
