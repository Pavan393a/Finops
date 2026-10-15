'use client';

import React, { useState } from 'react';
import {
  X,
  Package,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertCircle,
  Play,
  Sliders,
  DollarSign,
  Building2,
  Calendar,
} from 'lucide-react';
import { SkuItem } from './InventorySheet';

interface SkuDetailDrawerProps {
  sku: SkuItem | null;
  onClose: () => void;
  onInvestigate: (skuId: string, customQuantity?: number, directive?: string) => Promise<void>;
  isInvestigating: boolean;
  currentCashGbp: number;
}

export const SkuDetailDrawer: React.FC<SkuDetailDrawerProps> = ({
  sku,
  onClose,
  onInvestigate,
  isInvestigating,
  currentCashGbp,
}) => {
  if (!sku) return null;

  // Surge Simulator State
  const baseVelocity = parseFloat(sku.dailySalesVelocity) || 10;
  const [surgeMultiplier, setSurgeMultiplier] = useState<number>(1.0);
  const effectiveVelocity = parseFloat((baseVelocity * surgeMultiplier).toFixed(1));
  const simulatedDaysCover = parseFloat((sku.currentStock / effectiveVelocity).toFixed(1));

  // Custom reorder slider
  const [reorderUnits, setReorderUnits] = useState<number>(
    Math.max(sku.minimumOrderQuantity, Math.ceil(effectiveVelocity * 2))
  );

  const unitCostGbp = sku.unitCostPence / 100;
  const totalCostGbp = reorderUnits * unitCostGbp;
  const postOrderDaysCover = parseFloat(
    ((sku.currentStock + reorderUnits) / effectiveVelocity).toFixed(1)
  );

  // Policy preview
  const isAutoSpend = totalCostGbp <= 500;
  const projectedBalance = currentCashGbp - totalCostGbp;
  const isFloorSafe = projectedBalance >= 5000;

  // Listen for Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-lg h-full border-l border-white/10 flex flex-col justify-between overflow-y-auto shadow-2xl bg-[#0b101d]/95 cursor-default"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-start justify-between bg-slate-950/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {sku.code} · {sku.category}
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">{sku.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Section 1: Live Physical State */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/60 border border-white/[0.04] p-3.5 rounded-xl">
              <span className="text-[11px] text-slate-400 font-medium">On-Hand Stock</span>
              <div className="text-xl font-bold text-white mt-0.5">
                {sku.currentStock}{' '}
                <span className="text-xs text-slate-400 font-normal">units</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Reorder Point: {sku.reorderPoint} units</div>
            </div>

            <div className="bg-slate-900/60 border border-white/[0.04] p-3.5 rounded-xl">
              <span className="text-[11px] text-slate-400 font-medium">Days of Cover</span>
              <div
                className={`text-xl font-bold mt-0.5 ${
                  sku.daysOfCover < 3 ? 'text-rose-400' : sku.daysOfCover < 5 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {sku.daysOfCover}{' '}
                <span className="text-xs font-normal opacity-80">days</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {sku.daysOfCover < 3 ? 'Critical Stockout Alert' : 'Operational Buffer'}
              </div>
            </div>
          </div>

          {/* Section 2: Interactive Demand Surge Simulator (Origami / What-If pattern) */}
          <div className="bg-slate-900/80 border border-sky-500/20 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                Live Demand Surge Simulator
              </span>
              <span className="text-xs font-mono font-bold text-sky-400">
                {surgeMultiplier}x ({effectiveVelocity} units/day)
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Drag to simulate hot weather footfall, promo rush, or supplier lead-time shocks to test depletion velocity.
            </p>

            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={surgeMultiplier}
              onChange={(e) => setSurgeMultiplier(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
              <span>0.5x Slow</span>
              <span>1.0x Normal</span>
              <span>2.0x Spike</span>
              <span>3.0x Surge</span>
            </div>

            {/* Simulated Depletion Gauge */}
            <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs">
              <span className="text-slate-400">Simulated Runout Time:</span>
              <span
                className={`font-mono font-bold ${
                  simulatedDaysCover < 3 ? 'text-rose-400' : 'text-amber-400'
                }`}
              >
                {simulatedDaysCover} days remaining
              </span>
            </div>
          </div>

          {/* Section 3: Verified Supplier Terms */}
          <div className="bg-slate-900/60 border border-white/[0.04] p-4 rounded-xl space-y-2.5">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              Supplier Profile & Delivery Terms
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Primary Vendor:</span>
                <span className="font-medium text-slate-200">{sku.supplierName || 'FreshFarm Organics'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Fulfillment Lead Time:</span>
                <span className="font-medium text-slate-200">{sku.supplierLeadTime || 2} days</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Contract Unit Cost:</span>
                <span className="font-medium text-emerald-400">£{unitCostGbp.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Anti-Fraud Status:</span>
                <span className="font-medium text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Live Reorder Proposal Simulator */}
          <div className="bg-slate-900/80 border border-white/[0.08] p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Simulated Replenishment Order
              </span>
              <span className="text-xs font-bold text-white">
                {reorderUnits} units (£{totalCostGbp.toFixed(2)})
              </span>
            </div>

            <input
              type="range"
              min={sku.minimumOrderQuantity}
              max="80"
              step="5"
              value={reorderUnits}
              onChange={(e) => setReorderUnits(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.04] text-[11px]">
              <div>
                <span className="text-slate-400">Post-Order Stock Cover:</span>
                <span className="font-bold text-sky-400 ml-1">+{postOrderDaysCover} days</span>
              </div>
              <div>
                <span className="text-slate-400">Mandate Status:</span>
                <span
                  className={`font-semibold ml-1 ${
                    isAutoSpend && isFloorSafe
                      ? 'text-emerald-400'
                      : !isFloorSafe
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {isAutoSpend && isFloorSafe
                    ? 'Clause 2.1 Pre-Authorised'
                    : !isFloorSafe
                    ? 'Floor Breached (Blocked)'
                    : 'Clause 2.2 Approval Required'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer & Action Button */}
        <div className="p-6 border-t border-white/[0.08] bg-slate-950/80 space-y-3">
          <button
            onClick={() => {
              onInvestigate(
                sku.id,
                reorderUnits,
                `Surge simulated at ${surgeMultiplier}x velocity. Target: ${reorderUnits} units.`
              );
              onClose();
            }}
            disabled={isInvestigating || !isFloorSafe}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
              isAutoSpend && isFloorSafe
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : !isFloorSafe
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
            } disabled:opacity-50`}
          >
            <Play className={`w-3.5 h-3.5 ${isInvestigating ? 'animate-spin' : ''}`} />
            {isInvestigating
              ? 'Agent Investigating...'
              : !isFloorSafe
              ? 'Blocked: Breaches £5,000 Cash Floor'
              : isAutoSpend
              ? `Auto-Replenish ${reorderUnits} Units (£${totalCostGbp.toFixed(2)})`
              : `Submit for Store Approval (£${totalCostGbp.toFixed(2)})`}
          </button>
        </div>
      </div>
    </div>
  );
};
