/**
 * Atomski prijelazi sesije plaćanja.
 * Produkcija ih izvršava u Postgresu (FOR UPDATE + djelomični unique index).
 * In-memory implementacija je isti ugovor, serijaliziran po booking id-u,
 * da testovi pokriju paralelne zahtjeve bez baze.
 */

import {
  CHECKOUT_CLAIM_STALE_MS,
  PAYMENT_FINALIZING_GUARD_MS,
  holdUntilFrom,
  isOpenIntentStatus,
  parseTime,
  sessionCanStillBePaid,
  type CaptureGate,
  type IntentView,
} from './payment-hold.policy';

export type LockBooking = {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  depositPaid: boolean;
  paymentHoldUntil: string | null;
  paymentFinalizingAt: string | null;
  paymentFinalizingIntentId: string | null;
  paymentHoldReleasedAt: string | null;
};

export type LockIntent = {
  id: string;
  bookingId: string;
  status: string;
  createdAt: string;
  redirectExpiresAt: string | null;
  hasToken: boolean;
  orderId: string | null;
  amount: number;
  currency: string;
};

export type LockState = {
  bookings: Record<string, LockBooking | undefined>;
  intents: LockIntent[];
};

export type ClaimResult =
  | { result: 'claimed'; intentId: string }
  | { result: 'session_active'; intentId: string }
  | { result: 'needs_assert'; intentId: string; orderId: string | null }
  | { result: 'already_paid' }
  | { result: 'cancelled' }
  | { result: 'not_found' };

export function intentToView(intent: LockIntent): IntentView {
  return {
    id: intent.id,
    status: intent.status,
    createdAt: intent.createdAt,
    redirectExpiresAt: intent.redirectExpiresAt,
    hasToken: intent.hasToken,
    orderId: intent.orderId,
    lastAssertAt: null,
  };
}

function openIntents(state: LockState, bookingId: string): LockIntent[] {
  return state.intents.filter(
    (intent) => intent.bookingId === bookingId && isOpenIntentStatus(intent.status),
  );
}

function cloneState(state: LockState): LockState {
  return {
    bookings: Object.fromEntries(
      Object.entries(state.bookings).map(([id, booking]) => [
        id,
        booking ? { ...booking } : undefined,
      ]),
    ),
    intents: state.intents.map((intent) => ({ ...intent })),
  };
}

/**
 * Jedan otvoreni intent. Ako je claim bez tokena stariji od 2 min, nema
 * Saferpay sesije i smije se zatvoriti u istoj transakciji. Inače, ako se
 * sesija još može platiti → session_active. Ako je rok prošao, a token postoji
 * → needs_assert (ne otvaraj drugu sesiju prije Asserta).
 */
export function reduceClaim(
  state: LockState,
  bookingId: string,
  amount: number,
  currency: string,
  nowMs: number,
  newIntentId: string,
): { state: LockState; result: ClaimResult } {
  const next = cloneState(state);
  const booking = next.bookings[bookingId];
  if (!booking) return { state: next, result: { result: 'not_found' } };
  if (booking.status === 'cancelled') return { state: next, result: { result: 'cancelled' } };
  if (booking.status === 'confirmed' || booking.depositPaid) {
    return { state: next, result: { result: 'already_paid' } };
  }

  const open = openIntents(next, bookingId);
  const active = open[0];
  if (active) {
    const staleCreating =
      active.status === 'creating' &&
      !active.hasToken &&
      (parseTime(active.createdAt) ?? nowMs) + CHECKOUT_CLAIM_STALE_MS <= nowMs;

    if (staleCreating) {
      active.status = 'cancelled';
      if (openIntents(next, bookingId).length > 0) {
        return reduceClaim(next, bookingId, amount, currency, nowMs, newIntentId);
      }
    } else if (sessionCanStillBePaid(intentToView(active), nowMs)) {
      return {
        state: next,
        result: { result: 'session_active', intentId: active.id },
      };
    } else if (active.hasToken) {
      return {
        state: next,
        result: {
          result: 'needs_assert',
          intentId: active.id,
          orderId: active.orderId,
        },
      };
    } else {
      return {
        state: next,
        result: { result: 'session_active', intentId: active.id },
      };
    }
  }

  next.intents.push({
    id: newIntentId,
    bookingId,
    status: 'creating',
    createdAt: new Date(nowMs).toISOString(),
    redirectExpiresAt: null,
    hasToken: false,
    orderId: null,
    amount,
    currency,
  });

  const floor = holdUntilFrom(nowMs);
  const current = booking.paymentHoldUntil;
  booking.paymentHoldUntil = !current || floor > current ? floor : current;

  return { state: next, result: { result: 'claimed', intentId: newIntentId } };
}

