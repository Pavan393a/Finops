# Tillwise — Autonomous Retail FinOps Control Plane

> **An autonomous retail FinOps control plane that monitors inventory, moves money on Stripe within strict cash guardrails, and explains every transaction via Cognee causal memory.**

Built for **Track 01 ("Agents that spend")** and the **Side Quest ("Best use of Cognee memory")**.

---

## 📖 The Platform Story

Every retail founder and store operator lives in constant tension between two failure modes:
1. **The Inventory Stockout Trap**: Running out of your best-selling product on a Saturday morning. You lose thousands of pounds in high-margin sales and disappoint loyal customers because nobody noticed inventory fell below supplier delivery lead times.
2. **The Bank Insolvency Trap**: An employee or an autonomous AI script over-orders stock, drains bank cash below the emergency safety reserve, and leaves the business unable to meet payroll, commercial rent, or VAT obligations.

Traditional software doesn't solve this. Accounts-payable tools are static dashboards that wait for humans to manually enter invoices. LLM chatbots attached to bank accounts are dangerous because language models can hallucinate, suffer prompt injection, or spend money indiscriminately without mathematical guardrails.

**Tillwise was built on a first-principles thesis:**  
> **"Models may propose and investigate, but deterministic services authorize, execute, and account for money movement."**

Tillwise operates as an autonomous financial control plane. It continuously monitors retail shelf telemetry, calculates optimal economic replenishment, enforces mathematical cash buffer floors, executes live payouts via **Stripe test rails**, and links every single penny to an immutable **Cognee Knowledge Graph** so that founders and auditors can always ask: *"Why did you pay this?"* and receive verifiable causal proof.

---

## 🔍 How Tillwise Analyzes Retail Operations

Tillwise does not wait for a human to trigger a spreadsheet review. It continuously analyzes operational health through a 3-tier sensory engine:

1. **Live Velocity & Stockout Telemetry**:
   - Calculates daily sales velocity ($\text{units/day}$) and real-time days of cover:
     $$\text{Days of Cover} = \frac{\text{Current Stock}}{\text{Daily Sales Velocity}}$$
   - If stock cover drops below supplier delivery lead time ($< 3\text{ days}$), the SKU is flagged as `CRITICAL`.
2. **Economic Margin vs. Holding Cost Optimization**:
   - Calculates the cost of doing nothing: projected stockout hours multiplied by gross margin loss per hour.
   - Evaluates supplier minimum order quantities (MOQ), unit costs, and trade-offs across 3 distinct trajectories:
     - **Low / MOQ** (conserves cash, higher stockout risk)
     - **Balanced / Recommended** (optimizes cash runway vs. weekend demand)
     - **Aggressive / Bulk Buffer** (maximizes margin protection, higher cash commitment)
3. **Dynamic Demand Surge Simulation**:
   - Store operators can adjust demand multipliers ($0.5\times - 3.0\times$) in the interactive **SkuDetailDrawer** to simulate holiday rushes, heatwaves, or local footfall surges and view real-time impact on days of cover.

---

## 💳 How Tillwise Moves Money via Stripe Rails

Moving real business money without a human in the loop requires **deterministic financial guardrails and idempotent payment execution**:

```mermaid
flowchart LR
    A["Proposed Order\n(e.g., 20 Units Cold Brew = £320)"] --> B{"Deterministic Policy Gate\n(Hard Rules Engine)"}
    B -->|"Floor Breached\n(Cash < £5,000)"| C["❌ BLOCKED\nPreserves Liquidity"]
    B -->|"> £500 Spend Limit"| D["⏸️ ESCALATE\nGenerates 1-Click Action Card"]
    B -->|"≤ £500 & Cash > £5,000"| E["✅ AUTO-APPROVED\nRule 2.1 Applied"]
    E --> F["Stripe Rails\nstripe.transfers.create()"]
    F --> G["Verified Vendor Connected Account\n(acct_1FreshFarmTestGBP)"]
    G --> H["Webhook Verified\n(/api/webhooks/stripe)"]
```

