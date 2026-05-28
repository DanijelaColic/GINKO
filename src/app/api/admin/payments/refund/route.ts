// New — Stripe 5. Admin refund action.
// POST /api/admin/payments/refund
//
// Body:
//   paymentIntentId  string   — our DB UUID (payment_intents.id)
//   amountCents?     number   — partial refund amount; omit for full remaining
//   reason?          string   — 'requested_by_customer' | 'duplicate' | 'fraudulent'
//
// Idempotency: Stripe idempotency key + UNIQUE stripe_charge_id in payment_transactions
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import { issueRefund } from '@/modules/payments/payment.service';

const VALID_REASONS = new Set(['requested_by_customer', 'duplicate', 'fraudulent']);

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { paymentIntentId, amountCents, reason } = (await request.json()) as {
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
  if (reason && !VALID_REASONS.has(reason)) {
    return NextResponse.json(
      { error: 'reason mora biti: requested_by_customer | duplicate | fraudulent' },
      { status: 400 },
    );
  }

  try {
    const result = await issueRefund({
      paymentIntentDbId: paymentIntentId,
      amountCents,
      reason: reason as 'duplicate' | 'fraudulent' | 'requested_by_customer' | undefined,
    });

    if (result.alreadyRefunded) {
      return NextResponse.json({ ok: false, note: 'Već je u potpunosti vraćen' });
    }

    return NextResponse.json({
      ok: true,
      stripeRefundId: result.stripeRefundId,
      amountCents: result.amountCents,
      currency: result.currency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[admin/payments/refund]', message);

    if (message.includes('STRIPE_SECRET_KEY') || message.includes('No API key')) {
      return NextResponse.json({ error: 'Stripe nije konfiguriran' }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
