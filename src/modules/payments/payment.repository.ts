// New — Supabase CRUD for payment tables.
// All functions use the service-role client (server-side only).

import { createServerSupabaseClient } from '@/lib/supabase';
import type {
  PaymentIntent,
  PaymentTransaction,
  WebhookEvent,
  PaymentIntentStatus,
  TransactionType,
  TransactionStatus,
} from './payment.types';

// ── PaymentIntent ─────────────────────────────────────────────────

export async function createPaymentIntentRecord(data: {
  booking_id: string | null;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  client_secret: string | null;
  metadata?: Record<string, unknown>;
}): Promise<PaymentIntent> {
  const supabase = createServerSupabaseClient();
  const { data: row, error } = await supabase
    .from('payment_intents')
    .insert({
      booking_id: data.booking_id,
      stripe_payment_intent_id: data.stripe_payment_intent_id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      client_secret: data.client_secret,
      metadata: data.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw error;
  return row as PaymentIntent;
}

export async function getPaymentIntentByStripeId(
  stripeId: string,
): Promise<PaymentIntent | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('payment_intents')
    .select('*')
    .eq('stripe_payment_intent_id', stripeId)
    .single();

  if (error?.code === 'PGRST116') return null; // not found
  if (error) throw error;
  return data as PaymentIntent;
}

export async function getPaymentIntentByBookingId(
  bookingId: string,
): Promise<PaymentIntent | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('payment_intents')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw error;
  return data as PaymentIntent;
}

export async function updatePaymentIntentStatus(
  stripeId: string,
  status: PaymentIntentStatus,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from('payment_intents')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('stripe_payment_intent_id', stripeId);

  if (error) throw error;
}

// ── PaymentTransaction ────────────────────────────────────────────

export async function createTransactionRecord(data: {
  payment_intent_id: string;
  stripe_charge_id: string | null;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  failure_reason?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<PaymentTransaction> {
  const supabase = createServerSupabaseClient();
  const { data: row, error } = await supabase
    .from('payment_transactions')
    .insert({
      payment_intent_id: data.payment_intent_id,
      stripe_charge_id: data.stripe_charge_id,
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      failure_reason: data.failure_reason ?? null,
      metadata: data.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw error;
  return row as PaymentTransaction;
}

/**
 * Find payment intent by the Stripe Checkout Session ID stored in metadata.
 * Needed for checkout.session.* events when the pi_ ID may not match.
 */
export async function getPaymentIntentByCheckoutSessionId(
  checkoutSessionId: string,
): Promise<PaymentIntent | null> {
  const supabase = createServerSupabaseClient();
  // metadata->>'checkout_session_id' via Supabase PostgREST filter
  const { data, error } = await supabase
    .from('payment_intents')
    .select('*')
    .eq('stripe_payment_intent_id', checkoutSessionId) // fallback: cs_ stored as pi_id
    .single();

  if (!error && data) return data as PaymentIntent;

  // Try metadata JSON lookup
  const { data: meta, error: metaErr } = await supabase
    .from('payment_intents')
    .select('*')
    .filter('metadata->>checkout_session_id', 'eq', checkoutSessionId)
    .limit(1)
    .single();

  if (metaErr?.code === 'PGRST116') return null;
  if (metaErr) return null;
  return meta as PaymentIntent;
}

// ── Booking payment state ─────────────────────────────────────────

/**
 * Update a booking's payment-related fields.
 * `confirmIfPending` transitions status pending → confirmed atomically.
 * Safe to call multiple times — the WHERE filter prevents double-confirm.
 */
export async function updateBookingPaymentState(
  bookingId: string,
  opts: {
    confirmIfPending?: boolean;   // pending → confirmed
    depositPaid?: boolean;
  },
): Promise<{ confirmed: boolean }> {
  const supabase = createServerSupabaseClient();

  const updates: Record<string, unknown> = {};
  if (opts.depositPaid !== undefined) updates.deposit_paid = opts.depositPaid;

  if (opts.confirmIfPending) {
    // Only flip to 'confirmed' if currently 'pending' — prevents re-confirming
    const { data, error } = await supabase
      .from('bookings')
      .update({ ...updates, status: 'confirmed' })
      .eq('id', bookingId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    return { confirmed: !!data };
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId);
    if (error) throw error;
  }

  return { confirmed: false };
}

export async function getTransactionsByPaymentIntentId(
  paymentIntentId: string,
): Promise<PaymentTransaction[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('payment_intent_id', paymentIntentId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as PaymentTransaction[];
}

/**
 * Return payment_intents with a status that may differ from Stripe's ground truth
 * and are old enough that the initial payment flow should have completed.
 * Used by the reconciliation job.
 */
export async function getAmbiguousPaymentIntents(
  olderThanMinutes = 15,
): Promise<PaymentIntent[]> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('payment_intents')
    .select('*')
    .in('status', [
      'requires_payment_method',
      'requires_confirmation',
      'requires_action',
      'processing',
    ])
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as PaymentIntent[];
}

// ── WebhookEvent ──────────────────────────────────────────────────

/** Returns null if the event already exists (idempotency guard). */
export async function insertWebhookEvent(data: {
  stripe_event_id: string;
  type: string;
  payload: Record<string, unknown>;
}): Promise<WebhookEvent | null> {
  const supabase = createServerSupabaseClient();

  // Check for duplicate first — .upsert with ignoreDuplicates skips returning data
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('stripe_event_id', data.stripe_event_id)
    .single();

  if (existing) return null; // already processed or in-flight

  const { data: row, error } = await supabase
    .from('webhook_events')
    .insert({
      stripe_event_id: data.stripe_event_id,
      type: data.type,
      payload: data.payload,
    })
    .select()
    .single();

  if (error) throw error;
  return row as WebhookEvent;
}

export async function markWebhookEventProcessed(
  id: string,
  error?: string,
): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase
    .from('webhook_events')
    .update({
      processed: !error,
      processed_at: new Date().toISOString(),
      error: error ?? null,
    })
    .eq('id', id);
}