/** Nakon terminalnog neuspjeha Asserta: zatvori tu sesiju i uzmi novi claim. */
export function reduceSupersede(
  state: LockState,
  bookingId: string,
  intentId: string,
  amount: number,
  currency: string,
  nowMs: number,
  newIntentId: string,
): { state: LockState; result: ClaimResult } {
  const next = cloneState(state);
  const booking = next.bookings[bookingId];
  if (!booking) return { state: next, result: { result: 'not_found' } };
  if (booking.status === 'cancelled') return { state: next, result: { result: 'cancelled' } };
  if (booking.status === 'confirmed' || booking.depositPaid) {
    return { state: next, result: { result: 'already_paid' } };
  }

  const target = next.intents.find((intent) => intent.id === intentId);
  if (target && isOpenIntentStatus(target.status)) target.status = 'cancelled';

  const stillOpen = openIntents(next, bookingId);
  if (stillOpen.length > 0) {
    return {
      state: next,
      result: { result: 'session_active', intentId: stillOpen[0].id },
    };
  }

  return reduceClaim(next, bookingId, amount, currency, nowMs, newIntentId);
}

export function reduceComplete(
  state: LockState,
  intentId: string,
  token: string,
  orderId: string,
  redirectExpiresAt: string | null,
  holdUntil: string,
): { state: LockState; ok: boolean } {
  const next = cloneState(state);
  const intent = next.intents.find((row) => row.id === intentId);
  if (!intent || intent.status !== 'creating') return { state: next, ok: false };

  intent.status = 'requires_payment_method';
  intent.hasToken = true;
  intent.orderId = orderId;
  intent.redirectExpiresAt = redirectExpiresAt;

  const booking = next.bookings[intent.bookingId];
  if (booking) {
    const current = booking.paymentHoldUntil;
    booking.paymentHoldUntil = !current || holdUntil > current ? holdUntil : current;
  }

  return { state: next, ok: true };
}

export function reduceAbort(state: LockState, intentId: string): LockState {
  const next = cloneState(state);
  const intent = next.intents.find((row) => row.id === intentId);
  if (intent && intent.status === 'creating') intent.status = 'cancelled';
  return next;
}

/**
 * Compare-and-set: samo jedan poziv smije ući u Capture.
 * Isti intent, dok je finalizing svjež, dobije in_progress.
 * Nakon PAYMENT_FINALIZING_GUARD_MS jedan novi pokušaj smije proći.
 */
export function reduceBeginCapture(
  state: LockState,
  bookingId: string,
  intentId: string,
  nowMs: number,
): { state: LockState; gate: CaptureGate } {
  const next = cloneState(state);
  const booking = next.bookings[bookingId];
  if (!booking || booking.status === 'cancelled') {
    return { state: next, gate: 'void_released' };
  }
  if (booking.status === 'confirmed' || booking.depositPaid) {
    return { state: next, gate: 'void_duplicate' };
  }

  const otherPaid = next.intents.some(
    (intent) =>
      intent.bookingId === bookingId &&
      intent.id !== intentId &&
      intent.status === 'succeeded',
  );
  if (otherPaid) return { state: next, gate: 'void_duplicate' };

  const intent = next.intents.find((row) => row.id === intentId);
  if (intent?.status === 'succeeded') return { state: next, gate: 'already_succeeded' };

  const finalizingAt = parseTime(booking.paymentFinalizingAt);
  const stale =
    finalizingAt != null && nowMs - finalizingAt >= PAYMENT_FINALIZING_GUARD_MS;
  const free = booking.paymentFinalizingAt == null;

  if (!free && !stale) {
    return { state: next, gate: 'in_progress' };
  }

  booking.paymentFinalizingAt = new Date(nowMs).toISOString();
  booking.paymentFinalizingIntentId = intentId;
  return { state: next, gate: 'proceed' };
}

export function reduceClearFinalizing(
  state: LockState,
  bookingId: string,
  intentId: string,
): LockState {
  const next = cloneState(state);
  const booking = next.bookings[bookingId];
  if (booking && booking.paymentFinalizingIntentId === intentId) {
    booking.paymentFinalizingAt = null;
    booking.paymentFinalizingIntentId = null;
  }
  return next;
}

