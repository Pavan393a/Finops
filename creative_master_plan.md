# Tillwise — Creative Generative FinOps Canvas (Master Atomic Blueprint)

> **Philosophy**: Reject boring B2B accounting jargon. Build a generative, intent-driven financial operating canvas inspired by **CreateAnything.com** and **Origami.chat**.  
> **Target**: Hackathon Track 01 ("Agents that spend") + Side Quest ("Best use of Cognee memory").  
> **Confirmed Stack**: **OpenAI** (LLM) + **Stripe Test Mode** (Payments) + **Supabase PostgreSQL** (Database) + **Cognee** (Policy Memory) + **Next.js 15 / TailwindCSS** (Frontend).

---

## 1. The Thinking Process: Traditional FinOps vs. The Generative Canvas

### 1.1 How Traditional Finance Ops Fails
In a traditional retail business, finance is trapped in fractured, dead tools:
* **The Spreadsheet**: Excel/Google Sheets with stale inventory counts and manual VLOOKUPs.
* **The Bank Portal**: Logging into Barclays/NatWest/Stripe to check cash balances.
* **The Invoice Pile**: PDFs in email inboxes waiting for someone to manually check: *"Did we actually get these 50 boxes of oat milk?"*
* **The Human Friction**: The store manager spends 2 hours every evening cross-referencing three screens just to decide if they can afford to pay a supplier tomorrow without missing payroll on Friday.

### 1.2 The "CreateAnything" Paradigm Shift
If you look at **CreateAnything.com**, you never fill out a 20-field form or click through a labyrinth of static ERP tabs. 
Instead:
1. **You express intent or the world triggers an event** (e.g. *"Sales spike on cold brew, protect weekend stock"*).
2. **The platform materializes a live, interactive artifact** right in front of you. It doesn't just reply with a wall of text—it renders an interactive, inspectable visual canvas.
3. **The user manipulates the artifact or approves with one gesture**.

### 1.3 What Tillwise Looks & Feels Like
Tillwise is **not** an AP dashboard with an LLM chatbot slapped on the side. 
It is a **Generative Financial Control Canvas**:
* **The Ambient Header**: A dynamic Liquidity Horizon bar showing current cash (£6,740), the untouchable £5,000 cash floor, and projected runway.
* **The Conversational Directive Bar**: You can talk to it (*"Show me upcoming cash drains"* or *"Hold non-critical supplier payments this week"*), or let it run autonomously on store telemetry.
* **The Generative Decision Cards**: When an operational signal arrives, the agent doesn't write an essay. It materializes a **high-density, interactive card**:
  - Live tradeoff slider (e.g., *Order 20 units = £320 vs 40 units = £600*).
  - Visual evidence badges (Sales velocity, days of cover, supplier trust score).
  - Policy badge (Authorised under Clause 2.1 via Cognee).
  - A 1-click **"Slide to Authorize"** or **"Auto-Executed"** pulse badge.
* **The Cognee Deep Inspector**: Clicking any pound spent explodes into a visual graph showing the exact mandate clause, the order receipt, and the Stripe transfer ID.

---

## 2. The 8 Fundamental Atoms (First-Principles Breakdown)

```
[ Atom 1: Retail Physics ] ──► Stockout Risk & Cash Liquidity Dynamics
          │
          ▼
[ Atom 2: Intent & Telemetry ] ──► Store POS Event or Operator Command
          │
          ▼
[ Atom 3: Cognitive Agent ] ──► OpenAI (gpt-4o) + Cognee Policy Knowledge Graph
          │
          ▼
[ Atom 4: Structured Artifact ] ──► Materialized Decision Card on UI Canvas
          │
          ▼
[ Atom 5: Deterministic Membrane ] ──► Policy Gate & Atomic Cash Locker (Supabase)
          │
          ▼
[ Atom 6: Financial Rail ] ──► Stripe Test Transfers with Idempotency Keys
          │
          ▼
[ Atom 7: Audit Provenance ] ──► Cognee Multi-Hop Memory ("Why Did You Pay This?")
          │
          ▼
[ Atom 8: Reconciled Truth ] ──► Ledger Entry & State Machine Settlement
```

---

