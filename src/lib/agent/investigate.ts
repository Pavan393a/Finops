import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import { db } from '../db';
import { skus, suppliers, tenants, agentRuns } from '../db/schema';
import { eq } from 'drizzle-orm';
import { queryPolicyForAction } from '../cognee/mandate';

dotenv.config({ path: '.env.local' });

// Typed Schema for Agent Proposal Plan
export const ProposalPlanSchema = z.object({
  skuId: z.string(),
  skuCode: z.string(),
  skuName: z.string(),
  recommendedQuantity: z.number().int().positive(),
  unitCostPence: z.number().int().positive(),
  totalAmountPence: z.number().int().positive(),
  supplierId: z.string(),
  supplierName: z.string(),
  destinationAccountId: z.string(),
  daysOfCoverRemaining: z.number(),
  daysOfCoverAfterReorder: z.number(),
  urgency: z.enum(['CRITICAL', 'WARNING', 'ROUTINE']).default('CRITICAL'),
  rationale: z.string(),
  policyClauseCited: z.string().optional().default('Clause 2.1'),
  tradeoffOptions: z.array(
    z.object({
      label: z.string(),
      quantity: z.number().int(),
      costPence: z.number().int(),
      daysCover: z.number(),
      isRecommended: z.boolean().optional().default(false),
    })
  ).optional().default([]),
});

export type ProposalPlan = z.infer<typeof ProposalPlanSchema>;

export interface InvestigateInput {
  tenantId: string;
  skuId: string;
  triggerEvent?: string; // 'STOCKOUT_ALERT' | 'MANUAL_DIRECTIVE'
  directive?: string;    // e.g. "Prepare for warm weekend rush"
}

export interface InvestigationResult {
  agentRunId: string;
  proposal: ProposalPlan;
  rawRationale: string;
}

/**
 * Autonomous Agent Investigation Core
 * 1. Reads authoritative inventory & supplier facts from PostgreSQL
 * 2. Asks Cognee memory for the authorizing policy clause
 * 3. Uses OpenAI via Vercel AI SDK to generate structured proposal and trade-offs
 */
export async function runAgentInvestigation(input: InvestigateInput): Promise<InvestigationResult> {
  // 1. Fetch SKU details with preferred supplier
  const [sku] = await db
    .select()
    .from(skus)
    .where(eq(skus.id, input.skuId))
    .limit(1);

  if (!sku) {
    throw new Error(`SKU not found: ${input.skuId}`);
  }

  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, sku.preferredSupplierId))
    .limit(1);

  if (!supplier) {
    throw new Error(`Preferred supplier not found for SKU: ${sku.code}`);
  }

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, input.tenantId))
    .limit(1);

  if (!tenant) {
    throw new Error(`Tenant not found: ${input.tenantId}`);
  }

  // 2. Compute Physical Metrics
  const velocity = parseFloat(sku.dailySalesVelocity) || 1;
  const daysOfCover = parseFloat((sku.currentStock / velocity).toFixed(1));
  const defaultReorderQty = Math.max(sku.minimumOrderQuantity, Math.ceil(velocity * 2)); // 2 days of buffer
  const totalCostPence = defaultReorderQty * sku.unitCostPence;

  // 3. Query Cognee for Governing Policy Clause
  const cogneeClause = await queryPolicyForAction(totalCostPence, sku.name);

  // 4. Create Agent Run Record in DB
  const [agentRunRecord] = await db
    .insert(agentRuns)
    .values({
      tenantId: input.tenantId,
      triggerEvent: input.triggerEvent || 'STOCKOUT_ALERT',
      skuId: sku.id,
      status: 'PLANNING',
      clauseCited: cogneeClause,
    })
    .returning();

  // 5. Run LLM Structured Reasoning with OpenAI
  const prompt = `
You are Tillwise, an Autonomous Retail FinOps Control Plane agent.
Investigate this retail inventory telemetry and construct an optimal purchase proposal:

Store Context:
- Store: ${tenant.name}
- Current Cash: £${tenant.currentCashBalanceGbp} (Operating buffer floor: £${tenant.cashBufferFloorGbp})
- Target SKU: ${sku.name} (${sku.code})
- Category: ${sku.category}
- Current In-Stock: ${sku.currentStock} units
- Sales Velocity: ${sku.dailySalesVelocity} units/day
- Calculated Days of Cover Remaining: ${daysOfCover} days
- Reorder Point: ${sku.reorderPoint} units
- Unit Cost: £${(sku.unitCostPence / 100).toFixed(2)}
- Minimum Order Quantity: ${sku.minimumOrderQuantity} units
- Supplier: ${supplier.name} (${supplier.category})
- Lead Time: ${supplier.leadTimeDays} days
- Bank Details Verified: ${supplier.isVerified} (Cooling Period: ${supplier.isInCoolingPeriod})
- Governing Cognee Policy Clause: "${cogneeClause}"
${input.directive ? `- Operator Directive: "${input.directive}"` : ''}

Instructions:
1. Determine recommended reorder quantity (e.g. 20 units to achieve ~4 days of cover).
2. Calculate total cost in pence.
3. Formulate three trade-off options for the CreateAnything visual canvas:
   - Low (Minimum Order Quantity)
   - Balanced/Recommended (e.g. 20 units)
   - Aggressive (e.g. 40 units for bulk buffer)
4. State clear, concise retail financial rationale for why this order protects shelf revenue without violating liquidity.
`;

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: ProposalPlanSchema,
    prompt,
    system:
      'You are Tillwise, an expert autonomous retail financial controller. Output strict JSON matching the schema.',
  });

  // Ensure IDs & constants match DB ground truth
  const proposal: ProposalPlan = {
    ...object,
    skuId: sku.id,
    skuCode: sku.code,
    skuName: sku.name,
    supplierId: supplier.id,
    supplierName: supplier.name,
    destinationAccountId: supplier.stripeConnectedAccountId,
    unitCostPence: sku.unitCostPence,
    policyClauseCited: cogneeClause,
    daysOfCoverRemaining: daysOfCover,
  };

  // 6. Update Agent Run in DB with proposal
  await db
    .update(agentRuns)
    .set({
      proposalPlan: proposal,
      rationale: proposal.rationale,
      status: 'GATING',
    })
    .where(eq(agentRuns.id, agentRunRecord.id));

  return {
    agentRunId: agentRunRecord.id,
    proposal,
    rawRationale: proposal.rationale,
  };
}
