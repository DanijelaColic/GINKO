import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PAYMENT_FINALIZING_GUARD_MS,
  PAYMENT_HOLD_MS,
  SAFERPAY_ABANDON_AFTER_MS,
} from './payment-hold.policy';
import { SaferpayApiError } from './saferpay.client';
import {
  captureOutcomeUnknown,
  isTransactionAlreadyCaptured,
} from './payment-hold.saferpay';
import {
  createInMemoryPaymentLock,
  reduceBeginCapture,
  reduceRelease,
  type LockState,
} from './payment-hold.lock';
import { startLockedCheckout } from './payment-hold.checkout';
import { releaseOneHold } from './payment-hold.release';

const T0 = Date.parse('2027-01-15T10:00:00.000Z');

function pendingState(): LockState {
  return {
    bookings: {
      b1: {
        id: 'b1',
        status: 'pending',
        depositPaid: false,
        paymentHoldUntil: new Date(T0 + PAYMENT_HOLD_MS).toISOString(),
        paymentFinalizingAt: null,
        paymentFinalizingIntentId: null,
        paymentHoldReleasedAt: null,
      },
    },
    intents: [],
  };
}

describe('atomsko zaključavanje sesije', () => {
  it('dva istovremena checkouta otvaraju samo jednu sesiju', async () => {
    const lock = createInMemoryPaymentLock(pendingState());
    let inits = 0;
    const start = () =>
      startLockedCheckout({
        bookingId: 'b1',
        amountCents: 3000,
        currency: 'eur',
        nowMs: T0,
        lock,
        initialize: async () => {
          inits += 1;
          await new Promise((resolve) => setTimeout(resolve, 15));
          return {
            token: `tok-${inits}`,
            redirectUrl: 'https://test.saferpay.com/vt2/api/PaymentPage/1',
            expiration: new Date(T0 + 20 * 60 * 1000).toISOString(),
            orderId: `order-${inits}`,
          };
        },
        assertIntent: async () => ({ kind: 'unreachable' }),
        settlePaid: async () => undefined,
      });

    const [a, b] = await Promise.all([start(), start()]);
    const oks = [a, b].filter((row) => row.ok);
    const blocked = [a, b].filter((row) => !row.ok && row.reason === 'session_active');
    expect(inits).toBe(1);
    expect(oks).toHaveLength(1);
    expect(blocked).toHaveLength(1);
    expect(lock.snapshot().intents.filter((row) => row.status !== 'cancelled')).toHaveLength(1);
  });

  it('ponovljeni klik dok je sesija živa ne radi drugi Initialize', async () => {
    const lock = createInMemoryPaymentLock(pendingState());
    let inits = 0;
    const once = () =>
      startLockedCheckout({
        bookingId: 'b1',
        amountCents: 3000,
        currency: 'eur',
        nowMs: T0,
        lock,
        initialize: async () => {
          inits += 1;
          return {
            token: 'tok',
            redirectUrl: 'https://test.saferpay.com/pay',
            expiration: new Date(T0 + 20 * 60 * 1000).toISOString(),
            orderId: 'order-1',
          };
        },
        assertIntent: async () => ({ kind: 'unreachable' }),
        settlePaid: async () => undefined,
      });

    expect((await once()).ok).toBe(true);
    const again = await once();
    expect(again).toEqual({ ok: false, reason: 'session_active' });
    expect(inits).toBe(1);
  });

  it('nakon konačnog neuspjeha gost smije otvoriti novu sesiju', async () => {
    const state = pendingState();
    state.intents.push({
      id: 'old',
      bookingId: 'b1',
      status: 'requires_payment_method',
      createdAt: new Date(T0).toISOString(),
      redirectExpiresAt: new Date(T0 + 20 * 60 * 1000).toISOString(),
      hasToken: true,
      orderId: 'order-old',
      amount: 3000,
      currency: 'eur',
    });
    const lock = createInMemoryPaymentLock(state);
    const now = T0 + 21 * 60 * 1000;
    const result = await startLockedCheckout({
      bookingId: 'b1',
      amountCents: 3000,
      currency: 'eur',
      nowMs: now,
      lock,
      initialize: async () => ({
        token: 'tok-2',
        redirectUrl: 'https://test.saferpay.com/pay-2',
        expiration: new Date(now + 20 * 60 * 1000).toISOString(),
        orderId: 'order-2',
      }),
      assertIntent: async () => ({
        kind: 'error',
        httpStatus: 400,
        errorName: 'TRANSACTION_ABORTED',
        transactionId: null,
      }),
      settlePaid: async () => undefined,
    });
    expect(result.ok).toBe(true);
    const live = lock.snapshot().intents.filter((row) => row.status !== 'cancelled');
    expect(live).toHaveLength(1);
    expect(live[0]?.orderId).toBe('order-2');
  });

  it('nejasan Assert ne otvara drugu sesiju', async () => {
    const state = pendingState();
    state.intents.push({
      id: 'old',
      bookingId: 'b1',
      status: 'requires_payment_method',
      createdAt: new Date(T0).toISOString(),
      redirectExpiresAt: new Date(T0 + 20 * 60 * 1000).toISOString(),
      hasToken: true,
      orderId: 'order-old',
      amount: 3000,
      currency: 'eur',
    });
    const lock = createInMemoryPaymentLock(state);
    let inits = 0;
    const result = await startLockedCheckout({
      bookingId: 'b1',
      amountCents: 3000,
      currency: 'eur',
      nowMs: T0 + 21 * 60 * 1000,
      lock,
      initialize: async () => {
        inits += 1;
        return {
          token: 'x',
          redirectUrl: 'https://test.saferpay.com/x',
          expiration: null,
          orderId: 'new',
        };
      },
      assertIntent: async () => ({ kind: 'unreachable' }),
      settlePaid: async () => undefined,
    });
    expect(result).toEqual({ ok: false, reason: 'unclear' });
    expect(inits).toBe(0);
  });
});

