/**
 * Privremena blokada neplaćene rezervacije i odluka o Saferpay ishodu.
 *
 * Službeni Saferpay JSON API 1.55 (PaymentPage Initialize):
 * zahtjev NEMA argument Expiration. Expiration je obavezan u ODGOVORU i
 * označava rok RedirectUrl-a: nakon tog vremena URL se više ne može otvoriti.
 * Token se nakon isteka ne prima ni za što osim Asserta.
 *
 * Integration guide (Payment Page):
 * - obična sesija ne traje dulje od ~20 minuta; uz 3-D Secure može do ~1 sata
 * - Init stariji od jednog sata smije se zatvoriti tek NAKON Asserta
 * - TRANSACTION_NOT_STARTED = „try again later”, nije konačan neuspjeh
 * - COMMUNICATION_TIMEOUT = autorizacija je možda nastala, a Saferpay to ne zna
 * - ako je narudžba već plaćena, drugu autorizaciju treba Cancel, ne Capture
 *
 * Gostu obećavamo najmanje 30 minuta. Ako Saferpay vrati kasniji Expiration,
 * blokada se produžuje do tog roka da se termin ne oslobodi dok se još može platiti.
 */

export const PAYMENT_HOLD_MS = 30 * 60 * 1000;

/** Integration guide: init stariji od 1 h smije se smatrati napuštenim nakon Asserta. */
export const SAFERPAY_ABANDON_AFTER_MS = 60 * 60 * 1000;

/** Claim bez tokena: Initialize još traje. Nakon ovoga nema žive Saferpay sesije. */
export const CHECKOUT_CLAIM_STALE_MS = 2 * 60 * 1000;

/** Dok je capture u tijeku, cron ne smije otkazati rezervaciju. */
export const PAYMENT_FINALIZING_GUARD_MS = 10 * 60 * 1000;

/** Ne zovi Assert iznova na nejasnom ishodu češće od ovoga (nije polling stranice). */
export const UNCERTAIN_ASSERT_COOLDOWN_MS = 15 * 60 * 1000;

export const OPEN_INTENT_STATUSES = [
  'creating',
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'processing',
  'requires_capture',
] as const;

/**
 * Konačan neuspjeh ove sesije. Izvor: JSON API ErrorName.
 * TRANSACTION_NOT_STARTED ovdje namjerno nije — ovisi o roku sesije.
 */
export const TERMINAL_UNPAID_ERROR_NAMES = [
  'TOKEN_EXPIRED',
  'TOKEN_INVALID',
  'TRANSACTION_ABORTED',
  'TRANSACTION_DECLINED',
  'GENERAL_DECLINED',
  'PAYMENTMEANS_INVALID',
  'PAYMENTMEANS_NOT_SUPPORTED',
  '3DS_AUTHENTICATION_FAILED',
] as const;

const UNCERTAIN_ERROR_NAMES = [
  'COMMUNICATION_TIMEOUT',
  'COMMUNICATION_FAILED',
  'INTERNAL_ERROR',
  'UNEXPECTED_ERROR_BY_ACQUIRER',
] as const;

export type AssertSnapshot =
  | { kind: 'authorized'; transactionId: string }
  | { kind: 'captured'; transactionId: string; captureId: string | null }
  | { kind: 'pending'; transactionId: string | null; status: string }
  | {
      kind: 'error';
      httpStatus: number | null;
      errorName: string | null;
      transactionId: string | null;
    }
  | { kind: 'unreachable' };

export type AssertClass = 'paid' | 'terminal_unpaid' | 'still_open' | 'uncertain';

export type IntentView = {
  id: string;
  status: string;
  createdAt: string;
  redirectExpiresAt: string | null;
  hasToken: boolean;
  orderId: string | null;
  lastAssertAt: string | null;
  lastAssertClass?: string | null;
};

export type BookingHoldView = {
  status: string;
  depositPaid: boolean;
  paymentHoldUntil: string | null;
  paymentFinalizingAt: string | null;
  paymentFinalizingIntentId: string | null;
};

export type ReleaseDecision =
  | { action: 'skip'; reason: 'not_pending' | 'deposit_paid' | 'no_deadline' }
  | { action: 'keep'; reason: 'hold_open' | 'finalizing' | 'still_payable' | 'uncertain' }
  | { action: 'release' }
  | { action: 'settle_paid'; intentId: string };

export type MoneyAction =
  | { action: 'capture_and_confirm' }
  | { action: 'confirm_captured' }
  | { action: 'already_done' }
  | { action: 'void_authorization'; reason: 'booking_released' | 'already_paid_other' }
  | { action: 'refund_capture'; reason: 'booking_released' | 'already_paid_other' }
  | { action: 'in_progress' };

export type CaptureGate =
  | 'proceed'
  | 'void_released'
  | 'void_duplicate'
  | 'already_succeeded'
  | 'in_progress';

