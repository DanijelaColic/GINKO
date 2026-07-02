// POST /api/webhooks/worldline
//
// Register in Worldline Merchant Portal → Webhooks:
//   URL: https://your-domain/api/webhooks/worldline
//   Events: payment.*, refund.*
//
// GET with X-GCS-Webhooks-Endpoint-Verification — endpoint verification handshake.

import { NextRequest, NextResponse } from 'next/server';
import { getWorldlineWebhooksHelper } from '@/modules/payments/worldline.client';
import { insertWebhookEvent, markWebhookEventProcessed } from '@/modules/payments/payment.repository';
import { handleWorldlineWebhookEvent } from '@/modules/payments/payment.service';

export async function GET(request: NextRequest) {
  const verification = request.headers.get('X-GCS-Webhooks-Endpoint-Verification');
  if (!verification) {
    return NextResponse.json({ error: 'Missing verification header' }, { status: 400 });
  }
  return new NextResponse(verification, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

export async function POST(request: NextRequest) {
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: 'Cannot read body' }, { status: 400 });
  }

  let helper;
  try {
    helper = getWorldlineWebhooksHelper();
  } catch {
    console.error('[webhook/worldline] Webhook keys not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event;
  try {
    event = await helper.unmarshal(body, headers);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[webhook/worldline] Signature verification failed:', msg);
    return NextResponse.json({ error: `Webhook signature invalid: ${msg}` }, { status: 400 });
  }

  const eventId = event.id ?? `unknown_${Date.now()}`;

  let webhookRow: { id: string } | null;
  try {
    webhookRow = await insertWebhookEvent({
      provider_event_id: eventId,
      type: event.type ?? 'unknown',
      payload: event as unknown as Record<string, unknown>,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ received: true, note: 'duplicate' });
    }
    console.error('[webhook/worldline] Failed to insert webhook_event:', msg);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (webhookRow === null) {
    return NextResponse.json({ received: true, note: 'duplicate' });
  }

  try {
    await handleWorldlineWebhookEvent(event);
    await markWebhookEventProcessed(webhookRow.id);
    return NextResponse.json({ received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[webhook/worldline] Handler error for ${event.type}:`, msg);
    await markWebhookEventProcessed(webhookRow.id, msg);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}