1. **The Protected Liquidity Buffer (£5,000 Floor)**:
   - Operating bank cash is tracked live. The store enforces an unbreakable rule: **No disbursement can ever breach the £5,000 cash floor**.
2. **Tiered Authority Thresholds**:
   - **Micro-Spend ($\le £500$)**: Pre-authorized for autonomous execution. The agent disburses funds immediately to prevent shelf runouts.
   - **Manager Escalation ($£500 - £2,500$)**: Pauses execution and renders an Apple-styled **Interactive Action Card** on the operator’s canvas for 1-click confirmation.
3. **Stripe Transfers & Connected Accounts**:
   - Integrated via `stripe.transfers.create` in `src/lib/payment/stripe.ts`.
   - Transfers capital directly from the store’s platform balance to verified vendor **Stripe Connected Accounts** (`stripeConnectedAccountId`).
4. **Idempotency & Reversal Protection**:
   - Every transfer includes a deterministic idempotency key (`idem_tx_{agentRunId}_{amountPence}_{timestamp}`) preventing double-payments.
   - Listens to Stripe webhooks (`/api/webhooks/stripe`) to track real-time settlement (`SETTLED`) or reversals.
5. **Deterministic 3-Way Match & Anti-Fraud (Clause 3.1)**:
   - Matches Purchase Order vs. Warehouse Delivery Slip vs. Inbound Supplier Invoice.
   - **Anti-Tamper Bank Defense**: If an invoice introduces an altered bank sort code or account number, payouts are frozen for **72 hours** under Clause 3.1.

---

## 🧠 How Tillwise Utilizes Cognee Memory

In an autonomous platform where humans are out of the loop, **Cognee serves as the agent’s semantic policy brain and immutable causal audit memory**.

```mermaid
flowchart TD
    subgraph Cognee Knowledge Graph
        M["Store Spending Mandate\n(Financial Constitution)"]
        G["Cognified Policy Graph\n(Clauses 1.1, 2.1, 2.2, 3.1, 4.1)"]
        A["Causal Provenance Nodes\n('Why Did You Pay This?')"]
    end

    M -->|"cognee.add_text & cognify"| G
    G -->|"Semantic Policy Query"| Agent["Tillwise Agent"]
    Agent -->|"Executes Stripe Transfer"| Stripe["Stripe Rails"]
    Stripe -->|"Ingests Causal Chain"| A
    Auditor["Founder / Auditor / Chat Pop:\n'Why did you pay £320?'"] -->|"1-Click Visual Graph"| A
```

### 1. Ingesting the Financial Constitution (`syncMandateToCognee`)
Tillwise syncs its plain-English store spending rules into Cognee's `tillwise_policy` dataset and triggers `POST /api/v1/cognify`. Cognee builds a semantic knowledge graph representing:
- **Clause 1.1**: £5,000 operating cash reserve.
- **Clause 2.1**: Autonomous inventory replenishment pre-approved under £500.
- **Clause 2.2**: Dual-authorization threshold for orders above £500.
- **Clause 3.1**: Anti-fraud 3-day cooling hold for bank detail updates.

### 2. Semantic Policy Retrieval (`queryPolicyForAction`)
Before executing an order, the agent queries Cognee to find which specific clause justifies the expenditure. Cognee searches the graph and returns the governing citation (e.g., `Mandate v1.0, Clause 2.1`).

### 3. Causal Provenance & "Why Did You Pay This?" (`recordPaymentMemory`)
When a payment settles on Stripe, Tillwise ingests the complete causal rationale into Cognee's `tillwise_audit` dataset:
- **Telemetry State**: Cold Brew stock dropped to 18 units (1.8 days cover).
- **Economic Loss**: Supplier lead time is 2 days; stockout would cause £1,200 in lost margin.
- **Policy Compliance**: Order amount (£320) is within Clause 2.1; post-order cash (£5,460) preserves the £5,000 buffer.
- **Settlement Receipt**: Copyable Stripe Transfer ID (`tr_test_req_...`).

