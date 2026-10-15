import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { skus, suppliers, tenants } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { triggerOrchestrationPipeline } from '@/lib/agent/orchestrator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, skuId, quantity = 5, amountGbp = 500 } = body;

    const [tenant] = await db.select().from(tenants).limit(1);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    switch (eventType) {
      case 'SALE': {
        const [sku] = await db.select().from(skus).where(eq(skus.id, skuId)).limit(1);
        if (!sku) return NextResponse.json({ error: 'SKU not found' }, { status: 404 });

        const newStock = Math.max(0, sku.currentStock - quantity);
        await db.update(skus).set({ currentStock: newStock }).where(eq(skus.id, sku.id));

        const velocity = parseFloat(sku.dailySalesVelocity) || 1;
        const newDaysCover = parseFloat((newStock / velocity).toFixed(1));

        let autoRunResult = null;
        if (newDaysCover < 3) {
          try {
            autoRunResult = await triggerOrchestrationPipeline({
              tenantId: tenant.id,
              skuId: sku.id,
              triggerEvent: 'LIVE_SALE_SURGE_DEPLETION',
              directive: `Customer sales surge: ${quantity} units purchased. Stock dropped to ${newStock} units (${newDaysCover} days cover remaining).`,
            });
          } catch (e: any) {
            console.warn('Auto-run on sale surge error:', e.message);
          }
        }

        return NextResponse.json({
          success: true,
          message: `Simulated sale: -${quantity} units sold. New stock: ${newStock} units (${newDaysCover} days cover).`,
          newStock,
          newDaysCover,
          autoRunResult,
        });
      }

      case 'RESTOCK_DELIVERY': {
        const [sku] = await db.select().from(skus).where(eq(skus.id, skuId)).limit(1);
        if (!sku) return NextResponse.json({ error: 'SKU not found' }, { status: 404 });

        const newStock = sku.currentStock + quantity;
        await db.update(skus).set({ currentStock: newStock }).where(eq(skus.id, sku.id));

        const velocity = parseFloat(sku.dailySalesVelocity) || 1;
        const newDaysCover = parseFloat((newStock / velocity).toFixed(1));

        return NextResponse.json({
          success: true,
          message: `Delivery receipt confirmed: +${quantity} units received on shelf. New stock: ${newStock} units (${newDaysCover} days cover).`,
          newStock,
          newDaysCover,
        });
      }

      case 'CASH_INFLOW': {
        await db
          .update(tenants)
          .set({
            currentCashBalanceGbp: sql`${tenants.currentCashBalanceGbp} + ${amountGbp}`,
            updatedAt: new Date(),
          })
          .where(eq(tenants.id, tenant.id));

        return NextResponse.json({
          success: true,
          message: `POS Day-end revenue settled: +£${Number(amountGbp).toFixed(2)} added to store operating account.`,
        });
      }

      case 'VENDOR_FRAUD_ATTACK': {
        const [sup] = await db.select().from(suppliers).limit(1);
        if (!sup) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

        await db
          .update(suppliers)
          .set({
            isInCoolingPeriod: true,
            bankSortCode: '99-88-77',
            bankDetailsLastChangedAt: new Date(),
          })
          .where(eq(suppliers.id, sup.id));

        return NextResponse.json({
          success: true,
          message: `CRITICAL FRAUD SIMULATION: Supplier ${sup.name} bank sort code modified to 99-88-77. Mandate Clause 3.1 3-day cooling hold activated! Payouts frozen.`,
        });
      }

      default:
        return NextResponse.json({ error: 'Unknown eventType' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Simulation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
