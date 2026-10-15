import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const { cashBufferFloorGbp } = await req.json();

    if (typeof cashBufferFloorGbp !== 'number' || cashBufferFloorGbp < 0) {
      return NextResponse.json({ error: 'Valid cashBufferFloorGbp is required' }, { status: 400 });
    }

    const [tenant] = await db.select().from(tenants).limit(1);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    await db
      .update(tenants)
      .set({
        cashBufferFloorGbp,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenant.id));

    return NextResponse.json({
      success: true,
      message: `Spending rule updated: Protected Cash Floor is now £${cashBufferFloorGbp.toLocaleString()}.`,
      cashBufferFloorGbp,
    });
  } catch (err: any) {
    console.error('Update rules error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
