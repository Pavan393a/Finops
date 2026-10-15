import { db } from '../db';
import { invoices, purchaseOrders, suppliers, skus } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface ThreeWayMatchInput {
  invoiceId?: string;
  poId: string;
  invoicedQuantity: number;
  invoicedAmountPence: number;
  receivedQuantity: number;
  invoiceBankSortCode?: string;
  invoiceBankAccountNumber?: string;
}

export interface ThreeWayMatchResult {
  status: 'MATCHED' | 'DISPUTED' | 'SHORT_PAID' | 'FRAUD_SUSPECTED';
  isMatched: boolean;
  authorizedAmountPence: number;
  discrepancyPence: number;
  discrepancyUnits: number;
  notes: string;
  clauseCited: string;
  fraudAlert?: string;
}

/**
 * Three-Way Match Engine (PO ↔ Delivery Receipt ↔ Inbound Invoice)
 * Evaluates Clause 4.1 & Clause 3.1
 */
export async function performThreeWayMatch(input: ThreeWayMatchInput): Promise<ThreeWayMatchResult> {
  // 1. Fetch Purchase Order
  const [po] = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.id, input.poId))
    .limit(1);

  if (!po) {
    throw new Error(`Purchase order ${input.poId} not found`);
  }

  // 2. Fetch Supplier
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, po.supplierId))
    .limit(1);

  if (!supplier) {
    throw new Error(`Supplier for PO ${po.poNumber} not found`);
  }

  // 3. Check Bank Details Integrity (Clause 3.1 Anti-Fraud)
  if (
    (input.invoiceBankSortCode && input.invoiceBankSortCode !== supplier.bankSortCode) ||
    (input.invoiceBankAccountNumber && input.invoiceBankAccountNumber !== supplier.bankAccountNumber)
  ) {
    // Flag supplier into cooling period immediately
    await db
      .update(suppliers)
      .set({
        isInCoolingPeriod: true,
        bankDetailsLastChangedAt: new Date(),
      })
      .where(eq(suppliers.id, supplier.id));

    return {
      status: 'FRAUD_SUSPECTED',
      isMatched: false,
      authorizedAmountPence: 0,
      discrepancyPence: input.invoicedAmountPence,
      discrepancyUnits: 0,
      notes: `CRITICAL FRAUD ALERT: Inbound invoice specifies Sort Code ${input.invoiceBankSortCode} / Acc ${input.invoiceBankAccountNumber}, mismatching verified supplier profile (${supplier.bankSortCode} / ${supplier.bankAccountNumber}). Cooling period activated. Payout locked.`,
      clauseCited: 'Mandate v1.0, Clause 3.1 (Anti-Fraud & Bank Details Cooling Period)',
      fraudAlert: 'Bank details mismatch detected between invoice header and verified vendor profile.',
    };
  }

  // 4. Check Quantities and Pricing (Clause 4.1)
  const unitPricePence = Math.round(po.totalAmountPence / po.quantity);
  const receivedQuantity = input.receivedQuantity;
  const invoicedQuantity = input.invoicedQuantity;

  // Case A: Perfect Match
  if (invoicedQuantity === po.quantity && receivedQuantity === po.quantity && input.invoicedAmountPence === po.totalAmountPence) {
    return {
      status: 'MATCHED',
      isMatched: true,
      authorizedAmountPence: po.totalAmountPence,
      discrepancyPence: 0,
      discrepancyUnits: 0,
      notes: `3-Way Match Verified: Ordered ${po.quantity} units, Delivered ${receivedQuantity} units, Invoiced £${(input.invoicedAmountPence / 100).toFixed(2)}. Fully reconciled under Clause 4.1.`,
      clauseCited: 'Mandate v1.0, Clause 4.1 (Three-Way Match Verification)',
    };
  }

  // Case B: Delivery Shortfall (e.g. Invoiced for 100 units, but only 90 delivered)
  if (receivedQuantity < invoicedQuantity) {
    const discrepancyUnits = invoicedQuantity - receivedQuantity;
    const authorizedAmountPence = receivedQuantity * unitPricePence;
    const discrepancyPence = input.invoicedAmountPence - authorizedAmountPence;

    return {
      status: 'SHORT_PAID',
      isMatched: false,
      authorizedAmountPence,
      discrepancyPence,
      discrepancyUnits,
      notes: `Discrepancy Detected: Invoiced for ${invoicedQuantity} units (£${(input.invoicedAmountPence / 100).toFixed(2)}), but delivery receipt confirms only ${receivedQuantity} units received (${discrepancyUnits} units shortfall). Recommending automated short-payment of £${(authorizedAmountPence / 100).toFixed(2)} with £${(discrepancyPence / 100).toFixed(2)} credit debit note.`,
      clauseCited: 'Mandate v1.0, Clause 4.1 (Short-Payment on Delivery Discrepancy)',
    };
  }

  // Case C: Overbilling Discrepancy
  const expectedPence = receivedQuantity * unitPricePence;
  if (input.invoicedAmountPence > expectedPence) {
    return {
      status: 'DISPUTED',
      isMatched: false,
      authorizedAmountPence: 0,
      discrepancyPence: input.invoicedAmountPence - expectedPence,
      discrepancyUnits: 0,
      notes: `Price Discrepancy: Invoice total £${(input.invoicedAmountPence / 100).toFixed(2)} exceeds agreed contract unit price rate (£${(expectedPence / 100).toFixed(2)}). Disputed under Clause 4.1.`,
      clauseCited: 'Mandate v1.0, Clause 4.1 (Three-Way Match Contract Price Dispute)',
    };
  }

  return {
    status: 'MATCHED',
    isMatched: true,
    authorizedAmountPence: input.invoicedAmountPence,
    discrepancyPence: 0,
    discrepancyUnits: 0,
    notes: 'Reconciled successfully.',
    clauseCited: 'Mandate v1.0, Clause 4.1',
  };
}
