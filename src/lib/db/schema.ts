import { pgTable, text, integer, timestamp, boolean, jsonb, decimal, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Tenants (Stores / Merchant Entity)
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  cashBufferFloorGbp: integer('cash_buffer_floor_gbp').default(5000).notNull(), // £5,000 liquidity buffer
  currentCashBalanceGbp: decimal('current_cash_balance_gbp', { precision: 12, scale: 2 }).default('6740.00').notNull(),
  currency: text('currency').default('GBP').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Verified Suppliers & Connected Accounts
export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(), // Produce, Bakery, Packaging, Logistics
  stripeConnectedAccountId: text('stripe_connected_account_id').notNull(),
  isVerified: boolean('is_verified').default(true).notNull(),
  bankSortCode: text('bank_sort_code').notNull(),
  bankAccountNumber: text('bank_account_number').notNull(),
  bankDetailsLastChangedAt: timestamp('bank_details_last_changed_at').defaultNow().notNull(),
  isInCoolingPeriod: boolean('is_in_cooling_period').default(false).notNull(),
  leadTimeDays: integer('lead_time_days').default(2).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Inventory SKUs & Velocity
export const skus = pgTable('skus', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  code: text('code').notNull(), // e.g. SKU-104
  name: text('name').notNull(), // e.g. Organic Cold Brew 250ml
  category: text('category').notNull(),
  currentStock: integer('current_stock').notNull(),
  dailySalesVelocity: decimal('daily_sales_velocity', { precision: 6, scale: 2 }).notNull(), // units/day
  reorderPoint: integer('reorder_point').notNull(),
  preferredSupplierId: uuid('preferred_supplier_id').references(() => suppliers.id).notNull(),
  unitCostPence: integer('unit_cost_pence').notNull(), // e.g. 1600 = £16.00
  minimumOrderQuantity: integer('minimum_order_quantity').default(10).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Purchase Orders
export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  poNumber: text('po_number').notNull(), // PO-8921
  supplierId: uuid('supplier_id').references(() => suppliers.id).notNull(),
  skuId: uuid('sku_id').references(() => skus.id).notNull(),
  quantity: integer('quantity').notNull(),
  totalAmountPence: integer('total_amount_pence').notNull(),
  status: text('status').default('DRAFT').notNull(), // DRAFT | PLACED | RECEIVED | CLOSED | CANCELLED
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Invoices & 3-Way Match
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  supplierId: uuid('supplier_id').references(() => suppliers.id).notNull(),
  poId: uuid('po_id').references(() => purchaseOrders.id),
  invoiceNumber: text('invoice_number').notNull(),
  amountPence: integer('amount_pence').notNull(),
  isMatched: boolean('is_matched').default(false).notNull(),
  status: text('status').default('PENDING').notNull(), // PENDING | MATCHED | DISPUTED | PAID | SHORT_PAID
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Agent Runs & Reasoning Traces
export const agentRuns = pgTable('agent_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  triggerEvent: text('trigger_event').notNull(), // STOCKOUT_ALERT | INVOICE_RECEIVED
  skuId: uuid('sku_id').references(() => skus.id),
  status: text('status').default('OBSERVING').notNull(), // OBSERVING | PLANNING | GATING | AWAITING_APPROVAL | EXECUTING | COMPLETED | BLOCKED
  proposalPlan: jsonb('proposal_plan'),
  policyDecision: text('policy_decision'), // AUTO | ESCALATE | BLOCK
  clauseCited: text('clause_cited'), // e.g. Mandate v1.0, Clause 2.1
  cogneeMemoryId: text('cognee_memory_id'),
  rationale: text('rationale'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Transactions (Stripe Transfers & Reconciliation)
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  agentRunId: uuid('agent_run_id').references(() => agentRuns.id).notNull(),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id),
  stripeTransferId: text('stripe_transfer_id'),
  idempotencyKey: text('idempotency_key').unique().notNull(),
  amountPence: integer('amount_pence').notNull(),
  currency: text('currency').default('gbp').notNull(),
  status: text('status').default('INITIATED').notNull(), // INITIATED | SUBMITTED | PROCESSING | SETTLED | FAILED | REVERSED
  createdAt: timestamp('created_at').defaultNow().notNull(),
  settledAt: timestamp('settled_at'),
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  suppliers: many(suppliers),
  skus: many(skus),
  purchaseOrders: many(purchaseOrders),
  agentRuns: many(agentRuns),
  transactions: many(transactions),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [suppliers.tenantId], references: [tenants.id] }),
  skus: many(skus),
  purchaseOrders: many(purchaseOrders),
  invoices: many(invoices),
}));

export const skusRelations = relations(skus, ({ one }) => ({
  tenant: one(tenants, { fields: [skus.tenantId], references: [tenants.id] }),
  preferredSupplier: one(suppliers, { fields: [skus.preferredSupplierId], references: [suppliers.id] }),
}));
