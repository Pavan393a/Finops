import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants, skus, suppliers, purchaseOrders, agentRuns, transactions, invoices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // 1. Reset Tenant Cash Balance back to £6,740.00
    const [tenant] = await db.select().from(tenants).limit(1);
    if (tenant) {
      await db
        .update(tenants)
        .set({
          currentCashBalanceGbp: '6740.00',
          cashBufferFloorGbp: 5000,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenant.id));
    }

    // 2. Reset SKU-104 back to Critical Stockout (18 units, 1.8 days cover)
    await db
      .update(skus)
      .set({ currentStock: 18 })
      .where(eq(skus.code, 'SKU-104'));

    // 3. Reset Suppliers out of cooling period
    await db
      .update(suppliers)
      .set({
        isInCoolingPeriod: false,
        bankSortCode: '20-00-00',
        bankAccountNumber: '87654321',
      });

    // 4. Clean previous test runs & transactions if desired
    await db.delete(transactions);
    await db.delete(agentRuns);
    await db.delete(purchaseOrders);

    return NextResponse.json({
      success: true,
      message: 'Demo state successfully reset to initial conditions! Operating cash: £6,740.00 | SKU-104: 1.8 days cover | Cooling holds cleared.',
    });
  } catch (err: any) {
    console.error('Demo reset error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
