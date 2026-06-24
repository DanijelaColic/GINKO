// New — Stripe 3. Webhook endpoint with signature verification + idempotency.
// POST /api/webhooks/stripe
//
// Register in Stripe Dashboard → Webhooks → Add endpoint:
//   URL: https://your-domain/api/webhooks/stripe
//   Events:
//     checkout.session.completed
//     payment_intent.succeeded
//     payment_intent.payment_failed
//     checkout.session.expired
//     charge.refunded
//
// CRITICAL: Must read raw body (text) for Stripe signature verification.
// Do NOT use request.json() — it invalidates the signature.

import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, getStripeWebhookSecret } from '@/modules/payments/stripe.client';
import { insertWebhookEvent, markWebhookEventProcessed } from '@/modules/payments/payment.repository';
import { handleWebhookEvent } from '@/modules/payments/payment.service';

// App Router: request.text() vraća raw body (nema bodyParser config kao u Pages Routeru)
export async function POST(request: NextRequest) {
  // ── 1. Read raw body ─────────────────────────────────────────────
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: 'Cannot read body' }, { status: 400 });
  }

  // ── 2. Verify Stripe signature ───────────────────────────────────
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let webhookSecret: string;
  try {
    webhookSecret = getStripeWebhookSecret();
  } catch {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const stripe = getStripeClient();
  let event: ReturnType<typeof stripe.webhooks.constructEvent>;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[webhook] Signature verification failed:', msg);
    return NextResponse.json({ error: `Webhook signature invalid: ${msg}` }, { status: 400 });
  }

  // ── 3. Idempotency guard — insert webhook_events row ─────────────
  // insertWebhookEvent returns null if this stripe_event_id already exists.
  let webhookRow: { id: string } | null;
  try {
    webhookRow = await insertWebhookEvent({
      stripe_event_id: event.id,
      type: event.type,
      payload: event as unknown as Record<string, unknown>,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[webhook] Failed to insert webhook_event:', msg);
    // Return 500 so Stripe retries — but only if it's not a duplicate constraint error
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ received: true, note: 'duplicate' });
    }
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (webhookRow === null) {
    // Already processed — acknowledge immediately, no double-processing
    return NextResponse.json({ received: true, note: 'duplicate' });
  }

  // ── 4. Dispatch to handler ───────────────────────────────────────
  try {
    await handleWebhookEvent(event.type, event);
    await markWebhookEventProcessed(webhookRow.id);
    return NextResponse.json({ received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[webhook] Handler error for ${event.type}:`, msg);

    // Mark as failed — Stripe will retry (exponential backoff up to 3 days)
    await markWebhookEventProcessed(webhookRow.id, msg);

    // Return 500 to trigger Stripe retry for handler failures
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}
