'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Search,
  Sliders,
  DollarSign,
  TrendingDown,
  Layers,
} from 'lucide-react';

export interface DecisionCardData {
  agentRunId: string;
  skuCode: string;
  skuName: string;
  proposal: {
    recommendedQuantity: number;
    unitCostPence: number;
    totalAmountPence: number;
    supplierName: string;
    daysOfCoverRemaining: number;
    daysOfCoverAfterReorder: number;
    rationale: string;
    policyClauseCited: string;
    tradeoffOptions?: Array<{
      label: string;
      quantity: number;
      costPence: number;
      daysCover: number;
      isRecommended: boolean;
    }>;
  };
  policy: {
    decision: 'AUTO_EXECUTE' | 'AWAITING_APPROVAL' | 'BLOCKED';
    clauseCited: string;
    reason: string;
    projectedCashGbp: number;
  };
  payment?: {
    stripeTransferId: string;
    transactionId: string;
    status: string;
    idempotencyKey: string;
  };
  status: 'AUTO_EXECUTED' | 'AWAITING_APPROVAL' | 'BLOCKED';
  message: string;
}

interface DecisionCardProps {
  card: DecisionCardData;
  onApprove: (runId: string, customQuantity?: number) => Promise<void>;
  onReject: (runId: string) => Promise<void>;
  onInspectCognee: (transactionId: string) => void;
  isProcessing: boolean;
  currentCashGbp?: number;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  card,
  onApprove,
  onReject,
  onInspectCognee,
  isProcessing,
  currentCashGbp = 6740,
}) => {
  const [selectedQty, setSelectedQty] = useState<number>(card.proposal.recommendedQuantity);

  const isAuto = card.status === 'AUTO_EXECUTED';
  const isPending = card.status === 'AWAITING_APPROVAL';
  const isBlocked = card.status === 'BLOCKED';

  const unitCostGbp = card.proposal.unitCostPence / 100;
  const currentTotalGbp = parseFloat((selectedQty * unitCostGbp).toFixed(2));
  const dynamicProjectedBalance = parseFloat((currentCashGbp - currentTotalGbp).toFixed(2));
  const isFloorSafe = dynamicProjectedBalance >= 5000;
  const isWithinAutoLimit = currentTotalGbp <= 500;

  // Compute dynamic policy status as user drags the slider
  const dynamicPolicyStatus = useMemo(() => {
    if (!isFloorSafe) {
      return {
        badge: 'FLOOR BREACH (BLOCKED)',
        color: 'text-rose-400 bg-rose-950/80 border-rose-500/40',
        clause: 'Mandate Clause 1.1 (Liquidity Reserve Floor < £5,000)',
        canExecute: false,
      };
    }
    if (isWithinAutoLimit) {
      return {
        badge: 'AUTO-AUTHORIZED',
        color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40',
        clause: 'Mandate Clause 2.1 (Auto-Replenishment < £500)',
        canExecute: true,
      };
    }
    if (currentTotalGbp <= 2500) {
      return {
        badge: 'APPROVAL REQUIRED',
        color: 'text-amber-400 bg-amber-950/80 border-amber-500/40',
        clause: 'Mandate Clause 2.2 (Approval Threshold: £500 - £2,500)',
        canExecute: true,
      };
    }
    return {
      badge: 'CAP EXCEEDED (BLOCKED)',
      color: 'text-rose-400 bg-rose-950/80 border-rose-500/40',
      clause: 'Mandate Clause 2.3 (Single Order Cap > £2,500)',
      canExecute: false,
    };
  }, [isFloorSafe, isWithinAutoLimit, currentTotalGbp]);

  return (
    <div
      className={`glass-panel rounded-2xl p-6 border transition-all duration-300 ${
        isAuto
          ? 'border-emerald-500/40 glow-emerald'
          : isPending
          ? 'border-amber-500/40 glow-amber'
          : 'border-rose-500/40 glow-rose'
      }`}
    >
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <span
            className={`p-2 rounded-xl ${
              isAuto ? 'bg-emerald-500/20 text-emerald-400' : isPending ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Interactive Action Artifact · {card.skuCode}
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {card.skuName} Replenishment Directive
            </h3>
          </div>
        </div>

        {/* State Badge */}
        <div>
          {isAuto && (
            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Settled Autonomous Spend (&lt; £500)
            </span>
          )}
          {isPending && (
            <span className="text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Awaiting 1-Click Store Sign-off
            </span>
          )}
          {isBlocked && (
            <span className="text-xs font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              Safety Membrane Blocked
            </span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-5">
        {/* Left Column: Context, Tradeoff Slider, and Rationale */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-400">AI Investigation & Context Rationale:</span>
            <p className="text-xs text-slate-200 mt-1.5 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-white/[0.04]">
              {card.proposal.rationale}
            </p>
          </div>

          {/* Interactive Live Slider (Origami / CreateAnything pattern) */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                Live Replenishment Quantity Slider
              </span>
              <span className="text-sm font-mono font-bold text-sky-400">
                {selectedQty} units
              </span>
            </div>

            <input
              type="range"
              min="10"
              max="80"
              step="5"
              disabled={isAuto || isProcessing}
              value={selectedQty}
              onChange={(e) => setSelectedQty(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 disabled:opacity-50"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>10 units (MOQ)</span>
              <span>20 units (Rec)</span>
              <span>40 units (Buffer)</span>
              <span>80 units (Max)</span>
            </div>
          </div>

          {/* Tradeoff Option Selectors */}
          {card.proposal.tradeoffOptions && card.proposal.tradeoffOptions.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Select Strategy Horizon:</span>
                <span>Unit: £{unitCostGbp.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {card.proposal.tradeoffOptions.map((opt, idx) => {
                  const isSelected = selectedQty === opt.quantity;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAuto || isProcessing}
                      onClick={() => setSelectedQty(opt.quantity)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-sky-950/40 border-sky-400/60 shadow-lg shadow-sky-950/40 scale-[1.02]'
                          : 'bg-slate-900/40 border-white/[0.05] hover:border-white/10 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{opt.quantity} units</span>
                        {opt.isRecommended && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/30">
                            Rec
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-sky-400 mt-1">
                        £{(opt.costPence / 100).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        +{opt.daysCover}d stock buffer
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Governing Mandate Clause */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Governing Mandate:
            </span>
            <span className="text-emerald-300 font-mono font-medium truncate max-w-sm">
              {dynamicPolicyStatus.clause}
            </span>
          </div>
        </div>

        {/* Right Column: Financial Impact & Live Authority Status */}
        <div className="bg-slate-950/80 rounded-xl p-5 border border-white/[0.06] flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Financial Impact
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${dynamicPolicyStatus.color}`}
              >
                {dynamicPolicyStatus.badge}
              </span>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Order Quantity:</span>
                <span className="font-bold text-white">{selectedQty} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Disbursement:</span>
                <span className="font-bold text-lg text-emerald-400">£{currentTotalGbp.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Supplier:</span>
                <span className="font-medium text-slate-200">{card.proposal.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Post-Order Balance:</span>
                <span
                  className={`font-semibold ${
                    isFloorSafe ? 'text-sky-300' : 'text-rose-400 font-bold'
                  }`}
                >
                  £{dynamicProjectedBalance.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-amber-400/90 pt-1.5 border-t border-white/[0.04]">
                <span>Protected Floor:</span>
                <span>£5,000.00 Floor Buffer</span>
              </div>
            </div>
          </div>

          {/* Action Execution Button */}
          <div className="pt-2">
            {isAuto && (
              <div className="space-y-2">
                <div className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-lg font-mono truncate">
                  Stripe: <span className="text-emerald-400 font-bold">{card.payment?.stripeTransferId}</span>
                </div>
                {card.payment?.transactionId && (
                  <button
                    type="button"
                    onClick={() => onInspectCognee(card.payment!.transactionId)}
                    className="w-full py-3 px-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Why Did You Pay This? (Cognee Proof)
                  </button>
                )}
              </div>
            )}

            {isPending && (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => onReject(card.agentRunId)}
                  className="w-1/3 py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={isProcessing || !dynamicPolicyStatus.canExecute}
                  onClick={() => onApprove(card.agentRunId, selectedQty)}
                  className={`w-2/3 py-3 px-3 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-all ${
                    dynamicPolicyStatus.canExecute
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  } disabled:opacity-50`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  {isProcessing
                    ? 'Executing...'
                    : !dynamicPolicyStatus.canExecute
                    ? 'Floor Breached'
                    : `Authorize £${currentTotalGbp.toFixed(2)}`}
                </button>
              </div>
            )}

            {isBlocked && (
              <div className="text-xs text-rose-300 bg-rose-950/50 p-3 rounded-xl border border-rose-500/30">
                {card.policy.reason}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
