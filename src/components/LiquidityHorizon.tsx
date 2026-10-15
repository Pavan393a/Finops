'use client';

import React from 'react';
import { ShieldCheck, ArrowUpRight, RefreshCw, Sparkles, Building2, Lock } from 'lucide-react';

interface LiquidityHorizonProps {
  storeName: string;
  currentCashGbp: number;
  cashFloorGbp: number;
  onSyncMandate: () => Promise<void>;
  isSyncing: boolean;
}

export const LiquidityHorizon: React.FC<LiquidityHorizonProps> = ({
  storeName,
  currentCashGbp,
  cashFloorGbp,
  onSyncMandate,
  isSyncing,
}) => {
  const deployableCash = Math.max(0, currentCashGbp - cashFloorGbp);
  const floorRatio = Math.min(100, Math.round((cashFloorGbp / currentCashGbp) * 100));
  const deployableRatio = 100 - floorRatio;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-72 h-48 bg-sky-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Store identity and Mandate Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse-glow" />
            <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              Autonomous Control Plane Active
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {storeName || 'Tillwise Retail Flagship Soho'}
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Liquidity Horizon & Spend Mandate
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Real-time balance telemetry under Store Spending Mandate v1.0. Bounded by autonomous £500 auto-replenishment & protected £5,000 cash floor.
          </p>
        </div>

        {/* Right: Quick Mandate Sync Button */}
        <div className="flex items-center gap-3 self-start lg:self-auto">
          <button
            onClick={onSyncMandate}
            disabled={isSyncing}
            className="flex items-center gap-2 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 hover:border-slate-600 px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing Knowledge Graph...' : 'Sync Mandate to Cognee'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/[0.06]">
        {/* Metric 1: Total Liquid Cash */}
        <div className="bg-slate-900/60 border border-white/[0.04] p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Available Operating Cash</div>
          <div className="text-2xl font-bold text-white tracking-tight mt-1 flex items-baseline gap-1">
            <span>£{currentCashGbp.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-xs text-slate-400 font-normal">GBP</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live Supabase Balance
          </div>
        </div>

        {/* Metric 2: Protected Cash Floor (Mandate Clause 1.1) */}
        <div className="bg-slate-900/60 border border-white/[0.04] p-4 rounded-xl relative overflow-hidden">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Protected Liquidity Floor
          </div>
          <div className="text-2xl font-bold text-amber-300 tracking-tight mt-1 flex items-baseline gap-1">
            <span>£{cashFloorGbp.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-xs text-amber-400/80 font-normal">Clause 1.1</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Untouchable reserve for payroll & utilities
          </div>
        </div>

        {/* Metric 3: Autonomous Headroom */}
        <div className="bg-slate-900/60 border border-white/[0.04] p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Deployable Spend Headroom
          </div>
          <div className="text-2xl font-bold text-sky-400 tracking-tight mt-1 flex items-baseline gap-1">
            <span>£{deployableCash.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-xs text-sky-400/80 font-normal">Buffer Safe</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Available for replenishment without breaching floor
          </div>
        </div>
      </div>

      {/* Visual Runway Horizon Bar */}
      <div className="mt-5 space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-sm bg-amber-500/80" />
            Protected Floor: £{cashFloorGbp.toFixed(0)} ({floorRatio}%)
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="w-2 h-2 rounded-sm bg-sky-500/80" />
            Deployable: £{deployableCash.toFixed(0)} ({deployableRatio}%)
          </span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${floorRatio}%` }}
            className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-l-full"
            title="Protected Floor"
          />
          <div
            style={{ width: `${deployableRatio}%` }}
            className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-r-full"
            title="Deployable Cash"
          />
        </div>
      </div>
    </div>
  );
};
