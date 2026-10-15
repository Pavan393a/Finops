import { db } from '../db';
import { agentRuns, purchaseOrders, skus, suppliers, tenants, transactions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { runAgentInvestigation, ProposalPlan } from './investigate';
import { evaluatePolicy, PolicyEvaluationResult } from '../policy/gate';
import { executeStripePayment, PaymentExecutionResult } from '../payment/stripe';
import { recordPaymentMemory } from '../cognee/mandate';

export interface OrchestrationResult {
  agentRunId: string;
  skuCode: string;
  skuName: string;
  proposal: ProposalPlan;
  policy: PolicyEvaluationResult;
  payment?: PaymentExecutionResult;
  status: 'AUTO_EXECUTED' | 'AWAITING_APPROVAL' | 'BLOCKED';
  message: string;
}

/**
 * End-to-End Orchestrator:
 * Signal ➔ Investigation (LLM + Cognee) ➔ Deterministic Policy Gate ➔ Execution or Escalation
 */
export async function triggerOrchestrationPipeline(params: {
  tenantId: string;
  skuId: string;
  customQuantity?: number;
  triggerEvent?: string;
  directive?: string;
}): Promise<OrchestrationResult> {
  // 1. Run Cognitive Agent Investigation
  const { agentRunId, proposal } = await runAgentInvestigation({
    tenantId: params.tenantId,
    skuId: params.skuId,
    triggerEvent: params.triggerEvent || 'STOCKOUT_ALERT',
    directive: params.directive,
  });

  // Allow custom override if user picked an alternate slider option
  let finalAmountPence = proposal.totalAmountPence;
  let finalQuantity = proposal.recommendedQuantity;
  if (params.customQuantity && params.customQuantity > 0) {
    finalQuantity = params.customQuantity;
    finalAmountPence = finalQuantity * proposal.unitCostPence;
    proposal.recommendedQuantity = finalQuantity;
    proposal.totalAmountPence = finalAmountPence;
  }

  // 2. Pass into Deterministic Safety Membrane
  const policyResult = await evaluatePolicy({
    tenantId: params.tenantId,
    supplierId: proposal.supplierId,
    skuId: proposal.skuId,
    amountPence: finalAmountPence,
    clauseCited: proposal.policyClauseCited,
  });

  // Update Agent Run with Policy Decision
  await db
    .update(agentRuns)
    .set({
      policyDecision: policyResult.decision === 'AUTO_EXECUTE' ? 'AUTO' : policyResult.decision === 'AWAITING_APPROVAL' ? 'ESCALATE' : 'BLOCK',
      status: policyResult.decision === 'AUTO_EXECUTE' ? 'EXECUTING' : policyResult.decision === 'AWAITING_APPROVAL' ? 'AWAITING_APPROVAL' : 'BLOCKED',
    })
    .where(eq(agentRuns.id, agentRunId));

  // Branch A: AUTO_EXECUTE (< £500, floor preserved, no cooling period)
  if (policyResult.decision === 'AUTO_EXECUTE') {
    // 1. Create Purchase Order in DB
    const poNumber = `PO-${Math.floor(1000 + Math.random() * 9000)}`;
    const [po] = await db
      .insert(purchaseOrders)
      .values({
        tenantId: params.tenantId,
        supplierId: proposal.supplierId,
        skuId: proposal.skuId,
        poNumber,
        quantity: finalQuantity,
        totalAmountPence: finalAmountPence,
        status: 'PLACED',
        notes: `Autonomous replenishment authorized under ${policyResult.clauseCited}`,
      })
      .returning();

    // 2. Execute Payment via Stripe Test Mode
    const payment = await executeStripePayment({
      tenantId: params.tenantId,
      agentRunId,
      purchaseOrderId: po.id,
      amountPence: finalAmountPence,
      destinationAccountId: proposal.destinationAccountId,
      supplierName: proposal.supplierName,
      skuName: proposal.skuName,
      clauseCited: policyResult.clauseCited,
    });

    // 3. Mark Agent Run as COMPLETED
    await db
      .update(agentRuns)
      .set({ status: 'COMPLETED' })
      .where(eq(agentRuns.id, agentRunId));

    // 4. Update Inventory Stock Level (Order Placed)
    await db
      .update(skus)
      .set({ currentStock: proposal.recommendedQuantity + 18 }) // replenished
      .where(eq(skus.id, proposal.skuId));

    // 5. Ingest Audit Record into Cognee Knowledge Graph
    const remainingCashGbp = (policyResult.projectedCashGbp).toFixed(2);
    await recordPaymentMemory({
      transactionId: payment.transactionId,
      stripeTransferId: payment.stripeTransferId,
      poNumber: po.poNumber,
      skuName: proposal.skuName,
      supplierName: proposal.supplierName,
      amountPence: finalAmountPence,
      clauseCited: policyResult.clauseCited,
      remainingCashGbp,
    });

    return {
      agentRunId,
      skuCode: proposal.skuCode,
      skuName: proposal.skuName,
      proposal,
      policy: policyResult,
      payment,
      status: 'AUTO_EXECUTED',
      message: `Successfully executed autonomous transfer of £${(finalAmountPence / 100).toFixed(2)} to ${proposal.supplierName} (${payment.stripeTransferId})`,
    };
  }

  // Branch B: AWAITING_APPROVAL (£500 - £2,500)
  if (policyResult.decision === 'AWAITING_APPROVAL') {
    return {
      agentRunId,
      skuCode: proposal.skuCode,
      skuName: proposal.skuName,
      proposal,
      policy: policyResult,
      status: 'AWAITING_APPROVAL',
      message: `Order of £${(finalAmountPence / 100).toFixed(2)} requires Store Manager authorization. Decision Card created on canvas.`,
    };
  }

  // Branch C: BLOCKED (Floor breach or anti-fraud cooling hold)
  return {
    agentRunId,
    skuCode: proposal.skuCode,
    skuName: proposal.skuName,
    proposal,
    policy: policyResult,
    status: 'BLOCKED',
    message: policyResult.reason,
  };
}

/**
 * Human 1-Click Approval Handler:
 * When operator clicks "Authorize" on an escalated decision card
 */
export async function executeHumanApproval(agentRunId: string): Promise<PaymentExecutionResult> {
  const [run] = await db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.id, agentRunId))
    .limit(1);

  if (!run) throw new Error('Agent run not found');
  if (run.status !== 'AWAITING_APPROVAL') {
    throw new Error(`Run status is ${run.status}, cannot approve`);
  }

  const proposal = run.proposalPlan as ProposalPlan;
  if (!proposal) throw new Error('No proposal plan found on run');

  // Re-verify policy at execution time
  const policyResult = await evaluatePolicy({
    tenantId: run.tenantId,
    supplierId: proposal.supplierId,
    skuId: proposal.skuId,
    amountPence: proposal.totalAmountPence,
    clauseCited: proposal.policyClauseCited,
  });

  if (policyResult.decision === 'BLOCKED') {
    throw new Error(`Blocked by safety membrane: ${policyResult.reason}`);
  }

  // 1. Create Purchase Order
  const poNumber = `PO-${Math.floor(1000 + Math.random() * 9000)}`;
  const [po] = await db
    .insert(purchaseOrders)
    .values({
      tenantId: run.tenantId,
      supplierId: proposal.supplierId,
      skuId: proposal.skuId,
      poNumber,
      quantity: proposal.recommendedQuantity,
      totalAmountPence: proposal.totalAmountPence,
      status: 'PLACED',
      notes: `Human manager 1-click authorization under ${policyResult.clauseCited}`,
    })
    .returning();

  // 2. Execute Payment via Stripe
  const payment = await executeStripePayment({
    tenantId: run.tenantId,
    agentRunId: run.id,
    purchaseOrderId: po.id,
    amountPence: proposal.totalAmountPence,
    destinationAccountId: proposal.destinationAccountId,
    supplierName: proposal.supplierName,
    skuName: proposal.skuName,
    clauseCited: `${policyResult.clauseCited} [Store Manager Signed]`,
  });

  // 3. Mark Run as COMPLETED
  await db
    .update(agentRuns)
    .set({ status: 'COMPLETED' })
    .where(eq(agentRuns.id, run.id));

  // 4. Ingest Audit Record into Cognee
  const remainingCashGbp = (policyResult.projectedCashGbp).toFixed(2);
  await recordPaymentMemory({
    transactionId: payment.transactionId,
    stripeTransferId: payment.stripeTransferId,
    poNumber: po.poNumber,
    skuName: proposal.skuName,
    supplierName: proposal.supplierName,
    amountPence: proposal.totalAmountPence,
    clauseCited: `${policyResult.clauseCited} [Store Manager Signed]`,
    remainingCashGbp,
  });

  return payment;
}
