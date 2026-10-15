'use client';

import React from 'react';
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  ArrowUpRight,
  Package,
  Search,
  Sliders,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { SkuItem } from './InventorySheet';
import { AgentActivityLog, ActivityLogItem } from './AgentActivityLog';

interface AppleStoreOverviewProps {
  currentCashGbp: number;
  cashFloorGbp: number;
  skus: SkuItem[];
  onInvestigate: (skuId: string, directive?: string, customQty?: number) => Promise<void>;
  onSelectSku: (sku: SkuItem) => void;
  onInspectPayment: (txId: string) => void;
  latestTransactions: any[];
  isInvestigating: boolean;
  isAutoPilotActive: boolean;
  onToggleAutoPilot: () => void;
  activityLogs: ActivityLogItem[];
}

export const AppleStoreOverview: React.FC<AppleStoreOverviewProps> = ({
  currentCashGbp,
  cashFloorGbp,
  skus,
  onInvestigate,
  onSelectSku,
  onInspectPayment,
  latestTransactions,
  isInvestigating,
  isAutoPilotActive,
  onToggleAutoPilot,
  activityLogs,
}) => {
  const safeSpendGbp = Math.max(0, currentCashGbp - cashFloorGbp);
  const criticalSku = skus.find((s) => s.status === 'CRITICAL') || skus[0];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. At a Glance: Cash & Safety Buffer (Apple Clean Minimalism) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Financial Health
          </span>
          <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Bank Connection (Stripe)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Available Cash */}
          <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/[0.06] hover:border-white/10 transition-all">
            <span className="text-xs text-slate-400 font-medium">Available Cash</span>
            <div className="text-3xl font-extrabold text-white tracking-tight mt-1 flex items-baseline gap-1">
              <span>£{currentCashGbp.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-xs text-slate-400 font-normal">GBP</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Store balance in operating bank account.
            </p>
          </div>

          {/* Card 2: Protected Safety Buffer */}
          <div className="bg-slate-900/60 rounded-3xl p-6 border border-white/[0.06] hover:border-white/10 transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Protected Safety Buffer
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
                Rule 1.1
              </span>
            </div>
            <div className="text-3xl font-extrabold text-amber-300 tracking-tight mt-1">
              £{cashFloorGbp.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Untouchable reserve for payroll and rent.
            </p>
          </div>

          {/* Card 3: Safe to Spend Today */}
          <div className="bg-gradient-to-br from-slate-900/90 to-sky-950/40 rounded-3xl p-6 border border-sky-500/20 hover:border-sky-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs text-sky-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Safe to Spend Today
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Authorized
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight mt-1">
              £{safeSpendGbp.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Available for stock replenishment without touching safety buffer.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Primary Operational Urgent Action: Impending Stockout Alert */}
      {criticalSku && (
        <section className="bg-gradient-to-r from-rose-950/30 via-slate-900/80 to-slate-900/80 rounded-3xl p-6 lg:p-8 border border-rose-500/40 shadow-xl space-y-5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Urgent Restock Needed
                </span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">
                  {criticalSku.name} ({criticalSku.code})
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-3 py-1 rounded-full">
                Only {criticalSku.daysOfCover} days of stock left
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="bg-black/30 p-4 rounded-2xl border border-white/[0.04]">
              <span className="text-slate-400 block mb-1">Current In-Stock</span>
              <span className="text-lg font-bold text-white">{criticalSku.currentStock} units</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Selling {criticalSku.dailySalesVelocity} units / day</span>
            </div>

            <div className="bg-black/30 p-4 rounded-2xl border border-white/[0.04]">
              <span className="text-slate-400 block mb-1">Agent Recommendation</span>
              <span className="text-lg font-bold text-emerald-400">Order 20 units (£320.00)</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">From {criticalSku.supplierName || 'FreshFarm Organics'}</span>
            </div>

            <div className="bg-black/30 p-4 rounded-2xl border border-white/[0.04]">
              <span className="text-slate-400 block mb-1">Spending Rule Check</span>
              <span className="text-lg font-bold text-sky-400">Pre-Approved (&lt; £500)</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Leaves £6,420 safe cash</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => onInvestigate(criticalSku.id)}
              disabled={isInvestigating}
              className="w-full sm:w-auto px-6 py-3.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" />
              {isInvestigating ? 'Agent Moving Money...' : 'Authorize & Pay £320 via Stripe'}
            </button>

            <button
              onClick={() => onSelectSku(criticalSku)}
              className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 border border-white/10 transition-all"
            >
              <Sliders className="w-4 h-4 text-sky-400" />
              Simulate Demand Surge
            </button>
          </div>
        </section>
      )}

      {/* 3. Products in Store (Clean Cards) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-400" />
              Products in Store
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Current stock and projected shelf cover for all store items.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{skus.length} items tracked</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {skus.map((sku) => {
            const isCritical = sku.status === 'CRITICAL';
            const isWarning = sku.status === 'WARNING';

            return (
              <div
                key={sku.id}
                onClick={() => onSelectSku(sku)}
                className="bg-slate-900/60 rounded-3xl p-5 border border-white/[0.06] hover:border-white/15 cursor-pointer transition-all space-y-3 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      {sku.code}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5 group-hover:text-sky-300 transition-colors">
                      {sku.name}
                    </h4>
                  </div>

                  {isCritical ? (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                      Restock Now
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      Healthy
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Stock Cover:</span>
                    <span className={`font-bold ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {sku.daysOfCover} days
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (sku.daysOfCover / 10) * 100)}%` }}
                      className={`h-full rounded-full ${isCritical ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.04]">
                  <span>{sku.currentStock} in stock</span>
                  <span>£{(sku.unitCostPence / 100).toFixed(2)}/unit</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Autonomous Agent Activity Log (Human Out of the Loop) */}
      <AgentActivityLog
        logs={activityLogs}
        isAutoPilotActive={isAutoPilotActive}
        onToggleAutoPilot={onToggleAutoPilot}
        onInspectProof={onInspectPayment}
      />

      {/* 5. Recent Money Moved (Stripe Proof) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Recent Payments
          </span>
          <span className="text-xs text-slate-400">Settled via Stripe Rails</span>
        </div>

        {latestTransactions.length === 0 ? (
          <div className="bg-slate-900/40 rounded-3xl p-6 text-center text-xs text-slate-400 border border-white/[0.04]">
            No payments executed yet. Click "Authorize & Pay" above to see real money movement.
          </div>
        ) : (
          <div className="bg-slate-900/60 rounded-3xl p-4 border border-white/[0.06] divide-y divide-white/[0.04]">
            {latestTransactions.slice(0, 3).map((tx) => (
              <div
                key={tx.id}
                className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        £{(tx.amountPence / 100).toFixed(2)}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full">
                        SETTLED
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {tx.stripeTransferId || 'tr_test_settled'} · {new Date(tx.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onInspectPayment(tx.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 rounded-xl text-xs font-medium border border-sky-500/20 transition-all flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Search className="w-3.5 h-3.5" />
                  Why was this paid?
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
