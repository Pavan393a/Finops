# Tillwise — Technical Stack, APIs, and Integrations Specification

> **Hackathon Target**: Track 01 ("Agents that spend") + Side Quest ("Best use of Cognee memory")  
> **Status**: Approved Blueprint — Keep this document as the single source of truth for all packages, APIs, schemas, and integrations.

---

## 1. Executive Strategy: Winning Track 01 & The Cognee Side Quest

The hackathon guidelines set three non-negotiable requirements for **Track 01**:
1. **Money moves in Stripe test mode in the demo video.**
2. **The agent enforces a written policy (limits, approvals, allowed counterparties).**
3. **It answers *"Why did you pay this?"* by pointing to the rule and the evidence.**

And the **Side Quest ("Best use of Cognee memory")** states:
> *"The panel looks at how central Cognee memory is to the agent working, and how well the agent explains its actions from that memory."*

### The Winning Loop:
```
[ Written Merchant Policy / Mandate ]
                │
                ▼ (cognee.add + cognify)
    [ Cognee Knowledge Graph ] (Clauses, Thresholds, Allowlist)
                │
   Store Event (Stockout Alert / Invoice)
                │
                ▼
      [ Tillwise Agent (AI SDK) ]
   - Gathers store context via read-only tools
   - Queries Cognee: "Which policy clause governs this replenishment?"
   - Proposes PaymentIntent citing Clause # and linking Evidence IDs
                │
                ▼
      [ Deterministic Policy Engine ]
   - Validates frozen intent against live balance & limits
   - Evaluates: AUTO-APPROVE | ESCALATE (Human Modal) | BLOCK
                │
                ▼
      [ Stripe Payment Rail ]
   - Executes Transfer to Supplier with Idempotency-Key
   - Listens to Stripe Webhooks for settlement
                │
                ▼ (cognee.add + cognify)
  [ Cognee Audit & Decision Memory ]
  (Links Signal → PO → Delivery → Invoice → Clause → Stripe Transfer ID)
                │
                ▼
   "Why did you pay this?" Inspector
   - Queries Cognee Knowledge Graph
   - Instantly highlights the exact rule and evidence trail!
```

---

## 2. Deep Stripe Test Mode Utilization

Stripe is not treated as a black-box checkout button. We leverage Stripe's test mode primitives to model real-world business-to-business (B2B) retail spend.

### 2.1 Primitives Utilized
| Stripe Primitive | How Tillwise Uses It | Test Mode Simulation |
| :--- | :--- | :--- |
| **Connected Accounts (`/v1/accounts`)** | Represents verified retail suppliers (e.g., `acct_supplier_bakery`, `acct_supplier_produce`). | Created as Express/Custom connected accounts with UK GBP capability. |
| **Transfers (`/v1/transfers`)** | Moves money from the store's operating balance to the supplier's account to settle verified purchase orders/invoices. | Instant balance transfer in test mode; funds move to destination account. |
| **Idempotency Keys (`Idempotency-Key`)** | Passed on every `POST /v1/transfers` using `idem_intent_{intentId}`. | Guarantees that retries, network glitches, or agent loop replays **never double-pay**. |
| **Webhooks (`/v1/webhook_endpoints`)** | Receives asynchronous state updates for money movement. | Listens to `transfer.created`, `transfer.reversed`, and `payout.failed`. |
| **Balance Top-Up (`/v1/charges` / Balance)** | Ensures the merchant platform account maintains a test GBP balance. | Seeded with test balance (£20,000) so payouts execute cleanly. |
| **Account Update Events** | Simulates a fraudulent or suspicious bank detail change (`account.external_account.updated`). | Triggers Tillwise's **Cooling Period & Risk Freeze** automatically! |

### 2.2 Stripe API Payloads & Signatures

