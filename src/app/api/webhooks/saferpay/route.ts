// GET|POST /api/webhooks/saferpay
//
// Saferpay calls SuccessNotifyUrl / FailNotifyUrl via HTTP GET.
// We put `oid` (our order id) in the URL at Initialize time — Saferpay
// does not append Token or payment data.
//
// Register in Initialize Notification container (automatic), not Merchant Portal.

import { NextRequest, NextResponse } from 'next/server';
import { insertWebhookEvent, markWebhookEventProcessed } from '@/modules/payments/payment.repository';
import { handleSaferpayNotify } from '@/modules/payments/payment.service';

async function processNotify(orderId: string, result: string | null) {
  const eventId = `saferpay_${orderId}_${result ?? 'unknown'}`;

  let webhookRow: { id: string } | null;
  try {
    webhookRow = await insertWebhookEvent({
      provider_event_id: eventId,
      type: result === 'fail' ? 'saferpay.notify.fail' : 'saferpay.notify.success',
      payload: { orderId, result },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ received: true, note: 'duplicate' });
    }
    console.error('[webhook/saferpay] Failed to insert webhook_event:', msg);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  // insertWebhookEvent returns null on duplicate provider_event_id — rare with timestamp.
  // Still process notify (idempotent Assert/Capture).
  try {
    await handleSaferpayNotify({ orderId, result });
    if (webhookRow) await markWebhookEventProcessed(webhookRow.id);
    return NextResponse.json({ received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[webhook/saferpay] Handler error:', msg);
    if (webhookRow) await markWebhookEventProcessed(webhookRow.id, msg);
    // Saferpay retries on non-200 — return 200 only if we want to stop retries.
    // Transient errors → 500 so Saferpay retries.
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