**In the UI:**
- Clicking **"Why did you pay this?"** on any transaction opens the **Cognee Causal Inspector Modal**, displaying a live 5-hop visual node graph.
- Asking the docked Origami chat assistant (*"Why did we pay FreshFarm £320?"*) queries Cognee memory to provide the human explanation and proof.

---

## 🏛️ System Architecture

```mermaid
graph TB
    subgraph Client Layer ["Apple-Inspired & Origami.chat Interface"]
        Overview["Store Overview & Activity Log"]
        Inventory["Inventory Sheet & Surge Drawer"]
        Rules["Spending Rules & Buffer Slider"]
        Bills["3-Way Match & Fraud Lab"]
        Gateway["External Agent Gateway (MCP)"]
        Chat["Docked Agent Co-Pilot Pop"]
    end

    subgraph Runtime Layer ["Next.js 15 App Router & API Endpoints"]
        APIAgent["/api/agent/investigate & /api/agent/tools"]
        APIChat["/api/agent/chat"]
        APIStatus["/api/store/status & /api/store/rules"]
        APISim["/api/telemetry/simulate"]
        APIInvoices["/api/invoices/match"]
        APIWebhooks["/api/webhooks/stripe"]
    end

    subgraph Agentic Pipeline ["Core FinOps Intelligence"]
        Orchestrator["Agent Orchestrator"]
        LLM["OpenAI GPT-4o-mini (Proposal Engine)"]
        PolicyGate["Deterministic Policy Membrane"]
    end

    subgraph Data & Payment Layer
        DB[("Supabase PostgreSQL\n(Drizzle ORM)")]
        StripeRail["Stripe API Test Rails\n(Transfers & Connected Accounts)"]
        CogneeGraph["Cognee Knowledge Graph\n(Semantic Memory & Causal Proof)"]
    end

    Overview & Inventory & Rules & Bills & Gateway & Chat --> Runtime Layer
    Runtime Layer --> Orchestrator
    Orchestrator --> LLM
    Orchestrator --> PolicyGate
    PolicyGate --> DB
    PolicyGate --> StripeRail
    PolicyGate --> CogneeGraph
```

---

## 🔄 The End-to-End Agentic Pipeline

The autonomous lifecycle follows a strict 5-stage pipeline:

```
[1. TELEMETRY]  ──>  [2. INVESTIGATION]  ──>  [3. MEMBRANE]  ──>  [4. STRIPE RAILS]  ──>  [5. COGNEE MEMORY]
Stock: 18 units     LLM plans batch:          Deterministic gate   Programmatic transfer:  Causal node saved:
Velocity: 10/day    20 units @ £16 = £320     £320 ≤ £500 limit    stripe.transfers.create tr_test_req_...
Runout: 1.8 days    Lead-time risk: £1.2k     Cash £5,460 > £5k    Idempotency key tagged  Answers "Why?"
```

---

## 👥 User Flow

### 1. Store Operator Flow (Human Founder)
1. **At-a-Glance Dashboard**: Views Available Cash (£5,780), Protected Buffer (£5,000), Safe Spend (£780), and critical stock alerts.
2. **Demand Surge Simulation**: Clicks any product to slide out the **SkuDetailDrawer**. Adjusts the demand multiplier ($0.5\times - 3.0\times$) to simulate rush periods.
3. **Autonomous Auto-Pilot**: The agent monitors stock and auto-spends for orders $\le £500$. If an order exceeds £500, an **Action Card** appears on the canvas for 1-click authorization.
4. **Instant Audit**: Clicks **"Why did you pay this?"** on any payment or asks the docked chat assistant to inspect the causal reasoning.
5. **Adjusting Store Policy**: Visits the **Spending Rules** tab and drags the **Liquidity Reserve Slider** to change the protected floor from £5,000 to another value.

