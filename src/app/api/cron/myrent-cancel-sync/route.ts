/**
 * MyRent → Ginko otkazivanja (cron HTTP trigger).
 * Scheduler: Supabase pg_cron + pg_net (ne Vercel Cron / Hobby).
 *
 * Auth obavezan: Authorization Bearer CRON_SECRET
 * Ne pokrece Saferpay refund. Ne pise u MyRent.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { runMyRentInboundCancelSync } from '@/modules/myrent/myrent.inbound-cancel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runMyRentInboundCancelSync();
    console.info(
      '[cron/myrent-cancel-sync]',
      JSON.stringify({
        scanned: result.scanned,
        cancelled: result.cancelled,
        skipped: result.skipped,
        errors: result.errors,
      }),
    );
    return NextResponse.json({
      ok: true,
      ...result,
      // migrationPending: nema otkazivanja dok 019 nije u bazi
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/myrent-cancel-sync] failed:', message);
    return NextResponse.json(
      { ok: false, error: 'cron_failed' },
      { status: 500 },
    );
  }
}

/** POST: Supabase pg_net / ručni trigger (isti Bearer CRON_SECRET). */
export async function POST(request: NextRequest) {
  return GET(request);
}
