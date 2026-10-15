import { NextRequest, NextResponse } from 'next/server';
import { performThreeWayMatch } from '@/lib/invoices/matcher';
import { db } from '@/lib/db';
import { purchaseOrders, suppliers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      poId,
      invoicedQuantity,
      invoicedAmountPence,
      receivedQuantity,
      invoiceBankSortCode,
      invoiceBankAccountNumber,
    } = body;

    let targetPoId = poId;

    // If no PO provided, grab the latest PO in DB or create a test one
    if (!targetPoId) {
      const [latestPo] = await db.select().from(purchaseOrders).limit(1);
      if (latestPo) {
        targetPoId = latestPo.id;
      } else {
        return NextResponse.json({ error: 'No purchase order found to match against. Run a replenishment first.' }, { status: 400 });
      }
    }

    const matchResult = await performThreeWayMatch({
      poId: targetPoId,
      invoicedQuantity: Number(invoicedQuantity),
      invoicedAmountPence: Number(invoicedAmountPence),
      receivedQuantity: Number(receivedQuantity),
      invoiceBankSortCode,
      invoiceBankAccountNumber,
    });

    return NextResponse.json(matchResult);
  } catch (err: any) {
    console.error('API Invoice Match error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