### 2. External AI Agent Flow (e.g. Arudno Labs, AutoGPT, ERP Agents)
External agents integrate directly without human intervention via the **Model Context Protocol (MCP)** or REST tools:
1. **Discovery**: Calls `GET /api/agent/tools` to receive typed JSON schemas for store tools.
2. **Telemetry Query**: Calls `POST /api/agent/tools` with `{"tool": "get_store_telemetry"}` to read current cash, safe spend, and stock runout.
3. **Dispatching Actions**: Calls `{"tool": "investigate_and_reorder_sku", "arguments": {"skuId": "SKU-104", "customQuantity": 20}}`.
4. **Deterministic Protection**: The external agent cannot force Tillwise to overspend; Tillwise’s internal membrane checks the cash floor before executing the Stripe transfer.
5. **Audit Retrieval**: Calls `{"tool": "query_cognee_provenance"}` to retrieve the immutable Cognee memory record.

---

## 🛠️ Tech Stack & Integrations

| Layer | Technologies Used |
| :--- | :--- |
| **Framework & Frontend** | **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, **Lucide Icons**, **Sonner Toasts** |
| **Design Language** | **Apple Minimalism** + **Origami.chat Ergonomics** (clean SF Pro typography, glass cards, zero robotic jargon) |
| **Database & ORM** | **Supabase PostgreSQL** via session pooler, **Drizzle ORM** (`drizzle-kit`) |
| **Payment Rails** | **Stripe API** (Transfers, Connected Accounts, Webhooks, Idempotency Keys) |
| **Semantic Memory** | **Cognee Knowledge Graph** (`/api/v1/add_text`, `/api/v1/cognify`, `/api/v1/search`) |
| **AI Reasoning** | **OpenAI GPT-4o-mini** via **Vercel AI SDK** (`generateObject` with Zod structured output) |
| **Agent Protocols** | **Model Context Protocol (MCP)** & JSON-RPC REST Gateway (`/api/agent/tools`) |

---

## 🚀 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Pavan393a/Finops.git
cd Finops
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the project root:
```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# AI Reasoning
OPENAI_API_KEY="sk-proj-..."

# Payment Movement Rails (Stripe Test Mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Semantic Memory & Causal Provenance (Cognee)
COGNEE_API_URL="https://tenant-xxx.aws.cognee.ai"
COGNEE_API_KEY="your-cognee-api-key"
```

### 3. Run Database Migrations & Seed
```bash
npx drizzle-kit push
npx tsx src/lib/db/seed.ts
```

### 4. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Interactive Demo Guide

1. **Test Autonomous Restocking**:
   - On the main dashboard, find the **Organic Cold Brew** alert. Click **"Autonomous Restock"**.
   - Watch the agent evaluate Rule 2.1, disburse £320 on Stripe test rails, and settle the transaction live.
2. **Inspect "Why Did You Pay This?"**:
   - In the Activity Log or Recent Payments, click **"Why did you pay this?"**.
   - Inspect the interactive 5-hop causal node graph loaded from Cognee.
3. **Simulate Retail Events**:
   - Click **"Live Simulator"** in the top header.
   - Click **"Simulate 5 Units Sold"** to deplete stock, or **"Simulate Vendor Bank Attack"** to test Clause 3.1 fraud defense.
4. **Test External AI Agent Integration**:
   - Navigate to the **External Agent Interop** tab in the sidebar.
   - Switch between **Arudno Labs**, **ERP Agent**, or **Claude 3.7**, and click **"1. Query Telemetry"** or **"2. Dispatch Agent Reorder"** to observe live JSON responses.

---

## 📄 License
MIT © 2026 Tillwise Retail FinOps Control Plane. Built for Hackathon Track 01 & Cognee Side Quest.
