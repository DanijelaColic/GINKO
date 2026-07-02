// Payment service — Worldline Hosted Checkout + webhooks.

import type { Domain } from 'onlinepayments-sdk-nodejs';

type PaymentResponse = Domain.PaymentResponse;

type WebhooksEvent = {
  id?: string | null;
  type?: string | null;
  payment?: PaymentResponse | null;
  refund?: Domain.RefundResponse | null;
};
import { getWorldlineClient, getWorldlineMerchantId } from './worldline.client';
import {
  createPaymentIntentRecord,
  getPaymentIntentByBookingId,
  getPaymentIntentByProviderId,
  getPaymentIntentByHostedCheckoutId,
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
  PaymentIntentStatus,
} from './payment.types';
import { getSiteUrl } from '@/lib/siteUrl';
import { notifyGuestBookingConfirmed } from '@/lib/email';

// ── Worldline status mapping ──────────────────────────────────────

export function mapWorldlinePaymentStatus(
  payment: PaymentResponse | null | undefined,
  hostedCheckoutStatus?: string | null,
): PaymentIntentStatus {
  if (hostedCheckoutStatus === 'CANCELLED_BY_CONSUMER' || hostedCheckoutStatus === 'EXPIRED') {
    return 'cancelled';
  }

  if (!payment) return 'requires_payment_method';

  const category = payment.statusOutput?.statusCategory;
  const status = payment.status;

  if (
    category === 'COMPLETED' ||
    status === 'CAPTURED' ||
    status === 'PAID' ||
    payment.statusOutput?.isAuthorized === true
  ) {
    return 'succeeded';
  }

  if (
    category === 'UNSUCCESSFUL' ||
    status === 'REJECTED' ||
    status === 'CANCELLED' ||
    status === 'REJECTED_CAPTURE'
  ) {
    return 'cancelled';
  }

  if (
    category === 'PENDING' ||
    status === 'PENDING_CAPTURE' ||
    status === 'PENDING_PAYMENT' ||
    status === 'PENDING_COMPLETION'
  ) {
    return 'processing';
  }

  return 'requires_payment_method';
}

function isPaymentSuccessful(status: PaymentIntentStatus): boolean {
  return status === 'succeeded';
}

async function confirmBookingAfterPayment(bookingId: string): Promise<void> {
  const { confirmed } = await updateBookingPaymentState(bookingId, {
    confirmIfPending: true,
    depositPaid: true,
  });

  if (confirmed) {
    void notifyGuestBookingConfirmed(bookingId).catch((err) =>
      console.error('[email] notifyGuestBookingConfirmed:', err),
    );
  }
}

function getWorldlinePaymentId(payment: PaymentResponse): string | null {
  return payment.id ?? null;
}

function getHostedCheckoutIdFromPayment(payment: PaymentResponse): string | null {
  return payment.hostedCheckoutSpecificOutput?.hostedCheckoutId ?? null;
}

// ── Create Hosted Checkout session ────────────────────────────────

/**
 * Create a Worldline Hosted Checkout session for a booking deposit.
 * Returns redirect URL for the guest.
 */
