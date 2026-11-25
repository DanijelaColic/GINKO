/**
 * Neplaćene rezervacije: Assert pa oslobađanje termina.
 * Scheduler: Supabase pg_cron + pg_net (isti CRON_SECRET kao MyRent cancel).
 * Ne radi ručni admin klik. Ne piše u MyRent. Ne dira potvrđene rezervacije.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { runPaymentHoldRelease } from '@/modules/payments/payment-hold.job';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runPaymentHoldRelease();
    console.info('[cron/payment-hold-release]', JSON.stringify(result));
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/payment-hold-release] failed:', message);
    return NextResponse.json({ ok: false, error: 'cron_failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
