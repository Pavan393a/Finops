# FinOps — Autonomous Retail Control Plane

> **An autonomous retail FinOps control plane that monitors inventory, moves money on Stripe within strict cash guardrails, and explains every transaction via Cognee causal memory.**

Built for **Track 01 ("Agents that spend")** and the **Side Quest ("Best use of Cognee memory")**.

---

## 📖 The Platform Story

Every retail founder and store operator lives in constant tension between two failure modes:
1. **The Inventory Stockout Trap**: Running out of your best-selling product on a Saturday morning. You lose thousands of pounds in high-margin sales and disappoint loyal customers because nobody noticed inventory fell below supplier delivery lead times.
2. **The Bank Insolvency Trap**: An employee or an autonomous AI script over-orders stock, drains bank cash below the emergency safety reserve, and leaves the business unable to meet payroll, commercial rent, or VAT obligations.

Traditional software doesn't solve this. Accounts-payable tools are static dashboards that wait for humans to manually enter invoices. LLM chatbots attached to bank accounts are dangerous because language models can hallucinate, suffer prompt injection, or spend money indiscriminately without mathematical guardrails.

**FinOps was built on a first-principles thesis:**  
> **"Models may propose and investigate, but deterministic services authorize, execute, and account for money movement."**

FinOps operates as an autonomous financial control plane. It continuously monitors retail shelf telemetry, calculates optimal economic replenishment, enforces mathematical cash buffer floors, executes live payouts via **Stripe test rails**, and links every single penny to an immutable **Cognee Knowledge Graph** so that founders and auditors can always ask: *"Why did you pay this?"* and receive verifiable causal proof.

---

## 🤖 The Arudno Labs Story: How External AI Agents Safely Move Money via MCP

Imagine a cutting-edge third-party AI research company like **Arudno Labs**. They build specialized autonomous agents that analyze local weather, social media trends, and logistics patterns to forecast retail demand shocks days in advance.

### The Real-World Dilemma:
How can an external AI agent from **Arudno Labs** actually *act* on its predictions in the physical world?
- If the retail store founder gives Arudno Labs' agent raw access to corporate bank accounts or credit cards, **the agent could hallucinate, suffer prompt injection, or over-order and drain the store’s cash**.
- But if Arudno Labs' agent can only send emails or Slack alerts, the store owner is stuck doing manual data entry and midnight wire transfers.

### The FinOps Solution:
Instead of raw bank access, **Arudno Labs connects to FinOps as an Autonomous Financial Gateway via the Model Context Protocol (MCP)** or REST Tools (`POST /api/agent/tools`):

```mermaid
sequenceDiagram
    autonumber
    participant A as Arudno Labs AI Agent
    participant T as FinOps MCP Gateway
    participant P as Policy Membrane (Guardrails)
    participant S as Stripe Rails
    participant C as Cognee Causal Memory

    A->>T: 1. Discovers tools via GET /api/agent/tools (MCP Schema)
    A->>T: 2. Reads telemetry (Stock: 18 units, Velocity: 10/day, Safe Spend: £780)
    Note over A: Arudno Labs predicts weekend surge;<br/>calculates 20 units needed
    A->>T: 3. Dispatches tool call: investigate_and_reorder_sku("SKU-104", qty=20)
    T->>P: 4. Evaluates Mandate (£320 ≤ £500 limit? Yes. Balance £5,460 ≥ £5,000? Yes.)
    P->>S: 5. Executes programmatic transfer to verified supplier (acct_1FreshFarmTestGBP)
    S-->>T: 6. Returns settled Stripe Transfer ID (tr_test_req_...)
    T->>C: 7. Ingests causal provenance into Cognee Graph tagged to Arudno Labs
    T-->>A: 8. Returns JSON: { status: "AUTO_EXECUTED", stripeTransferId: "tr_test_..." }
```

