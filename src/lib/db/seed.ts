import { db } from './index';
import { tenants, suppliers, skus, purchaseOrders, invoices, agentRuns, transactions } from './schema';
import { sql } from 'drizzle-orm';

export async function seed() {
  console.log('Seeding Supabase retail store state...');

  // Clean existing demo records
  await db.delete(transactions);
  await db.delete(agentRuns);
  await db.delete(invoices);
  await db.delete(purchaseOrders);
  await db.delete(skus);
  await db.delete(suppliers);
  await db.delete(tenants);

  // 1. Create Demo Tenant (Store)
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: 'Tillwise Retail Flagship (Soho, London)',
      cashBufferFloorGbp: 5000, // £5,000 untouchable buffer
      currentCashBalanceGbp: '6740.00', // £6,740 available cash
      currency: 'GBP',
    })
    .returning();

  console.log(`Created Tenant: ${tenant.name} (${tenant.id})`);

  // 2. Create Suppliers
  const [freshFarm] = await db
    .insert(suppliers)
    .values({
      tenantId: tenant.id,
      name: 'FreshFarm Organics Ltd',
      category: 'Produce & Beverages',
      stripeConnectedAccountId: 'acct_1FreshFarmTestGBP',
      isVerified: true,
      bankSortCode: '20-40-71',
      bankAccountNumber: '89214732',
      leadTimeDays: 2,
      isInCoolingPeriod: false,
    })
    .returning();

  const [ecoPack] = await db
    .insert(suppliers)
    .values({
      tenantId: tenant.id,
      name: 'EcoPack Packaging UK',
      category: 'Packaging',
      stripeConnectedAccountId: 'acct_1EcoPackTestGBP',
      isVerified: true,
      bankSortCode: '40-11-18',
      bankAccountNumber: '51930214',
      leadTimeDays: 3,
      isInCoolingPeriod: false,
    })
    .returning();

  console.log(`Created Suppliers: ${freshFarm.name}, ${ecoPack.name}`);

  // 3. Create SKUs (with SKU-104 triggering the stockout alert!)
  const [coldBrew] = await db
    .insert(skus)
    .values({
      tenantId: tenant.id,
      code: 'SKU-104',
      name: 'Organic Cold Brew 250ml',
      category: 'Beverages',
      currentStock: 18, // ONLY 18 UNITS LEFT!
      dailySalesVelocity: '10.00', // Sells 10 units/day -> 1.8 days of cover!
      reorderPoint: 35, // Trigger replenishment!
      preferredSupplierId: freshFarm.id,
      unitCostPence: 1600, // £16.00 per case
      minimumOrderQuantity: 10,
    })
    .returning();

  const [oatMilk] = await db
    .insert(skus)
    .values({
      tenantId: tenant.id,
      code: 'SKU-105',
      name: 'Oat M*lk Barista Edition 1L',
      category: 'Dairy Alternative',
      currentStock: 80,
      dailySalesVelocity: '8.00', // 10 days of cover (healthy)
      reorderPoint: 30,
      preferredSupplierId: freshFarm.id,
      unitCostPence: 1400, // £14.00 per case
      minimumOrderQuantity: 10,
    })
    .returning();

  const [cups] = await db
    .insert(skus)
    .values({
      tenantId: tenant.id,
      code: 'SKU-106',
      name: 'Compostable Takeaway Cups 12oz (Box 500)',
      category: 'Packaging',
      currentStock: 450,
      dailySalesVelocity: '35.00', // ~12.8 days cover (healthy)
      reorderPoint: 150,
      preferredSupplierId: ecoPack.id,
      unitCostPence: 4500, // £45.00
      minimumOrderQuantity: 5,
    })
    .returning();

  console.log(`Created SKUs: ${coldBrew.code} (CRITICAL: 1.8d cover), ${oatMilk.code}, ${cups.code}`);
  console.log('Seeding completed successfully!');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
