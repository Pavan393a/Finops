import { db } from '../db';
import { tenants, suppliers, skus } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface PolicyEvaluationInput {
  tenantId: string;
  supplierId: string;
  skuId?: string;
  amountPence: number;
  clauseCited?: string;
}

export type PolicyDecisionType = 'AUTO_EXECUTE' | 'AWAITING_APPROVAL' | 'BLOCKED';

export interface PolicyEvaluationResult {
  decision: PolicyDecisionType;
  isAllowed: boolean;
  requiresHumanSignoff: boolean;
  clauseCited: string;
  reason: string;
  currentCashGbp: number;
  projectedCashGbp: number;
  cashFloorGbp: number;
  isCoolingPeriodActive: boolean;
}

/**
 * Deterministic Safety Membrane
 * Core Axiom: Models may observe, investigate, and propose;
 * but deterministic systems authorize, execute, and account for money movement.
 */
export async function evaluatePolicy(input: PolicyEvaluationInput): Promise<PolicyEvaluationResult> {
  // 1. Fetch Tenant Financial Limits
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, input.tenantId))
    .limit(1);

  if (!tenant) {
    throw new Error(`Tenant not found: ${input.tenantId}`);
  }

  // 2. Fetch Supplier Verification & Fraud Status
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, input.supplierId))
    .limit(1);

  if (!supplier) {
    throw new Error(`Supplier not found: ${input.supplierId}`);
  }

  const currentCashGbp = parseFloat(tenant.currentCashBalanceGbp);
  const cashFloorGbp = tenant.cashBufferFloorGbp; // e.g. 5000 (£5,000)
  const spendGbp = input.amountPence / 100;
  const projectedCashGbp = currentCashGbp - spendGbp;

  // RULE 1: Anti-Fraud Bank Change Cooling Period (Clause 3.1)
  if (supplier.isInCoolingPeriod) {
    return {
      decision: 'BLOCKED',
      isAllowed: false,
      requiresHumanSignoff: true,
      clauseCited: 'Mandate v1.0, Clause 3.1 (Anti-Fraud & Bank Details Cooling Period)',
      reason: `SECURITY BLOCK: Supplier ${supplier.name} bank details were modified recently. 3-day mandatory cooling period is active. Dual human verification required before disbursement.`,
      currentCashGbp,
      projectedCashGbp,
      cashFloorGbp,
      isCoolingPeriodActive: true,
    };
  }

  // RULE 2: Liquidity Reserve Floor (Clause 1.1)
  // Projected cash balance must NEVER fall below £5,000 floor
  if (projectedCashGbp < cashFloorGbp) {
    return {
      decision: 'BLOCKED',
      isAllowed: false,
      requiresHumanSignoff: true,
      clauseCited: 'Mandate v1.0, Clause 1.1 (Liquidity Reserve Floor)',
      reason: `LIQUIDITY BREACH: Spending £${spendGbp.toFixed(2)} would reduce store cash balance to £${projectedCashGbp.toFixed(2)}, breaching the mandatory £${cashFloorGbp.toFixed(2)} floor. Payment blocked to protect payroll.`,
      currentCashGbp,
      projectedCashGbp,
      cashFloorGbp,
      isCoolingPeriodActive: false,
    };
  }

  // RULE 3: Auto-Replenishment Limit (£500 / 50,000 pence) (Clause 2.1)
  if (input.amountPence <= 50000) {
    return {
      decision: 'AUTO_EXECUTE',
      isAllowed: true,
      requiresHumanSignoff: false,
      clauseCited: input.clauseCited || 'Mandate v1.0, Clause 2.1 (Inventory Auto-Replenishment < £500)',
      reason: `PRE-AUTHORIZED: Order of £${spendGbp.toFixed(2)} is within the autonomous £500 threshold. Post-order cash £${projectedCashGbp.toFixed(2)} satisfies the £5,000 floor. Approved for immediate execution.`,
      currentCashGbp,
      projectedCashGbp,
      cashFloorGbp,
      isCoolingPeriodActive: false,
    };
  }

  // RULE 4: Approval Threshold (£500 to £2,500) (Clause 2.2)
  if (input.amountPence <= 250000) {
    return {
      decision: 'AWAITING_APPROVAL',
      isAllowed: true,
      requiresHumanSignoff: true,
      clauseCited: input.clauseCited || 'Mandate v1.0, Clause 2.2 (Approval Threshold: £500 - £2,500)',
      reason: `APPROVAL REQUIRED: Order of £${spendGbp.toFixed(2)} exceeds the autonomous £500 threshold. Post-order cash £${projectedCashGbp.toFixed(2)} remains above the £5,000 floor. Paused for Store Manager 1-click authorization.`,
      currentCashGbp,
      projectedCashGbp,
      cashFloorGbp,
      isCoolingPeriodActive: false,
    };
  }

  // RULE 5: Hard Spending Cap (> £2,500)
  return {
    decision: 'BLOCKED',
    isAllowed: false,
    requiresHumanSignoff: true,
    clauseCited: 'Mandate v1.0, Clause 2.3 (Capital Expenditure Cap)',
    reason: `CAP EXCEEDED: Proposed disbursement of £${spendGbp.toFixed(2)} exceeds the single-order maximum £2,500 limit. Requires Board / CFO sign-off.`,
    currentCashGbp,
    projectedCashGbp,
    cashFloorGbp,
    isCoolingPeriodActive: false,
  };
}