#### A. Creating a Supplier Transfer
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function executeSupplierTransfer(params: {
  amountPence: number;
  currency: 'gbp';
  destinationAccountId: string;
  paymentIntentId: string;
  metadata: {
    poId: string;
    invoiceId: string;
    clauseCited: string;
    tenantId: string;
  };
}) {
  return await stripe.transfers.create(
    {
      amount: params.amountPence,
      currency: params.currency,
      destination: params.destinationAccountId,
      description: `Payment for PO ${params.metadata.poId} / Inv ${params.metadata.invoiceId}`,
      metadata: params.metadata,
    },
    {
      idempotencyKey: `idem_intent_${params.paymentIntentId}`,
    }
  );
}
```

#### B. Handled Webhook Events
```typescript
switch (event.type) {
  case 'transfer.created':
    await updateTransactionStatus(event.data.object.id, 'SUBMITTED');
    break;
  case 'transfer.reversed':
    await updateTransactionStatus(event.data.object.id, 'REVERSED');
    break;
  case 'account.external_account.updated':
    // High-risk event: Vendor bank account changed
    await triggerVendorSecurityHold(event.account!);
    break;
}
```

---

## 3. Deep Cognee Memory & Knowledge Graph Utilization

Cognee (`@cognee/cognee-ts`) provides the cognitive infrastructure for the agent: structuring policies into knowledge graphs and preserving full decision context.

### 3.1 Cognee Memory Verbs for Tillwise
| Verb | Role in Tillwise |
| :--- | :--- |
| **`remember` / `add` + `cognify`** | **1. Policy Ingestion**: Reads the retailer's written spending mandate (markdown document) and decomposes it into an entity graph of clauses, limits, conditions, and permissions.<br>**2. Run Context**: Ingests the decision chain when a payment is executed. |
| **`recall` / `search`** | **1. Policy Pre-flight**: The agent queries Cognee before generating a plan to discover which clause governs the transaction.<br>**2. Audit Answering**: Answers *"Why did you pay this?"* by extracting the multi-hop relationship from Cognee memory. |

### 3.2 The Written Policy Graph in Cognee
The retailer provides a standard written mandate:
```markdown
# Store Spending Mandate v1.0
- Clause 1.1 (Liquidity Floor): Operating cash must never drop below £5,000.
- Clause 2.1 (Auto-Replenishment): Inventory replenishment orders under £500 to verified suppliers are pre-authorized if stock cover < 3 days.
- Clause 2.2 (Approval Threshold): Orders between £500 and £2,500 require Store Manager approval.
- Clause 3.1 (Anti-Fraud / Bank Change): Any change in supplier bank sort code or account triggers a mandatory 3-day cooling hold and out-of-band verification.
```
When `cognify()` processes this document, it creates:
* **Entities**: `Clause 1.1`, `Clause 2.1`, `VerifiedSupplier`, `CashFloor`, `StockoutRisk`.
* **Relationships**: `[Clause 2.1] -> (authorizes_up_to) -> [£500]`, `[Clause 2.1] -> (requires_condition) -> [StockCover < 3 days]`.

### 3.3 Answering: "Why Did You Pay This?"
When the user clicks the **Inspect** button or asks the agent:
```typescript
import { Cognee } from '@cognee/cognee-ts';

const cognee = new Cognee({
  apiKey: process.env.COGNEE_API_KEY,
});

export async function explainPayment(transactionId: string) {
  // Query Cognee's hybrid graph + vector search
  const result = await cognee.search({
    query: `Why was transaction ${transactionId} paid? Cite the exact policy clause and evidence.`,
    searchType: 'GRAPH_COMPLETION',
  });

  return result; 
  // Returns:
  // "Paid £320 to FreshFarm Produce on 2026-10-15.
  // Authorised by: Mandate v1.0, Clause 2.1 (Auto-Replenishment under £500).
  // Evidence: SKU-104 stock projected to run out in 1.8 days (sales velocity 14 units/day).
  // Verification: 3-way match confirmed against PO-892 and GRN-401.
  // Cash Floor Check: Projected balance £6,420 remains above £5,000 threshold."
}
```

---

## 4. The Complete Technology Stack

```
┌───────────────────────────────────────────────────────────────┐
│                      OPERATOR INTERFACE                       │
│     Next.js 15 (App Router, React 19) + TailwindCSS v4       │
│     Shadcn UI / Radix Primitives + Lucide Icons + Sonner      │
│     Decision Cards · Run Timeline · "Why Did You Pay?" Modal  │
└───────────────────────────────┬───────────────────────────────┘
                                │ Server Actions / API Routes
┌───────────────────────────────▼───────────────────────────────┐
│                     APPLICATION BACKEND                       │
│     TypeScript (strict) · Zod Runtime Validation              │
│     Vercel AI SDK Core (`ToolLoopAgent` + Typed Tools)        │
│     Durable Execution: Workflow DevKit (Inngest fallback)    │
└───────────────┬───────────────────────────────┬───────────────┘
                │                               │
