'use client';

import React, { useState } from 'react';
import {
  X,
  Zap,
  ShoppingCart,
  Truck,
  DollarSign,
  ShieldAlert,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { SkuItem } from './InventorySheet';

interface LiveStoreSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  skus: SkuItem[];
  onRefreshData: () => Promise<void>;
}

export const LiveStoreSimulator: React.FC<LiveStoreSimulatorProps> = ({
  isOpen,
  onClose,
  skus,
  onRefreshData,
}) => {
  const [selectedSkuId, setSelectedSkuId] = useState<string>(skus[0]?.id || '');
  const [saleUnits, setSaleUnits] = useState<number>(5);
  const [deliveryUnits, setDeliveryUnits] = useState<number>(20);
  const [inflowGbp, setInflowGbp] = useState<number>(1500);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const runSimulation = async (eventType: string, payload: any) => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/telemetry/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          skuId: selectedSkuId || skus[0]?.id,
          ...payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simulation failed');

      if (eventType === 'VENDOR_FRAUD_ATTACK') {
        toast.error(data.message);
      } else {
        toast.success(data.message);
      }

      await onRefreshData();
    } catch (err: any) {
      toast.error(`Simulation error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-sky-500/30 overflow-hidden shadow-2xl relative bg-[#0b101e]/95 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Live Retail Operations Simulator
              </h3>
              <p className="text-xs text-slate-400">
                Trigger real store operational events to watch the agent observe, calculate, and act dynamically.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Target Product Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Target Product for Simulation:
            </label>
            <select
              value={selectedSkuId}
              onChange={(e) => setSelectedSkuId(e.target.value)}
              className="w-full bg-slate-900 text-xs text-slate-200 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-sky-500/50"
            >
              {skus.map((sku) => (
                <option key={sku.id} value={sku.id}>
                  {sku.name} ({sku.code}) — {sku.currentStock} in stock ({sku.daysOfCover} days cover)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event 1: Customer Sales Surge */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-rose-400" />
                    Customer Sales Surge
                  </span>
                  <span className="text-[10px] font-mono text-rose-400">Depletion</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Simulate footfall buying items. If stock drops under 3 days, watch the agent autonomously awaken!
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-slate-400">Units:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={saleUnits}
                    onChange={(e) => setSaleUnits(parseInt(e.target.value, 10))}
                    className="w-20 bg-slate-800 text-xs text-white p-1.5 rounded-lg border border-white/10 text-center"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isSimulating}
                onClick={() => runSimulation('SALE', { quantity: saleUnits })}
                className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                Simulate -{saleUnits} Units Sold
              </button>
            </div>

            {/* Event 2: Goods Delivery Received */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    Delivery Received
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Restock</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Supplier truck unloads boxes at your store dock. Shelf stock and days of cover increase dynamically!
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-slate-400">Units:</span>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={deliveryUnits}
                    onChange={(e) => setDeliveryUnits(parseInt(e.target.value, 10))}
                    className="w-20 bg-slate-800 text-xs text-white p-1.5 rounded-lg border border-white/10 text-center"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isSimulating}
                onClick={() => runSimulation('RESTOCK_DELIVERY', { quantity: deliveryUnits })}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm +{deliveryUnits} Delivered
              </button>
            </div>

            {/* Event 3: Day-end Cash Inflow */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-sky-400" />
                    Store Revenue Inflow
                  </span>
                  <span className="text-[10px] font-mono text-sky-400">Liquidity</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Simulate POS cash register day-end settlement crediting your bank operating balance.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-slate-400">Amount:</span>
                  <span className="text-xs text-white font-bold">£{inflowGbp}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isSimulating}
                onClick={() => runSimulation('CASH_INFLOW', { amountGbp: inflowGbp })}
                className="w-full py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                Credit +£{inflowGbp} to Bank
              </button>
            </div>

            {/* Event 4: Vendor Phishing / Bank Hack Attack */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-rose-500/30 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Supplier Bank Change Attack
                  </span>
                  <span className="text-[10px] font-mono text-rose-400">Clause 3.1</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Simulates compromised vendor credentials submitting an invoice with an altered Sort Code (99-88-77).
                </p>
              </div>

              <button
                type="button"
                disabled={isSimulating}
                onClick={() => runSimulation('VENDOR_FRAUD_ATTACK', {})}
                className="w-full py-2.5 px-3 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Trigger Bank Change Attack
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
