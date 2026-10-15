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
import { LiveStoreSimulator } from '@/components/LiveStoreSimulator';
import { ExternalAgentGateway } from '@/components/ExternalAgentGateway';
import { ActivityLogItem } from '@/components/AgentActivityLog';
import { Sparkles, User, Zap } from 'lucide-react';

export default function FinOpsCanvasPage() {
  const [storeData, setStoreData] = useState<any>(null);
  const [activeCards, setActiveCards] = useState<DecisionCardData[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'stock' | 'payments' | 'rules' | 'bills' | 'agent-api'>('overview');
  const [isSyncingMandate, setIsSyncingMandate] = useState(false);
  const [isInvestigatingSkuId, setIsInvestigatingSkuId] = useState<string | null>(null);
  const [isProcessingCardId, setIsProcessingCardId] = useState<string | null>(null);
  const [selectedDrawerSku, setSelectedDrawerSku] = useState<SkuItem | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isAutoPilotActive, setIsAutoPilotActive] = useState(true);

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

  // Derive dynamic activity logs (Human Out of the Loop)
  const activityLogs: ActivityLogItem[] = React.useMemo(() => {
    const list: ActivityLogItem[] = [];

    // 1. Transactions (Money Moved via Stripe)
    if (storeData?.recentTransactions) {
      storeData.recentTransactions.forEach((tx: any) => {
        list.push({
          id: `tx-${tx.id}`,
          timestamp: new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'MONEY_MOVED',
          title: `Autonomous Payment: £${(tx.amountPence / 100).toFixed(2)}`,
          detail: `Transferred via Stripe Test Rails (${tx.stripeTransferId || 'tr_test_settled'}). Idempotency key verified.`,
          amountGbp: tx.amountPence / 100,
          stripeTransferId: tx.stripeTransferId,
          transactionId: tx.id,
        });
      });
    }

    // 2. Critical stock observation
    const critical = storeData?.skus?.find((s: any) => s.status === 'CRITICAL');
    if (critical) {
      list.unshift({
        id: `crit-${critical.id}`,
        timestamp: 'Just now',
        type: 'OBSERVE',
        title: `Telemetry Alert: ${critical.name} Low Stock`,
        detail: `Stock level dropped to ${critical.currentStock} units (${critical.daysOfCover} days remaining). Reorder threshold breached.`,
        clauseCited: 'Rule 2.1 Pre-Authorised Restock',
      });
    }

    // 3. Baseline rule observation
    list.push({
      id: 'rule-baseline',
      timestamp: 'Today',
      type: 'RULE_CHECK',
      title: 'Store Spending Rules Active',
      detail: `Operating buffer floor £${cashFloor.toLocaleString()} protected. Pre-authorized spend limit: £500 per order.`,
      clauseCited: 'Mandate v1.0',
    });

    return list;
  }, [storeData, cashFloor]);

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
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-full border border-white/[0.04]">
            <button
              onClick={() => setActiveTab('overview')}
              title="Store Overview"
              className={`w-6 h-1.5 rounded-full transition-all ${
                activeTab === 'overview' ? 'bg-pink-500 scale-110 shadow-sm shadow-pink-500/50' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
            <button
              onClick={() => setActiveTab('stock')}
              title="Inventory & Stock"
              className={`w-6 h-1.5 rounded-full transition-all ${
                activeTab === 'stock' ? 'bg-pink-500 scale-110 shadow-sm shadow-pink-500/50' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
            <button
              onClick={() => setActiveTab('payments')}
              title="Money Moved (Stripe)"
              className={`w-6 h-1.5 rounded-full transition-all ${
                activeTab === 'payments' ? 'bg-pink-500 scale-110 shadow-sm shadow-pink-500/50' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
            <button
              onClick={() => setActiveTab('rules')}
              title="Spending Rules"
              className={`w-6 h-1.5 rounded-full transition-all ${
                activeTab === 'rules' ? 'bg-pink-500 scale-110 shadow-sm shadow-pink-500/50' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
            <button
              onClick={() => setActiveTab('bills')}
              title="3-Way Match & Bills"
              className={`w-6 h-1.5 rounded-full transition-all ${
                activeTab === 'bills' ? 'bg-pink-500 scale-110 shadow-sm shadow-pink-500/50' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
            <button
              onClick={() => setActiveTab('agent-api')}
              title="External Agent Interop"
              className={`w-6 h-1.5 rounded-full transition-all ${
                activeTab === 'agent-api' ? 'bg-indigo-500 scale-110 shadow-sm shadow-indigo-500/50' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
          </div>

          {/* Actions & User Profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Live Simulator</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                P
              </div>
              <span className="text-xs font-semibold text-slate-200 hidden sm:inline">Pavan</span>
            </div>
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
              isAutoPilotActive={isAutoPilotActive}
              onToggleAutoPilot={() => setIsAutoPilotActive(!isAutoPilotActive)}
              activityLogs={activityLogs}
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
              currentFloorGbp={cashFloor}
              onRefreshData={fetchStoreStatus}
              onSyncMandate={handleSyncMandate}
              isSyncing={isSyncingMandate}
            />
          )}

          {/* View Tab 5: 3-Way Match & Fraud Defense Lab */}
          {activeTab === 'bills' && (
            <ThreeWayMatchLab purchaseOrders={storeData?.purchaseOrders || []} />
          )}

          {/* View Tab 6: External AI Agent Interoperability Gateway */}
          {activeTab === 'agent-api' && (
            <ExternalAgentGateway onRefreshData={fetchStoreStatus} />
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

      {/* Interactive Live Store Simulator Modal */}
      <LiveStoreSimulator
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        skus={storeData?.skus || []}
        onRefreshData={fetchStoreStatus}
      />
    </div>
  );
}