### What This Enables:
1. **Zero-Trust Autonomous Execution**: Arudno Labs' agent can freely manage store stock and initiate supplier payments 24/7 without a human in the loop.
2. **Mathematical Protection**: Even if Arudno Labs' AI model hallucinates and attempts to order £10,000 of inventory, **FinOps’s non-LLM policy membrane immediately blocks the transfer** and prevents the £5,000 cash buffer from ever being breached.
3. **Complete Attribution & Auditability**: Every pound spent by Arudno Labs is logged in Cognee memory. When the founder asks *"Why did we pay £320?"*, the audit trail confirms: *“Initiated by external agent Arudno Labs v1 based on projected weekend heatwave surge; authorized under Mandate Clause 2.1.”*

---

## 🔍 How FinOps Analyzes Retail Operations

FinOps does not wait for a human to trigger a spreadsheet review. It continuously analyzes operational health through a 3-tier sensory engine:

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

## 💳 How FinOps Moves Money via Stripe Rails

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

## 🧠 How FinOps Utilizes Cognee Memory

In an autonomous platform where humans are out of the loop, **Cognee serves as the agent’s semantic policy brain and immutable causal audit memory**.

```mermaid
flowchart TD
    subgraph Cognee Knowledge Graph
        M["Store Spending Mandate\n(Financial Constitution)"]
        G["Cognified Policy Graph\n(Clauses 1.1, 2.1, 2.2, 3.1, 4.1)"]
        A["Causal Provenance Nodes\n('Why Did You Pay This?')"]
    end

    M -->|"cognee.add_text & cognify"| G
    G -->|"Semantic Policy Query"| Agent["FinOps Agent"]
    Agent -->|"Executes Stripe Transfer"| Stripe["Stripe Rails"]
    Stripe -->|"Ingests Causal Chain"| A
    Auditor["Founder / Auditor / Chat Pop:\n'Why did you pay £320?'"] -->|"1-Click Visual Graph"| A
```

### 1. Ingesting the Financial Constitution (`syncMandateToCognee`)
FinOps syncs its plain-English store spending rules into Cognee's policy dataset and triggers `POST /api/v1/cognify`. Cognee builds a semantic knowledge graph representing:
- **Clause 1.1**: £5,000 operating cash reserve.
- **Clause 2.1**: Autonomous inventory replenishment pre-approved under £500.
- **Clause 2.2**: Dual-authorization threshold for orders above £500.
- **Clause 3.1**: Anti-fraud 3-day cooling hold for bank detail updates.

### 2. Semantic Policy Retrieval (`queryPolicyForAction`)
Before executing an order, the agent queries Cognee to find which specific clause justifies the expenditure. Cognee searches the graph and returns the governing citation (e.g., `Mandate v1.0, Clause 2.1`).

### 3. Causal Provenance & "Why Did You Pay This?" (`recordPaymentMemory`)
When a payment settles on Stripe, FinOps ingests the complete causal rationale into Cognee's audit dataset:
- **Telemetry State**: Cold Brew stock dropped to 18 units (1.8 days cover).
- **Economic Loss**: Supplier lead time is 2 days; stockout would cause £1,200 in lost margin.
- **Policy Compliance**: Order amount (£320) is within Clause 2.1; post-order cash (£5,460) preserves the £5,000 buffer.
- **Settlement Receipt**: Copyable Stripe Transfer ID (`tr_test_req_...`).

**In the UI:**
- Clicking **"Why did you pay this?"** on any transaction opens the **Cognee Causal Inspector Modal**, displaying a live 5-hop visual node graph.
- Asking the docked Origami chat assistant (*"Why did we pay FreshFarm £320?"*) queries Cognee memory to provide the human explanation and proof.

---

## 🏆 Track 01 ("Agents that Spend") — Requirements & Implementation

FinOps directly fulfills every core requirement of **Track 01 ("Agents that spend")** by proving that autonomous AI agents can move real business capital safely without human supervision:

