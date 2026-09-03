// POST /api/admin/payments/refund
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import { issueRefund } from '@/modules/payments/payment.service';

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { paymentIntentId, amountCents } = (await request.json()) as {
    paymentIntentId?: string;
    amountCents?: number;
    reason?: string;
  };

  if (!paymentIntentId) {
    return NextResponse.json({ error: 'Nedostaje paymentIntentId' }, { status: 400 });
  }
  if (amountCents !== undefined && (typeof amountCents !== 'number' || amountCents <= 0)) {
    return NextResponse.json({ error: 'amountCents mora biti pozitivan broj' }, { status: 400 });
  }

  try {
    const result = await issueRefund({
      paymentIntentDbId: paymentIntentId,
      amountCents,
    });

    if (result.alreadyRefunded) {
      return NextResponse.json({ ok: false, note: 'Već je u potpunosti vraćen' });
    }

    return NextResponse.json({
      ok: true,
      providerRefundId: result.providerRefundId,
      amountCents: result.amountCents,
      currency: result.currency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[admin/payments/refund]', message);

    if (
      message.includes('SAFERPAY_') ||
      message.includes('Saferpay') ||
      message.includes('Nedostaju Saferpay')
    ) {
      return NextResponse.json({ error: 'Saferpay nije konfiguriran' }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
