/**
 * Produkcijski cron: samo rezervacije s postavljenim payment_hold_until.
 * Assert prije otkaza. Saferpay nedostupan → termin ostaje blokiran.
 */

import { createServerSupabaseClient } from '@/lib/supabase';
import {
  saferpayRequest,
  type PaymentPageAssertResponse,
} from './saferpay.client';
import { syncSaferpayPayment } from './payment.service';
import { createSupabasePaymentLock } from './payment-hold.supabase-lock';
import { releaseOneHold } from './payment-hold.release';
import type { AssertSnapshot, IntentView } from './payment-hold.policy';
import { updatePaymentIntentStatus } from './payment.repository';
import type { PaymentIntentStatus } from './payment.types';
import { formatSafeErrorMessage } from './safe-error';
import {
  snapshotFromAssertBody,
  snapshotFromSaferpayError,
} from './payment-hold.saferpay';

type IntentRow = {
  id: string;
  booking_id: string | null;
  provider_payment_id: string;
  status: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

function toView(row: IntentRow): IntentView {
  const meta = row.metadata ?? {};
  const expires =
    typeof meta.saferpay_redirect_expires_at === 'string'
      ? meta.saferpay_redirect_expires_at
      : null;
  const token = typeof meta.saferpay_token === 'string' ? meta.saferpay_token : '';
  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    redirectExpiresAt: expires,
    hasToken: token.length > 0 && !row.provider_payment_id.startsWith('creating:'),
    orderId: typeof meta.order_id === 'string' ? meta.order_id : null,
    lastAssertAt:
      typeof meta.saferpay_last_assert_at === 'string' ? meta.saferpay_last_assert_at : null,
    lastAssertClass:
      typeof meta.saferpay_last_assert_class === 'string'
        ? meta.saferpay_last_assert_class
        : null,
  };
}

async function assertIntent(row: IntentRow): Promise<AssertSnapshot> {
  const token =
    (typeof row.metadata?.saferpay_token === 'string' && row.metadata.saferpay_token) ||
    row.provider_payment_id;
  if (!token || token.startsWith('creating:')) return { kind: 'unreachable' };
  try {
    const body = await saferpayRequest<PaymentPageAssertResponse>(
      '/Payment/v1/PaymentPage/Assert',
      { Token: token },
    );
    return snapshotFromAssertBody(body);
  } catch (err) {
    return snapshotFromSaferpayError(err);
  }
}

export async function runPaymentHoldRelease(): Promise<{
  checked: number;
  released: number;
  kept: number;
  settled: number;
}> {
  const supabase = createServerSupabaseClient();
  const lock = createSupabasePaymentLock();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, status, deposit_paid, payment_hold_until, payment_finalizing_at, payment_finalizing_intent_id',
    )
    .eq('status', 'pending')
    .eq('deposit_paid', false)
    .not('payment_hold_until', 'is', null)
    .lte('payment_hold_until', nowIso)
    .order('payment_hold_until', { ascending: true })
    .limit(40);

  if (error) throw error;

  const summary = { checked: 0, released: 0, kept: 0, settled: 0 };

  for (const booking of data ?? []) {
    summary.checked += 1;
    const { data: intentRows, error: intentError } = await supabase
      .from('payment_intents')
      .select('id, booking_id, provider_payment_id, status, created_at, metadata')
      .eq('booking_id', booking.id);

    if (intentError) {
      summary.kept += 1;
      console.error(
        '[payment-hold] intents:',
        booking.id,
        formatSafeErrorMessage(intentError),
      );
      continue;
    }

    const rows = (intentRows ?? []) as IntentRow[];
    const outcome = await releaseOneHold({
      booking: {
        status: booking.status,
        depositPaid: booking.deposit_paid === true,
        paymentHoldUntil: booking.payment_hold_until,
        paymentFinalizingAt: booking.payment_finalizing_at,
        paymentFinalizingIntentId: booking.payment_finalizing_intent_id,
      },
      intents: rows.map(toView),
      nowMs: Date.now(),
      assertIntent: async (intent) => {
        const row = rows.find((item) => item.id === intent.id);
        if (!row) return { kind: 'unreachable' };
        return assertIntent(row);
      },
      settlePaid: async (intent) => {
        if (intent.orderId) await syncSaferpayPayment(intent.orderId);
      },
      markIntentUnpaid: async (intent) => {
        const row = rows.find((item) => item.id === intent.id);
        if (!row) return;
        await updatePaymentIntentStatus(row.provider_payment_id, 'cancelled', {
          saferpay_hold_terminal: true,
        });
      },
      rememberAssert: async (intent, klass) => {
        const row = rows.find((item) => item.id === intent.id);
        if (!row) return;
        await updatePaymentIntentStatus(
          row.provider_payment_id,
          row.status as PaymentIntentStatus,
          {
            saferpay_last_assert_at: new Date().toISOString(),
            saferpay_last_assert_class: klass,
          },
        );
      },
      releaseIfUnpaid: () => lock.releaseIfUnpaid(booking.id, Date.now()),
    });

    if (outcome.action === 'released') summary.released += 1;
    else if (outcome.action === 'settled') summary.settled += 1;
    else summary.kept += 1;
  }

  return summary;
}
