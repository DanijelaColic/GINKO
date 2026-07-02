// Supabase CRUD for payment tables (server-side only).

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
  provider_payment_id: string;
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
      provider_payment_id: data.provider_payment_id,
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

export async function getPaymentIntentByProviderId(
  providerId: string,
): Promise<PaymentIntent | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('payment_intents')
    .select('*')
    .eq('provider_payment_id', providerId)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw error;
  return data as PaymentIntent;
}

/** @deprecated Use getPaymentIntentByProviderId — kept for transitional imports */
export const getPaymentIntentByStripeId = getPaymentIntentByProviderId;

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
  providerId: string,
  status: PaymentIntentStatus,
  metadataPatch?: Record<string, unknown>,
): Promise<void> {
  const supabase = createServerSupabaseClient();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (metadataPatch && Object.keys(metadataPatch).length > 0) {
    const { data: existing } = await supabase
      .from('payment_intents')
      .select('metadata')
      .eq('provider_payment_id', providerId)
      .single();

    updates.metadata = {
      ...((existing?.metadata as Record<string, unknown>) ?? {}),
      ...metadataPatch,
    };
  }

  const { error } = await supabase
    .from('payment_intents')
    .update(updates)
    .eq('provider_payment_id', providerId);

  if (error) throw error;
}

export async function getPaymentIntentByHostedCheckoutId(
  hostedCheckoutId: string,
): Promise<PaymentIntent | null> {
  const byId = await getPaymentIntentByProviderId(hostedCheckoutId);
  if (byId) return byId;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('payment_intents')
    .select('*')
    .filter('metadata->>hosted_checkout_id', 'eq', hostedCheckoutId)
    .limit(1)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) return null;
  return data as PaymentIntent;
}

/** @deprecated Use getPaymentIntentByHostedCheckoutId */
export const getPaymentIntentByCheckoutSessionId = getPaymentIntentByHostedCheckoutId;

// ── PaymentTransaction ────────────────────────────────────────────

export async function createTransactionRecord(data: {
  payment_intent_id: string;
  provider_transaction_id: string | null;
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
      provider_transaction_id: data.provider_transaction_id,
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

// ── Booking payment state ─────────────────────────────────────────

export async function updateBookingPaymentState(
  bookingId: string,
  opts: {
    confirmIfPending?: boolean;
    depositPaid?: boolean;
  },
): Promise<{ confirmed: boolean }> {
  const supabase = createServerSupabaseClient();

  const updates: Record<string, unknown> = {};
  if (opts.depositPaid !== undefined) updates.deposit_paid = opts.depositPaid;

  if (opts.confirmIfPending) {
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

export async function insertWebhookEvent(data: {
  provider_event_id: string;
  type: string;
  payload: Record<string, unknown>;
}): Promise<WebhookEvent | null> {
  const supabase = createServerSupabaseClient();

  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('provider_event_id', data.provider_event_id)
    .single();

  if (existing) return null;

  const { data: row, error } = await supabase
    .from('webhook_events')
    .insert({
      provider_event_id: data.provider_event_id,
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
