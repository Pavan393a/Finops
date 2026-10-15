'use client';

import React, { useState } from 'react';
import {
  FileCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';

interface ThreeWayMatchLabProps {
  purchaseOrders: Array<{
    id: string;
    poNumber: string;
    quantity: number;
    totalAmountPence: number;
  }>;
}

export const ThreeWayMatchLab: React.FC<ThreeWayMatchLabProps> = ({ purchaseOrders }) => {
  const [selectedPoId, setSelectedPoId] = useState<string>(
    purchaseOrders[0]?.id || ''
  );
  const [scenario, setScenario] = useState<'MATCH' | 'SHORT' | 'FRAUD'>('SHORT');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const runTest = async (chosenScenario: 'MATCH' | 'SHORT' | 'FRAUD') => {
    setIsTesting(true);
    setScenario(chosenScenario);
    setTestResult(null);

    try {
      let body: any = {
        poId: selectedPoId || undefined,
      };

      if (chosenScenario === 'MATCH') {
        body = {
          ...body,
          invoicedQuantity: 20,
          invoicedAmountPence: 32000,
          receivedQuantity: 20,
          invoiceBankSortCode: '20-00-00',
          invoiceBankAccountNumber: '87654321',
        };
      } else if (chosenScenario === 'SHORT') {
        body = {
          ...body,
          invoicedQuantity: 100,
          invoicedAmountPence: 160000, // £1,600.00
          receivedQuantity: 90,        // 10 units shortfall!
          invoiceBankSortCode: '20-00-00',
          invoiceBankAccountNumber: '87654321',
        };
      } else if (chosenScenario === 'FRAUD') {
        body = {
          ...body,
          invoicedQuantity: 20,
          invoicedAmountPence: 32000,
          receivedQuantity: 20,
          invoiceBankSortCode: '99-88-77', // Mismatch!
          invoiceBankAccountNumber: '11223344',
        };
      }

      const res = await fetch('/api/invoices/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setTestResult(data);

      if (data.status === 'FRAUD_SUSPECTED') {
        toast.error('CRITICAL FRAUD ALERT: Bank details mismatch detected. Cooling freeze activated!');
      } else if (data.status === 'SHORT_PAID') {
        toast.warning('Short-payment authorized: Delivery discrepancy detected.');
      } else {
        toast.success('3-Way Match Verified! Invoice reconciled.');
      }
    } catch (err: any) {
      toast.error(`Test failed: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-sky-400" />
            3-Way Match & Fraud Defense Testing Lab
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-verifies Inbound Invoices against Purchase Orders and Delivery Receipts before disbursement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">Clause 4.1 & Clause 3.1</span>
        </div>
      </div>

      {/* Preset Scenario Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Test 1: Perfect Match */}
        <button
          type="button"
          onClick={() => runTest('MATCH')}
          disabled={isTesting}
          className={`p-4 rounded-xl border text-left transition-all ${
            scenario === 'MATCH' && testResult
              ? 'bg-emerald-950/40 border-emerald-500/50 glow-emerald'
              : 'bg-slate-900/60 border-white/[0.05] hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              1. Perfect Match
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">100% OK</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Ordered 20 units, Delivered 20 units, Invoiced £320.00. Reconciles and auto-approves.
          </p>
        </button>

        {/* Test 2: Delivery Shortfall (Short-Payment) */}
        <button
          type="button"
          onClick={() => runTest('SHORT')}
          disabled={isTesting}
          className={`p-4 rounded-xl border text-left transition-all ${
            scenario === 'SHORT' && testResult
              ? 'bg-amber-950/40 border-amber-500/50 glow-amber'
              : 'bg-slate-900/60 border-white/[0.05] hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              2. Delivery Shortfall
            </span>
            <span className="text-[10px] text-amber-400 font-mono">Short-Pay</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Invoiced for 100 units (£1,600) but only 90 arrived. Computes £1,440 short-payment + £160 debit note.
          </p>
        </button>

        {/* Test 3: Bank Details Change Attack */}
        <button
          type="button"
          onClick={() => runTest('FRAUD')}
          disabled={isTesting}
          className={`p-4 rounded-xl border text-left transition-all ${
            scenario === 'FRAUD' && testResult
              ? 'bg-rose-950/40 border-rose-500/50 glow-rose'
              : 'bg-slate-900/60 border-white/[0.05] hover:border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              3. Bank Change Attack
            </span>
            <span className="text-[10px] text-rose-400 font-mono">Clause 3.1</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Invoice header contains altered Sort Code (99-88-77). Triggers 3-day cooling hold & blocks payout.
          </p>
        </button>
      </div>

      {/* Result Card */}
      {testResult && (
        <div
          className={`p-5 rounded-xl border transition-all ${
            testResult.status === 'FRAUD_SUSPECTED'
              ? 'bg-rose-950/30 border-rose-500/40 glow-rose'
              : testResult.status === 'SHORT_PAID'
              ? 'bg-amber-950/30 border-amber-500/40 glow-amber'
              : 'bg-emerald-950/30 border-emerald-500/40 glow-emerald'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Match Engine Evaluation Result:
              </span>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  testResult.status === 'FRAUD_SUSPECTED'
                    ? 'bg-rose-900 text-rose-200'
                    : testResult.status === 'SHORT_PAID'
                    ? 'bg-amber-900 text-amber-200'
                    : 'bg-emerald-900 text-emerald-200'
                }`}
              >
                {testResult.status}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">{testResult.clauseCited}</span>
          </div>

          <p className="text-sm text-slate-200 mt-3 leading-relaxed">{testResult.notes}</p>

          {/* Mathematical breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-white/[0.06] text-xs">
            <div>
              <span className="text-slate-400 block">Authorized Amount:</span>
              <span className="font-bold text-white text-sm">
                £{(testResult.authorizedAmountPence / 100).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Discrepancy:</span>
              <span className="font-bold text-amber-400 text-sm">
                £{(testResult.discrepancyPence / 100).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Shortfall Units:</span>
              <span className="font-bold text-white text-sm">
                {testResult.discrepancyUnits} units
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Fraud Hold Status:</span>
              <span className="font-bold text-rose-400 text-sm">
                {testResult.status === 'FRAUD_SUSPECTED' ? 'ACTIVE (FROZEN)' : 'NONE'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
