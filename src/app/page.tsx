'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Layers,
  Sparkles,
  Package,
  ArrowRightLeft,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  Github,
  Zap,
} from 'lucide-react';
import { LiquidityHorizon } from '@/components/LiquidityHorizon';
import { DirectiveBar } from '@/components/DirectiveBar';
import { InventorySheet, SkuItem } from '@/components/InventorySheet';
import { DecisionCard, DecisionCardData } from '@/components/DecisionCard';
import { CogneeInspectorModal } from '@/components/CogneeInspectorModal';
import { ThreeWayMatchLab } from '@/components/ThreeWayMatchLab';
import { TransactionStream } from '@/components/TransactionStream';
import { SkuDetailDrawer } from '@/components/SkuDetailDrawer';

export default function FinOpsCanvasPage() {
  const [storeData, setStoreData] = useState<any>(null);
  const [activeCards, setActiveCards] = useState<DecisionCardData[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'threeway'>('overview');
  const [isSyncingMandate, setIsSyncingMandate] = useState(false);
  const [isInvestigatingSkuId, setIsInvestigatingSkuId] = useState<string | null>(null);
  const [isProcessingDirective, setIsProcessingDirective] = useState(false);
  const [isProcessingCardId, setIsProcessingCardId] = useState<string | null>(null);
  const [selectedDrawerSku, setSelectedDrawerSku] = useState<SkuItem | null>(null);

  // Inspector Modal State
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorData, setInspectorData] = useState<any>(null);
  const [inspectorLoading, setInspectorLoading] = useState(false);

  // 1. Fetch Store Telemetry
  const fetchStoreStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/store/status');
      if (!res.ok) throw new Error('Failed to load store status');
      const data = await res.json();
      setStoreData(data);

      // If pending approvals exist in DB, populate as decision cards
      if (data.pendingApprovals && data.pendingApprovals.length > 0) {
        const pendingCards: DecisionCardData[] = data.pendingApprovals
          .filter((run: any) => run.proposalPlan)
          .map((run: any) => ({
            agentRunId: run.id,
            skuCode: run.proposalPlan.skuCode || 'SKU',
            skuName: run.proposalPlan.skuName || 'Item',
            proposal: run.proposalPlan,
            policy: {
              decision: 'AWAITING_APPROVAL',
              clauseCited: run.clauseCited || 'Mandate v1.0, Clause 2.2',
              reason: 'Over £500 limit. Awaiting Store Manager authorization.',
              projectedCashGbp:
                parseFloat(data.tenant.currentCashBalanceGbp) -
                run.proposalPlan.totalAmountPence / 100,
            },
            status: 'AWAITING_APPROVAL',
            message: 'Awaiting 1-Click Store Sign-off',
          }));

        setActiveCards((prev) => {
          const existingIds = new Set(prev.map((c) => c.agentRunId));
          const uniqueNew = pendingCards.filter((c) => !existingIds.has(c.agentRunId));
          return [...uniqueNew, ...prev];
        });
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchStoreStatus();
  }, [fetchStoreStatus]);

  // 2. Sync Mandate with Cognee Knowledge Graph
  const handleSyncMandate = async () => {
    setIsSyncingMandate(true);
    try {
      const res = await fetch('/api/mandate/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Store Mandate v1.0 cognified in Cognee!');
      } else {
        toast.error(`Cognee Sync: ${data.message}`);
      }
    } catch (err: any) {
      toast.error(`Sync error: ${err.message}`);
    } finally {
      setIsSyncingMandate(false);
    }
  };

  // 3. Trigger Investigation via Directive, Sku Card, or Surge Drawer
  const handleRunInvestigation = async (skuId: string, directive?: string, customQuantity?: number) => {
    setIsInvestigatingSkuId(skuId);
    try {
      const res = await fetch('/api/agent/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skuId, directive, customQuantity }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Investigation failed');

      // Add to decision cards
      const newCard: DecisionCardData = {
        agentRunId: data.agentRunId,
        skuCode: data.skuCode,
        skuName: data.skuName,
        proposal: data.proposal,
        policy: data.policy,
        payment: data.payment,
        status: data.status,
        message: data.message,
      };

      setActiveCards((prev) => [newCard, ...prev]);

      if (data.status === 'AUTO_EXECUTED') {
        toast.success(`Autonomous Transfer Settled: £${(data.proposal.totalAmountPence / 100).toFixed(2)} transferred via Stripe test rails!`);
      } else if (data.status === 'AWAITING_APPROVAL') {
        toast.warning('Order exceeds £500 limit. Decision Card generated for 1-click authorization.');
      } else if (data.status === 'BLOCKED') {
        toast.error(`Payment Blocked by Safety Membrane: ${data.policy.reason}`);
      }

      await fetchStoreStatus();
    } catch (err: any) {
      toast.error(`Investigation error: ${err.message}`);
    } finally {
      setIsInvestigatingSkuId(null);
    }
  };

  // 4. Handle Conversational Directive
  const handleDirective = async (directive: string, targetedSkuId?: string) => {
    setIsProcessingDirective(true);
    let skuId = targetedSkuId;

    if (!skuId && storeData?.skus?.length > 0) {
      // Find critical SKU or default to first
      const critical = storeData.skus.find((s: SkuItem) => s.status === 'CRITICAL');
      skuId = critical ? critical.id : storeData.skus[0].id;
    }

    if (skuId) {
      await handleRunInvestigation(skuId, directive);
    }
    setIsProcessingDirective(false);
  };

  // 5. 1-Click Approval Handler
  const handleApprove = async (runId: string) => {
    setIsProcessingCardId(runId);
    try {
      const res = await fetch(`/api/approvals/${runId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');

      toast.success('Approved! Stripe transfer executed and memory ingested into Cognee.');

      // Update card in state
      setActiveCards((prev) =>
        prev.map((c) =>
          c.agentRunId === runId
            ? {
                ...c,
                status: 'AUTO_EXECUTED',
                payment: data.payment,
              }
            : c
        )
      );

      await fetchStoreStatus();
    } catch (err: any) {
      toast.error(`Approval error: ${err.message}`);
    } finally {
      setIsProcessingCardId(null);
    }
  };

  // 6. Reject Handler
  const handleReject = async (runId: string) => {
    setIsProcessingCardId(runId);
    try {
      const res = await fetch(`/api/approvals/${runId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rejection failed');

      toast.info('Order proposal rejected.');
      setActiveCards((prev) => prev.filter((c) => c.agentRunId !== runId));
      await fetchStoreStatus();
    } catch (err: any) {
      toast.error(`Rejection error: ${err.message}`);
    } finally {
      setIsProcessingCardId(null);
    }
  };

  // 7. Cognee Multi-Hop Audit Inspector Trigger
  const handleInspectCognee = async (transactionId: string) => {
    setInspectorOpen(true);
    setInspectorLoading(true);
    setInspectorData(null);

    try {
      const res = await fetch('/api/audit/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to explain payment');

      setInspectorData(data);
    } catch (err: any) {
      toast.error(`Cognee Explainer error: ${err.message}`);
    } finally {
      setInspectorLoading(false);
    }
  };

  // 8. Reset Demo State Handler
  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setActiveCards([]);
        await fetchStoreStatus();
      } else {
        toast.error(`Reset failed: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Reset error: ${err.message}`);
    }
  };

  const currentCash = storeData ? parseFloat(storeData.tenant.currentCashBalanceGbp) : 6740;
  const cashFloor = storeData ? storeData.tenant.cashBufferFloorGbp : 5000;
  const storeName = storeData?.tenant?.name || 'Tillwise Retail Flagship Soho';

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Zap className="w-4 h-4 text-slate-950 fill-current" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                Tillwise <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">v1.0</span>
              </span>
            </div>
          </div>

          {/* Navigation Pill Toggles & Reset Demo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900/80 border border-white/[0.08] p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === 'overview'
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Control Canvas
              </button>
              <button
                onClick={() => setActiveTab('threeway')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === 'threeway'
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3-Way Match & Fraud Lab
              </button>
            </div>

            <button
              onClick={handleResetDemo}
              title="Reset store balance to £6,740 and restore SKU-104 stockout alert"
              className="text-xs font-medium text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>

          {/* Track Badges */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[11px] font-mono font-medium text-slate-300 bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg">
              Stripe Test Rail
            </span>
            <span className="text-[11px] font-mono font-medium text-sky-300 bg-sky-950/60 border border-sky-500/30 px-2.5 py-1 rounded-lg">
              Cognee KG Memory
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1 w-full">
        {/* 1. Ambient Liquidity Horizon */}
        <LiquidityHorizon
          storeName={storeName}
          currentCashGbp={currentCash}
          cashFloorGbp={cashFloor}
          onSyncMandate={handleSyncMandate}
          isSyncing={isSyncingMandate}
        />

        {/* 2. CreateAnything-Style Conversational Directive Bar */}
        <DirectiveBar
          onRunDirective={handleDirective}
          isLoading={isProcessingDirective}
          skus={storeData?.skus || []}
          onSelectTab={(tab) => {
            if (tab === 'threeway') setActiveTab('threeway');
            else setActiveTab('overview');
          }}
        />

        {activeTab === 'overview' ? (
          <>
            {/* 3. Action Artifacts (Generative Decision Cards) */}
            {activeCards.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Materialized Decision Artifacts
                  </h2>
                  <span className="text-xs text-slate-400 font-mono">
                    {activeCards.length} {activeCards.length === 1 ? 'card' : 'cards'} active
                  </span>
                </div>

                <div className="space-y-4">
                  {activeCards.map((card) => (
                    <DecisionCard
                      key={card.agentRunId}
                      card={card}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onInspectCognee={handleInspectCognee}
                      isProcessing={isProcessingCardId === card.agentRunId}
                      currentCashGbp={currentCash}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 4. Operational SKU Inventory Sheet */}
            <InventorySheet
              skus={storeData?.skus || []}
              onInvestigate={(skuId) => handleRunInvestigation(skuId)}
              onSelectSku={(sku) => setSelectedDrawerSku(sku)}
              isInvestigatingId={isInvestigatingSkuId}
            />

            {/* 5. Settled Stripe Transfers & Cognee Audit Stream */}
            <TransactionStream
              transactions={storeData?.recentTransactions || []}
              onInspect={handleInspectCognee}
            />
          </>
        ) : (
          /* 3-Way Match & Fraud Defense Lab */
          <ThreeWayMatchLab purchaseOrders={storeData?.purchaseOrders || []} />
        )}
      </main>

      {/* Sku Detail & Demand Surge Simulator Drawer */}
      <SkuDetailDrawer
        sku={selectedDrawerSku}
        onClose={() => setSelectedDrawerSku(null)}
        onInvestigate={(skuId, qty, dir) => handleRunInvestigation(skuId, dir, qty)}
        isInvestigating={isInvestigatingSkuId !== null}
        currentCashGbp={currentCash}
      />

      {/* Cognee "Why Did You Pay This?" Multi-Hop Audit Inspector Modal */}
      <CogneeInspectorModal
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        data={inspectorData}
        isLoading={inspectorLoading}
      />

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-slate-500">
        Tillwise · Autonomous Retail FinOps Control Plane · Track 01 ("Agents that spend") + Side Quest ("Best use of Cognee memory")
      </footer>
    </div>
  );
}
