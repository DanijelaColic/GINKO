// GET|POST /api/webhooks/saferpay
//
// Saferpay calls SuccessNotifyUrl / FailNotifyUrl via HTTP GET.
// We put `oid` (our order id) in the URL at Initialize time — Saferpay
// does not append Token or payment data.
//
// Register in Initialize Notification container (automatic), not Merchant Portal.
//
// Idempotencija: isti provider_event_id → postojeći webhook red; syncSaferpayPayment
// short-circuit ako je intent već succeeded; confirm samo dok je booking pending.
//
import { NextRequest, NextResponse } from 'next/server';
import { insertWebhookEvent, markWebhookEventProcessed } from '@/modules/payments/payment.repository';
import { handleSaferpayNotify } from '@/modules/payments/payment.service';
import { formatSafeErrorMessage } from '@/modules/payments/safe-error';

// Assert/Capture + await MyRent sync može trajati dulje od default serverless limita.
export const maxDuration = 60;

async function processNotify(orderId: string, result: string | null) {
  const eventId = `saferpay_${orderId}_${result ?? 'unknown'}`;

  let webhookRow: { id: string };
  try {
    webhookRow = await insertWebhookEvent({
      provider_event_id: eventId,
      type: result === 'fail' ? 'saferpay.notify.fail' : 'saferpay.notify.success',
      // Samo oid + result — bez PII / kartica / tajni
      payload: { orderId, result },
    });
  } catch (err) {
    const msg = formatSafeErrorMessage(err);
    if (/unique|duplicate|23505/i.test(msg)) {
      return NextResponse.json({ received: true, note: 'duplicate' });
    }
    console.error('[webhook/saferpay] Failed to insert webhook_event:', msg);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  try {
    await handleSaferpayNotify({ orderId, result });
    await markWebhookEventProcessed(webhookRow.id);
    return NextResponse.json({ received: true });
  } catch (err) {
    const msg = formatSafeErrorMessage(err);
    console.error('[webhook/saferpay] Handler error:', msg);
    await markWebhookEventProcessed(webhookRow.id, msg);
    // Transient → 500 da Saferpay retrya; handler je idempotentan
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('oid');
  const result = request.nextUrl.searchParams.get('result');

  if (!orderId) {
    return NextResponse.json({ error: 'Missing oid' }, { status: 400 });
  }

  return processNotify(orderId, result);
}

export async function POST(request: NextRequest) {
  const orderId =
    request.nextUrl.searchParams.get('oid') ??
    ((await request.json().catch(() => ({}))) as { oid?: string }).oid;

  if (!orderId) {
    return NextResponse.json({ error: 'Missing oid' }, { status: 400 });
  }

  const result = request.nextUrl.searchParams.get('result');
  return processNotify(orderId, result);
}
