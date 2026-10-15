'use client';

import React from 'react';
import { Package, TrendingUp, AlertCircle, CheckCircle2, Clock, Play } from 'lucide-react';

export interface SkuItem {
  id: string;
  code: string;
  name: string;
  category: string;
  currentStock: number;
  dailySalesVelocity: string;
  reorderPoint: number;
  unitCostPence: number;
  minimumOrderQuantity: number;
  supplierId: string;
  supplierName: string | null;
  supplierAccount: string | null;
  supplierCooling: boolean | null;
  supplierLeadTime: number | null;
  daysOfCover: number;
  status: 'CRITICAL' | 'WARNING' | 'HEALTHY';
}

interface InventorySheetProps {
  skus: SkuItem[];
  onInvestigate: (skuId: string) => Promise<void>;
  isInvestigatingId: string | null;
}

export const InventorySheet: React.FC<InventorySheetProps> = ({
  skus,
  onInvestigate,
  isInvestigatingId,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-sky-400" />
            Operational Inventory & Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical stock cover calculated from live sales velocity. Flags impending stockouts before shelf starvation.
          </p>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical (&lt; 3d)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning (3-5d)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy (&gt; 5d)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {skus.map((sku) => {
          const isCritical = sku.status === 'CRITICAL';
          const isWarning = sku.status === 'WARNING';
          const isBusy = isInvestigatingId === sku.id;

          return (
            <div
              key={sku.id}
              className={`rounded-xl p-5 border transition-all ${
                isCritical
                  ? 'bg-rose-950/20 border-rose-500/40 glow-rose'
                  : isWarning
                  ? 'bg-amber-950/15 border-amber-500/30'
                  : 'bg-slate-900/40 border-white/[0.06] hover:border-white/10'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {sku.code} · {sku.category}
                  </span>
                  <h3 className="text-sm font-semibold text-white mt-0.5">{sku.name}</h3>
                </div>
                {isCritical ? (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-3 h-3" /> Stockout Risk
                  </span>
                ) : isWarning ? (
                  <span className="text-[10px] font-medium text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Low Stock
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Healthy
                  </span>
                )}
              </div>

              {/* Days of Cover Progress */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400">Days of Cover:</span>
                  <span
                    className={`font-bold ${
                      isCritical ? 'text-rose-400 text-sm' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {sku.daysOfCover} days
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (sku.daysOfCover / 10) * 100)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCritical
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* Detail Stats */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/[0.04] text-[11px] text-slate-400">
                <div>
                  Stock / Threshold: <span className="text-slate-200 font-medium">{sku.currentStock} / {sku.reorderPoint}</span>
                </div>
                <div>
                  Velocity: <span className="text-slate-200 font-medium">{sku.dailySalesVelocity}/day</span>
                </div>
                <div>
                  Unit Cost: <span className="text-slate-200 font-medium">£{(sku.unitCostPence / 100).toFixed(2)}</span>
                </div>
                <div>
                  Vendor: <span className="text-slate-200 font-medium">{sku.supplierName || 'Verified'}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onInvestigate(sku.id)}
                disabled={isBusy}
                className={`w-full mt-4 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isCritical
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                } disabled:opacity-50`}
              >
                <Play className={`w-3 h-3 ${isBusy ? 'animate-spin' : ''}`} />
                {isBusy ? 'Agent Investigating...' : isCritical ? 'Investigate & Auto-Replenish' : 'Audit Stock Level'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