┌───────────────▼──────────────┐ ┌──────────────▼───────────────┐
│       POLICY & MEMORY        │ │    PAYMENTS & FINANCIALS     │
│   Cognee (@cognee/cognee-ts) │ │     Stripe (Node.js SDK)     │
│   - Policy Knowledge Graph   │ │     - Transfers API (test)   │
│   - Multi-Hop Audit Memory   │ │     - Connected Accounts     │
│   Deterministic Policy Engine│ │     - Webhook Signature Verif│
│   - Atomic Budget Locker     │ │     - Idempotency Keys       │
└───────────────┬──────────────┘ └──────────────┬───────────────┘
                │                               │
┌───────────────▼───────────────────────────────▼───────────────┐
│                    DATABASE & PERSISTENCE                     │
│     PostgreSQL + Drizzle ORM                                  │
│     Multi-Tenant (tenant_id on all tables) + RLS              │
│     Monotonic State Machines (AgentRun, Transaction, Match)   │
└───────────────────────────────────────────────────────────────┘
```

### 4.1 Exact Package Dependencies (`package.json`)

```json
{
  "name": "tillwise-finops",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "stripe:listen": "stripe listen --forward-to localhost:3000/api/webhooks/stripe"
  },
  "dependencies": {
    "@ai-sdk/anthropic": "^1.1.0",
    "@ai-sdk/google": "^1.1.0",
    "@ai-sdk/openai": "^1.1.0",
    "@ai-sdk/workflow": "^0.1.0",
    "@cognee/cognee-ts": "^0.1.5",
    "@hookform/resolvers": "^3.9.1",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.1",
    "ai": "^4.1.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "dotenv": "^16.4.7",
    "drizzle-orm": "^0.38.3",
    "lucide-react": "^0.469.0",
    "next": "15.1.3",
    "pg": "^8.13.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "sonner": "^1.7.1",
    "stripe": "^17.5.0",
    "tailwind-merge": "^2.6.0",
    "workflow": "^0.1.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/pg": "^8.11.10",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "drizzle-kit": "^0.30.1",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2"
  }
}
```

---

## 5. Database Schema & Data APIs (PostgreSQL + Drizzle ORM)

All tables enforce multi-tenancy with `tenant_id`.

```typescript
import { pgTable, text, integer, timestamp, boolean, jsonb, decimal, uuid } from 'drizzle-orm/pg-core';

// 1. Tenants & Stores
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  cashBufferFloorGbp: integer('cash_buffer_floor_gbp').default(5000).notNull(), // £5,000
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Verified Suppliers & Connected Accounts
export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  stripeConnectedAccountId: text('stripe_connected_account_id').notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  bankSortCode: text('bank_sort_code').notNull(),
  bankAccountNumber: text('bank_account_number').notNull(),
  bankDetailsLastChangedAt: timestamp('bank_details_last_changed_at').defaultNow().notNull(),
  isInCoolingPeriod: boolean('is_in_cooling_period').default(false).notNull(),
});

// 3. Inventory SKUs & Stock
export const skus = pgTable('skus', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  currentStock: integer('current_stock').notNull(),
  dailySalesVelocity: decimal('daily_sales_velocity', { precision: 5, scale: 2 }).notNull(),
  reorderPoint: integer('reorder_point').notNull(),
  preferredSupplierId: uuid('preferred_supplier_id').references(() => suppliers.id).notNull(),
  unitCostPence: integer('unit_cost_pence').notNull(),
});

// 4. Purchase Orders
export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  supplierId: uuid('supplier_id').references(() => suppliers.id).notNull(),
  skuId: uuid('sku_id').references(() => skus.id).notNull(),
  quantity: integer('quantity').notNull(),
  totalAmountPence: integer('total_amount_pence').notNull(),
  status: text('status').notNull(), // DRAFT | PLACED | RECEIVED | CLOSED
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Invoices & 3-Way Match
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  supplierId: uuid('supplier_id').references(() => suppliers.id).notNull(),
  poId: uuid('po_id').references(() => purchaseOrders.id),
  invoiceNumber: text('invoice_number').notNull(),
  amountPence: integer('amount_pence').notNull(),
  isMatched: boolean('is_matched').default(false).notNull(),
  status: text('status').notNull(), // PENDING | MATCHED | DISPUTED | PAID
});

