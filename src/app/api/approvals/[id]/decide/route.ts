import { NextRequest, NextResponse } from 'next/server';
import { executeHumanApproval } from '@/lib/agent/orchestrator';
import { db } from '@/lib/db';
import { agentRuns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    if (!id) {
      return NextResponse.json({ error: 'Agent run ID is required' }, { status: 400 });
    }

    if (action === 'REJECT') {
      await db
        .update(agentRuns)
        .set({ status: 'REJECTED' })
        .where(eq(agentRuns.id, id));

      return NextResponse.json({
        success: true,
        message: 'Order proposal rejected by store manager. Run marked REJECTED.',
      });
    }

    if (action === 'APPROVE') {
      const paymentResult = await executeHumanApproval(id);
      return NextResponse.json({
        success: true,
        message: 'Order proposal approved and authorized. Stripe test transfer executed.',
        payment: paymentResult,
      });
    }

    return NextResponse.json({ error: 'Invalid action. Must be APPROVE or REJECT' }, { status: 400 });
  } catch (err: any) {
    console.error('API Decide error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
