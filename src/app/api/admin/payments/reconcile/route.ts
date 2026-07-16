// POST /api/admin/payments/reconcile
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import { reconcilePayments } from '@/modules/payments/payment.service';

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { olderThanMinutes?: number };
  const olderThanMinutes =
    typeof body.olderThanMinutes === 'number' && body.olderThanMinutes > 0
      ? body.olderThanMinutes
      : 15;

  try {
    const result = await reconcilePayments(olderThanMinutes);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[admin/payments/reconcile]', message);

    if (
      message.includes('SAFERPAY_') ||
      message.includes('Saferpay') ||
      message.includes('Nedostaju Saferpay')
    ) {
      return NextResponse.json({ error: 'Saferpay nije konfiguriran' }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
