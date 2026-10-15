'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { OrigamiSidebar } from '@/components/OrigamiSidebar';
import { AppleStoreOverview } from '@/components/AppleStoreOverview';
import { InventorySheet, SkuItem } from '@/components/InventorySheet';
import { DecisionCard, DecisionCardData } from '@/components/DecisionCard';
import { CogneeInspectorModal } from '@/components/CogneeInspectorModal';
import { ThreeWayMatchLab } from '@/components/ThreeWayMatchLab';
import { TransactionStream } from '@/components/TransactionStream';
import { SkuDetailDrawer } from '@/components/SkuDetailDrawer';
import { SpendingRulesView } from '@/components/SpendingRulesView';
import { Sparkles, User } from 'lucide-react';

export default function FinOpsCanvasPage() {
  const [storeData, setStoreData] = useState<any>(null);
  const [activeCards, setActiveCards] = useState<DecisionCardData[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'stock' | 'payments' | 'rules' | 'bills'>('overview');
  const [isSyncingMandate, setIsSyncingMandate] = useState(false);
  const [isInvestigatingSkuId, setIsInvestigatingSkuId] = useState<string | null>(null);
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
        toast.success(data.message || 'Store spending rules synced with Cognee!');
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

  // 4. 1-Click Approval Handler
  const handleApprove = async (runId: string, customQuantity?: number) => {
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

  // 5. Reject Handler
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

  // 6. Cognee Multi-Hop Audit Inspector Trigger
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

  // 7. Reset Demo Loop
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
  const latestTx = storeData?.recentTransactions?.[0]?.id;

  return (
    <div className="min-h-screen bg-[#080c16] text-slate-100 flex flex-col lg:flex-row antialiased">
      {/* 1. Left Sidebar (Origami Design Pattern) */}
      <OrigamiSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onResetDemo={handleResetDemo}
        onInspectPayment={handleInspectCognee}
        latestTxId={latestTx}
        onRefreshData={fetchStoreStatus}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col overflow-x-hidden min-h-screen">
        {/* Top Minimalist Header (Apple Style) */}
        <header className="h-16 border-b border-white/[0.06] bg-slate-950/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Store:</span>
            <span className="text-sm font-bold text-white tracking-tight">{storeName}</span>
          </div>

          {/* Minimalist Step Progress Indicators (From Origami screenshot) */}
          <div className="hidden sm:flex items-center gap-2">
            <div className={`w-6 h-1 rounded-full ${activeTab === 'overview' ? 'bg-pink-500' : 'bg-slate-700'}`} />
            <div className={`w-6 h-1 rounded-full ${activeTab === 'stock' ? 'bg-pink-500' : 'bg-slate-700'}`} />
            <div className={`w-6 h-1 rounded-full ${activeTab === 'payments' ? 'bg-pink-500' : 'bg-slate-700'}`} />
            <div className={`w-6 h-1 rounded-full ${activeTab === 'rules' ? 'bg-pink-500' : 'bg-slate-700'}`} />
            <div className={`w-6 h-1 rounded-full ${activeTab === 'bills' ? 'bg-pink-500' : 'bg-slate-700'}`} />
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
              P
            </div>
            <span className="text-xs font-semibold text-slate-200 hidden sm:inline">Pavan</span>
          </div>
        </header>

        {/* Dynamic Main Canvas Area */}
        <main className="p-6 lg:p-10 max-w-6xl w-full mx-auto space-y-8 flex-1">
          {/* Active Decision Cards (Always displayed at top if present) */}
          {activeCards.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Active Restock Plan
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {activeCards.length} action item
                </span>
              </div>

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
          )}

          {/* View Tab 1: Overview */}
          {activeTab === 'overview' && (
            <AppleStoreOverview
              currentCashGbp={currentCash}
              cashFloorGbp={cashFloor}
              skus={storeData?.skus || []}
              onInvestigate={handleRunInvestigation}
              onSelectSku={(sku) => setSelectedDrawerSku(sku)}
              onInspectPayment={handleInspectCognee}
              latestTransactions={storeData?.recentTransactions || []}
              isInvestigating={isInvestigatingSkuId !== null}
            />
          )}

          {/* View Tab 2: Inventory & Stock Command Sheet */}
          {activeTab === 'stock' && (
            <InventorySheet
              skus={storeData?.skus || []}
              onInvestigate={(skuId) => handleRunInvestigation(skuId)}
              onSelectSku={(sku) => setSelectedDrawerSku(sku)}
              isInvestigatingId={isInvestigatingSkuId}
            />
          )}

          {/* View Tab 3: Money Moved via Stripe */}
          {activeTab === 'payments' && (
            <TransactionStream
              transactions={storeData?.recentTransactions || []}
              onInspect={handleInspectCognee}
            />
          )}

          {/* View Tab 4: Spending Rules */}
          {activeTab === 'rules' && (
            <SpendingRulesView
              onSyncMandate={handleSyncMandate}
              isSyncing={isSyncingMandate}
            />
          )}

          {/* View Tab 5: 3-Way Match & Fraud Defense Lab */}
          {activeTab === 'bills' && (
            <ThreeWayMatchLab purchaseOrders={storeData?.purchaseOrders || []} />
          )}
        </main>
      </div>

      {/* Slide-Over Drawer: Demand Surge Simulator */}
      <SkuDetailDrawer
        sku={selectedDrawerSku}
        onClose={() => setSelectedDrawerSku(null)}
        onInvestigate={(skuId, qty, dir) => handleRunInvestigation(skuId, dir, qty)}
        isInvestigating={isInvestigatingSkuId !== null}
        currentCashGbp={currentCash}
      />

      {/* Modal: "Why Did You Pay This?" Cognee Causal Inspector */}
      <CogneeInspectorModal
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        data={inspectorData}
        isLoading={inspectorLoading}
      />
    </div>
  );
}
