import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants, skus, suppliers, agentRuns, transactions, invoices, purchaseOrders } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch Tenant
    const [tenant] = await db.select().from(tenants).limit(1);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not seeded' }, { status: 404 });
    }

    // 2. Fetch SKUs with supplier info
    const allSkus = await db
      .select({
        id: skus.id,
        code: skus.code,
        name: skus.name,
        category: skus.category,
        currentStock: skus.currentStock,
        dailySalesVelocity: skus.dailySalesVelocity,
        reorderPoint: skus.reorderPoint,
        unitCostPence: skus.unitCostPence,
        minimumOrderQuantity: skus.minimumOrderQuantity,
        supplierId: skus.preferredSupplierId,
        supplierName: suppliers.name,
        supplierAccount: suppliers.stripeConnectedAccountId,
        supplierCooling: suppliers.isInCoolingPeriod,
        supplierLeadTime: suppliers.leadTimeDays,
      })
      .from(skus)
      .leftJoin(suppliers, eq(skus.preferredSupplierId, suppliers.id));

    // Calculate days of cover for each SKU
    const enrichedSkus = allSkus.map((item) => {
      const velocity = parseFloat(item.dailySalesVelocity) || 1;
      const daysOfCover = parseFloat((item.currentStock / velocity).toFixed(1));
      let status: 'CRITICAL' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
      if (daysOfCover < 3) status = 'CRITICAL';
      else if (daysOfCover < 5) status = 'WARNING';

      return {
        ...item,
        daysOfCover,
        status,
      };
    });

    // 3. Fetch Pending Approvals (Agent Runs Awaiting Approval)
    const pendingApprovals = await db
      .select()
      .from(agentRuns)
      .where(eq(agentRuns.status, 'AWAITING_APPROVAL'))
      .orderBy(desc(agentRuns.createdAt))
      .limit(5);

    // 4. Fetch Recent Agent Runs
    const recentRuns = await db
      .select()
      .from(agentRuns)
      .orderBy(desc(agentRuns.createdAt))
      .limit(8);

    // 5. Fetch Recent Transactions
    const recentTransactions = await db
      .select({
        id: transactions.id,
        agentRunId: transactions.agentRunId,
        stripeTransferId: transactions.stripeTransferId,
        amountPence: transactions.amountPence,
        status: transactions.status,
        createdAt: transactions.createdAt,
        settledAt: transactions.settledAt,
        idempotencyKey: transactions.idempotencyKey,
      })
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    // 6. Fetch Suppliers
    const allSuppliers = await db.select().from(suppliers);

    // 7. Fetch Purchase Orders
    const allPOs = await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt)).limit(10);

    return NextResponse.json({
      tenant,
      skus: enrichedSkus,
      pendingApprovals,
      recentRuns,
      recentTransactions,
      suppliers: allSuppliers,
      purchaseOrders: allPOs,
    });
  } catch (error: any) {
    console.error('Error fetching store status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