### Atom 1: The Retail Physics (Domain Constants)
Every retail store operates under two physical laws:
1. **The Lead-Time Gap**: Between ordering and goods arriving on the shelf, you are blind and vulnerable to stockouts.
2. **The Liquidity Constraint**: Cash out must never cross the safety floor, or operations stop.

### Atom 2: The Intent & Telemetry Ingestion
* **Telemetry**: POS sales feed and inventory counters trigger events (e.g., `SKU_104_COVER_CRITICAL: 1.8 days remaining`).
* **Conversational Intent**: Operator inputs like *"Ensure we have enough stock for the sunny weekend"* adjust the agent's operating parameters.

### Atom 3: The Cognitive Agent (OpenAI + Cognee)
The agent runs in a strict, bounded sandbox using the **Vercel AI SDK Core**:
* **Model**: `openai('gpt-4o')` (or `gpt-4o-mini` for fast sub-steps).
* **Role**: The agent investigates, compares suppliers, calculates trade-offs, and queries Cognee for the governing clause.
* **Hard Boundary**: The agent has **no payment tools**. It can only output a structured proposal.

### Atom 4: The Generative UI Canvas (CreateAnything-Style)
Instead of static pages, the UI renders dynamic states:
* **Ambient Mode**: The agent is quietly observing; inventory cover bars pulse green/yellow.
* **Intervention Mode**: When an order exceeds policy limits (£1,000 threshold) or an anomaly is detected, the canvas smoothly slides in an **Action Artifact** with full evidence provenance and a single authorization trigger.

### Atom 5: The Deterministic Membrane (Supabase PostgreSQL)
Code, not AI, enforces authority:
* `amount <= mandate.autoLimitPence`
* `(currentCash - amount) >= mandate.cashFloorPence`
* `supplier.isInCoolingPeriod === false`
* If passed: Locks funds atomically in Supabase inside a `SERIALIZABLE` transaction.

### Atom 6: The Financial Rail (Stripe Test Mode)
* Dispatches `stripe.transfers.create(...)` to the supplier's test connected account.
* Transmits an `Idempotency-Key` (`idem_po_{id}`).
* Listens to Stripe webhooks (`transfer.created`, `transfer.reversed`).

### Atom 7: Audit Provenance (Cognee Knowledge Graph)
* Records the multi-hop causal chain:
  `[Stockout Signal] ➔ [PO Draft] ➔ [Clause 2.1 Pre-Approval] ➔ [Stripe Transfer tr_test_...]`
* Answers the hackathon question: *"Why did you pay this?"* instantly with exact citations.

### Atom 8: Reconciled Truth
* Updates Supabase state machines from `SUBMITTED` ➔ `SETTLED`.
* Updates inventory on order receipt.
* Emits a clean audit log.

---

## 3. End-to-End System Architecture

```mermaid
flowchart TB
  subgraph CLIENT["Generative Financial Canvas (Next.js 15 + React 19)"]
    CANVAS["Interactive Canvas View"]
    INTENT["Intent / Directive Input (CreateAnything style)"]
    CARDS["Generative Decision Cards (Action Artifacts)"]
    INSPECTOR["Cognee Multi-Hop Audit Inspector"]
  end

  subgraph AGENT_CORE["AI Agent Engine (Vercel AI SDK)"]
    ORCH["Agent Orchestrator (OpenAI gpt-4o)"]
    TOOLS["Bounded Read Tools: Store Context, Supplier Terms"]
    PROPOSAL["Typed Proposal Schema (Zod)"]
  end

  subgraph BRAIN["Policy & Memory Engine (Cognee)"]
    KGRAPH["Policy Knowledge Graph (Mandate Clauses)"]
    EXPLAIN["'Why Did You Pay This?' Graph Traversal"]
  end

  subgraph SAFETY["Deterministic Membrane (TypeScript)"]
    GATE["Policy Gate: Cash Floor (£5k) & Limits (£500)"]
    COOLING["Anti-Fraud Bank Cooling Locker"]
    LOCKER["Atomic Balance Lock"]
  end

  subgraph RAILS["Payment Infrastructure (Stripe Test Mode)"]
    TRANSFER["Stripe Transfers API (/v1/transfers)"]
    WEBHOOKS["Stripe Webhook Listener (/api/webhooks/stripe)"]
  end

  subgraph STORAGE["Authoritative Storage (Supabase PostgreSQL)"]
    SUPABASE[("Supabase DB: Tenants, SKUs, POs, Invoices, Transactions")]
  end

  INTENT --> ORCH
  CANVAS --> INTENT
  ORCH --> TOOLS --> SUPABASE
  ORCH --> KGRAPH
  ORCH --> PROPOSAL
  PROPOSAL --> GATE
  GATE -->|Over Threshold| CARDS
  CARDS -->|1-Click Authorize| LOCKER
  GATE -->|Within Mandate| LOCKER
  LOCKER --> TRANSFER
  TRANSFER --> WEBHOOKS --> SUPABASE
  WEBHOOKS --> BRAIN
  INSPECTOR --> EXPLAIN --> KGRAPH
```