export function parseTime(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

export function holdUntilFrom(nowMs: number): string {
  return new Date(nowMs + PAYMENT_HOLD_MS).toISOString();
}

/**
 * Blokada je barem 30 minuta od ovog pokušaja i barem do Saferpay RedirectUrl
 * Expirationa. Kraći Expiration ne skraćuje 30 minuta.
 */
export function alignHoldWithSaferpayExpiration(
  nowMs: number,
  saferpayRedirectExpiresAt: string | null,
): string {
  let until = nowMs + PAYMENT_HOLD_MS;
  const exp = parseTime(saferpayRedirectExpiresAt);
  if (exp != null && exp > until) until = exp;
  return new Date(until).toISOString();
}

export function isOpenIntentStatus(status: string): boolean {
  return (OPEN_INTENT_STATUSES as readonly string[]).includes(status);
}

/**
 * Do kada se OVA sesija još može platiti.
 * null = ne znamo (neispravan datum) → tretiraj kao još otvorenu.
 */
export function sessionPayableUntilMs(intent: IntentView): number | null {
  if (!isOpenIntentStatus(intent.status)) return intentCreatedOrNull(intent);

  if (intent.status === 'creating' && !intent.hasToken) {
    const created = parseTime(intent.createdAt);
    if (created == null) return null;
    return created + CHECKOUT_CLAIM_STALE_MS;
  }

  if (intent.redirectExpiresAt) {
    return parseTime(intent.redirectExpiresAt);
  }

  const created = parseTime(intent.createdAt);
  if (created == null) return null;
  return created + SAFERPAY_ABANDON_AFTER_MS;
}

function intentCreatedOrNull(intent: IntentView): number | null {
  return parseTime(intent.createdAt);
}

export function sessionCanStillBePaid(intent: IntentView, nowMs: number): boolean {
  if (!isOpenIntentStatus(intent.status)) return false;
  const until = sessionPayableUntilMs(intent);
  if (until == null) return true;
  return nowMs < until;
}

export function classifyAssert(
  snapshot: AssertSnapshot,
  intent: IntentView,
  nowMs: number,
): AssertClass {
  if (snapshot.kind === 'unreachable') return 'uncertain';
  if (snapshot.kind === 'authorized' || snapshot.kind === 'captured') return 'paid';
  if (snapshot.kind === 'pending') return 'uncertain';

  const name = (snapshot.errorName ?? '').toUpperCase();
  if (!name || snapshot.httpStatus == null) return 'uncertain';

  if ((UNCERTAIN_ERROR_NAMES as readonly string[]).includes(name)) return 'uncertain';

  if (name === 'TRANSACTION_NOT_STARTED') {
    return sessionCanStillBePaid(intent, nowMs) ? 'still_open' : 'terminal_unpaid';
  }

  if ((TERMINAL_UNPAID_ERROR_NAMES as readonly string[]).includes(name)) {
    return 'terminal_unpaid';
  }

  return 'uncertain';
}

export function recentUncertain(intent: IntentView, nowMs: number): boolean {
  const at = parseTime(intent.lastAssertAt);
  if (at == null) return false;
  return nowMs - at < UNCERTAIN_ASSERT_COOLDOWN_MS;
}

export function decideHoldRelease(input: {
  booking: BookingHoldView;
  intents: IntentView[];
  classes: Record<string, AssertClass | undefined>;
  nowMs: number;
}): ReleaseDecision {
  const booking = input.booking;
  if (booking.status !== 'pending') return { action: 'skip', reason: 'not_pending' };
  if (booking.depositPaid) return { action: 'skip', reason: 'deposit_paid' };

  const deadline = parseTime(booking.paymentHoldUntil);
  if (deadline == null) return { action: 'skip', reason: 'no_deadline' };
  if (input.nowMs < deadline) return { action: 'keep', reason: 'hold_open' };

  const finalizingAt = parseTime(booking.paymentFinalizingAt);
  if (
    finalizingAt != null &&
    input.nowMs - finalizingAt < PAYMENT_FINALIZING_GUARD_MS
  ) {
    return { action: 'keep', reason: 'finalizing' };
  }

  if (input.intents.some((intent) => intent.status === 'succeeded')) {
    const paid = input.intents.find((intent) => intent.status === 'succeeded');
    return { action: 'settle_paid', intentId: paid?.id ?? input.intents[0].id };
  }

  let uncertain = false;
  let stillPayable = false;
  let paidId: string | null = null;

  for (const intent of input.intents) {
    if (intent.status === 'cancelled' || intent.status === 'succeeded') continue;
    const klass = input.classes[intent.id];
    if (klass === 'paid') paidId = intent.id;
    else if (klass === 'uncertain' || klass == null) uncertain = true;
    else if (klass === 'still_open' || sessionCanStillBePaid(intent, input.nowMs)) {
      stillPayable = true;
    }
  }

  if (paidId) return { action: 'settle_paid', intentId: paidId };
  if (uncertain) return { action: 'keep', reason: 'uncertain' };
  if (stillPayable) return { action: 'keep', reason: 'still_payable' };
  return { action: 'release' };
}

export function decideMoneyMovement(input: {
  gate: CaptureGate;
  snapshot: AssertSnapshot;
}): MoneyAction {
  if (input.gate === 'in_progress') return { action: 'in_progress' };
  if (input.gate === 'already_succeeded') return { action: 'already_done' };

  const paid = input.snapshot.kind === 'authorized' || input.snapshot.kind === 'captured';
  if (!paid) return { action: 'already_done' };

  if (input.gate === 'proceed') {
    return input.snapshot.kind === 'captured'
      ? { action: 'confirm_captured' }
      : { action: 'capture_and_confirm' };
  }

  const reason = input.gate === 'void_released' ? 'booking_released' : 'already_paid_other';
  if (input.snapshot.kind === 'captured') return { action: 'refund_capture', reason };
  return { action: 'void_authorization', reason };
}

/** Fail notify sam po sebi nije dokaz da uplate nema. */
export function failNotifyIsNotProof(): false {
  return false;
}
