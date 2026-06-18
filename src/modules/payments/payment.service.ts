// Payment service — Stripe 2 (checkout session) + Stripe 3 (webhook handlers).

import type Stripe from 'stripe';
import { getStripeClient } from './stripe.client';
import {
  createPaymentIntentRecord,
  getPaymentIntentByBookingId,
  getPaymentIntentByStripeId,
  getPaymentIntentByCheckoutSessionId,
  updatePaymentIntentStatus,
  createTransactionRecord,
  updateBookingPaymentState,
  getTransactionsByPaymentIntentId,
  getAmbiguousPaymentIntents,
} from './payment.repository';
import { createServerSupabaseClient } from '@/lib/supabase';
import { eurToCents } from './payment.types';
import type {
  CreatePaymentIntentInput,
  PaymentIntentResult,
  PaymentStatus,
} from './payment.types';
import { getSiteUrl } from '@/lib/siteUrl';

// ── Create Checkout Session ───────────────────────────────────────

/**
 * Create a Stripe Checkout Session for a booking deposit.
 * Returns the session URL for client-side redirect.
 * Persists a payment_intents row with the Stripe PaymentIntent ID.
 * Amount comes from `input.amount_cents` — API route derives it from DB.
 */
export async function createCheckoutSession(
  input: CreatePaymentIntentInput & { returnBasePath: string },
): Promise<{ url: string } & PaymentIntentResult> {
  const stripe = getStripeClient();
  const siteUrl = getSiteUrl();

  const successUrl = `${siteUrl}${input.returnBasePath}&payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl  = `${siteUrl}${input.returnBasePath}&payment=cancelled`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    currency: (input.currency ?? 'eur').toLowerCase(),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: (input.currency ?? 'eur').toLowerCase(),
          unit_amount: input.amount_cents,
          product_data: {
            name: 'Depozit za rezervaciju',
            description: `Booking ID: ${input.booking_id}`,
          },
        },
      },
    ],
    payment_intent_data: {
      metadata: {
        booking_id: input.booking_id,
        payment_type: input.metadata?.payment_type ?? 'deposit',
        ...(input.metadata ?? {}),
      },
    },
    metadata: {
      booking_id: input.booking_id,
      payment_type: input.metadata?.payment_type ?? 'deposit',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    throw new Error('Stripe nije vratio URL za plaćanje');
  }

  const stripePaymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? session.id;

  const record = await createPaymentIntentRecord({
    booking_id: input.booking_id,
    stripe_payment_intent_id: stripePaymentIntentId,
    amount: input.amount_cents,
    currency: (input.currency ?? 'eur').toLowerCase(),
    status: 'requires_payment_method',
    client_secret: null,
    metadata: {
      checkout_session_id: session.id,
      payment_type: input.metadata?.payment_type ?? 'deposit',
    },
  });

  return {
    url: session.url,
    id: record.id,
    stripe_payment_intent_id: stripePaymentIntentId,
    client_secret: record.client_secret ?? '',
    amount: record.amount,
    currency: record.currency,
    status: record.status,
  };
}

// ── Create Payment Intent for Stripe Elements (inline form) ──────

/**
 * Create a Stripe PaymentIntent and return its client_secret for use
 * with Stripe Elements on the confirmation page (no redirect needed).
 * Persists a payment_intents row — webhooks handle confirmation.
 */
export async function createPaymentIntentForElements(
  input: CreatePaymentIntentInput,
): Promise<{ clientSecret: string } & PaymentIntentResult> {
  const stripe = getStripeClient();

  const pi = await stripe.paymentIntents.create({
    amount: input.amount_cents,
    currency: (input.currency ?? 'eur').toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata: {
      booking_id: input.booking_id,
      payment_type: input.metadata?.payment_type ?? 'deposit',
      ...(input.metadata ?? {}),
    },
  });

  if (!pi.client_secret) {
    throw new Error('Stripe nije vratio client_secret za PaymentIntent');
  }

  const record = await createPaymentIntentRecord({
    booking_id: input.booking_id,
    stripe_payment_intent_id: pi.id,
    amount: input.amount_cents,
    currency: (input.currency ?? 'eur').toLowerCase(),
    status: 'requires_payment_method',
    client_secret: pi.client_secret,
    metadata: {
      payment_type: input.metadata?.payment_type ?? 'deposit',
    },
  });

  return {
    clientSecret: pi.client_secret,
    id: record.id,
    stripe_payment_intent_id: pi.id,
    client_secret: pi.client_secret,
    amount: record.amount,
    currency: record.currency,
    status: record.status,
  };
}

// ── Get Payment Status ────────────────────────────────────────────

export async function getPaymentStatus(bookingId: string): Promise<PaymentStatus | null> {
  const record = await getPaymentIntentByBookingId(bookingId);
  if (!record) return null;

  return {
    booking_id: bookingId,
    intent_status: record.status,
    amount: record.amount,
    currency: record.currency,
    last_transaction_status: null,
  };
}

// Alias kept for index.ts re-export compatibility
export async function createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
  const siteUrl = getSiteUrl();
  return createCheckoutSession({
    ...input,
    returnBasePath: `/booking/confirmation/${input.booking_id}?token=`,
  }).then((r) => ({ ...r, url: `${siteUrl}${r.url}` }))
    .catch(() => { throw new Error('createPaymentIntent: use createCheckoutSession directly'); });
}

// ── Webhook event handlers ────────────────────────────────────────
//
// Each handler is idempotent. The outer route calls insertWebhookEvent first,
// which returns null on duplicate stripe_event_id → the route short-circuits.
// Handlers may still run again if the server crashes mid-handler and Stripe
// retries; all DB operations here are therefore safe to repeat.

/**
 * Route a verified Stripe webhook event to the appropriate handler.
 * Idempotency is guaranteed by the caller (insertWebhookEvent checks stripe_event_id).
 *
 * Event → state mapping:
 *
 *  checkout.session.completed    → payment_intents: succeeded
 *                                  bookings: confirmed (if pending), deposit_paid: true
 *                                  payment_transactions: charge/succeeded
 *
 *  payment_intent.succeeded      → payment_intents: succeeded
 *                                  bookings: confirmed (if pending), deposit_paid: true
 *                                  payment_transactions: charge/succeeded
 *
 *  payment_intent.payment_failed → payment_intents: requires_payment_method
 *                                  payment_transactions: charge/failed
 *
 *  checkout.session.expired      → payment_intents: cancelled
 *                                  (booking stays pending — session expired ≠ booking cancelled)
 *
 *  charge.refunded               → payment_transactions: refund/succeeded
 *                                  bookings: deposit_paid: false (full refund only)
 */
export async function handleWebhookEvent(type: string, event: Stripe.Event): Promise<void> {
  switch (type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    case 'checkout.session.expired':
      await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
      break;

    case 'charge.refunded':
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;

    default:
      // Unknown but subscribed event — log and ignore
      console.warn(`[webhook] Unhandled event type: ${type}`);
  }
}

// ── Individual handlers ───────────────────────────────────────────

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  // Resolve our payment_intents record via the PI ID from the session,
  // or fall back to a session-ID metadata lookup.
  const piStripeId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id;

  const record = piStripeId
    ? (await getPaymentIntentByStripeId(piStripeId)) ??
      (await getPaymentIntentByCheckoutSessionId(session.id))
    : await getPaymentIntentByCheckoutSessionId(session.id);

  if (!record) {
    console.warn('[webhook] checkout.session.completed: no matching payment_intent record', session.id);
    return;
  }

  // Update PI status
  await updatePaymentIntentStatus(record.stripe_payment_intent_id, 'succeeded');

  // Record the charge transaction (idempotent — stripe_charge_id is UNIQUE)
  // The charge ID is accessible on the session's payment_intent expand; we use a
  // derived identifier so the unique constraint prevents a second insert.
  const chargeId = piStripeId ? `cs_charge_${piStripeId}` : `cs_charge_${session.id}`;
  await createTransactionRecord({
    payment_intent_id: record.id,
    stripe_charge_id: chargeId,
    type: 'charge',
    amount: session.amount_total ?? record.amount,
    currency: session.currency ?? record.currency,
    status: 'succeeded',
    metadata: { source: 'checkout.session.completed', session_id: session.id },
  }).catch((err: unknown) => {
    // Unique constraint violation = already recorded → safe to ignore
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('unique') && !msg.includes('duplicate')) throw err;
  });

  // Update booking: pending → confirmed + deposit_paid
  if (record.booking_id) {
    await updateBookingPaymentState(record.booking_id, {
      confirmIfPending: true,
      depositPaid: true,
    });
  }
}

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
  const record = await getPaymentIntentByStripeId(pi.id);

  if (!record) {
    console.warn('[webhook] payment_intent.succeeded: no matching record for', pi.id);
    return;
  }

  await updatePaymentIntentStatus(pi.id, 'succeeded');

  // Record charge; the latest_charge field holds the charge ID
  const chargeId =
    typeof pi.latest_charge === 'string' ? pi.latest_charge : `pi_charge_${pi.id}`;

  await createTransactionRecord({
    payment_intent_id: record.id,
    stripe_charge_id: chargeId,
    type: 'charge',
    amount: pi.amount,
    currency: pi.currency,
    status: 'succeeded',
    metadata: { source: 'payment_intent.succeeded' },
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('unique') && !msg.includes('duplicate')) throw err;
  });

  if (record.booking_id) {
    await updateBookingPaymentState(record.booking_id, {
      confirmIfPending: true,
      depositPaid: true,
    });
  }
}

async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent): Promise<void> {
  const record = await getPaymentIntentByStripeId(pi.id);

  if (!record) {
    console.warn('[webhook] payment_intent.payment_failed: no matching record for', pi.id);
    return;
  }

  // Revert to requires_payment_method so the guest can retry
  await updatePaymentIntentStatus(pi.id, 'requires_payment_method');

  const failureReason =
    pi.last_payment_error?.message ??
    pi.last_payment_error?.code ??
    'unknown';

  const chargeId =
    typeof pi.latest_charge === 'string'
      ? `${pi.latest_charge}_failed`
      : `pi_failed_${pi.id}_${Date.now()}`;

  await createTransactionRecord({
    payment_intent_id: record.id,
    stripe_charge_id: chargeId,
    type: 'charge',
    amount: pi.amount,
    currency: pi.currency,
    status: 'failed',
    failure_reason: failureReason,
    metadata: { source: 'payment_intent.payment_failed' },
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('unique') && !msg.includes('duplicate')) throw err;
  });
  // Booking stays 'pending' — guest may retry payment
}

async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const piStripeId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id;

  const record = piStripeId
    ? (await getPaymentIntentByStripeId(piStripeId)) ??
      (await getPaymentIntentByCheckoutSessionId(session.id))
    : await getPaymentIntentByCheckoutSessionId(session.id);

  if (!record) {
    console.warn('[webhook] checkout.session.expired: no matching record', session.id);
    return;
  }

  await updatePaymentIntentStatus(record.stripe_payment_intent_id, 'cancelled');
  // Booking intentionally NOT cancelled — session expiry ≠ booking cancellation.
  // Owner can decide to cancel the booking manually via admin panel.
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const piStripeId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : null;

  const record = piStripeId ? await getPaymentIntentByStripeId(piStripeId) : null;

  if (!record) {
    console.warn('[webhook] charge.refunded: no matching payment_intent record for charge', charge.id);
    return;
  }

  const refundAmount = charge.amount_refunded;
  const isFullRefund = refundAmount >= charge.amount;

  await createTransactionRecord({
    payment_intent_id: record.id,
    stripe_charge_id: `${charge.id}_refund`,
    type: 'refund',
    amount: refundAmount,
    currency: charge.currency,
    status: 'succeeded',
    metadata: {
      source: 'charge.refunded',
      charge_id: charge.id,
      full_refund: isFullRefund,
    },
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('unique') && !msg.includes('duplicate')) throw err;
  });

  // Only update deposit_paid on full refund — partial refunds don't invalidate the deposit
  if (record.booking_id && isFullRefund) {
    await updateBookingPaymentState(record.booking_id, { depositPaid: false });
  }
}

// ── Issue Refund ─────────────────────────────────────────────────

export type RefundInput = {
  /** Our DB `payment_intents.id` (UUID) */
  paymentIntentDbId: string;
  /** Amount to refund in EUR cents. Omit for full remaining refund. */
  amountCents?: number;
  /** Stripe refund reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' */
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
};

export type RefundResult = {
  stripeRefundId: string;
  amountCents: number;
  currency: string;
  alreadyRefunded: boolean;
};

/**
 * Issue a Stripe refund (full or partial).
 *
 * Idempotency guards:
 *   1. DB check: rejects if requested amount would over-refund
 *   2. Stripe idempotency key: `{pi_id}-refund-{amountCents}` — Stripe deduplicates
 *      within 24 h for the same key
 *   3. UNIQUE stripe_charge_id in payment_transactions prevents a second DB insert
 *      for the same Stripe refund ID
 */
export async function issueRefund(input: RefundInput): Promise<RefundResult> {
  // ── Load our PI record ───────────────────────────────────────────
  const record = await getPaymentIntentByDbId(input.paymentIntentDbId);
  if (!record) throw new Error('Payment intent niet gevonden / not found');
  if (record.status !== 'succeeded') {
    throw new Error(
      `Refund nije moguć: payment intent status je "${record.status}" (mora biti "succeeded")`,
    );
  }

  // ── Sum existing refunds ─────────────────────────────────────────
  const transactions = await getTransactionsByPaymentIntentId(record.id);
  const totalRefunded = transactions
    .filter((t) => t.type === 'refund' && t.status === 'succeeded')
    .reduce((sum, t) => sum + t.amount, 0);

  const remaining = record.amount - totalRefunded;
  if (remaining <= 0) {
    return {
      stripeRefundId: 'already_fully_refunded',
      amountCents: 0,
      currency: record.currency,
      alreadyRefunded: true,
    };
  }

  const refundAmount = input.amountCents ?? remaining;
  if (refundAmount > remaining) {
    throw new Error(
      `Iznos povrata (${refundAmount} ¢) prelazi preostali iznos (${remaining} ¢)`,
    );
  }
  if (refundAmount <= 0) {
    throw new Error('Iznos povrata mora biti veći od nule');
  }

  // ── Validate the Stripe PI ID ────────────────────────────────────
  if (!record.stripe_payment_intent_id.startsWith('pi_')) {
    throw new Error(
      'Ovaj payment intent nema direktan Stripe PI ID — refund nije moguć putem ovog alata',
    );
  }

  // ── Call Stripe ──────────────────────────────────────────────────
  const stripe = getStripeClient();
  const idempotencyKey = `${record.stripe_payment_intent_id}-refund-${refundAmount}`;

  let stripeRefund: Awaited<ReturnType<typeof stripe.refunds.create>>;
  try {
    stripeRefund = await stripe.refunds.create(
      {
        payment_intent: record.stripe_payment_intent_id,
        amount: refundAmount,
        reason: input.reason ?? 'requested_by_customer',
      },
      { idempotencyKey },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Stripe refund greška: ${msg}`);
  }

  // ── Persist transaction (idempotent via UNIQUE stripe_charge_id) ──
  await createTransactionRecord({
    payment_intent_id: record.id,
    stripe_charge_id: stripeRefund.id, // re_xxx — UNIQUE prevents double insert
    type: 'refund',
    amount: stripeRefund.amount,
    currency: stripeRefund.currency,
    status: stripeRefund.status === 'succeeded' ? 'succeeded' : 'pending',
    metadata: {
      reason: stripeRefund.reason ?? input.reason ?? 'requested_by_customer',
      stripe_refund_id: stripeRefund.id,
    },
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    // Unique constraint = already persisted from a previous attempt (Stripe idempotency replay)
    if (!msg.includes('unique') && !msg.includes('duplicate')) throw err;
  });

  // ── Update booking deposit_paid on full refund ───────────────────
  const isFullRefund = refundAmount >= remaining;
  if (record.booking_id && isFullRefund) {
    await updateBookingPaymentState(record.booking_id, { depositPaid: false });
  }

  return {
    stripeRefundId: stripeRefund.id,
    amountCents: stripeRefund.amount,
    currency: stripeRefund.currency,
    alreadyRefunded: false,
  };
}