export async function createCheckoutSession(
  input: CreatePaymentIntentInput & { returnBasePath: string },
): Promise<{ url: string } & PaymentIntentResult> {
  const client = getWorldlineClient();
  const merchantId = getWorldlineMerchantId();
  const siteUrl = getSiteUrl();

  const returnUrl = `${siteUrl}${input.returnBasePath}&payment=success`;

  const response = await client.hostedCheckout.createHostedCheckout(merchantId, {
    order: {
      amountOfMoney: {
        currencyCode: (input.currency ?? 'eur').toUpperCase(),
        amount: input.amount_cents,
      },
      references: {
        merchantReference: input.booking_id,
      },
      customer: {
        merchantCustomerId: input.booking_id,
      },
    },
    hostedCheckoutSpecificInput: {
      locale: 'hr-HR',
      returnUrl,
      allowedNumberOfPaymentAttempts: 3,
    },
  });

  if (!response.isSuccess) {
    const errMsg =
      response.body?.errors?.[0]?.message ??
      response.body?.errorId ??
      'Worldline nije vratio URL za plaćanje';
    throw new Error(errMsg);
  }

  const body = response.body;
  const redirectUrl = body.redirectUrl;
  const hostedCheckoutId = body.hostedCheckoutId;

  if (!redirectUrl || !hostedCheckoutId) {
    throw new Error('Worldline nije vratio redirectUrl ili hostedCheckoutId');
  }

  const record = await createPaymentIntentRecord({
    booking_id: input.booking_id,
    provider_payment_id: hostedCheckoutId,
    amount: input.amount_cents,
    currency: (input.currency ?? 'eur').toLowerCase(),
    status: 'requires_payment_method',
    client_secret: null,
    metadata: {
      hosted_checkout_id: hostedCheckoutId,
      return_mac: body.RETURNMAC ?? null,
      payment_type: input.metadata?.payment_type ?? 'deposit',
      provider: 'worldline',
      ...(input.metadata ?? {}),
    },
  });

  return {
    url: redirectUrl,
    id: record.id,
    provider_payment_id: hostedCheckoutId,
    client_secret: '',
    amount: record.amount,
    currency: record.currency,
    status: record.status,
  };
}

// ── Sync hosted checkout status (return URL + reconcile) ──────────

/**
 * Fetch live status from Worldline and update local DB.
 * Called when guest returns from Hosted Checkout or during reconciliation.
 */
export async function syncHostedCheckoutStatus(
  hostedCheckoutId: string,
): Promise<PaymentIntentStatus | null> {
  const record =
    (await getPaymentIntentByHostedCheckoutId(hostedCheckoutId)) ??
    (await getPaymentIntentByProviderId(hostedCheckoutId));

  if (!record) {
    console.warn('[worldline] sync: no matching payment_intent for', hostedCheckoutId);
    return null;
  }

  const client = getWorldlineClient();
  const merchantId = getWorldlineMerchantId();
  const response = await client.hostedCheckout.getHostedCheckout(
    merchantId,
    hostedCheckoutId,
  );

  if (!response.isSuccess) {
    console.warn('[worldline] getHostedCheckout failed:', hostedCheckoutId);
    return record.status;
  }

  const checkout = response.body;
  const payment = checkout.createdPaymentOutput?.payment ?? null;
  const newStatus = mapWorldlinePaymentStatus(payment, checkout.status);

  const worldlinePaymentId = payment ? getWorldlinePaymentId(payment) : null;
  const metadataPatch: Record<string, unknown> = {};
  if (worldlinePaymentId) metadataPatch.worldline_payment_id = worldlinePaymentId;

  if (newStatus !== record.status || worldlinePaymentId) {
    await updatePaymentIntentStatus(record.provider_payment_id, newStatus, metadataPatch);
  }

  await applyPaymentOutcome(record.id, record.booking_id, payment, newStatus, {
    source: 'hosted_checkout_sync',
    hosted_checkout_id: hostedCheckoutId,
  });

  return newStatus;
}

async function applyPaymentOutcome(
  paymentIntentDbId: string,
  bookingId: string | null,
  payment: PaymentResponse | null,
  status: PaymentIntentStatus,
  metadata: Record<string, unknown>,
): Promise<void> {
  if (!isPaymentSuccessful(status)) return;

  const paymentId = payment ? getWorldlinePaymentId(payment) : null;
  const chargeId = paymentId ?? `hc_success_${paymentIntentDbId}`;

  const amount =
    payment?.paymentOutput?.amountOfMoney?.amount ??
    (await getPaymentIntentByDbId(paymentIntentDbId))?.amount ??
    0;
  const currency =
    payment?.paymentOutput?.amountOfMoney?.currencyCode?.toLowerCase() ?? 'eur';

  await createTransactionRecord({
    payment_intent_id: paymentIntentDbId,
    provider_transaction_id: chargeId,
    type: 'charge',
    amount,
    currency,
    status: 'succeeded',
    metadata,
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('unique') && !msg.includes('duplicate')) throw err;
  });

  if (bookingId) {
    await confirmBookingAfterPayment(bookingId);
  }
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

