'use client';

import React from 'react';
import { ArrowUpRight, Search, CheckCircle2, Clock, ShieldCheck, ArrowRightLeft } from 'lucide-react';

interface TransactionItem {
  id: string;
  agentRunId: string;
  stripeTransferId: string | null;
  amountPence: number;
  status: string;
  createdAt: string;
  settledAt: string | null;
  idempotencyKey: string;
}

interface TransactionStreamProps {
  transactions: TransactionItem[];
  onInspect: (transactionId: string) => void;
}

export const TransactionStream: React.FC<TransactionStreamProps> = ({
  transactions,
  onInspect,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            Settled Money Movement & Cognee Audit Trail
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable monotonic ledger of Stripe test transfers. Every pound is linked to Cognee knowledge graph memory.
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Track 01: "Agents that spend"
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-white/[0.04]">
          No settlements executed yet. Run an autonomous investigation or directive above.
        </div>
      ) : (
        <div className="divide-y divide-white/[0.05]">
          {transactions.map((tx) => {
            const amountGbp = (tx.amountPence / 100).toFixed(2);
            const dateStr = new Date(tx.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={tx.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">£{amountGbp}</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {tx.status}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{tx.stripeTransferId || 'tr_test_pending'}</span>
                      <span>·</span>
                      <span className="truncate max-w-[140px]">{tx.idempotencyKey}</span>
                      <span>·</span>
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onInspect(tx.id)}
                  className="self-start sm:self-center px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-medium text-xs rounded-lg flex items-center gap-1.5 border border-sky-500/20 hover:border-sky-500/40 transition-all"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Why Did You Pay This?</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