/** Otkaz samo ako je red još pending, neplaćen i capture nije u tijeku. */
export function reduceRelease(
  state: LockState,
  bookingId: string,
  nowMs: number,
): { state: LockState; released: boolean } {
  const next = cloneState(state);
  const booking = next.bookings[bookingId];
  if (!booking) return { state: next, released: false };
  if (booking.status !== 'pending' || booking.depositPaid) {
    return { state: next, released: false };
  }
  const deadline = parseTime(booking.paymentHoldUntil);
  if (deadline == null || nowMs < deadline) return { state: next, released: false };

  const finalizingAt = parseTime(booking.paymentFinalizingAt);
  if (
    finalizingAt != null &&
    nowMs - finalizingAt < PAYMENT_FINALIZING_GUARD_MS
  ) {
    return { state: next, released: false };
  }

  booking.status = 'cancelled';
  booking.paymentHoldReleasedAt = new Date(nowMs).toISOString();
  booking.paymentFinalizingAt = null;
  booking.paymentFinalizingIntentId = null;
  return { state: next, released: true };
}

export type PaymentLock = {
  claim(
    bookingId: string,
    amount: number,
    currency: string,
    nowMs: number,
  ): Promise<ClaimResult>;
  supersede(
    bookingId: string,
    intentId: string,
    amount: number,
    currency: string,
    nowMs: number,
  ): Promise<ClaimResult>;
  complete(
    intentId: string,
    token: string,
    orderId: string,
    redirectExpiresAt: string | null,
    holdUntil: string,
  ): Promise<boolean>;
  abort(intentId: string): Promise<void>;
  beginCapture(bookingId: string, intentId: string, nowMs: number): Promise<CaptureGate>;
  clearFinalizing(bookingId: string, intentId: string): Promise<void>;
  releaseIfUnpaid(bookingId: string, nowMs: number): Promise<boolean>;
};

function exclusive<T>(queues: Map<string, Promise<void>>, key: string, fn: () => T | Promise<T>) {
  const prev = queues.get(key) ?? Promise.resolve();
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = prev.then(() => gate);
  queues.set(key, tail);
  return prev.then(async () => {
    try {
      return await fn();
    } finally {
      release();
    }
  });
}

export function createInMemoryPaymentLock(initial: LockState): PaymentLock & {
  snapshot: () => LockState;
} {
  let state = cloneState(initial);
  const queues = new Map<string, Promise<void>>();
  let seq = 0;

  const bookingKey = (bookingId: string) => `booking:${bookingId}`;

  return {
    snapshot: () => cloneState(state),
    claim(bookingId, amount, currency, nowMs) {
      return exclusive(queues, bookingKey(bookingId), () => {
        const id = `intent-${++seq}`;
        const reduced = reduceClaim(state, bookingId, amount, currency, nowMs, id);
        state = reduced.state;
        return reduced.result;
      });
    },
    supersede(bookingId, intentId, amount, currency, nowMs) {
      return exclusive(queues, bookingKey(bookingId), () => {
        const id = `intent-${++seq}`;
        const reduced = reduceSupersede(
          state,
          bookingId,
          intentId,
          amount,
          currency,
          nowMs,
          id,
        );
        state = reduced.state;
        return reduced.result;
      });
    },
    complete(intentId, token, orderId, redirectExpiresAt, holdUntil) {
      const intent = state.intents.find((row) => row.id === intentId);
      const key = bookingKey(intent?.bookingId ?? intentId);
      return exclusive(queues, key, () => {
        const reduced = reduceComplete(
          state,
          intentId,
          token,
          orderId,
          redirectExpiresAt,
          holdUntil,
        );
        state = reduced.state;
        return reduced.ok;
      });
    },
    abort(intentId) {
      const intent = state.intents.find((row) => row.id === intentId);
      const key = bookingKey(intent?.bookingId ?? intentId);
      return exclusive(queues, key, () => {
        state = reduceAbort(state, intentId);
      });
    },
    beginCapture(bookingId, intentId, nowMs) {
      return exclusive(queues, bookingKey(bookingId), () => {
        const reduced = reduceBeginCapture(state, bookingId, intentId, nowMs);
        state = reduced.state;
        return reduced.gate;
      });
    },
    clearFinalizing(bookingId, intentId) {
      return exclusive(queues, bookingKey(bookingId), () => {
        state = reduceClearFinalizing(state, bookingId, intentId);
      });
    },
    releaseIfUnpaid(bookingId, nowMs) {
      return exclusive(queues, bookingKey(bookingId), () => {
        const reduced = reduceRelease(state, bookingId, nowMs);
        state = reduced.state;
        return reduced.released;
      });
    },
  };
}
