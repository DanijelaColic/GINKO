/**
 * Jedna Saferpay sesija po rezervaciji.
 * needs_assert: prvo Assert, pa tek onda nova sesija ako je uplata sigurno nemoguća.
 */

import {
  alignHoldWithSaferpayExpiration,
  classifyAssert,
  type AssertSnapshot,
} from './payment-hold.policy';
import type { ClaimResult, PaymentLock } from './payment-hold.lock';

export type CheckoutStart =
  | { ok: true; url: string; intentId: string; token: string }
  | {
      ok: false;
      reason: 'session_active' | 'already_paid' | 'cancelled' | 'not_found' | 'unclear';
    };

export type InitializeResult = {
  token: string;
  redirectUrl: string;
  expiration: string | null;
  orderId: string;
};

export async function startLockedCheckout(input: {
  bookingId: string;
  amountCents: number;
  currency: string;
  nowMs: number;
  lock: PaymentLock;
  initialize: (intentId: string) => Promise<InitializeResult>;
  assertIntent: (intentId: string, orderId: string | null) => Promise<AssertSnapshot>;
  settlePaid: (orderId: string) => Promise<void>;
}): Promise<CheckoutStart> {
  let claim = await input.lock.claim(
    input.bookingId,
    input.amountCents,
    input.currency,
    input.nowMs,
  );

  if (claim.result === 'needs_assert') {
    const snapshot = await input.assertIntent(claim.intentId, claim.orderId);
    const klass = classifyAssert(
      snapshot,
      {
        id: claim.intentId,
        status: 'requires_payment_method',
        createdAt: new Date(input.nowMs - 60 * 60 * 1000).toISOString(),
        redirectExpiresAt: new Date(input.nowMs - 1000).toISOString(),
        hasToken: true,
        orderId: claim.orderId,
        lastAssertAt: null,
      },
      input.nowMs,
    );

    if (klass === 'paid') {
      if (claim.orderId) await input.settlePaid(claim.orderId);
      return { ok: false, reason: 'already_paid' };
    }
    if (klass !== 'terminal_unpaid') {
      return { ok: false, reason: 'unclear' };
    }

    claim = await input.lock.supersede(
      input.bookingId,
      claim.intentId,
      input.amountCents,
      input.currency,
      input.nowMs,
    );
  }

  return finishClaim(claim, input);
}

async function finishClaim(
  claim: ClaimResult,
  input: {
    bookingId: string;
    nowMs: number;
    lock: PaymentLock;
    initialize: (intentId: string) => Promise<InitializeResult>;
  },
): Promise<CheckoutStart> {
  if (claim.result === 'session_active') {
    return { ok: false, reason: 'session_active' };
  }
  if (claim.result === 'already_paid') return { ok: false, reason: 'already_paid' };
  if (claim.result === 'cancelled') return { ok: false, reason: 'cancelled' };
  if (claim.result === 'not_found') return { ok: false, reason: 'not_found' };
  if (claim.result === 'needs_assert') return { ok: false, reason: 'unclear' };
  if (claim.result !== 'claimed') return { ok: false, reason: 'unclear' };

  try {
    const session = await input.initialize(claim.intentId);
    const holdUntil = alignHoldWithSaferpayExpiration(input.nowMs, session.expiration);
    const saved = await input.lock.complete(
      claim.intentId,
      session.token,
      session.orderId,
      session.expiration,
      holdUntil,
    );
    if (!saved) {
      await input.lock.abort(claim.intentId);
      return { ok: false, reason: 'session_active' };
    }
    return {
      ok: true,
      url: session.redirectUrl,
      intentId: claim.intentId,
      token: session.token,
    };
  } catch (err) {
    await input.lock.abort(claim.intentId);
    throw err;
  }
}
