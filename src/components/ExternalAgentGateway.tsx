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
} from 'lucide-react';
import { toast } from 'sonner';

interface ExternalAgentGatewayProps {
  onRefreshData?: () => Promise<void>;
}

export const ExternalAgentGateway: React.FC<ExternalAgentGatewayProps> = ({ onRefreshData }) => {
  const [selectedAgent, setSelectedAgent] = useState<'arudno' | 'shopify' | 'claude'>('arudno');
  const [activeTool, setActiveTool] = useState<string>('get_store_telemetry');
  const [skuTarget, setSkuTarget] = useState<string>('SKU-104');
  const [customUnits, setCustomUnits] = useState<number>(32);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'python' | 'mcp'>('curl');

  const executeExternalTool = async (toolName: string, customArgs: any = {}) => {
    setIsRunning(true);
    setLastResponse(null);

    try {
      let args = customArgs;
      if (toolName === 'investigate_and_reorder_sku') {
        args = {
          skuId: skuTarget,
          directive: `External agent (${selectedAgent}) autonomous restock signal`,
          customQuantity: customUnits,
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

      const res = await fetch('/api/agent/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-ID': `${selectedAgent}-autonomous-client-v1`,
        },
        body: JSON.stringify({
          tool: toolName,
          arguments: args,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Execution failed');

      setLastResponse(data);
      toast.success(`Agent executed ${toolName} successfully!`);
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      toast.error(`Agent tool error: ${err.message}`);
      setLastResponse({ error: err.message });
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
  -H "X-Agent-ID: arudno-labs-agent-v1" \\
  -d '{
    "tool": "investigate_and_reorder_sku",
    "arguments": {
      "skuId": "SKU-104",
      "customQuantity": 32,
      "directive": "Autonomous weekend surge restocking"
    }
  }'`;

  const pythonSnippet = `import requests

# External Agent Dispatch to Tillwise FinOps
url = "http://localhost:3000/api/agent/tools"
payload = {
    "tool": "investigate_and_reorder_sku",
    "arguments": {
        "skuId": "SKU-104",
        "customQuantity": 32
    }
}
headers = {
    "Content-Type": "application/json",
    "X-Agent-ID": "arudno-supply-agent-v2"
}

response = requests.post(url, json=payload, headers=headers)
result = response.json()
print("Stripe Transfer & Cognee Proof:", result)`;

  const mcpSnippet = `{
  "mcpServers": {
    "tillwise-finops": {
      "command": "npx",
      "args": ["-y", "@tillwise/mcp-server"],
      "env": {
        "TILLWISE_ENDPOINT": "http://localhost:3000/api/agent/tools",
        "TILLWISE_API_KEY": "tw_live_test_key"
      }
    }
  }
}`;

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            External AI Agent Interoperability Gateway
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            How external agents (Arudno Labs, AutoGPT, ERP agents) autonomously interact, execute financial operations, and move money within deterministic guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/30 px-3 py-1.5 rounded-full text-xs font-medium text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>MCP & OpenAPI Protocol Active</span>
        </div>
      </div>

      {/* First Principles: How External AI Agents Operate (Human Out of the Loop) */}
      <div className="bg-gradient-to-br from-slate-900/90 to-slate-900/40 rounded-3xl p-6 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bot className="w-4 h-4 text-emerald-400" />
          First Principles: External Agent Interoperability Architecture
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          When an external AI agent (like <strong>Arudno Labs</strong> or a logistics optimization model) connects to Tillwise, it does not need human supervision. Tillwise acts as the <strong>Autonomous Financial Sandbox & Ledger</strong>:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/[0.04] space-y-2">
            <span className="text-[10px] font-mono text-sky-400 font-bold">STAGE 1: DISCOVERY</span>
            <p className="text-xs text-white font-bold">Standard Tool Schema</p>
            <p className="text-[11px] text-slate-400 leading-normal">
              External agent fetches machine-readable tool schemas via Model Context Protocol (MCP) or <code className="text-sky-300 font-mono">GET /api/agent/tools</code>.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/[0.04] space-y-2">
            <span className="text-[10px] font-mono text-amber-400 font-bold">STAGE 2: MANDATE ARBITER</span>
            <p className="text-xs text-white font-bold">Deterministic Enforcement</p>
            <p className="text-[11px] text-slate-400 leading-normal">
              Tillwise verifies the £5,000 cash buffer and pre-authorized spend limits. External agents cannot overspend or drain bank liquidity.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/[0.04] space-y-2">
            <span className="text-[10px] font-mono text-emerald-400 font-bold">STAGE 3: STRIPE EXECUTION</span>
            <p className="text-xs text-white font-bold">Money Movement Rails</p>
            <p className="text-[11px] text-slate-400 leading-normal">
              Tillwise executes real Stripe test payouts with cryptographic idempotency keys, releasing funds directly to verified vendor IBANs.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/[0.04] space-y-2">
            <span className="text-[10px] font-mono text-purple-400 font-bold">STAGE 4: COGNEE AUDIT</span>
            <p className="text-xs text-white font-bold">Immutable Causal Memory</p>
            <p className="text-[11px] text-slate-400 leading-normal">
              Every request and transfer is written to the Cognee Knowledge Graph, answering <em>"Why did this external agent pay this?"</em> for human auditors.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive External Agent Sandbox (Simulate External AI Interaction) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: External Agent Controls */}
        <div className="lg:col-span-5 bg-slate-900/60 rounded-3xl p-6 border border-white/[0.06] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Simulate External Agent
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Live Gateway
            </span>
          </div>

          {/* Select External Agent Identity */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">External Agent Identity</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedAgent('arudno')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-center ${
                  selectedAgent === 'arudno'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Arudno Labs
              </button>
              <button
                onClick={() => setSelectedAgent('shopify')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-center ${
                  selectedAgent === 'shopify'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ERP Agent
              </button>
              <button
                onClick={() => setSelectedAgent('claude')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-center ${
                  selectedAgent === 'claude'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Claude 3.7
              </button>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold text-slate-300 block">External Agent Actions:</span>

            {/* Action 1: Get Telemetry */}
            <button
              onClick={() => {
                setActiveTool('get_store_telemetry');
                executeExternalTool('get_store_telemetry');
              }}
              disabled={isRunning}
              className="w-full text-left p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-white/[0.04] hover:border-sky-500/30 transition-all flex items-center justify-between group disabled:opacity-50"
            >
              <div>
                <span className="text-xs font-bold text-sky-400 block group-hover:text-sky-300">
                  1. Query Telemetry & Safe Spend
                </span>
                <span className="text-[11px] text-slate-400">
                  Reads available cash, buffer, and SKU stock runout rates.
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
            </button>

            {/* Action 2: Autonomous Reorder & Stripe Disbursement */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-white/[0.04] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">
                  2. Autonomous Restock & Pay
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full">
                  Stripe Rail
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Target SKU</label>
                  <select
                    value={skuTarget}
                    onChange={(e) => setSkuTarget(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="SKU-104">SKU-104 (Cold Brew)</option>
                    <option value="SKU-101">SKU-101 (Oat Milk)</option>
                    <option value="SKU-102">SKU-102 (Filter Roast)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Quantity (Units)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={customUnits}
                    onChange={(e) => setCustomUnits(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTool('investigate_and_reorder_sku');
                  executeExternalTool('investigate_and_reorder_sku');
                }}
                disabled={isRunning}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {isRunning && activeTool === 'investigate_and_reorder_sku' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Mandate & Stripe...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Dispatch Agent Reorder ({customUnits} Units)</span>
                  </>
                )}
              </button>
            </div>

            {/* Action 3: Verify 3-Way Match & Fraud */}
            <button
              onClick={() => {
                setActiveTool('verify_and_match_invoice');
                executeExternalTool('verify_and_match_invoice');
              }}
              disabled={isRunning}
              className="w-full text-left p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-white/[0.04] hover:border-amber-500/30 transition-all flex items-center justify-between group disabled:opacity-50"
            >
              <div>
                <span className="text-xs font-bold text-amber-400 block group-hover:text-amber-300">
                  3. Verify Inbound Supplier Invoice
                </span>
                <span className="text-[11px] text-slate-400">
                  Tests PO-8821 3-way match & bank account anti-tamper cooling hold.
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </button>

            {/* Action 4: Query Cognee Causal Memory */}
            <button
              onClick={() => {
                setActiveTool('query_cognee_provenance');
                executeExternalTool('query_cognee_provenance');
              }}
              disabled={isRunning}
              className="w-full text-left p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-white/[0.04] hover:border-purple-500/30 transition-all flex items-center justify-between group disabled:opacity-50"
            >
              <div>
                <span className="text-xs font-bold text-purple-400 block group-hover:text-purple-300">
                  4. Query Cognee Causal Memory
                </span>
                <span className="text-[11px] text-slate-400">
                  Answers "Why did you pay this?" from knowledge graph nodes.
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Right Column: Live Output & Code Integration */}
        <div className="lg:col-span-7 space-y-5">
          {/* Live Agent Terminal Output */}
          <div className="bg-[#050811] rounded-3xl p-5 border border-white/[0.08] shadow-2xl font-mono space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>External Agent Response Stream</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>JSON-RPC / REST 200 OK</span>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto text-[11px] leading-relaxed text-emerald-300 p-2 bg-slate-950/80 rounded-xl border border-white/[0.04]">
              {isRunning ? (
                <div className="flex items-center gap-2 text-slate-400 py-6 justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Agent executing against live database, policy rules & Stripe rails...</span>
                </div>
              ) : lastResponse ? (
                <pre className="whitespace-pre-wrap">{JSON.stringify(lastResponse, null, 2)}</pre>
              ) : (
                <div className="text-slate-500 py-8 text-center italic font-sans text-xs">
                  Click any action on the left to simulate an external AI agent executing against Tillwise.
                </div>
              )}
            </div>
          </div>

          {/* Integration Snippets (cURL, Python, MCP) */}
          <div className="bg-slate-900/60 rounded-3xl p-5 border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                External Agent Client Code
              </span>

              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setCodeLanguage('curl')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    codeLanguage === 'curl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setCodeLanguage('python')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    codeLanguage === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setCodeLanguage('mcp')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    codeLanguage === 'mcp' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  MCP JSON
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="bg-slate-950 p-4 rounded-2xl text-[11px] font-mono text-slate-300 overflow-x-auto border border-white/[0.04]">
                {codeLanguage === 'curl' && curlSnippet}
                {codeLanguage === 'python' && pythonSnippet}
                {codeLanguage === 'mcp' && mcpSnippet}
              </pre>

              <button
                onClick={() => {
                  const text =
                    codeLanguage === 'curl'
                      ? curlSnippet
                      : codeLanguage === 'python'
                      ? pythonSnippet
                      : mcpSnippet;
                  copyToClipboard(text);
                }}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition-all text-xs flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
