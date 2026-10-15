'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

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
  onSelectSku: (sku: SkuItem) => void;
  isInvestigatingId: string | null;
}

export const InventorySheet: React.FC<InventorySheetProps> = ({
  skus,
  onInvestigate,
  onSelectSku,
  isInvestigatingId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(skus.map((s) => s.category)));
    return ['ALL', ...cats];
  }, [skus]);

  // Filtered SKUs
  const filteredSkus = useMemo(() => {
    return skus.filter((sku) => {
      const matchesSearch =
        sku.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sku.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sku.supplierName && sku.supplierName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'ALL' || sku.category === selectedCategory;
      const matchesStatus = selectedStatus === 'ALL' || sku.status === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [skus, searchQuery, selectedCategory, selectedStatus]);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-sky-400" />
            Operational Retail Inventory Command Sheet
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any SKU row to open the interactive demand surge simulator and supplier terms.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by SKU or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/80 text-xs text-slate-200 placeholder-slate-500 pl-8 pr-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-sky-500/50 w-44 sm:w-56"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/[0.06] text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all ${
                  selectedCategory === cat
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Quick Filter */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/[0.06] text-xs">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-2 py-1 rounded-lg text-[11px] ${
                selectedStatus === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus('CRITICAL')}
              className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 ${
                selectedStatus === 'CRITICAL' ? 'bg-rose-500 text-white font-bold' : 'text-rose-400'
              }`}
            >
              <AlertCircle className="w-3 h-3" /> Risk (&lt; 3d)
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Interactive SKU Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredSkus.map((sku) => {
          const isCritical = sku.status === 'CRITICAL';
          const isWarning = sku.status === 'WARNING';
          const isBusy = isInvestigatingId === sku.id;

          return (
            <div
              key={sku.id}
              onClick={() => onSelectSku(sku)}
              className={`group cursor-pointer rounded-2xl p-5 border transition-all duration-200 relative overflow-hidden ${
                isCritical
                  ? 'bg-gradient-to-b from-rose-950/30 to-slate-900/60 border-rose-500/50 glow-rose hover:border-rose-400'
                  : isWarning
                  ? 'bg-slate-900/60 border-amber-500/30 hover:border-amber-400'
                  : 'bg-slate-900/40 border-white/[0.06] hover:border-sky-500/30 hover:bg-slate-900/70'
              }`}
            >
              {/* Top Row: SKU code, category & status badge */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {sku.code}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                      {sku.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1 group-hover:text-sky-300 transition-colors">
                    {sku.name}
                  </h3>
                </div>

                {isCritical ? (
                  <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/50 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-3 h-3 text-rose-400" /> Stockout Risk
                  </span>
                ) : isWarning ? (
                  <span className="text-[10px] font-medium text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> Reorder Soon
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Healthy Buffer
                  </span>
                )}
              </div>

              {/* Visual Stock Cover Meter */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400">Days of Cover:</span>
                  <span
                    className={`font-mono font-bold ${
                      isCritical ? 'text-rose-400 text-sm' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {sku.daysOfCover} days remaining
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(100, (sku.daysOfCover / 10) * 100)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* High-Density Metrics Bar */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/[0.04] text-[11px] text-slate-400">
                <div>
                  On-Hand: <span className="text-slate-200 font-semibold">{sku.currentStock} units</span>
                </div>
                <div>
                  Velocity: <span className="text-slate-200 font-semibold">{sku.dailySalesVelocity}/day</span>
                </div>
                <div>
                  Contract Unit: <span className="text-emerald-400 font-semibold">£{(sku.unitCostPence / 100).toFixed(2)}</span>
                </div>
                <div className="truncate">
                  Vendor: <span className="text-slate-200 font-semibold">{sku.supplierName || 'Verified'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSku(sku);
                  }}
                  className="w-1/2 py-2 px-2.5 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1 transition-all"
                >
                  <SlidersHorizontal className="w-3 h-3 text-sky-400" />
                  Simulate
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInvestigate(sku.id);
                  }}
                  disabled={isBusy}
                  className={`w-1/2 py-2 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                    isCritical
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                  } disabled:opacity-50`}
                >
                  <Play className={`w-3 h-3 ${isBusy ? 'animate-spin' : ''}`} />
                  {isBusy ? 'Gating...' : isCritical ? 'Auto-Restock' : 'Audit'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