// ── Reconcile Payments ───────────────────────────────────────────

export type ReconcileResult = {
  checked: number;
  repaired: number;
  skipped: number;
  details: Array<{ paymentIntentId: string; localStatus: string; stripeStatus: string; action: string }>;
};

/**
 * Re-check ambiguous local payment_intents against the Stripe API and repair drift.
 *
 * Targets: status in (requires_payment_method, requires_confirmation, requires_action,
 *          processing) AND created_at < now() - olderThanMinutes.
 *
 * For each ambiguous PI:
 *   - Fetch live status from Stripe
 *   - If Stripe says "succeeded" but we have something else → repair (confirm booking etc.)
 *   - If Stripe says "canceled"  but we have something else → update to cancelled
 *   - Otherwise: no change, log as skipped
 *
 * Records with cs_xxx IDs are skipped (reconciled via webhook only).
 */
export async function reconcilePayments(
  olderThanMinutes = 15,
): Promise<ReconcileResult> {
  const ambiguous = await getAmbiguousPaymentIntents(olderThanMinutes);
  const stripe = getStripeClient();

  const result: ReconcileResult = { checked: ambiguous.length, repaired: 0, skipped: 0, details: [] };

  for (const record of ambiguous) {
    // Skip checkout session IDs — only PI IDs can be reconciled directly
    if (!record.stripe_payment_intent_id.startsWith('pi_')) {
      result.skipped++;
      result.details.push({
        paymentIntentId: record.id,
        localStatus: record.status,
        stripeStatus: 'unknown (cs_ id)',
        action: 'skipped',
      });
      continue;
    }

    let stripeStatus: string;
    try {
      const pi = await stripe.paymentIntents.retrieve(record.stripe_payment_intent_id);
      stripeStatus = pi.status;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.skipped++;
      result.details.push({
        paymentIntentId: record.id,
        localStatus: record.status,
        stripeStatus: `error: ${msg}`,
        action: 'skipped (fetch error)',
      });
      continue;
    }

    if (stripeStatus === record.status) {
      result.skipped++;
      result.details.push({
        paymentIntentId: record.id,
        localStatus: record.status,
        stripeStatus,
        action: 'in_sync',
      });
      continue;
    }

    // ── Repair drift ─────────────────────────────────────────────
    const action = 'repaired';

    if (stripeStatus === 'succeeded') {
      await updatePaymentIntentStatus(record.stripe_payment_intent_id, 'succeeded');
      if (record.booking_id) {
        await updateBookingPaymentState(record.booking_id, {
          confirmIfPending: true,
          depositPaid: true,
        });
      }
    } else if (stripeStatus === 'canceled') {
      await updatePaymentIntentStatus(record.stripe_payment_intent_id, 'cancelled');
    } else {
      // Stripe has a different ambiguous status — update and note it
      await updatePaymentIntentStatus(
        record.stripe_payment_intent_id,
        stripeStatus as import('./payment.types').PaymentIntentStatus,
      );
    }

    result.repaired++;
    result.details.push({
      paymentIntentId: record.id,
      localStatus: record.status,
      stripeStatus,
      action,
    });
  }

  return result;
}

// ── Internal helper ───────────────────────────────────────────────

async function getPaymentIntentByDbId(dbId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('payment_intents')
    .select('*')
    .eq('id', dbId)
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw error;
  return data as import('./payment.types').PaymentIntent;
}

// ── Helpers re-exported for convenience ──────────────────────────
export { eurToCents };
