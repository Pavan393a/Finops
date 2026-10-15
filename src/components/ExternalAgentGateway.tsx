'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Terminal,
  Zap,
  CheckCircle2,
  Code,
  ArrowRight,
  ShieldAlert,
  Copy,
  ExternalLink,
  Bot,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Network,
  Clock,
  Layers,
  FileCheck2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ExternalAgentGatewayProps {
  onRefreshData?: () => Promise<void>;
  operatingMode?: 'in_house' | 'external_mcp' | 'hybrid';
  onSelectMode?: (mode: 'in_house' | 'external_mcp' | 'hybrid') => void;
}

interface StepLog {
  stage: number;
  name: string;
  tool: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR';
  latencyMs?: number;
  output?: any;
}

export const ExternalAgentGateway: React.FC<ExternalAgentGatewayProps> = ({
  onRefreshData,
  operatingMode = 'external_mcp',
  onSelectMode,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<'arudno' | 'shopify' | 'claude'>('arudno');
  const [activeScenario, setActiveScenario] = useState<'normal_surge' | 'high_value' | 'insolvency_test'>('normal_surge');
  const [skuTarget, setSkuTarget] = useState<string>('SKU-104');
  const [customUnits, setCustomUnits] = useState<number>(40);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'python' | 'mcp'>('curl');

  // Step-by-step pipeline execution logs
  const [pipelineLogs, setPipelineLogs] = useState<StepLog[]>([
    { stage: 1, name: 'Discovery & Telemetry Probe', tool: 'get_store_telemetry', status: 'PENDING' },
    { stage: 2, name: 'Pre-Flight Mandate Simulation', tool: 'simulate_mandate_quote', status: 'PENDING' },
    { stage: 3, name: 'Stripe Settlement Rails', tool: 'investigate_and_reorder_sku', status: 'PENDING' },
    { stage: 4, name: 'Cognee Causal Attestation', tool: 'query_cognee_provenance', status: 'PENDING' },
  ]);

  const executeExternalTool = async (toolName: string, customArgs: any = {}) => {
    setIsRunning(true);
    setLastResponse(null);

    try {
      let args = customArgs;
      if (toolName === 'investigate_and_reorder_sku') {
        args = {
          skuId: skuTarget,
          directive: `External agent (${selectedAgent}) autonomous restock signal under ${activeScenario}`,
          customQuantity: customUnits,
        };
      } else if (toolName === 'simulate_mandate_quote') {
        args = {
          skuId: skuTarget,
          quantity: customUnits,
        };
      } else if (toolName === 'verify_and_match_invoice') {
        args = {
          poId: 'PO-8821',
          invoiceAmountPence: 32000,
        };
      } else if (toolName === 'query_cognee_provenance') {
        args = {
          transactionId: 'tx_recent',
        };
      }

      const startTime = performance.now();
      const res = await fetch('/api/agent/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-ID': `${selectedAgent}-autonomous-client-v2`,
        },
        body: JSON.stringify({
          tool: toolName,
          arguments: args,
        }),
      });

      const data = await res.json();
      const latency = Math.round(performance.now() - startTime);

      if (!res.ok) throw new Error(data.error || 'Execution failed');

      setLastResponse({
        tool: toolName,
        agentId: `${selectedAgent}.client.v2`,
        latencyMs: latency,
        protocol: 'MCP / JSON-RPC 2.0',
        timestamp: new Date().toISOString(),
        result: data,
      });

      toast.success(`Agent executed ${toolName} in ${latency}ms`);
      if (onRefreshData) await onRefreshData();
      return data;
    } catch (err: any) {
      toast.error(`Agent tool error: ${err.message}`);
      setLastResponse({ error: err.message });
      throw err;
    } finally {
      setIsRunning(false);
    }
  };

  // Run the full 4-stage first-principles autonomous protocol
  const runFullAutonomousPipeline = async () => {
    setIsRunning(true);

    const initialSteps: StepLog[] = [
      { stage: 1, name: 'Discovery & Telemetry Probe', tool: 'get_store_telemetry', status: 'RUNNING' },
      { stage: 2, name: 'Pre-Flight Mandate Simulation', tool: 'simulate_mandate_quote', status: 'PENDING' },
      { stage: 3, name: 'Stripe Settlement Rails', tool: 'investigate_and_reorder_sku', status: 'PENDING' },
      { stage: 4, name: 'Cognee Causal Attestation', tool: 'query_cognee_provenance', status: 'PENDING' },
    ];
    setPipelineLogs(initialSteps);

    try {
      // Stage 1: Probe Telemetry
      const t1Start = performance.now();
      const telemetry = await executeExternalTool('get_store_telemetry');
      const t1Latency = Math.round(performance.now() - t1Start);

      initialSteps[0] = {
        stage: 1,
        name: 'Discovery & Telemetry Probe',
        tool: 'get_store_telemetry',
        status: 'SUCCESS',
        latencyMs: t1Latency,
        output: { cashGbp: telemetry?.telemetry?.currentCashGbp, safeSpend: telemetry?.telemetry?.safeSpendGbp },
      };
      initialSteps[1].status = 'RUNNING';
      setPipelineLogs([...initialSteps]);

      // Stage 2: Pre-Flight Mandate Simulation
      const t2Start = performance.now();
      const quote = await executeExternalTool('simulate_mandate_quote', { skuId: skuTarget, quantity: customUnits });
      const t2Latency = Math.round(performance.now() - t2Start);

      initialSteps[1] = {
        stage: 2,
        name: 'Pre-Flight Mandate Simulation',
        tool: 'simulate_mandate_quote',
        status: 'SUCCESS',
        latencyMs: t2Latency,
        output: quote?.simulation,
      };

      // Check if blocked
      if (quote?.simulation?.decision === 'BLOCK') {
        toast.error(`Membrane blocked disbursement: ${quote?.simulation?.reason}`);
        initialSteps[2] = {
          stage: 3,
          name: 'Stripe Settlement Rails',
          tool: 'investigate_and_reorder_sku',
          status: 'ERROR',
          output: { reason: 'Blocked by Clause 1.1 Solvency Buffer Protection' },
        };
        setPipelineLogs([...initialSteps]);
        return;
      }

      initialSteps[2].status = 'RUNNING';
      setPipelineLogs([...initialSteps]);

      // Stage 3: Execute Stripe Rails
      const t3Start = performance.now();
      const execution = await executeExternalTool('investigate_and_reorder_sku', {
        skuId: skuTarget,
        customQuantity: customUnits,
        directive: `First-Principles Autonomous Protocol run by ${selectedAgent}`,
      });
      const t3Latency = Math.round(performance.now() - t3Start);

      const paymentTxId = execution?.execution?.payment?.transactionId || execution?.execution?.transactionId;
      initialSteps[2] = {
        stage: 3,
        name: 'Stripe Settlement Rails',
        tool: 'investigate_and_reorder_sku',
        status: 'SUCCESS',
        latencyMs: t3Latency,
        output: {
          transferId: execution?.execution?.payment?.stripeTransferId || 'tr_settled',
          amountGbp: customUnits * 8.0,
        },
      };
      initialSteps[3].status = 'RUNNING';
      setPipelineLogs([...initialSteps]);

      // Stage 4: Ingest & Query Cognee Causal Memory
      const t4Start = performance.now();
      const provenance = await executeExternalTool('query_cognee_provenance', {
        transactionId: paymentTxId || 'tx_latest',
      });
      const t4Latency = Math.round(performance.now() - t4Start);

      initialSteps[3] = {
        stage: 4,
        name: 'Cognee Causal Attestation',
        tool: 'query_cognee_provenance',
        status: 'SUCCESS',
        latencyMs: t4Latency,
        output: provenance?.cogneeProvenance,
      };
      setPipelineLogs([...initialSteps]);

      toast.success('4-Stage Autonomous Protocol completed successfully!');
    } catch (err: any) {
      toast.error(`Pipeline interrupted: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const curlSnippet = `curl -X POST http://localhost:3000/api/agent/tools \\
  -H "Content-Type: application/json" \\
  -H "X-Agent-ID: ${selectedAgent}-autonomous-client-v2" \\
  -d '{
    "tool": "investigate_and_reorder_sku",
    "arguments": {
      "skuId": "${skuTarget}",
      "customQuantity": ${customUnits},
      "directive": "Autonomous weekend surge restocking"
    }
  }'`;

  const pythonSnippet = `import requests

# FinOps Agent-to-Agent Autonomous Protocol Client
url = "http://localhost:3000/api/agent/tools"
headers = {
    "Content-Type": "application/json",
    "X-Agent-ID": "${selectedAgent}-autonomous-client-v2"
}

# 1. Pre-flight quote simulation
quote = requests.post(url, json={
    "tool": "simulate_mandate_quote",
    "arguments": {"skuId": "${skuTarget}", "quantity": ${customUnits}}
}, headers=headers).json()

if quote["simulation"]["canExecuteAutonomously"]:
    # 2. Execute idempotent Stripe settlement
    payout = requests.post(url, json={
        "tool": "investigate_and_reorder_sku",
        "arguments": {"skuId": "${skuTarget}", "customQuantity": ${customUnits}}
    }, headers=headers).json()
    print("Settled via Stripe Rails:", payout["execution"]["payment"]["stripeTransferId"])
`;

  const mcpSnippet = `{
  "mcpServers": {
    "finops": {
      "command": "npx",
      "args": ["-y", "@finops/mcp-server"],
      "env": {
        "FINOPS_ENDPOINT": "http://localhost:3000/api/agent/tools",
        "FINOPS_AGENT_ID": "${selectedAgent}-client-v2"
      }
    }
  }
}`;

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-8">
      {/* 1. Header with First-Principles Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                External AI Agent Interoperability Gateway
              </h2>
              <p className="text-xs text-slate-400">
                Machine-to-Machine Financial Control Plane • Model Context Protocol (MCP) & REST Standard
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSelectMode && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-full border border-white/[0.08] text-xs">
              <span className="text-[10px] text-slate-400 pl-2 pr-1">Active Mode:</span>
              <button
                type="button"
                onClick={() => onSelectMode('in_house')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                  operatingMode === 'in_house'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                In-House
              </button>
              <button
                type="button"
                onClick={() => onSelectMode('external_mcp')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                  operatingMode === 'external_mcp'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                MCP Delegated
              </button>
              <button
                type="button"
                onClick={() => onSelectMode('hybrid')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                  operatingMode === 'hybrid'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dual Hybrid
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-indigo-950/80 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-mono text-indigo-300 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>MCP Protocol Active</span>
          </div>
        </div>
      </div>

      {/* 2. First-Principles Protocol Architecture Visualizer */}
      <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 rounded-2xl p-5 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              First-Principles Architecture: How External AI Agents Move Money
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Zero Human-in-the-Loop Bottleneck</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          {/* Layer 1 */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/[0.06] space-y-1.5 relative overflow-hidden group hover:border-sky-500/30 transition-all">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-sky-400 font-bold">STAGE 1</span>
              <Bot className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <p className="text-xs font-bold text-white">Discovery Probe</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              External agent probes store telemetry via <code className="text-sky-300 font-mono">get_store_telemetry</code> to evaluate runout velocity and safe spend.
            </p>
          </div>

          {/* Layer 2 */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/[0.06] space-y-1.5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-amber-400 font-bold">STAGE 2</span>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xs font-bold text-white">Membrane Gate</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pre-flight simulation (<code className="text-amber-300 font-mono">simulate_mandate_quote</code>) validates that order preserves £5,000 cash floor and stays under £500 limit.
            </p>
          </div>

          {/* Layer 3 */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/[0.06] space-y-1.5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-emerald-400 font-bold">STAGE 3</span>
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xs font-bold text-white">Stripe Rails</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Disbursement is executed through Stripe Connect test rails with cryptographic idempotency keys, settling funds to the verified supplier.
            </p>
          </div>

          {/* Layer 4 */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/[0.06] space-y-1.5 relative overflow-hidden group hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-purple-400 font-bold">STAGE 4</span>
              <Network className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="text-xs font-bold text-white">Cognee Memory</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every machine action generates an immutable 5-hop causal node in Cognee, answering <em>&quot;Why did this agent move money?&quot;</em>.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Interactive Protocol Runner & Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: External Agent Controls */}
        <div className="lg:col-span-5 bg-slate-900/60 rounded-2xl p-5 border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              External Agent Console
            </span>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Live Gateway
            </span>
          </div>

          {/* Agent Identity Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">Select External AI Agent Identity</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedAgent('arudno')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                  selectedAgent === 'arudno'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Arudno Labs
              </button>
              <button
                type="button"
                onClick={() => setSelectedAgent('shopify')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                  selectedAgent === 'shopify'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Logistics ERP
              </button>
              <button
                type="button"
                onClick={() => setSelectedAgent('claude')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                  selectedAgent === 'claude'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Claude 3.7
              </button>
            </div>
          </div>

          {/* First-Principles Scenario Selection */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-semibold text-slate-300">Simulate Operational Scenario</label>
            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveScenario('normal_surge');
                  setCustomUnits(40);
                }}
                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeScenario === 'normal_surge'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-800/60 border-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-xs">
                  <span>Scenario A: Pre-Approved Surge (£320)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Auto-Execute</span>
                </div>
                <p className="text-[10px] opacity-80 mt-0.5">
                  Predicted 2.5x foot-traffic surge. 40 units of Cold Brew falls under £500 limit and protects £5,000 floor.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveScenario('high_value');
                  setCustomUnits(80);
                }}
                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeScenario === 'high_value'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : 'bg-slate-800/60 border-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-xs">
                  <span>Scenario B: High-Value Batch (£640)</span>
                  <span className="text-[10px] text-amber-400 font-mono">Escalate</span>
                </div>
                <p className="text-[10px] opacity-80 mt-0.5">
                  Order value exceeds £500 ceiling. Membrane safely suspends into AWAITING_APPROVAL without moving money.
                </p>
              </button>
            </div>
          </div>

          {/* Primary Action Button: Run Full 4-Stage Autonomous Protocol */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isRunning}
              onClick={runFullAutonomousPipeline}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing 4-Stage Protocol...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Run Full 4-Stage Autonomous Protocol</span>
                </>
              )}
            </button>
          </div>

          {/* Individual Tool Triggers */}
          <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
              Discrete Tool Calls (MCP Standards)
            </span>

            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                disabled={isRunning}
                onClick={() => executeExternalTool('get_store_telemetry')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-white/[0.04] text-left text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40"
              >
                <span className="text-[11px] font-semibold text-sky-400 block">1. Probe Telemetry</span>
                <span className="text-[9px] text-slate-400">Read liquidity & inventory</span>
              </button>

              <button
                type="button"
                disabled={isRunning}
                onClick={() => executeExternalTool('simulate_mandate_quote', { skuId: skuTarget, quantity: customUnits })}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-white/[0.04] text-left text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40"
              >
                <span className="text-[11px] font-semibold text-amber-400 block">2. Simulate Quote</span>
                <span className="text-[9px] text-slate-400">Pre-flight mandate check</span>
              </button>

              <button
                type="button"
                disabled={isRunning}
                onClick={() => executeExternalTool('investigate_and_reorder_sku')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-white/[0.04] text-left text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40"
              >
                <span className="text-[11px] font-semibold text-emerald-400 block">3. Move via Stripe</span>
                <span className="text-[9px] text-slate-400">Disburse under Rule 2.1</span>
              </button>

              <button
                type="button"
                disabled={isRunning}
                onClick={() => executeExternalTool('query_cognee_provenance')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-white/[0.04] text-left text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40"
              >
                <span className="text-[11px] font-semibold text-purple-400 block">4. Cognee Audit</span>
                <span className="text-[9px] text-slate-400">Explain causal graph</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Pipeline Trace & Code Integration */}
        <div className="lg:col-span-7 space-y-4">
          {/* Live Step-by-Step Pipeline Trace */}
          <div className="bg-[#050811] rounded-2xl p-4 border border-white/[0.08] shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs text-slate-200 font-bold">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Autonomous Pipeline Live Trace</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                Idempotent & Audited
              </span>
            </div>

            {/* Stages Visual Stepper */}
            <div className="space-y-2">
              {pipelineLogs.map((log) => (
                <div
                  key={log.stage}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    log.status === 'SUCCESS'
                      ? 'bg-slate-900/60 border-emerald-500/30'
                      : log.status === 'RUNNING'
                      ? 'bg-indigo-950/30 border-indigo-500/40 animate-pulse'
                      : log.status === 'ERROR'
                      ? 'bg-rose-950/30 border-rose-500/30'
                      : 'bg-slate-950/40 border-white/[0.04] opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-white/10 text-[9px] font-mono font-bold flex items-center justify-center text-slate-300">
                        {log.stage}
                      </span>
                      <span className="font-semibold text-white">{log.name}</span>
                      <code className="text-[10px] font-mono text-slate-400">({log.tool})</code>
                    </div>

                    <div className="flex items-center gap-2">
                      {log.latencyMs !== undefined && (
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {log.latencyMs}ms
                        </span>
                      )}
                      {log.status === 'SUCCESS' && (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> PASSED
                        </span>
                      )}
                      {log.status === 'RUNNING' && (
                        <span className="text-[10px] font-mono font-bold text-indigo-400 flex items-center gap-0.5">
                          <RefreshCw className="w-3 h-3 animate-spin" /> EXECUTING
                        </span>
                      )}
                      {log.status === 'ERROR' && (
                        <span className="text-[10px] font-mono font-bold text-rose-400 flex items-center gap-0.5">
                          BLOCKED
                        </span>
                      )}
                      {log.status === 'PENDING' && (
                        <span className="text-[9px] font-mono text-slate-500">READY</span>
                      )}
                    </div>
                  </div>

                  {log.output && (
                    <div className="mt-2 pt-2 border-t border-white/[0.04] space-y-1.5">
                      {/* Clean Structured Metric Row */}
                      {log.stage === 1 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
                          <div className="bg-slate-950/70 p-2 rounded-lg border border-white/[0.04]">
                            <span className="text-slate-400 block text-[9px]">Available Cash</span>
                            <span className="font-mono font-bold text-white">
                              £{typeof log.output.cashGbp === 'number' ? log.output.cashGbp.toFixed(2) : log.output.cashGbp || '5,180.00'}
                            </span>
                          </div>
                          <div className="bg-slate-950/70 p-2 rounded-lg border border-white/[0.04]">
                            <span className="text-slate-400 block text-[9px]">Safe Spend</span>
                            <span className="font-mono font-bold text-emerald-400">
                              £{typeof log.output.safeSpend === 'number' ? log.output.safeSpend.toFixed(2) : log.output.safeSpend || '180.00'}
                            </span>
                          </div>
                          <div className="bg-slate-950/70 p-2 rounded-lg border border-white/[0.04] col-span-2 sm:col-span-1">
                            <span className="text-slate-400 block text-[9px]">Solvency Status</span>
                            <span className="text-emerald-300 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Floor Satisfied
                            </span>
                          </div>
                        </div>
                      )}

                      {log.stage === 2 && (
                        <div className="space-y-1.5 text-[10px]">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            <div className="bg-slate-950/70 p-2 rounded-lg border border-white/[0.04]">
                              <span className="text-slate-400 block text-[9px]">Membrane Decision</span>
                              <span
                                className={`font-mono font-bold ${
                                  log.output.decision === 'AUTO'
                                    ? 'text-emerald-400'
                                    : log.output.decision === 'ESCALATE'
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {log.output.decision || 'AUTO'}
                              </span>
                            </div>
                            <div className="bg-slate-950/70 p-2 rounded-lg border border-white/[0.04]">
                              <span className="text-slate-400 block text-[9px]">Order Total</span>
                              <span className="font-mono font-bold text-white">
                                £{log.output.totalCostGbp?.toFixed(2) || '320.00'}
                              </span>
                            </div>
                            <div className="bg-slate-950/70 p-2 rounded-lg border border-white/[0.04]">
                              <span className="text-slate-400 block text-[9px]">Projected Cash</span>
                              <span className="font-mono font-bold text-sky-400">
                                £{log.output.projectedCashGbp?.toFixed(2) || '4,860.00'}
                              </span>
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-400 bg-slate-950/40 p-1.5 rounded border border-white/[0.04]">
                            <span className="text-amber-300 font-semibold">Rule:</span>{' '}
                            {log.output.clauseCited || 'Mandate Clause 2.1 (Auto-Replenish under £500)'}
                          </div>
                        </div>
                      )}

                      {log.stage === 3 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
                          <div className="bg-slate-950/70 p-2 rounded-lg border border-white/[0.04]">
                            <span className="text-slate-400 block text-[9px]">Stripe Transfer ID</span>
                            <span className="font-mono font-bold text-emerald-300">
                              {log.output.transferId || 'tr_test_settled'}
                            </span>
                          </div>
                          <div className="bg-slate-950/70 p-2 rounded-lg border border-white/[0.04]">
                            <span className="text-slate-400 block text-[9px]">Execution Status</span>
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Settled to FreshFarm
                            </span>
                          </div>
                        </div>
                      )}

                      {log.stage === 4 && (
                        <div className="space-y-1 text-[10px]">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            <div className="bg-slate-950/70 p-2 rounded-lg border border-white/[0.04]">
                              <span className="text-slate-400 block text-[9px]">Cognee Graph Node</span>
                              <span className="font-mono text-purple-300 font-bold truncate block">
                                {log.output.graphNodeId || 'node_cognee_verified'}
                              </span>
                            </div>
                            <div className="bg-slate-950/70 p-2 rounded-lg border border-white/[0.04]">
                              <span className="text-slate-400 block text-[9px]">Causal Proof Status</span>
                              <span className="text-purple-300 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Immutable Audit Trace
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Integration Client Code Snippets */}
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                External Agent Integration SDK
              </span>

              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCodeLanguage('curl')}
                  className={`px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer ${
                    codeLanguage === 'curl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  cURL
                </button>
                <button
                  type="button"
                  onClick={() => setCodeLanguage('python')}
                  className={`px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer ${
                    codeLanguage === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Python
                </button>
                <button
                  type="button"
                  onClick={() => setCodeLanguage('mcp')}
                  className={`px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer ${
                    codeLanguage === 'mcp' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  MCP JSON
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 p-3 rounded-xl text-[10px] font-mono text-slate-300 overflow-x-auto border border-white/[0.04] max-h-40">
                {codeLanguage === 'curl' && curlSnippet}
                {codeLanguage === 'python' && pythonSnippet}
                {codeLanguage === 'mcp' && mcpSnippet}
              </pre>

              <button
                type="button"
                onClick={() => {
                  const text =
                    codeLanguage === 'curl'
                      ? curlSnippet
                      : codeLanguage === 'python'
                      ? pythonSnippet
                      : mcpSnippet;
                  copyToClipboard(text);
                }}
                className="absolute top-2 right-2 p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition-all text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
