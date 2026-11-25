/**
 * Postgres zaključavanje (migracija 020). nowMs dolazi iz baze (now()),
 * ne iz sata aplikacije, da dva instance ne računaju rok različito.
 */

import { createServerSupabaseClient } from '@/lib/supabase';
import type { CaptureGate } from './payment-hold.policy';
import type { ClaimResult, PaymentLock } from './payment-hold.lock';

type ClaimJson = {
  result?: string;
  intent_id?: string;
  order_id?: string | null;
};

function mapClaim(data: unknown): ClaimResult {
  const row = (data ?? {}) as ClaimJson;
  if (row.result === 'claimed' && row.intent_id) {
    return { result: 'claimed', intentId: row.intent_id };
  }
  if (row.result === 'session_active' && row.intent_id) {
    return { result: 'session_active', intentId: row.intent_id };
  }
  if (row.result === 'needs_assert' && row.intent_id) {
    return {
      result: 'needs_assert',
      intentId: row.intent_id,
      orderId: row.order_id ?? null,
    };
  }
  if (row.result === 'already_paid') return { result: 'already_paid' };
  if (row.result === 'cancelled') return { result: 'cancelled' };
  return { result: 'not_found' };
}

export function createSupabasePaymentLock(): PaymentLock {
  const supabase = createServerSupabaseClient();

  return {
    async claim(bookingId, amount, currency) {
      const { data, error } = await supabase.rpc('claim_booking_payment_session', {
        p_booking_id: bookingId,
        p_amount: amount,
        p_currency: currency,
      });
      if (error) throw error;
      return mapClaim(data);
    },
    async supersede(bookingId, intentId, amount, currency) {
      const { data, error } = await supabase.rpc('supersede_booking_payment_session', {
        p_booking_id: bookingId,
        p_intent_id: intentId,
        p_amount: amount,
        p_currency: currency,
      });
      if (error) throw error;
      return mapClaim(data);
    },
    async complete(intentId, token, orderId, redirectExpiresAt, holdUntil) {
      const { data, error } = await supabase.rpc('complete_booking_payment_claim', {
        p_intent_id: intentId,
        p_token: token,
        p_order_id: orderId,
        p_redirect_expires: redirectExpiresAt,
        p_hold_until: holdUntil,
        p_metadata: {},
      });
      if (error) throw error;
      return data === true;
    },
    async abort(intentId) {
      const { error } = await supabase.rpc('abort_booking_payment_claim', {
        p_intent_id: intentId,
      });
      if (error) throw error;
    },
    async beginCapture(bookingId, intentId): Promise<CaptureGate> {
      const { data, error } = await supabase.rpc('begin_deposit_capture', {
        p_booking_id: bookingId,
        p_intent_id: intentId,
      });
      if (error) throw error;
      if (
        data === 'proceed' ||
        data === 'void_released' ||
        data === 'void_duplicate' ||
        data === 'already_succeeded' ||
        data === 'in_progress'
      ) {
        return data;
      }
      return 'in_progress';
    },
    async clearFinalizing(bookingId, intentId) {
      const { error } = await supabase.rpc('clear_deposit_finalizing', {
        p_booking_id: bookingId,
        p_intent_id: intentId,
      });
      if (error) throw error;
    },
    async releaseIfUnpaid(bookingId) {
      const { data, error } = await supabase.rpc('release_unpaid_booking_hold', {
        p_booking_id: bookingId,
      });
      if (error) throw error;
      return data === true;
    },
  };
}
