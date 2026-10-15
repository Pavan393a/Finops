'use client';

import React from 'react';
import { X, Network, ShieldCheck, CheckCircle2, ArrowRight, ExternalLink, Cpu } from 'lucide-react';

interface CausalNode {
  id: string;
  type: string;
  label: string;
  detail: string;
}

interface CogneeExplanation {
  clauseCited: string;
  operationalEvidence: string;
  stripeProof: string;
  cashFloorSafety: string;
  explanation: string;
}

interface CogneeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    transaction: any;
    audit: CogneeExplanation;
    causalGraphNodes: CausalNode[];
  } | null;
  isLoading: boolean;
}

export const CogneeInspectorModal: React.FC<CogneeInspectorModalProps> = ({
  isOpen,
  onClose,
  data,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-sky-500/30 overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Network className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Cognee Memory Inspector: <span className="text-sky-400">"Why Did You Pay This?"</span>
              </h3>
              <p className="text-xs text-slate-400">
                Multi-hop causal provenance extracted directly from Cognee Knowledge Graph
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Cpu className="w-8 h-8 text-sky-400 animate-spin" />
              <p className="text-sm text-slate-400 font-medium">
                Traversing Cognee Knowledge Graph for Causal Proof...
              </p>
            </div>
          ) : data ? (
            <>
              {/* Visual Multi-Hop Causal Graph */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  1. Causal Graph Traversal
                </span>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-1">
                  {data.causalGraphNodes.map((node, i) => (
                    <div
                      key={node.id}
                      className="bg-slate-900/90 border border-white/[0.06] rounded-xl p-3 flex flex-col justify-between text-xs relative"
                    >
                      <div>
                        <span className="text-[9px] font-mono font-bold text-sky-400 uppercase tracking-wider">
                          Hop {i + 1}
                        </span>
                        <div className="font-semibold text-slate-100 mt-0.5">{node.label}</div>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-2 font-mono break-words">
                        {node.detail}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanatory Deep Dive from Cognee */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  2. Cognee Semantic Rationale
                </span>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-white/[0.06] space-y-3">
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {data.audit.explanation}
                  </div>
                </div>
              </div>

              {/* Evidence Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pillar A: Authorizing Clause */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-white/[0.04] space-y-1">
                  <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Authorizing Mandate Clause
                  </div>
                  <div className="text-xs text-slate-300 font-mono pt-1">
                    {data.audit.clauseCited}
                  </div>
                </div>

                {/* Pillar B: Cash Floor Verification */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-white/[0.04] space-y-1">
                  <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Liquidity Floor Safety
                  </div>
                  <div className="text-xs text-slate-300 pt-1">
                    {data.audit.cashFloorSafety}
                  </div>
                </div>
              </div>

              {/* Settlement Proof */}
              <div className="bg-slate-950 p-4 rounded-xl border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 text-xs">
                  <div className="text-slate-400">Stripe Transfer ID:</div>
                  <div className="font-mono text-emerald-400 font-bold">
                    {data.transaction?.stripeTransferId || 'tr_test_settled'}
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="text-slate-400">Idempotency Key:</div>
                  <div className="font-mono text-slate-300">
                    {data.transaction?.idempotencyKey}
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="text-slate-400">Status:</div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    SETTLED
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm">
              No audit explanation record found.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-all"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