| Track 01 Requirement | How FinOps Satisfies It | Implementation In Code |
| :--- | :--- | :--- |
| **1. Programmatic Money Movement** | The agent directly transfers real capital in Stripe test mode to supplier accounts without waiting for manual banking approval. | [`src/lib/payment/stripe.ts`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/lib/payment/stripe.ts) (`stripe.transfers.create`) |
| **2. Multi-Party Payouts (Connect)** | Disburses funds directly to verified vendor accounts (`acct_1FreshFarmTestGBP`, `acct_1EcoPackTestGBP`). | [`src/lib/db/schema.ts`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/lib/db/schema.ts#L16-L30) (`suppliers.stripeConnectedAccountId`) |
| **3. Invoicing & 3-Way Match** | Verifies Purchase Order vs. Warehouse Delivery Slip vs. Inbound Supplier Invoice before any payout is authorized. | [`src/app/api/invoices/match/route.ts`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/app/api/invoices/match/route.ts) |
| **4. Agent Toolkit & MCP** | Exposes typed Model Context Protocol (MCP) and JSON tool interfaces for external agents (e.g. Arudno Labs, AutoGPT). | [`src/app/api/agent/tools/route.ts`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/app/api/agent/tools/route.ts) |
| **5. Idempotent & Reversible** | Every transfer has a deterministic idempotency key (`idem_tx_...`) preventing double-spends; listens to webhooks for settlement. | [`src/app/api/webhooks/stripe/route.ts`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/app/api/webhooks/stripe/route.ts) |
| **6. Deterministic Guardrails** | Non-LLM policy membrane blocks any order that breaches the **£5,000 cash floor** or exceeds the **£500 auto-spend limit**. | [`src/lib/policy/gate.ts`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/lib/policy/gate.ts) (`evaluatePolicy`) |
| **7. Anti-Fraud Cooling Period** | Enforces **Clause 3.1 72-hour cooling freeze** if an invoice arrives with modified bank sort code or account details. | [`src/components/ThreeWayMatchLab.tsx`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/components/ThreeWayMatchLab.tsx) |

---

## 🧩 Component Catalog: Built Specifically for the Track

Every UI component was purpose-built following **Apple Design Language** and **Origami.chat ergonomics** to make autonomous financial operations dynamic, interactive, and transparent:

| Component | Role in the Platform & Track Fulfillment | File Path |
| :--- | :--- | :--- |
| **`OrigamiSidebar`** | Left navigation co-pilot with quick tab switching, suggested *"Ask or adjust"* prompts, docked agent chat pop, and 1-click demo state reset. | [`src/components/OrigamiSidebar.tsx`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/components/OrigamiSidebar.tsx) |
| **`AppleStoreOverview`** | Apple-clean financial summary displaying Available Cash (£5,780), Protected Buffer (£5,000), Safe Spend (£780), Urgent Restock Alert, and live Product Cards. | [`src/components/AppleStoreOverview.tsx`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/components/AppleStoreOverview.tsx) |
| **`AgentActivityLog`** | Immutable operational audit log of every autonomous observation, rule check, and Stripe payout ("Human out of the loop") with Auto-Pilot toggle. | [`src/components/AgentActivityLog.tsx`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/components/AgentActivityLog.tsx) |
| **`SkuDetailDrawer`** | Slide-over drawer with an interactive **Demand Surge Multiplier ($0.5\times - 3.0\times$)** and reorder slider with live disbursement calculation. | [`src/components/SkuDetailDrawer.tsx`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/components/SkuDetailDrawer.tsx) |
| **`DecisionCard`** | Action Card generated when a proposed order exceeds £500, displaying trade-offs, dynamic policy badges, and a 1-click human sign-off button. | [`src/components/DecisionCard.tsx`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/components/DecisionCard.tsx) |
| **`CogneeInspectorModal`** | Multi-hop causal provenance graph answering *"Why did you pay this?"* with semantic rationale, mandate clauses, and copyable Stripe transfer IDs. | [`src/components/CogneeInspectorModal.tsx`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/components/CogneeInspectorModal.tsx) |
| **`SpendingRulesView`** | Store spending authority console with an interactive **Liquidity Reserve Slider** (£1k - £10k) connected to `PATCH /api/store/rules`. | [`src/components/SpendingRulesView.tsx`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/components/SpendingRulesView.tsx) |
| **`ThreeWayMatchLab`** | Interactive simulation lab testing 100% Match, Shortfall short-payment, and Clause 3.1 supplier bank change cooling hold. | [`src/components/ThreeWayMatchLab.tsx`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/components/ThreeWayMatchLab.tsx) |
| **`ExternalAgentGateway`** | Developer and AI agent gateway exposing Model Context Protocol (MCP), live tool execution console, and code snippets in cURL, Python, and MCP JSON. | [`src/components/ExternalAgentGateway.tsx`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/components/ExternalAgentGateway.tsx) |
| **`LiveStoreSimulator`** | Real-time simulator for retail events: sales depletion (-5 units), delivery receipts (+20 units), cash inflows (+£1,500), and fraud attacks. | [`src/components/LiveStoreSimulator.tsx`](file:///Users/pavanmorla/Desktop/Saas/Finops/src/components/LiveStoreSimulator.tsx) |

---

## 🏛️ Comprehensive Architecture Visualization

```mermaid
graph TB
    subgraph External ["1. Operators & External AI Agents"]
        Operator["Retail Store Founder / Operator\n(Apple UI & Origami Co-Pilot)"]
        ExternalAgent["External AI Agent\n(Arudno Labs / AutoGPT / ERP Agent)"]
    end

    subgraph Interface ["2. Unified Presentation & Gateway Layer"]
        UIOverview["Store Overview & Activity Log"]
        UIDrawer["Surge Simulator & Restock Drawer"]
        UIRules["Spending Rules & Buffer Slider"]
        UILab["3-Way Match & Fraud Defense Lab"]
        MCPGateway["Model Context Protocol (MCP) & REST Tools\n(/api/agent/tools)"]
    end

    subgraph Runtime ["3. Next.js 15 App Router & API Endpoints"]
        APIInvestigate["/api/agent/investigate"]
        APIChat["/api/agent/chat"]
        APIRules["/api/store/rules"]
        APIInvoices["/api/invoices/match"]
        APIWebhooks["/api/webhooks/stripe"]
    end

    subgraph AgenticCore ["4. Autonomous Agentic Pipeline"]
        Orchestrator["Agent Orchestrator\n(triggerOrchestrationPipeline)"]
        LLM["OpenAI GPT-4o-mini\n(Structured Proposal & Trade-offs)"]
        Membrane{"Deterministic Policy Membrane\n- Floor: Cash ≥ £5,000\n- Cap: Spend ≤ £500\n- Verification: 3-Way Match"}
    end

    subgraph Persistence ["5. Storage, Rails & Memory Engine"]
        PostgreSQL[("Supabase PostgreSQL\n(Drizzle ORM Ledger)")]
        StripeRail["Stripe API Rails\n- stripe.transfers.create\n- Destination: Connected Accounts\n- Idempotency: idem_tx_..."]
        Cognee["Cognee Knowledge Graph\n- tillwise_policy (Cognified Mandate)\n- tillwise_audit (Causal Provenance Nodes)"]
    end

    Operator --> UIOverview & UIDrawer & UIRules & UILab
    ExternalAgent --> MCPGateway
    UIOverview & UIDrawer & UIRules & UILab --> Runtime
    MCPGateway --> Runtime
    Runtime --> Orchestrator
    Orchestrator --> LLM
    LLM --> Orchestrator
    Orchestrator --> Membrane
    Membrane -->|"State Mutation"| PostgreSQL
    Membrane -->|"Execute Transfer"| StripeRail
    Membrane -->|"Record Provenance"| Cognee
    StripeRail -.->|"Webhook Event"| APIWebhooks
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
4. **Deterministic Protection**: The external agent cannot force FinOps to overspend; FinOps’s internal membrane checks the cash floor before executing the Stripe transfer.
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
MIT © 2026 FinOps Autonomous Retail Control Plane. Built for Hackathon Track 01 & Cognee Side Quest.