---

## 4. Required Tech Stack & API Matrix

### 4.1 Exact Stack Choices (Confirmed)
| Layer | Technology | Why Chosen |
| :--- | :--- | :--- |
| **Frontend Canvas** | **Next.js 15 (App Router) + TailwindCSS + Lucide** | High-performance, reactive UI canvas with smooth micro-interactions. |
| **AI Model & SDK** | **OpenAI (`gpt-4o` & `gpt-4o-mini`) via Vercel AI SDK Core** | Reliable structured JSON generation (`generateObject`), robust tool calling. |
| **Database** | **Supabase (Managed PostgreSQL)** | Built-in connection pooling, instant schema migrations, type-safe Postgres via Drizzle. |
| **Payment Rail** | **Stripe Test Mode (`stripe` Node.js SDK)** | Track 01 requirement: test transfers, connected accounts, idempotency keys, webhooks. |
| **Cognitive Memory** | **Cognee (`@cognee/cognee-ts`)** | Side Quest requirement: builds the policy knowledge graph and answers *"Why did you pay this?"*. |

### 4.2 Exact Environment Keys (`.env`)
```env
# 1. Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."

# 2. OpenAI
OPENAI_API_KEY="sk-proj-..."

# 3. Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# 4. Cognee Memory Engine
COGNEE_API_KEY="cognee_..."
COGNEE_API_URL="https://api.cognee.ai"
```

---

## 5. Atomic Build Steps (How We Build It Step-by-Step)

We tackle the build in small, testable atoms:

### Step 1: Database & Core Schemas (Supabase + Drizzle)
* Set up Drizzle schema connecting to your Supabase PostgreSQL.
* Tables: `tenants`, `suppliers`, `skus`, `purchase_orders`, `invoices`, `agent_runs`, `transactions`.
* Seed script: 1 tenant (£6,740 test balance, £5,000 cash floor), 2 verified suppliers, 3 retail SKUs (with SKU #104 near stockout).

### Step 2: Cognee Policy Graph Ingestion
* Write the merchant's written mandate into Cognee (`cognee.add` + `cognify`).
* Form the knowledge graph of Clause 1.1 (cash floor), Clause 2.1 (auto-replenishment < £500), Clause 2.2 (manager approval > £1,000), Clause 3.1 (bank change cooling hold).

### Step 3: The Agent Runtime (OpenAI + AI SDK)
* Build the `investigateAndPropose` agent function.
* Provide the agent with `getStoreContext` and `checkPolicy` tools.
* Validate structured proposal output using Zod.

### Step 4: The Deterministic Membrane & Stripe Test Transfer
* Build `evaluatePolicy(proposal)`.
* Build `executeStripeTransfer(proposal)` with idempotency key `idem_po_{id}`.
* Build the Stripe webhook endpoint to capture settlement.

### Step 5: The Generative UI Canvas (Next.js 15)
* Build the ambient horizon bar (cash balance & runway).
* Build the interactive inventory sheet with visual stock cover bars.
* Build the generative Decision Card with the 1-click authorization slider.
* Build the Cognee "Why Did You Pay This?" graph inspector.

---

## 6. What I Need From You to Start Step 1

To kick off the build immediately, please provide or confirm:

1. **Supabase Database URL**:
   Your Postgres connection string from your Supabase dashboard:
   `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`
2. **OpenAI API Key**:
   Your `sk-proj-...` key.
3. **Stripe Test Secret Key**:
   Your `sk_test_...` key from the Stripe dashboard.
4. **Cognee Key** (or we start with local Cognee simulation / cloud key).

Once you share these keys (or place them in a `.env` file), we will immediately scaffold the project and execute Step 1!
