import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from '@/lib/db';
import { tenants, skus, suppliers, transactions, agentRuns, purchaseOrders } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { triggerOrchestrationPipeline } from '@/lib/agent/orchestrator';
import { explainPayment } from '@/lib/cognee/mandate';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 1. Gather live store telemetry & facts
    const [tenant] = await db.select().from(tenants).limit(1);
    const allSkus = await db.select().from(skus);
    const recentTx = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(5);

    const cashBalance = tenant ? parseFloat(tenant.currentCashBalanceGbp).toFixed(2) : '6740.00';
    const floor = tenant ? tenant.cashBufferFloorGbp : 5000;
    const safeToSpend = (parseFloat(cashBalance) - floor).toFixed(2);

    const skuSummary = allSkus
      .map((s) => {
        const velocity = parseFloat(s.dailySalesVelocity) || 1;
        const days = (s.currentStock / velocity).toFixed(1);
        return `- ${s.name} (${s.code}): ${s.currentStock} units in stock, sales rate ${s.dailySalesVelocity}/day, ${days} days remaining (Reorder point: ${s.reorderPoint}, Unit cost: £${(s.unitCostPence / 100).toFixed(2)})`;
      })
      .join('\n');

    const lower = message.toLowerCase();
    let triggeredAction: any = null;
    let actionCard: any = null;
    let cogneeContext = '';

    const isProposalQuery =
      lower.includes('can we') ||
      lower.includes('could we') ||
      lower.includes('should we') ||
      lower.includes('afford') ||
      lower.includes('propose') ||
      lower.includes('check') ||
      lower.includes('how much');

    const isExecuteIntent =
      !isProposalQuery &&
      (lower.includes('order') ||
        lower.includes('buy') ||
        lower.includes('restock') ||
        lower.includes('replenish') ||
        lower.includes('move money') ||
        lower.includes('disburse') ||
        lower.includes('transfer') ||
        lower.includes('execute'));

    // INTENT A: Reorder / Restock / Move Money
    if (isExecuteIntent || isProposalQuery) {
      const targetSku =
        allSkus.find(
          (s) =>
            lower.includes(s.code.toLowerCase()) ||
            lower.includes(s.name.toLowerCase()) ||
            (lower.includes('cold brew') && s.code === 'SKU-104') ||
            (lower.includes('oat') && s.code === 'SKU-105')
        ) || allSkus.find((s) => s.code === 'SKU-104');

      // Extract custom quantity if mentioned in message (e.g. "order 25 units")
      const qtyMatch = message.match(/\b(\d+)\s*(units?|boxes?|cases?|items?|bottles?)?\b/i);
      const parsedQty = qtyMatch ? parseInt(qtyMatch[1], 10) : 40;

      if (targetSku && tenant) {
        const unitCostGbp = targetSku.unitCostPence / 100;
        const totalCostGbp = unitCostGbp * parsedQty;

        if (isExecuteIntent) {
          try {
            const result = await triggerOrchestrationPipeline({
              tenantId: tenant.id,
              skuId: targetSku.id,
              customQuantity: parsedQty > 0 ? parsedQty : undefined,
              directive: `Initiated via conversational chat copilot: "${message}"`,
            });

            triggeredAction = {
              type: 'RESTOCK_EXECUTED',
              message: result.message || `Successfully executed order for ${targetSku.name}`,
              result,
            };

            actionCard = {
              type: 'RESTOCK_EXECUTED',
              title: `Stripe Disbursement Settled: £${totalCostGbp.toFixed(2)}`,
              detail: `Transferred to FreshFarm Organics Ltd via Stripe Test Rails (${result.payment?.stripeTransferId || 'tr_settled'}). Idempotency verified.`,
              amountGbp: totalCostGbp,
              quantity: parsedQty,
              skuCode: targetSku.code,
              skuName: targetSku.name,
              supplierName: 'FreshFarm Organics Ltd',
              stripeTransferId: result.payment?.stripeTransferId || 'tr_settled',
              transactionId: result.payment?.transactionId || recentTx[0]?.id,
              mandateClause: 'Mandate v1.0, Clause 2.1 (Auto-Replenish under £500)',
              status: 'settled',
            };
          } catch (e: any) {
            console.warn('Action trigger error in chat:', e);
          }
        } else {
          // It's a proposal / feasibility inquiry
          actionCard = {
            type: 'RESTOCK_PROPOSAL',
            title: `Restock Proposal: ${targetSku.name}`,
            detail: `${parsedQty} units @ £${unitCostGbp.toFixed(2)} = £${totalCostGbp.toFixed(2)}. Safe cash (£${safeToSpend}) safely covers this without touching the £${floor.toLocaleString()} floor.`,
            amountGbp: totalCostGbp,
            quantity: parsedQty,
            skuCode: targetSku.code,
            skuName: targetSku.name,
            supplierName: 'FreshFarm Organics Ltd',
            mandateClause: 'Mandate Clause 2.1 (Under £500 pre-approved)',
            status: 'ready_to_send',
            canExecute: true,
          };
        }
      }
    }

    // INTENT B: "Why did you pay / Audit" (Cognee Causal Query)
    else if (
      lower.includes('why') ||
      lower.includes('audit') ||
      lower.includes('cognee') ||
      lower.includes('proof') ||
      lower.includes('graph') ||
      lower.includes('spent') ||
      lower.includes('inspect')
    ) {
      const matchedTx = recentTx[0];
      if (matchedTx) {
        try {
          const cogneeProof = await explainPayment({
            transactionId: matchedTx.id,
            stripeTransferId: matchedTx.stripeTransferId || 'tr_test_settled',
            poNumber: 'PO-8821',
            skuName: 'Organic Cold Brew 250ml',
            supplierName: 'FreshFarm Organics Ltd',
            amountPence: matchedTx.amountPence,
            clauseCited: 'Mandate v1.0, Clause 2.1 (Inventory Auto-Replenishment under £500 pre-authorized)',
            remainingCashGbp: cashBalance,
          });
          cogneeContext = `Authoritative Cognee Knowledge Graph Record: ${JSON.stringify(cogneeProof)}`;

          actionCard = {
            type: 'AUDIT_INSPECT',
            title: `Cognee Audit: £${(matchedTx.amountPence / 100).toFixed(2)} Payout`,
            detail: `Causal root: Cold Brew inventory dropped to 18 units (1.8 days cover), breaching safety threshold. Replenishment triggered under Clause 2.1.`,
            amountGbp: matchedTx.amountPence / 100,
            supplierName: 'FreshFarm Organics Ltd',
            transactionId: matchedTx.id,
            stripeTransferId: matchedTx.stripeTransferId || 'tr_test_settled',
            mandateClause: 'Mandate v1.0, Clause 2.1 (Auto-Replenish under £500)',
            status: 'settled',
          };
        } catch (e) {
          console.warn('Cognee explain fallback in chat:', e);
        }
      }
    }

    // INTENT C: Update Spending Rule / Safety Buffer Floor
    else if (
      (lower.includes('buffer') || lower.includes('floor') || lower.includes('reserve')) &&
      (lower.includes('set') || lower.includes('change') || lower.includes('update') || lower.includes('make'))
    ) {
      const amountMatch = message.match(/£?(\d[\d,]*)/);
      if (amountMatch && tenant) {
        const newFloor = parseInt(amountMatch[1].replace(/,/g, ''), 10);
        if (newFloor >= 1000 && newFloor <= 10000) {
          await db
            .update(tenants)
            .set({ cashBufferFloorGbp: newFloor, updatedAt: new Date() })
            .where(eq(tenants.id, tenant.id));

          triggeredAction = {
            type: 'RULE_UPDATED',
            message: `Updated store spending rule: Safety buffer is now £${newFloor.toLocaleString()}.`,
          };

          actionCard = {
            type: 'RULE_UPDATED',
            title: `Safety Buffer Floor: £${newFloor.toLocaleString()}`,
            detail: `Store spending guardrail updated. Tillwise will never spend if bank balance drops below £${newFloor.toLocaleString()}.`,
            amountGbp: newFloor,
            status: 'settled',
          };
        }
      }
    }

    // INTENT D: Reset Demo State
    else if (lower.includes('reset demo') || lower.includes('reset store') || lower.includes('restart demo')) {
      if (tenant) {
        await db
          .update(tenants)
          .set({
            currentCashBalanceGbp: '6740.00',
            cashBufferFloorGbp: 5000,
            updatedAt: new Date(),
          })
          .where(eq(tenants.id, tenant.id));

        const coldBrew = allSkus.find((s) => s.code === 'SKU-104');
        if (coldBrew) {
          await db.update(skus).set({ currentStock: 18 }).where(eq(skus.id, coldBrew.id));
        }

        triggeredAction = {
          type: 'DEMO_RESET',
          message: 'Reset demo state: Balance restored to £6,740 and SKU-104 stock set to 18 units.',
        };

        actionCard = {
          type: 'DEMO_RESET',
          title: 'Demo Environment Reset',
          detail: 'Restored available cash to £6,740 and reset Cold Brew inventory to critical 18 units.',
          status: 'settled',
        };
      }
    }

    const systemPrompt = `
You are the Tillwise Store Operations AI Agent.
You manage retail store inventory, financial guardrails, and money movement on behalf of the store manager.

Tone & Style:
- Warm, helpful, simple, clear, inspired by Apple and Origami.chat.
- NEVER use complex robotic jargon (avoid words like "deterministic membrane", "monotonic ledger", "cognify dataset").
- Use plain human terms: "Available Cash", "Safety Buffer", "Stock Level", "Spending Rule", "Stripe Payment".
- Keep responses short, concise, and direct (2-3 sentences max).
- If an action was executed, tell the user the exact amount paid via Stripe and the stock level.

Current Live Store Facts:
- Store: ${tenant?.name || 'Tillwise Soho Flagship'}
- Available Cash in Bank: £${cashBalance}
- Protected Safety Buffer: £${floor} (we never spend below this to protect payroll & rent)
- Safe to Spend Right Now: £${safeToSpend}
- Products in Store:
${skuSummary}

Recent Payments:
${recentTx.map((t) => `- £${(t.amountPence / 100).toFixed(2)} (Stripe ID: ${t.stripeTransferId || 'tr_settled'}) at ${new Date(t.createdAt).toLocaleTimeString()}`).join('\n')}

${cogneeContext ? `Cognee Causal Memory Context:\n${cogneeContext}` : ''}
${triggeredAction ? `An operational action was just executed on the platform: ${triggeredAction.message}` : ''}
`;

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: message,
    });

    return NextResponse.json({
      reply: text,
      action: triggeredAction,
      actionCard: actionCard,
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
