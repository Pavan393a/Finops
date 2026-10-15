'use client';

import React, { useState } from 'react';
import {
  X,
  Network,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Cpu,
  Layers,
  FileText,
  DollarSign,
  Copy,
  Check,
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'graph' | 'semantic' | 'settlement'>('graph');
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-4xl rounded-3xl border border-sky-500/30 overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col bg-[#0b101f]/95">
        {/* Top Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08] bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/30">
              <Network className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 bg-sky-950 px-2 py-0.5 rounded-full border border-sky-500/30">
                  Side Quest: Cognee Memory
                </span>
                <span className="text-[10px] font-mono text-slate-400">Track 01 Provenance</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                Cognee Multi-Hop Inspector: <span className="text-sky-400">"Why Did You Pay This?"</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/[0.08] text-xs">
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'graph' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Causal Graph
              </button>
              <button
                onClick={() => setActiveTab('semantic')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'semantic' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Cognee Semantic
              </button>
              <button
                onClick={() => setActiveTab('settlement')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'settlement' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Stripe Rails
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Cpu className="w-10 h-10 text-sky-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm text-slate-200 font-bold">Traversing Cognee Knowledge Graph...</p>
                <p className="text-xs text-slate-400 mt-1">Retrieving multi-hop causal provenance and verifying clause citations</p>
              </div>
            </div>
          ) : data ? (
            <>
              {activeTab === 'graph' && (
                <div className="space-y-6">
                  {/* Visual Causal Nodes with Glowing Connectors */}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                      1. Multi-Hop Causal Provenance Traversal
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                      {data.causalGraphNodes.map((node, i) => (
                        <div
                          key={node.id}
                          className="bg-slate-900/90 border border-white/[0.08] hover:border-sky-500/40 rounded-2xl p-4 flex flex-col justify-between text-xs relative group transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded-full border border-sky-500/30">
                                Hop {i + 1}
                              </span>
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            </div>
                            <div className="font-bold text-white text-sm">{node.label}</div>
                          </div>
                          <div className="text-[11px] text-slate-300 mt-3 font-mono leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
                            {node.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Evidence Pillars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] space-y-2">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Authorizing Mandate Clause
                      </div>
                      <div className="text-xs text-slate-200 font-mono bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                        {data.audit.clauseCited}
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] space-y-2">
                      <div className="text-xs font-bold text-sky-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-sky-400" />
                        Liquidity Reserve Safety Verification
                      </div>
                      <div className="text-xs text-slate-200 font-mono bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
                        {data.audit.cashFloorSafety}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'semantic' && (
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    2. Verbatim Cognee Semantic Rationale
                  </span>
                  <div className="bg-slate-950 p-5 rounded-2xl border border-white/[0.08] space-y-3 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {data.audit.explanation}
                  </div>
                </div>
              )}

              {activeTab === 'settlement' && (
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    3. Live Stripe Payment Settlement Rail
                  </span>
                  <div className="bg-slate-950 p-5 rounded-2xl border border-white/[0.08] space-y-4 text-xs">
                    <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                      <span className="text-slate-400">Stripe Transfer ID:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400 font-bold text-sm">
                          {data.transaction?.stripeTransferId || 'tr_test_settled'}
                        </span>
                        <button
                          onClick={() => copyToClipboard(data.transaction?.stripeTransferId || '')}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        >
                          {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                      <span className="text-slate-400">Cryptographic Idempotency Key:</span>
                      <span className="font-mono text-slate-200 truncate max-w-sm">
                        {data.transaction?.idempotencyKey}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Ledger Settlement State:</span>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                        SETTLED ON STRIPE TEST RAILS
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              No audit explanation record found.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-white/[0.08] bg-slate-950/80 flex justify-between items-center">
          <span className="text-xs text-slate-400 font-mono">
            Cognee Graph Proof · Bounded Deterministic Membrane
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
