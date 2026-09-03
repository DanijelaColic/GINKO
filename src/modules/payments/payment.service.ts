// Payment service — Saferpay Payment Page + notify + refund.

import {
  getSaferpayConfig,
  saferpayRequest,
  SaferpayApiError,
  type PaymentPageAssertResponse,
  type PaymentPageInitializeResponse,
  type SaferpayTransaction,
  type TransactionCaptureResponse,
  type TransactionRefundResponse,
} from './saferpay.client';
import {
  createPaymentIntentRecord,
  getPaymentIntentByBookingId,
  getPaymentIntentByProviderId,
  getPaymentIntentByOrderId,
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
  PaymentIntent,
} from './payment.types';
import { getSiteUrl } from '@/lib/siteUrl';
import { toSaferpayLanguageCode } from '@/lib/bookingConfirmation';
import { notifyGuestBookingConfirmed } from '@/lib/email';

// ── Status mapping ────────────────────────────────────────────────

function mapSaferpayTransactionStatus(
  status: string | undefined | null,
): PaymentIntentStatus {
  switch ((status ?? '').toUpperCase()) {
    case 'CAPTURED':
    case 'AUTHORIZED':
      // AUTHORIZED is treated as success after we Capture (or if already captured).
      return 'succeeded';
    case 'CANCELED':
    case 'CANCELLED':
      return 'cancelled';
    case 'PENDING':
      return 'processing';
    default:
      return 'requires_payment_method';
  }
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

function centsToSaferpayValue(cents: number): string {
  return String(Math.round(cents));
}

// ── Create Payment Page session ───────────────────────────────────

/**
 * Create a Saferpay Payment Page session for a booking deposit.
 * Returns redirect URL for the guest.
 */
export async function createCheckoutSession(
  input: CreatePaymentIntentInput & { returnBasePath: string },
): Promise<{ url: string } & PaymentIntentResult> {
  const { customerId, terminalId } = getSaferpayConfig();
  const siteUrl = getSiteUrl();
  const orderId = crypto.randomUUID().replace(/-/g, '').slice(0, 32);

  // Saferpay returns NO payment data on redirect — we identify via our oid.
  const returnUrl = `${siteUrl}${input.returnBasePath}&payment=return&oid=${orderId}`;
  const notifyBase = `${siteUrl}/api/webhooks/saferpay?oid=${orderId}`;

  const languageCode = toSaferpayLanguageCode(input.languageCode);

  const init = await saferpayRequest<PaymentPageInitializeResponse>(
    '/Payment/v1/PaymentPage/Initialize',
    {
      TerminalId: terminalId,
      Payment: {
        Amount: {
          Value: centsToSaferpayValue(input.amount_cents),
          CurrencyCode: (input.currency ?? 'eur').toUpperCase(),
        },
        OrderId: orderId,
        Description: `Depozit rezervacije ${input.booking_id}`,
      },
      Payer: {
        LanguageCode: languageCode,
      },
      ReturnUrl: {
        Url: returnUrl,
      },
      Notification: {
        SuccessNotifyUrl: `${notifyBase}&result=success`,
        FailNotifyUrl: `${notifyBase}&result=fail`,
      },
      PaymentMethods: ['VISA', 'MASTERCARD', 'MAESTRO'],
    },
  );

  if (!init.Token || !init.RedirectUrl) {
    throw new Error('Saferpay nije vratio Token ili RedirectUrl');
  }

  const record = await createPaymentIntentRecord({
    booking_id: input.booking_id,
    provider_payment_id: init.Token,
    amount: input.amount_cents,
    currency: (input.currency ?? 'eur').toLowerCase(),
    status: 'requires_payment_method',
    client_secret: null,
    metadata: {
      order_id: orderId,
      saferpay_token: init.Token,
      saferpay_customer_id: customerId,
      payment_type: input.metadata?.payment_type ?? 'deposit',
      provider: 'saferpay',
      ...(input.metadata ?? {}),
    },
  });

  return {
    url: init.RedirectUrl,
    id: record.id,
    provider_payment_id: init.Token,
    client_secret: '',
    amount: record.amount,
    currency: record.currency,
    status: record.status,
  };
}

// ── Assert + Capture (return URL + notify + reconcile) ────────────

/**
 * Finalize a Saferpay Payment Page session (Assert → Capture if needed).
 * Safe to call from ReturnUrl and NotifyUrl (idempotent).
 */
export async function syncSaferpayPayment(
  orderId: string,
  opts: { failedNotify?: boolean } = {},
): Promise<PaymentIntentStatus | null> {
  const record = await getPaymentIntentByOrderId(orderId);
  if (!record) {
    console.warn('[saferpay] sync: no matching payment_intent for oid', orderId);
    return null;
  }

  if (record.status === 'succeeded') {
    return 'succeeded';
  }

  if (opts.failedNotify) {
    await updatePaymentIntentStatus(record.provider_payment_id, 'cancelled');
    return 'cancelled';
  }

  const token =
    (record.metadata?.saferpay_token as string | undefined) ??
    record.provider_payment_id;

  let assertBody: PaymentPageAssertResponse;
  try {
    assertBody = await saferpayRequest<PaymentPageAssertResponse>(
      '/Payment/v1/PaymentPage/Assert',
      { Token: token },
    );
  } catch (err) {
    if (err instanceof SaferpayApiError && err.status >= 400) {
      console.warn(
        '[saferpay] Assert failed:',
        err.message,
        err.body?.ErrorName,
      );
      await updatePaymentIntentStatus(record.provider_payment_id, 'cancelled', {
        saferpay_assert_error: err.body?.ErrorName ?? err.message,
      });
      return 'cancelled';
    }
    throw err;
  }

  const tx = assertBody.Transaction;
  const transactionId = tx.Id;
  if (!transactionId) {
    console.warn('[saferpay] Assert without Transaction.Id');
    return record.status;
  }

  let captureId =
    (record.metadata?.saferpay_capture_id as string | undefined) ??
    tx.CaptureId ??
    null;
  let finalStatus = (tx.Status ?? '').toUpperCase();

  // Card payments typically return AUTHORIZED — Capture to settle funds.
  if (finalStatus === 'AUTHORIZED') {
    try {
      const capture = await saferpayRequest<TransactionCaptureResponse>(
        '/Payment/v1/Transaction/Capture',
        {
          TransactionReference: { TransactionId: transactionId },
        },
      );
      captureId = capture.CaptureId ?? transactionId;
      finalStatus = (capture.Status ?? 'CAPTURED').toUpperCase();
    } catch (err) {
      // Already captured (retry / notify race) — treat as success.
      const msg = err instanceof Error ? err.message : String(err);
      if (/already|captured|TRANSACTION_ALREADY/i.test(msg)) {
        captureId = captureId ?? transactionId;
        finalStatus = 'CAPTURED';
      } else {
        throw err;
      }
    }
  }

  const newStatus = mapSaferpayTransactionStatus(finalStatus);

  await updatePaymentIntentStatus(record.provider_payment_id, newStatus, {
    saferpay_transaction_id: transactionId,
    saferpay_capture_id: captureId,
    saferpay_status: finalStatus,
    six_transaction_reference: tx.SixTransactionReference ?? null,
    payment_means: assertBody.PaymentMeans?.DisplayText ?? null,
  });

  await applyPaymentOutcome(record, tx, newStatus, {
    source: 'saferpay_assert',
    order_id: orderId,
    transaction_id: transactionId,
    capture_id: captureId,
  });

  return newStatus;
}

/** @deprecated Use syncSaferpayPayment — kept for transitional imports */
export async function syncHostedCheckoutStatus(
  hostedCheckoutIdOrOrderId: string,
): Promise<PaymentIntentStatus | null> {
  // Prefer order_id lookup; fall back to token (provider_payment_id).
  const byOrder = await getPaymentIntentByOrderId(hostedCheckoutIdOrOrderId);
  if (byOrder) {
    const oid = (byOrder.metadata?.order_id as string) ?? hostedCheckoutIdOrOrderId;
    return syncSaferpayPayment(oid);
  }
  const byToken = await getPaymentIntentByProviderId(hostedCheckoutIdOrOrderId);
  if (byToken?.metadata?.order_id) {
    return syncSaferpayPayment(byToken.metadata.order_id as string);
  }
  return null;
}

async function applyPaymentOutcome(
  record: PaymentIntent,
  tx: SaferpayTransaction,
  status: PaymentIntentStatus,
  metadata: Record<string, unknown>,
): Promise<void> {
  if (!isPaymentSuccessful(status)) return;

  const chargeId = tx.Id ?? `saferpay_success_${record.id}`;
  const amount = tx.Amount?.Value
    ? Number.parseInt(tx.Amount.Value, 10)
    : record.amount;
  const currency = (tx.Amount?.CurrencyCode ?? record.currency).toLowerCase();

  await createTransactionRecord({
    payment_intent_id: record.id,
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

  if (record.booking_id) {
    await confirmBookingAfterPayment(record.booking_id);
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
  const languageCode = toSaferpayLanguageCode(input.languageCode);
  const result = await createCheckoutSession({
    ...input,
    languageCode,
    returnBasePath: getBookingConfirmationPathPlaceholder(input.booking_id),
  });
  return result;
}

function getBookingConfirmationPathPlaceholder(bookingId: string): string {
  // Token is empty here — callers that need a real return URL must use createCheckoutSession
  return `/booking/confirmation/${bookingId}?token=`;
}

// ── Notify handler (GET from Saferpay servers) ────────────────────

export async function handleSaferpayNotify(opts: {
  orderId: string;
  result?: string | null;
}): Promise<void> {
  const failed = opts.result === 'fail';
  await syncSaferpayPayment(opts.orderId, { failedNotify: failed });
}

/** @deprecated */
export const handleWorldlineWebhookEvent = async (): Promise<void> => {
  console.warn('[payments] handleWorldlineWebhookEvent is deprecated — use Saferpay notify');
};

/** @deprecated */
export function mapWorldlinePaymentStatus(): PaymentIntentStatus {
  return 'requires_payment_method';
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

  const captureId =
    (record.metadata?.saferpay_capture_id as string | undefined) ??
    (record.metadata?.saferpay_transaction_id as string | undefined);

  if (!captureId) {
    throw new Error(
      'Nedostaje saferpay_capture_id u metadata — pokreni usklađivanje prije povrata',
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

  const refund = await saferpayRequest<TransactionRefundResponse>(
    '/Payment/v1/Transaction/Refund',
    {
      Refund: {
        Amount: {
          Value: centsToSaferpayValue(refundAmount),
          CurrencyCode: record.currency.toUpperCase(),
        },
      },
      CaptureReference: {
        CaptureId: captureId,
      },
    },
  );

  let refundTxId = refund.Transaction?.Id ?? `refund_${Date.now()}`;
  let refundStatus = (refund.Transaction?.Status ?? '').toUpperCase();

  // Some refunds return AUTHORIZED and need Capture.
  if (refundStatus === 'AUTHORIZED' && refund.Transaction?.Id) {
    const capture = await saferpayRequest<TransactionCaptureResponse>(
      '/Payment/v1/Transaction/Capture',
      {
        TransactionReference: { TransactionId: refund.Transaction.Id },
      },
    );
    refundTxId = capture.CaptureId ?? refundTxId;
    refundStatus = (capture.Status ?? 'CAPTURED').toUpperCase();
  }

  await createTransactionRecord({
    payment_intent_id: record.id,
    provider_transaction_id: refundTxId,
    type: 'refund',
    amount: refundAmount,
    currency: record.currency,
    status: 'succeeded',
    metadata: {
      saferpay_refund_id: refundTxId,
      saferpay_refund_status: refundStatus,
    },
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('unique') && !msg.includes('duplicate')) throw err;
  });

  const isFullRefund = refundAmount >= remaining;
  if (record.booking_id && isFullRefund) {
    await updateBookingPaymentState(record.booking_id, { depositPaid: false });
  }

  return {
    providerRefundId: refundTxId,
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
      const orderId = record.metadata?.order_id as string | undefined;
      if (!orderId) {
        result.skipped++;
        result.details.push({
          paymentIntentId: record.id,
          localStatus: before,
          providerStatus: 'missing order_id',
          action: 'skipped',
        });
        continue;
      }

      const after = await syncSaferpayPayment(orderId);

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
  return data as PaymentIntent;
}

export { eurToCents };