export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<PaymentIntentResult> {
  const result = await createCheckoutSession({
    ...input,
    returnBasePath: `/booking/confirmation/${input.booking_id}?token=`,
  });
  return result;
}

// ── Webhook handlers ──────────────────────────────────────────────

export async function handleWorldlineWebhookEvent(event: WebhooksEvent): Promise<void> {
  const type = event.type ?? '';

  if (type.startsWith('payment.') && event.payment) {
    await handleWorldlinePaymentWebhook(event.payment, type);
    return;
  }

  if (type.startsWith('refund.') && event.refund) {
    await handleWorldlineRefundWebhook(event);
    return;
  }

  console.warn(`[webhook/worldline] Unhandled event type: ${type}`);
}

async function handleWorldlinePaymentWebhook(
  payment: PaymentResponse,
  eventType: string,
): Promise<void> {
  const hostedCheckoutId = getHostedCheckoutIdFromPayment(payment);
  const merchantRef = payment.paymentOutput?.references?.merchantReference;

  const record = hostedCheckoutId
    ? await getPaymentIntentByHostedCheckoutId(hostedCheckoutId)
    : merchantRef
      ? await getPaymentIntentByBookingId(merchantRef)
      : null;

  if (!record) {
    console.warn('[webhook/worldline] payment event: no matching record', eventType);
    return;
  }

  const newStatus = mapWorldlinePaymentStatus(payment);
  const worldlinePaymentId = getWorldlinePaymentId(payment);

  await updatePaymentIntentStatus(record.provider_payment_id, newStatus, {
    worldline_payment_id: worldlinePaymentId,
  });

  if (isPaymentSuccessful(newStatus)) {
    await applyPaymentOutcome(record.id, record.booking_id, payment, newStatus, {
      source: eventType,
    });
  } else if (newStatus === 'cancelled') {
    await updatePaymentIntentStatus(record.provider_payment_id, 'cancelled');
  } else if (eventType.includes('failed') || eventType.includes('rejected')) {
    const failureReason =
      payment.statusOutput?.errors?.[0]?.message ?? 'payment_failed';

    await createTransactionRecord({
      payment_intent_id: record.id,
      provider_transaction_id: `${worldlinePaymentId ?? record.id}_failed_${Date.now()}`,
      type: 'charge',
      amount: record.amount,
      currency: record.currency,
      status: 'failed',
      failure_reason: failureReason,
      metadata: { source: eventType },
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('unique') && !msg.includes('duplicate')) throw err;
    });
  }
}

async function handleWorldlineRefundWebhook(event: WebhooksEvent): Promise<void> {
  const refund = event.refund;
  if (!refund?.id) return;

  const paymentId = refund.refundOutput?.references?.merchantReference;
  // Worldline refund references payment — look up by worldline_payment_id in metadata
  const supabase = createServerSupabaseClient();
  const { data: records } = await supabase
    .from('payment_intents')
    .select('*')
    .filter('metadata->>worldline_payment_id', 'eq', paymentId ?? '')
    .limit(1);

  const record = (records?.[0] as import('./payment.types').PaymentIntent | undefined) ?? null;
  if (!record) {
    console.warn('[webhook/worldline] refund: no matching payment_intent');
    return;
  }

  const refundAmount = refund.refundOutput?.amountOfMoney?.amount ?? 0;
  const currency =
    refund.refundOutput?.amountOfMoney?.currencyCode?.toLowerCase() ?? record.currency;

  await createTransactionRecord({
    payment_intent_id: record.id,
    provider_transaction_id: refund.id,
    type: 'refund',
    amount: refundAmount,
    currency,
    status: refund.status === 'REFUNDED' ? 'succeeded' : 'pending',
    metadata: { source: event.type ?? 'refund' },
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('unique') && !msg.includes('duplicate')) throw err;
  });

  const transactions = await getTransactionsByPaymentIntentId(record.id);
  const totalRefunded = transactions
    .filter((t) => t.type === 'refund' && t.status === 'succeeded')
    .reduce((sum, t) => sum + t.amount, 0);

  if (record.booking_id && totalRefunded >= record.amount) {
    await updateBookingPaymentState(record.booking_id, { depositPaid: false });
  }
}

