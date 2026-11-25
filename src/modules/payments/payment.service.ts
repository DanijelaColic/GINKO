// Payment service — Saferpay Payment Page + notify + refund.

import {
  getSaferpayConfig,
  saferpayRequest,
  type PaymentPageAssertResponse,
  type PaymentPageInitializeResponse,
  type TransactionCaptureResponse,
  type TransactionRefundResponse,
} from './saferpay.client';
import {
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
import { recheckAvailabilityBeforeBookingConfirm } from '@/modules/booking/availability.service';
import { queueMyRentSyncAfterPayment } from '@/modules/myrent/myrent.booking-sync-hook';
import { formatSafeErrorMessage } from './safe-error';
import { createSupabasePaymentLock } from './payment-hold.supabase-lock';
import { startLockedCheckout } from './payment-hold.checkout';
import { classifyAssert, decideMoneyMovement, type AssertSnapshot, type CaptureGate } from './payment-hold.policy';
import {
  captureOutcomeUnknown,
  isTransactionAlreadyCaptured,
  snapshotFromAssertBody,
  snapshotFromSaferpayError,
} from './payment-hold.saferpay';

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

/**
 * Nakon uspješne naplate: svježi re-check dostupnosti (isključujući vlastiti red),
 * zatim potvrda + email + MyRent sync queue.
 * Ako je termin zauzet / MyRent down: označi depozit plaćen, NE potvrđuj automatski,
 * NE šalji mail gostu, NE syncaj u MyRent (admin mora riješiti).
 * Ne mijenja Saferpay Capture — samo lokalnu potvrdu nakon plaćanja.
 */
/**
 * Zabilježi na payment_intent da je naplata OK, ali potvrda bookinga blokirana.
 * Admin vidi: booking.deposit_paid + status=pending + metadata.confirm_blocked.
 */
async function markBookingConfirmBlocked(
  bookingId: string,
  reason: string,
  message: string,
): Promise<void> {
  try {
    const intent = await getPaymentIntentByBookingId(bookingId);
    if (!intent) return;
    await updatePaymentIntentStatus(intent.provider_payment_id, intent.status, {
      confirm_blocked: true,
      confirm_blocked_reason: reason,
      confirm_blocked_message: message.slice(0, 200),
      confirm_blocked_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(
      '[payments] markBookingConfirmBlocked failed:',
      bookingId,
      formatSafeErrorMessage(err),
    );
  }
}

async function confirmBookingAfterPayment(
  bookingId: string,
): Promise<'confirmed' | 'blocked' | 'cancelled'> {
  const availability = await recheckAvailabilityBeforeBookingConfirm(bookingId);

  if (!availability.ok) {
    // Otkazana (hold release) rezervacija ne smije dobiti deposit_paid.
    // Zakašnjeli novac ide u Cancel/Refund prije ovog poziva.
    if (availability.reason === 'booking_cancelled') {
      return 'cancelled';
    }
    // Plaćeno, ali nije potvrđeno — jasan admin signal (pending + deposit_paid)
    await updateBookingPaymentState(bookingId, { depositPaid: true });
    await markBookingConfirmBlocked(
      bookingId,
      availability.reason,
      availability.message,
    );
    console.error(
      '[availability] re-check prije potvrde nije prošao — depozit bilježen, bez auto-confirm/email/MyRent:',
      bookingId,
      availability.reason,
      availability.message,
    );
    return 'blocked';
  }

  const { confirmed } = await updateBookingPaymentState(bookingId, {
    confirmIfPending: true,
    depositPaid: true,
  });

  // Uspješna potvrda — očisti eventualni stari confirm_blocked flag
  if (confirmed) {
    try {
      const intent = await getPaymentIntentByBookingId(bookingId);
      if (intent?.metadata?.confirm_blocked) {
        await updatePaymentIntentStatus(intent.provider_payment_id, intent.status, {
          confirm_blocked: false,
          confirm_blocked_cleared_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error(
        '[payments] clear confirm_blocked failed:',
        bookingId,
        formatSafeErrorMessage(err),
      );
    }

    void notifyGuestBookingConfirmed(bookingId).catch((err) =>
      console.error(
        '[email] notifyGuestBookingConfirmed:',
        formatSafeErrorMessage(err),
      ),
    );
  }

  // Await — Vercel inače može zamrznuti funkciju prije MyRent POST/reconcile.
  // Greške se gutaju: naplata / confirmed status već su zapisani.
  await ensureMyRentSyncAfterSuccessfulPayment(bookingId);
  return 'confirmed';
}

/**
 * Pouzdan pokušaj MyRent synca nakon uspješnog plaćanja.
 * Nikad ne baca — ne smije utjecati na Saferpay ishod ni booking confirm.
 * Idempotentno: claim / live_ok / uncertain blokiraju drugi POST.
 */
export async function ensureMyRentSyncAfterSuccessfulPayment(
  bookingId: string,
): Promise<void> {
  try {
    await queueMyRentSyncAfterPayment(bookingId);
  } catch (err) {
    console.error(
      '[myrent-sync] ensureMyRentSyncAfterSuccessfulPayment:',
      bookingId,
      formatSafeErrorMessage(err),
    );
  }
}

function centsToSaferpayValue(cents: number): string {
  return String(Math.round(cents));
}

// ── Create Payment Page session ───────────────────────────────────

export class PaymentCheckoutRejectedError extends Error {
  readonly code: 'session_active' | 'already_paid' | 'cancelled' | 'not_found' | 'unclear';

  constructor(
    code: 'session_active' | 'already_paid' | 'cancelled' | 'not_found' | 'unclear',
  ) {
    super(code);
    this.name = 'PaymentCheckoutRejectedError';
    this.code = code;
  }
}

export class PaymentSettlementInProgressError extends Error {
  constructor() {
    super('payment_settlement_in_progress');
    this.name = 'PaymentSettlementInProgressError';
  }
}

/**
 * Create a Saferpay Payment Page session for a booking deposit.
 * Jedna živa sesija po rezervaciji (Postgres claim). Returns redirect URL.
 */
export async function createCheckoutSession(
  input: CreatePaymentIntentInput & { returnBasePath: string },
): Promise<{ url: string } & PaymentIntentResult> {
  const { customerId, terminalId } = getSaferpayConfig();
  const siteUrl = getSiteUrl();
  const languageCode = toSaferpayLanguageCode(input.languageCode);
  const lock = createSupabasePaymentLock();

  const started = await startLockedCheckout({
    bookingId: input.booking_id,
    amountCents: input.amount_cents,
    currency: (input.currency ?? 'eur').toLowerCase(),
    nowMs: Date.now(),
    lock,
    initialize: async () => {
      const orderId = crypto.randomUUID().replace(/-/g, '').slice(0, 32);
      const returnUrl = `${siteUrl}${input.returnBasePath}&payment=return&oid=${orderId}`;
      const notifyBase = `${siteUrl}/api/webhooks/saferpay?oid=${orderId}`;
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
          Payer: { LanguageCode: languageCode },
          ReturnUrl: { Url: returnUrl },
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
      return {
        token: init.Token,
        redirectUrl: init.RedirectUrl,
        expiration: init.Expiration ?? null,
        orderId,
      };
    },
    assertIntent: async (_intentId, orderId) => {
      if (!orderId) return { kind: 'unreachable' };
      const existing = await getPaymentIntentByOrderId(orderId);
      const token =
        (existing?.metadata?.saferpay_token as string | undefined) ??
        existing?.provider_payment_id;
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
    },
    settlePaid: async (orderId) => {
      await syncSaferpayPayment(orderId);
    },
  });

  if (!started.ok) {
    throw new PaymentCheckoutRejectedError(started.reason);
  }

  try {
    await updatePaymentIntentStatus(started.token, 'requires_payment_method', {
      saferpay_customer_id: customerId,
      payment_type: input.metadata?.payment_type ?? 'deposit',
      ...(input.metadata ?? {}),
    });
  } catch (err) {
    console.error(
      '[payments] checkout metadata:',
      formatSafeErrorMessage(err),
    );
  }

  return {
    url: started.url,
    id: started.intentId,
    provider_payment_id: started.token,
    client_secret: '',
    amount: input.amount_cents,
    currency: (input.currency ?? 'eur').toLowerCase(),
    status: 'requires_payment_method',
  };
}

// ── Assert + Capture (return URL + notify + reconcile) ────────────

/**
 * Finalize a Saferpay Payment Page session (Assert → Capture ili Cancel/Refund).
 * Fail notify NIJE dokaz neuspjeha: uvijek ide Assert.
 * Capture ide tek nakon compare-and-set zaključavanja rezervacije.
 */
export async function syncSaferpayPayment(
  orderId: string,
  _opts: { failedNotify?: boolean } = {},
): Promise<PaymentIntentStatus | null> {
  const record = await getPaymentIntentByOrderId(orderId);
  if (!record) {
    console.warn('[saferpay] sync: no matching payment_intent for oid', orderId);
    return null;
  }

  if (record.status === 'succeeded') {
    if (record.booking_id) {
      const outcome = await confirmBookingAfterPayment(record.booking_id);
      if (outcome === 'cancelled') {
        const transactionId = record.metadata?.saferpay_transaction_id;
        const captureId = record.metadata?.saferpay_capture_id;
        if (typeof transactionId === 'string') {
          await settleLateMoney({
            bookingId: record.booking_id,
            intent: record,
            transactionId,
            captureId: typeof captureId === 'string' ? captureId : transactionId,
            action: 'refund_capture',
            reason: 'booking_released',
          });
        }
        return 'cancelled';
      }
    }
    return 'succeeded';
  }

  if (!record.booking_id) {
    console.error('[payments] sync without booking_id', record.id);
    return record.status;
  }

  const token =
    (record.metadata?.saferpay_token as string | undefined) ??
    record.provider_payment_id;
  if (!token || token.startsWith('creating:')) return record.status;

  let snapshot: AssertSnapshot;
  try {
    const body = await saferpayRequest<PaymentPageAssertResponse>(
      '/Payment/v1/PaymentPage/Assert',
      { Token: token },
    );
    snapshot = snapshotFromAssertBody(body);
  } catch (err) {
    snapshot = snapshotFromSaferpayError(err);
    if (snapshot.kind !== 'error' && snapshot.kind !== 'unreachable') throw err;
  }

  const intentView = {
    id: record.id,
    status: record.status,
    createdAt: record.created_at,
    redirectExpiresAt:
      typeof record.metadata?.saferpay_redirect_expires_at === 'string'
        ? record.metadata.saferpay_redirect_expires_at
        : null,
    hasToken: true,
    orderId,
    lastAssertAt: null,
  };
  const klass = classifyAssert(snapshot, intentView, Date.now());

  if (klass !== 'paid') {
    if (klass === 'terminal_unpaid') {
      await updatePaymentIntentStatus(record.provider_payment_id, 'cancelled', {
        saferpay_assert_error:
          snapshot.kind === 'error' ? snapshot.errorName : klass,
      });
      return 'cancelled';
    }
    await updatePaymentIntentStatus(record.provider_payment_id, record.status, {
      saferpay_last_assert_at: new Date().toISOString(),
      saferpay_last_assert_class: klass,
      saferpay_assert_error: snapshot.kind === 'error' ? snapshot.errorName : null,
    });
    return record.status;
  }

  const lock = createSupabasePaymentLock();
  const gate: CaptureGate = await lock.beginCapture(
    record.booking_id,
    record.id,
    Date.now(),
  );
  const action = decideMoneyMovement({ gate, snapshot });

  if (action.action === 'in_progress') {
    throw new PaymentSettlementInProgressError();
  }
  if (action.action === 'already_done') {
    await confirmBookingAfterPayment(record.booking_id);
    return 'succeeded';
  }

  const transactionId =
    snapshot.kind === 'authorized' || snapshot.kind === 'captured'
      ? snapshot.transactionId
      : null;
  if (!transactionId) return record.status;

  if (action.action === 'void_authorization' || action.action === 'refund_capture') {
    await settleLateMoney({
      bookingId: record.booking_id,
      intent: record,
      transactionId,
      captureId: snapshot.kind === 'captured' ? snapshot.captureId : null,
      action: action.action,
      reason: action.reason,
    });
    return 'cancelled';
  }

  let captureId = snapshot.kind === 'captured' ? snapshot.captureId : null;
  let finalStatus = snapshot.kind === 'captured' ? 'CAPTURED' : 'AUTHORIZED';
  // Prekid veze nakon Capturea ostavlja zaključavanje. Paralelni poziv
  // dobije in_progress umjesto drugog Capturea.
  let releaseFinalizing = true;

  try {
    if (action.action === 'capture_and_confirm') {
      try {
        const capture = await saferpayRequest<TransactionCaptureResponse>(
          '/Payment/v1/Transaction/Capture',
          { TransactionReference: { TransactionId: transactionId } },
        );
        captureId = capture.CaptureId ?? transactionId;
        finalStatus = (capture.Status ?? 'CAPTURED').toUpperCase();
      } catch (err) {
        if (isTransactionAlreadyCaptured(err)) {
          captureId = captureId ?? transactionId;
          finalStatus = 'CAPTURED';
        } else if (captureOutcomeUnknown(err)) {
          releaseFinalizing = false;
          throw err;
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
    });

    if (newStatus === 'succeeded') {
      await createTransactionRecord({
        payment_intent_id: record.id,
        provider_transaction_id: transactionId,
        type: 'charge',
        amount: record.amount,
        currency: record.currency,
        status: 'succeeded',
        metadata: { source: 'saferpay_assert', order_id: orderId, capture_id: captureId },
      }).catch((err: unknown) => {
        const msg = formatSafeErrorMessage(err);
        if (!/unique|duplicate|23505/i.test(msg)) throw err;
      });
      const outcome = await confirmBookingAfterPayment(record.booking_id);
      if (outcome === 'cancelled') {
        await settleLateMoney({
          bookingId: record.booking_id,
          intent: record,
          transactionId,
          captureId: captureId ?? transactionId,
          action: 'refund_capture',
          reason: 'booking_released',
        });
        return 'cancelled';
      }
    }
    return newStatus;
  } finally {
    if (releaseFinalizing) {
      await lock.clearFinalizing(record.booking_id, record.id);
    }
  }
}

async function settleLateMoney(input: {
  bookingId: string;
  intent: PaymentIntent;
  transactionId: string;
  captureId: string | null;
  action: 'void_authorization' | 'refund_capture';
  reason: 'booking_released' | 'already_paid_other';
}): Promise<void> {
  const supabase = createServerSupabaseClient();
  const released = input.reason === 'booking_released';
  try {
    if (input.action === 'void_authorization') {
      await saferpayRequest('/Payment/v1/Transaction/Cancel', {
        TransactionReference: { TransactionId: input.transactionId },
      });
    } else {
      await saferpayRequest<TransactionRefundResponse>(
        '/Payment/v1/Transaction/Refund',
        {
          Refund: {
            Amount: {
              Value: centsToSaferpayValue(input.intent.amount),
              CurrencyCode: input.intent.currency.toUpperCase(),
            },
          },
          CaptureReference: {
            CaptureId: input.captureId ?? input.transactionId,
          },
        },
      );
    }

    await updatePaymentIntentStatus(input.intent.provider_payment_id, 'cancelled', {
      late_payment_action: input.action,
      late_payment_reason: input.reason,
    });

    const message =
      input.action === 'void_authorization'
        ? released
          ? 'Zakašnjela autorizacija stigla je nakon oslobođenog termina. Autorizacija je poništena (Transaction Cancel). Novac nije zadržan. Provjerite Saferpay.'
          : 'Druga sesija je autorizirana nakon što je depozit već plaćen. Autorizacija je poništena da ne bi bilo dvostruke naplate. Provjerite Saferpay.'
        : released
          ? 'Zakašnjela naplata stigla je nakon oslobođenog termina. Iznos je vraćen (Refund). Rezervacija nije ponovno potvrđena. Provjerite Saferpay.'
          : 'Druga naplata je vraćena jer je depozit već bio plaćen. Provjerite Saferpay.';

    await supabase.from('payment_admin_alerts').insert({
      booking_id: input.bookingId,
      payment_intent_id: input.intent.id,
      kind:
        input.action === 'void_authorization'
          ? 'late_authorization_voided'
          : 'late_capture_refunded',
      message,
    });
  } catch (err) {
    const detail = formatSafeErrorMessage(err);
    await supabase.from('payment_admin_alerts').insert({
      booking_id: input.bookingId,
      payment_intent_id: input.intent.id,
      kind: 'late_payment_needs_review',
      message:
        `Zakašnjela uplata nije automatski poništena (${detail}). ` +
        'Ručna provjera u Saferpayu. Rezervacija se ne potvrđuje iz ovog koraka.',
    });
    throw err;
  }
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
    const msg = formatSafeErrorMessage(err);
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
      const msg = formatSafeErrorMessage(err);
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
