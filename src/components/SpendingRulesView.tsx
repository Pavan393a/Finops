'use client';

import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface SpendingRulesViewProps {
  currentFloorGbp?: number;
  onRefreshData?: () => Promise<void>;
  onSyncMandate: () => Promise<void>;
  isSyncing: boolean;
}

export const SpendingRulesView: React.FC<SpendingRulesViewProps> = ({
  currentFloorGbp = 5000,
  onRefreshData,
  onSyncMandate,
  isSyncing,
}) => {
  const [bufferFloor, setBufferFloor] = React.useState<number>(currentFloorGbp);
  const [isUpdatingFloor, setIsUpdatingFloor] = React.useState(false);

  React.useEffect(() => {
    setBufferFloor(currentFloorGbp);
  }, [currentFloorGbp]);

  const handleSaveFloor = async () => {
    setIsUpdatingFloor(true);
    try {
      const res = await fetch('/api/store/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cashBufferFloorGbp: bufferFloor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update rules');
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsUpdatingFloor(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Autonomous Spending Mandate & Authority
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic rules governing how the agent autonomously observes, authorizes, and disburses money with zero human intervention.
          </p>
        </div>

        <button
          onClick={onSyncMandate}
          disabled={isSyncing}
          className="flex items-center gap-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-2xl border border-white/10 transition-all disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Mandate with Cognee'}
        </button>
      </div>

      {/* Interactive Safety Buffer Adjustment (Apple Sliders Card) */}
      <div className="bg-gradient-to-br from-slate-900/90 to-slate-900/40 rounded-3xl p-6 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Dynamic Rule 1.1 — Protected Operating Buffer Floor
            </span>
            <p className="text-sm text-slate-200 font-semibold mt-1">
              Minimum Liquidity Reserve: <span className="text-white font-mono font-bold text-base">£{bufferFloor.toLocaleString()}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {bufferFloor !== currentFloorGbp && (
              <button
                onClick={handleSaveFloor}
                disabled={isUpdatingFloor}
                className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isUpdatingFloor ? 'Saving...' : 'Save Rule to DB'}
              </button>
            )}
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Active In Ledger
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>£1,000 (Aggressive Growth)</span>
            <span className="text-indigo-400 font-bold">Current: £{bufferFloor.toLocaleString()}</span>
            <span>£10,000 (Ultra Conservative)</span>
          </div>
          <input
            type="range"
            min="1000"
            max="10000"
            step="250"
            value={bufferFloor}
            onChange={(e) => setBufferFloor(Number(e.target.value))}
            className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-2"
          />
        </div>
        <p className="text-xs text-slate-400">
          The agent evaluates this floor prior to executing any Stripe transfer. If a restocking PO would reduce the operating cash below this threshold, the agent aborts execution and requests manual override.
        </p>
      </div>

      {/* The 4 Operational Mandate Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rule 1: Cash Floor */}
        <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Rule 1.1 — Cash Liquidity Reserve
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Protected
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Operating account must preserve at least <strong>£{bufferFloor.toLocaleString()}</strong>. Guarantees payroll, leases, and statutory obligations before supplier spend.
          </p>
        </div>

        {/* Rule 2: Autonomous Auto-Spend */}
        <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Rule 2.1 — Orders Under £500 Pre-Approved
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Autonomous
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            When SKU stock drops below 3 days of cover, the agent executes replenishment POs up to <strong>£500</strong> instantly via Stripe Rails without human approval.
          </p>
        </div>

        {/* Rule 3: Manager Sign-off */}
        <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Rule 2.2 — Orders £500 to £2,500
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-500/20">
              Action Card Sign-off
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Restock disbursements exceeding <strong>£500</strong> pause and generate an interactive Action Card with live trade-offs for 1-click human confirmation.
          </p>
        </div>

        {/* Rule 4: Anti-Fraud Bank Change Defense */}
        <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Rule 3.1 — 3-Day Anti-Fraud Hold
            </span>
            <span className="text-[10px] font-mono text-rose-400 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-500/20">
              Tamper Defense
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Any invoice referencing new bank account details triggers an immediate <strong>72-hour cooling hold</strong>. Prevents invoice interception and CEO fraud.
          </p>
        </div>
      </div>

      {/* First Principles Section: How the Autonomous Agent Manages Money */}
      <div className="bg-slate-900/40 rounded-3xl p-6 border border-white/[0.06] space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          First Principles: Autonomous Retail Money Management (Human Out of the Loop)
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          When humans are removed from operational execution, safety and trust require an unbreachable 5-stage loop. Every penny spent must be provably traced to an operational necessity and validated by deterministic policy:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/[0.04] space-y-2">
            <span className="text-[10px] font-mono text-sky-400 font-bold">1. TELEMETRY</span>
            <p className="text-[11px] text-slate-200 font-semibold">Continuous Sensing</p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Real-time monitoring of SKU inventory, sales velocity, supplier lead times, and bank balance.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/[0.04] space-y-2">
            <span className="text-[10px] font-mono text-indigo-400 font-bold">2. REASONING</span>
            <p className="text-[11px] text-slate-200 font-semibold">Economic Optimization</p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Calculates optimal reorder batch to minimize stockout margin loss against holding cost.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/[0.04] space-y-2">
            <span className="text-[10px] font-mono text-amber-400 font-bold">3. MANDATE CHECK</span>
            <p className="text-[11px] text-slate-200 font-semibold">Deterministic Policy</p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Validates cash buffer floor (£{bufferFloor.toLocaleString()}), spend ceilings, and 3-way match before approval.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/[0.04] space-y-2">
            <span className="text-[10px] font-mono text-emerald-400 font-bold">4. STRIPE RAILS</span>
            <p className="text-[11px] text-slate-200 font-semibold">Money Movement</p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Programmatic transfer via Stripe Test Rails with cryptographic idempotency keys.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/[0.04] space-y-2">
            <span className="text-[10px] font-mono text-purple-400 font-bold">5. COGNEE MEMORY</span>
            <p className="text-[11px] text-slate-200 font-semibold">Immutable Provenance</p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Every step is saved in the Knowledge Graph, answering "Why did you pay this?" for auditors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