// ── Issue Refund ─────────────────────────────────────────────────

export type RefundInput = {
  paymentIntentDbId: string;
  amountCents?: number;
};

export type RefundResult = {
  providerRefundId: string;
  amountCents: number;
  currency: string;
  alreadyRefunded: boolean;
};

export async function issueRefund(input: RefundInput): Promise<RefundResult> {
  const record = await getPaymentIntentByDbId(input.paymentIntentDbId);
  if (!record) throw new Error('Payment intent nije pronađen');
  if (record.status !== 'succeeded') {
    throw new Error(
      `Refund nije moguć: status je "${record.status}" (mora biti "succeeded")`,
    );
  }

  const worldlinePaymentId = record.metadata?.worldline_payment_id as string | undefined;
  if (!worldlinePaymentId) {
    throw new Error(
      'Nedostaje worldline_payment_id u metadata — pokreni usklađivanje prije povrata',
    );
  }

  const transactions = await getTransactionsByPaymentIntentId(record.id);
  const totalRefunded = transactions
    .filter((t) => t.type === 'refund' && t.status === 'succeeded')
    .reduce((sum, t) => sum + t.amount, 0);

  const remaining = record.amount - totalRefunded;
  if (remaining <= 0) {
    return {
      providerRefundId: 'already_fully_refunded',
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

  const client = getWorldlineClient();
  const merchantId = getWorldlineMerchantId();

  const response = await client.payments.refundPayment(merchantId, worldlinePaymentId, {
    amountOfMoney: {
      currencyCode: record.currency.toUpperCase(),
      amount: refundAmount,
    },
  });

  if (!response.isSuccess) {
    const errMsg =
      response.body?.errors?.[0]?.message ??
      response.body?.errorId ??
      'Worldline refund greška';
    throw new Error(errMsg);
  }

  const refundBody = response.body;
  const refundId = refundBody.id ?? `refund_${Date.now()}`;

  await createTransactionRecord({
    payment_intent_id: record.id,
    provider_transaction_id: refundId,
    type: 'refund',
    amount: refundAmount,
    currency: record.currency,
    status: 'succeeded',
    metadata: { worldline_refund_id: refundId },
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('unique') && !msg.includes('duplicate')) throw err;
  });

  const isFullRefund = refundAmount >= remaining;
  if (record.booking_id && isFullRefund) {
    await updateBookingPaymentState(record.booking_id, { depositPaid: false });
  }

  return {
    providerRefundId: refundId,
    amountCents: refundAmount,
    currency: record.currency,
    alreadyRefunded: false,
  };
}

// ── Reconcile Payments ───────────────────────────────────────────

export type ReconcileResult = {
  checked: number;
  repaired: number;
  skipped: number;
  details: Array<{
    paymentIntentId: string;
    localStatus: string;
    providerStatus: string;
    action: string;
  }>;
};

export async function reconcilePayments(
  olderThanMinutes = 15,
): Promise<ReconcileResult> {
  const ambiguous = await getAmbiguousPaymentIntents(olderThanMinutes);

  const result: ReconcileResult = {
    checked: ambiguous.length,
    repaired: 0,
    skipped: 0,
    details: [],
  };

  for (const record of ambiguous) {
    try {
      const before = record.status;
      const after = await syncHostedCheckoutStatus(record.provider_payment_id);

      if (!after || after === before) {
        result.skipped++;
        result.details.push({
          paymentIntentId: record.id,
          localStatus: before,
          providerStatus: after ?? 'unknown',
          action: after === before ? 'in_sync' : 'skipped',
        });
        continue;
      }

      result.repaired++;
      result.details.push({
        paymentIntentId: record.id,
        localStatus: before,
        providerStatus: after,
        action: 'repaired',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.skipped++;
      result.details.push({
        paymentIntentId: record.id,
        localStatus: record.status,
        providerStatus: `error: ${msg}`,
        action: 'skipped (fetch error)',
      });
    }
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

export { eurToCents };
