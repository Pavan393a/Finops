'use client';

import React, { useState } from 'react';
import { Send, Sparkles, Zap, ShieldAlert, FileCheck, AlertTriangle } from 'lucide-react';

interface DirectiveBarProps {
  onRunDirective: (directive: string, skuId?: string) => Promise<void>;
  isLoading: boolean;
  skus: Array<{ id: string; code: string; name: string }>;
  onSelectTab: (tab: 'inventory' | 'audit' | 'threeway') => void;
}

export const DirectiveBar: React.FC<DirectiveBarProps> = ({
  onRunDirective,
  isLoading,
  skus,
  onSelectTab,
}) => {
  const [directive, setDirective] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directive.trim() || isLoading) return;
    onRunDirective(directive);
  };

  const sku104 = skus.find((s) => s.code === 'SKU-104');
  const sku105 = skus.find((s) => s.code === 'SKU-105');

  return (
    <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generative Directive Canvas</span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Natural language operational directives or 1-click test scenarios
        </span>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={directive}
          onChange={(e) => setDirective(e.target.value)}
          placeholder="Issue a directive e.g. 'Audit cold brew for weekend sunny surge' or click a test scenario below..."
          disabled={isLoading}
          className="w-full bg-slate-900/90 text-sm text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 pr-24 border border-white/10 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all"
        />
        <button
          type="submit"
          disabled={!directive.trim() || isLoading}
          className="absolute right-2 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-xs rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:hover:bg-sky-500"
        >
          <Send className="w-3 h-3" />
          {isLoading ? 'Running...' : 'Dispatch'}
        </button>
      </form>

      {/* Quick Test Scenario Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] font-medium text-slate-400 mr-1">Direct Proofs:</span>

        {/* Scenario 1: Auto-Spend */}
        <button
          type="button"
          onClick={() => {
            if (sku104) {
              onRunDirective('Autonomous replenishment for SKU-104 under £500 mandate limit', sku104.id);
            }
          }}
          disabled={isLoading}
          className="text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>1. Auto-Spend (£320 &lt; £500)</span>
        </button>

        {/* Scenario 2: Escalated Approval */}
        <button
          type="button"
          onClick={() => {
            if (sku105) {
              onRunDirective('Large batch replenishment for SKU-105 Organic Oat Milk exceeding £500', sku105.id);
            }
          }}
          disabled={isLoading}
          className="text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>2. Escalated Approval (&gt; £500)</span>
        </button>

        {/* Scenario 3: Bank Change Fraud Test */}
        <button
          type="button"
          onClick={() => onSelectTab('threeway')}
          className="text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
        >
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          <span>3. Fraud Defense (Clause 3.1)</span>
        </button>

        {/* Scenario 4: 3-Way Match */}
        <button
          type="button"
          onClick={() => onSelectTab('threeway')}
          className="text-xs font-medium text-sky-300 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
        >
          <FileCheck className="w-3 h-3 text-sky-400" />
          <span>4. 3-Way Match Lab</span>
        </button>
      </div>
    </div>
  );
};
