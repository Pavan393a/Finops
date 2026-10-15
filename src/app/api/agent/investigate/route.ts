import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { triggerOrchestrationPipeline } from '@/lib/agent/orchestrator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { skuId, customQuantity, directive } = body;

    if (!skuId) {
      return NextResponse.json({ error: 'skuId is required' }, { status: 400 });
    }

    // Get tenant
    const [tenant] = await db.select().from(tenants).limit(1);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant record not found. Please run seed.' }, { status: 404 });
    }

    const result = await triggerOrchestrationPipeline({
      tenantId: tenant.id,
      skuId,
      customQuantity: customQuantity ? parseInt(customQuantity, 10) : undefined,
      triggerEvent: directive ? 'OPERATOR_DIRECTIVE' : 'STOCKOUT_ALERT',
      directive,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('API Investigate error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