// 6. Agent Runs & Traces
export const agentRuns = pgTable('agent_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  triggerEvent: text('trigger_event').notNull(), // e.g. STOCKOUT_ALERT
  status: text('status').notNull(), // OBSERVING | PLANNING | GATING | AWAITING_APPROVAL | EXECUTING | COMPLETED | BLOCKED
  proposalPlan: jsonb('proposal_plan'),
  policyDecision: text('policy_decision'), // AUTO | ESCALATE | BLOCK
  clauseCited: text('clause_cited'), // e.g. Clause 2.1
  cogneeMemoryId: text('cognee_memory_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Stripe Transactions (State Machine)
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  agentRunId: uuid('agent_run_id').references(() => agentRuns.id).notNull(),
  invoiceId: uuid('invoice_id').references(() => invoices.id).notNull(),
  stripeTransferId: text('stripe_transfer_id'),
  idempotencyKey: text('idempotency_key').unique().notNull(),
  amountPence: integer('amount_pence').notNull(),
  currency: text('currency').default('gbp').notNull(),
  status: text('status').notNull(), // INITIATED | SUBMITTED | PROCESSING | SETTLED | FAILED | REVERSED
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## 6. Internal API & Route Structure

| Route | Method | Purpose |
| :--- | :--- | :--- |
| `/api/agent/run` | `POST` | Triggers an agent evaluation run for a store event (stockout or invoice). |
| `/api/approvals/[id]/decide` | `POST` | Operator signs off (`APPROVED` or `REJECTED`) on an escalated action; resumes the waiting workflow. |
| `/api/audit/explain/[txId]` | `GET` | Queries Cognee memory to explain the exact clause and evidence behind a specific payment. |
| `/api/policy/sync` | `POST` | Ingests the updated written policy markdown into Cognee (`add` + `cognify`). |
| `/api/webhooks/stripe` | `POST` | Stripe webhook listener handling `transfer.created`, `transfer.reversed`, and bank changes. |
| `/api/seed/reset` | `POST` | Re-seeds the demo database (reset inventory, balance, and clear past runs for clean rehearsal). |

---

## 7. The 3-Minute Demo Video Script (Track 01 Blueprint)

| Timestamp | Screen | What Judges See | Voiceover / Narrative |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:30** | **Store Brief & Cognee Mandate** | Operator sets cash floor (£5,000) and written policy. Clicks "Sync Mandate to Cognee". Shows Cognee graph nodes generated. | *"Tillwise is an AI financial control plane for retail. The store owner sets a written policy, which Cognee structures into an authoritative knowledge graph."* |
| **0:30 – 1:15** | **Scenario 1: Permitted Auto-Spend** | Stockout alert on SKU #104. Agent investigates sales velocity, sees £320 order needed. Checks Cognee: matches Clause 2.1 (< £500). Auto-executes via Stripe test transfer! | *"When a stockout threatens, the agent investigates. Because the £320 order is within the £500 mandate limit and cash buffer is safe, it auto-authorizes and moves money in Stripe test mode."* |
| **1:15 – 2:00** | **Scenario 2: Escalated Approval** | Bulk order of £2,400. Breaches £1,000 auto-limit. Agent halts run, generates a Decision Card. Operator reviews rationale and clicks "Approve". Run resumes and dispatches Stripe transfer. | *"For large orders, models propose, but humans authorize. The run suspends safely. The owner reviews the decision card with evidence IDs, approves with one click, and the transaction settles."* |
| **2:00 – 2:30** | **Scenario 3: Blocked Fraud / Cooling Period** | Invoice arrives with a changed bank account sort code. Cognee recalls Clause 3.1. Payment is hard-blocked; security alert triggers. | *"When an invoice requests altered bank details, the agent refuses to act. It cites Clause 3.1, freezes the vendor, and flags the risk."* |
| **2:30 – 3:00** | **"Why Did You Pay This?" Inspector** | Operator clicks "Inspect" on the £320 transfer. Cognee retrieves the exact clause citation, evidence graph, PO, and Stripe Transfer ID. | *"Every pound is explained. Clicking any transaction queries Cognee's memory graph, proving the exact rule, evidence, and settlement trail."* |

---

## 8. Environment Variables Template (`.env.example`)

```env
# Database
DATABASE_URL="postgres://user:password@localhost:5432/tillwise"

# LLM Providers (via AI SDK)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."

# Cognee Memory Engine
COGNEE_API_KEY="cognee_live_..."
COGNEE_API_URL="https://api.cognee.ai" # Or local instance: http://localhost:8000

# Stripe Payments (Test Mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Workflow DevKit / App Settings
WORKFLOW_TARGET_WORLD="local"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
