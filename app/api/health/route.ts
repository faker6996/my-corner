import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_req: NextRequest) {
  const status: any = { ok: true, services: {} };
  try {
    const res = await query('SELECT 1');
    status.services.database = res?.rows ? 'up' : 'unknown';
  } catch (e: any) {
    status.ok = false;
    status.services.database = 'down';
    status.error = e?.message || 'DB error';
  }

  return NextResponse.json(status, { status: status.ok ? 200 : 500 });
}

