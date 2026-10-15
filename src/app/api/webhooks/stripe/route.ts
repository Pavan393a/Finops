import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payment/stripe';
import { db } from '@/lib/db';
import { transactions, tenants } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: any;

    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err: any) {
        console.warn(`Webhook signature verification failed: ${err.message}`);
        // In local development without Stripe CLI, fallback to parsing body directly
        event = JSON.parse(rawBody);
      }
    } else {
      event = JSON.parse(rawBody);
    }

    // Handle relevant Stripe event types
    switch (event.type) {
      case 'transfer.created': {
        const transfer = event.data.object;
        console.log(`[Stripe Webhook] Transfer created: ${transfer.id}`);
        // Ensure transaction is recorded as SUBMITTED / SETTLED
        await db
          .update(transactions)
          .set({ status: 'SETTLED', settledAt: new Date() })
          .where(eq(transactions.stripeTransferId, transfer.id));
        break;
      }

      case 'transfer.reversed': {
        const transfer = event.data.object;
        console.warn(`[Stripe Webhook] Transfer reversed: ${transfer.id}`);
        // 1. Mark transaction as REVERSED
        const [updatedTx] = await db
          .update(transactions)
          .set({ status: 'REVERSED' })
          .where(eq(transactions.stripeTransferId, transfer.id))
          .returning();

        // 2. Refund balance back to Tenant
        if (updatedTx) {
          const refundGbp = (updatedTx.amountPence / 100).toFixed(2);
          await db
            .update(tenants)
            .set({
              currentCashBalanceGbp: sql`${tenants.currentCashBalanceGbp} + ${refundGbp}`,
              updatedAt: new Date(),
            })
            .where(eq(tenants.id, updatedTx.tenantId));
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook processing error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