describe('compare-and-set prije Capturea', () => {
  it('dva paralelna beginCapture: jedan proceed, drugi in_progress', async () => {
    const lock = createInMemoryPaymentLock(pendingState());
    const [a, b] = await Promise.all([
      lock.beginCapture('b1', 'intent-a', T0),
      lock.beginCapture('b1', 'intent-b', T0),
    ]);
    expect([a, b].sort()).toEqual(['in_progress', 'proceed']);
  });

  it('svježi drugi poziv istog intenta ne šalje drugi Capture', () => {
    const first = reduceBeginCapture(pendingState(), 'b1', 'intent-a', T0);
    const second = reduceBeginCapture(first.state, 'b1', 'intent-a', T0 + 1000);
    expect(first.gate).toBe('proceed');
    expect(second.gate).toBe('in_progress');
  });

  it('isti intent smije ponovno u Capture tek nakon guarda', () => {
    const first = reduceBeginCapture(pendingState(), 'b1', 'intent-a', T0);
    const second = reduceBeginCapture(
      first.state,
      'b1',
      'intent-a',
      T0 + PAYMENT_FINALIZING_GUARD_MS,
    );
    expect(second.gate).toBe('proceed');
  });

  it('otkazana rezervacija dobiva void, ne Capture', () => {
    const state = pendingState();
    state.bookings.b1!.status = 'cancelled';
    expect(reduceBeginCapture(state, 'b1', 'intent-a', T0).gate).toBe('void_released');
  });

  it('release ne prolazi dok finalizing traje ni prije roka', () => {
    const early = reduceRelease(pendingState(), 'b1', T0 + 1000);
    expect(early.released).toBe(false);

    const started = reduceBeginCapture(pendingState(), 'b1', 'intent-a', T0 + PAYMENT_HOLD_MS);
    const blocked = reduceRelease(started.state, 'b1', T0 + PAYMENT_HOLD_MS + 1000);
    expect(blocked.released).toBe(false);
  });

  it('release prolazi samo na još pending i neplaćenom redu', () => {
    const released = reduceRelease(pendingState(), 'b1', T0 + PAYMENT_HOLD_MS);
    expect(released.released).toBe(true);
    expect(released.state.bookings.b1?.status).toBe('cancelled');

    const again = reduceRelease(released.state, 'b1', T0 + PAYMENT_HOLD_MS + 1000);
    expect(again.released).toBe(false);
  });
});

