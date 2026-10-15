import { NextResponse } from 'next/server';
import { syncMandateToCognee } from '@/lib/cognee/mandate';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await syncMandateToCognee();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('API Mandate Sync error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
