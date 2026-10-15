import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from '@/lib/db';
import { tenants, skus, suppliers, transactions, agentRuns } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { triggerOrchestrationPipeline } from '@/lib/agent/orchestrator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 1. Gather live store facts
    const [tenant] = await db.select().from(tenants).limit(1);
    const allSkus = await db.select().from(skus);
    const recentTx = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(3);

    const cashBalance = tenant ? parseFloat(tenant.currentCashBalanceGbp).toFixed(2) : '6740.00';
    const floor = tenant ? tenant.cashBufferFloorGbp : 5000;
    const safeToSpend = (parseFloat(cashBalance) - floor).toFixed(2);

    const skuSummary = allSkus
      .map((s) => {
        const velocity = parseFloat(s.dailySalesVelocity) || 1;
        const days = (s.currentStock / velocity).toFixed(1);
        return `- ${s.name} (${s.code}): ${s.currentStock} units in stock, sales rate ${s.dailySalesVelocity}/day, ${days} days remaining (Reorder point: ${s.reorderPoint})`;
      })
      .join('\n');

    // Check if the user is asking to trigger an order (e.g. "order cold brew" or "restock SKU-104")
    const lower = message.toLowerCase();
    let triggeredAction: any = null;

    if (lower.includes('order') || lower.includes('buy') || lower.includes('restock') || lower.includes('replenish')) {
      const targetSku = allSkus.find(
        (s) =>
          lower.includes(s.code.toLowerCase()) ||
          lower.includes(s.name.toLowerCase()) ||
          (lower.includes('cold brew') && s.code === 'SKU-104')
      ) || allSkus.find((s) => s.code === 'SKU-104');

      if (targetSku && tenant) {
        try {
          const result = await triggerOrchestrationPipeline({
            tenantId: tenant.id,
            skuId: targetSku.id,
            directive: message,
          });
          triggeredAction = result;
        } catch (e: any) {
          console.warn('Action trigger error in chat:', e);
        }
      }
    }

    const systemPrompt = `
You are the Tillwise Store Operations AI Agent.
You manage retail store inventory and money movement on behalf of the store manager.

Tone & Style:
- Warm, helpful, simple, clear, inspired by Apple and Origami.chat.
- NEVER use complex robotic jargon (avoid words like "deterministic membrane", "monotonic ledger", "cognify dataset").
- Use plain human terms: "Available Cash", "Safety Buffer", "Stock Level", "Spending Rule", "Stripe Payment".
- Keep responses short, concise, and direct (2-4 sentences max).

Current Live Store Facts:
- Store: ${tenant?.name || 'Tillwise Soho Flagship'}
- Available Cash in Bank: £${cashBalance}
- Protected Safety Buffer: £${floor} (we never spend below this to protect payroll)
- Safe to Spend Right Now: £${safeToSpend}
- Products in Store:
${skuSummary}

Rules:
- Under £500: Pre-authorized, we can pay automatically.
- £500 to £2,500: We pause and ask you to click Approve.
- Over £2,500 or below £5,000 buffer: Blocked for safety.
- If supplier bank details change: 3-day hold to prevent fraud.

${triggeredAction ? `An action was just executed: ${triggeredAction.message} (Stripe ID: ${triggeredAction.payment?.stripeTransferId || 'N/A'})` : ''}
`;

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: message,
    });

    return NextResponse.json({
      reply: text,
      action: triggeredAction,
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