describe('release nakon Asserta', () => {
  it('ne otkazuje kad Saferpay nije dostupan', async () => {
    let cancelled = false;
    const outcome = await releaseOneHold({
      booking: {
        status: 'pending',
        depositPaid: false,
        paymentHoldUntil: new Date(T0 + PAYMENT_HOLD_MS).toISOString(),
        paymentFinalizingAt: null,
        paymentFinalizingIntentId: null,
      },
      intents: [
        {
          id: 'i1',
          status: 'requires_payment_method',
          createdAt: new Date(T0).toISOString(),
          redirectExpiresAt: new Date(T0 + 20 * 60 * 1000).toISOString(),
          hasToken: true,
          orderId: 'o1',
          lastAssertAt: null,
        },
      ],
      nowMs: T0 + PAYMENT_HOLD_MS + 1000,
      assertIntent: async () => ({ kind: 'unreachable' }),
      settlePaid: async () => undefined,
      markIntentUnpaid: async () => undefined,
      rememberAssert: async () => undefined,
      releaseIfUnpaid: async () => {
        cancelled = true;
        return true;
      },
    });
    expect(outcome).toEqual({ action: 'kept', reason: 'uncertain' });
    expect(cancelled).toBe(false);
  });

  it('otkazuje tek kad je Assert siguran neuspjeh i release CAS prođe', async () => {
    let marked = 0;
    let released = false;
    const outcome = await releaseOneHold({
      booking: {
        status: 'pending',
        depositPaid: false,
        paymentHoldUntil: new Date(T0 + PAYMENT_HOLD_MS).toISOString(),
        paymentFinalizingAt: null,
        paymentFinalizingIntentId: null,
      },
      intents: [
        {
          id: 'i1',
          status: 'requires_payment_method',
          createdAt: new Date(T0).toISOString(),
          redirectExpiresAt: new Date(T0 + 20 * 60 * 1000).toISOString(),
          hasToken: true,
          orderId: 'o1',
          lastAssertAt: null,
        },
      ],
      nowMs: T0 + PAYMENT_HOLD_MS + 1000,
      assertIntent: async () => ({
        kind: 'error',
        httpStatus: 400,
        errorName: 'TOKEN_EXPIRED',
        transactionId: null,
      }),
      settlePaid: async () => undefined,
      markIntentUnpaid: async () => {
        marked += 1;
      },
      rememberAssert: async () => undefined,
      releaseIfUnpaid: async () => {
        released = true;
        return true;
      },
    });
    expect(outcome).toEqual({ action: 'released' });
    expect(marked).toBe(1);
    expect(released).toBe(true);
  });

  it('plaćen Assert ne otkazuje, nego predaje settle', async () => {
    let settled = false;
    let released = false;
    const outcome = await releaseOneHold({
      booking: {
        status: 'pending',
        depositPaid: false,
        paymentHoldUntil: new Date(T0 + PAYMENT_HOLD_MS).toISOString(),
        paymentFinalizingAt: null,
        paymentFinalizingIntentId: null,
      },
      intents: [
        {
          id: 'i1',
          status: 'requires_payment_method',
          createdAt: new Date(T0).toISOString(),
          redirectExpiresAt: null,
          hasToken: true,
          orderId: 'o1',
          lastAssertAt: null,
        },
      ],
      nowMs: T0 + SAFERPAY_ABANDON_AFTER_MS + PAYMENT_HOLD_MS,
      assertIntent: async () => ({ kind: 'authorized', transactionId: 'tx' }),
      settlePaid: async () => {
        settled = true;
      },
      markIntentUnpaid: async () => undefined,
      rememberAssert: async () => undefined,
      releaseIfUnpaid: async () => {
        released = true;
        return true;
      },
    });
    expect(outcome).toEqual({ action: 'settled' });
    expect(settled).toBe(true);
    expect(released).toBe(false);
  });
});

describe('SQL zaključavanje', () => {
  const sql = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/020_payment_hold.sql'),
    'utf8',
  );

  it('claim uzima FOR UPDATE i drži jedan otvoreni intent', () => {
    expect(sql).toMatch(/for update/i);
    expect(sql).toMatch(/payment_intents_one_open_per_booking/);
    expect(sql).toContain("status = 'creating'");
  });

  it('Capture je compare-and-set preko payment_finalizing_at', () => {
    expect(sql).toContain('payment_finalizing_at');
    expect(sql).toContain('payment_finalizing_intent_id');
    expect(sql).toMatch(/void_released/);
    expect(sql).toMatch(/in_progress/);
    expect(sql).not.toContain('or payment_finalizing_intent_id = p_intent_id');
  });

  it('nepoznat ishod Capturea drži zaključavanje', () => {
    const timeout = new SaferpayApiError(
      504,
      { ErrorName: 'COMMUNICATION_TIMEOUT', ErrorMessage: 'timeout' },
      'timeout',
    );
    const declined = new SaferpayApiError(
      402,
      { ErrorName: 'TRANSACTION_DECLINED', ErrorMessage: 'declined' },
      'declined',
    );
    const already = new SaferpayApiError(
      400,
      {
        ErrorName: 'TRANSACTION_ALREADY_CAPTURED',
        ErrorMessage: 'Transaction already captured',
      },
      'already',
    );
    expect(captureOutcomeUnknown(new TypeError('fetch failed'))).toBe(true);
    expect(captureOutcomeUnknown(timeout)).toBe(true);
    expect(captureOutcomeUnknown(declined)).toBe(false);
    expect(captureOutcomeUnknown(already)).toBe(false);
    expect(isTransactionAlreadyCaptured(already)).toBe(true);
    expect(isTransactionAlreadyCaptured(declined)).toBe(false);
  });

  it('payment_admin_alerts je samo za service_role', () => {
    expect(sql).toMatch(
      /create policy "Service role full access payment_admin_alerts"\s+on payment_admin_alerts\s+to service_role/i,
    );
    expect(sql).toContain(
      'revoke all on table public.payment_admin_alerts from public, anon, authenticated',
    );
    expect(sql).toContain(
      'grant all on table public.payment_admin_alerts to service_role',
    );
  });

  it('release traži pending, neplaćeno i istekao hold', () => {
    expect(sql).toMatch(/deposit_paid = false/);
    expect(sql).toMatch(/status = 'pending'/);
    expect(sql).toContain('payment_hold_until');
    expect(sql).toContain('payment_hold_released_at');
  });
});
