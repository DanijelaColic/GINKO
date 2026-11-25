import { describe, expect, it } from 'vitest';
import {
  PAYMENT_HOLD_MS,
  SAFERPAY_ABANDON_AFTER_MS,
  alignHoldWithSaferpayExpiration,
  classifyAssert,
  decideHoldRelease,
  decideMoneyMovement,
  failNotifyIsNotProof,
  holdUntilFrom,
  sessionCanStillBePaid,
  type AssertSnapshot,
  type BookingHoldView,
  type IntentView,
} from './payment-hold.policy';

const T0 = Date.parse('2027-01-15T10:00:00.000Z');

function abandonedWrongState(): AssertSnapshot {
  return {
    kind: 'error',
    httpStatus: 402,
    errorName: 'TRANSACTION_IN_WRONG_STATE',
    transactionId: null,
    behavior: 'DO_NOT_RETRY',
    errorDetail: ['Transaction still in progress or abandoned by the payer.'],
  };
}

function intent(partial: Partial<IntentView> = {}): IntentView {
  return {
    id: 'intent-1',
    status: 'requires_payment_method',
    createdAt: new Date(T0).toISOString(),
    redirectExpiresAt: new Date(T0 + 20 * 60 * 1000).toISOString(),
    hasToken: true,
    orderId: 'order-1',
    lastAssertAt: null,
    ...partial,
  };
}

function booking(partial: Partial<BookingHoldView> = {}): BookingHoldView {
  return {
    status: 'pending',
    depositPaid: false,
    paymentHoldUntil: new Date(T0 + PAYMENT_HOLD_MS).toISOString(),
    paymentFinalizingAt: null,
    paymentFinalizingIntentId: null,
    ...partial,
  };
}

describe('rok blokade i Saferpay Expiration', () => {
  it('blokada traje 30 minuta', () => {
    expect(Date.parse(holdUntilFrom(T0)) - T0).toBe(PAYMENT_HOLD_MS);
  });

  it('kasniji RedirectUrl Expiration produžuje blokadu', () => {
    const exp = new Date(T0 + 50 * 60 * 1000).toISOString();
    expect(Date.parse(alignHoldWithSaferpayExpiration(T0, exp))).toBe(
      T0 + 50 * 60 * 1000,
    );
  });

  it('kraći Expiration ne skraćuje 30 minuta', () => {
    const exp = new Date(T0 + 20 * 60 * 1000).toISOString();
    expect(Date.parse(alignHoldWithSaferpayExpiration(T0, exp)) - T0).toBe(
      PAYMENT_HOLD_MS,
    );
  });

  it('bez Expirationa u odgovoru ostaje 30 minuta; napuštena sesija ide do 1 h', () => {
    const row = intent({ redirectExpiresAt: null });
    expect(sessionCanStillBePaid(row, T0 + PAYMENT_HOLD_MS)).toBe(true);
    expect(sessionCanStillBePaid(row, T0 + SAFERPAY_ABANDON_AFTER_MS)).toBe(false);
  });
});

describe('Assert klasifikacija', () => {
  it('TRANSACTION_NOT_STARTED prije isteka sesije nije konačan neuspjeh', () => {
    const snap: AssertSnapshot = {
      kind: 'error',
      httpStatus: 400,
      errorName: 'TRANSACTION_NOT_STARTED',
      transactionId: null,
    };
    expect(classifyAssert(snap, intent(), T0 + 5 * 60 * 1000)).toBe('still_open');
  });

  it('TRANSACTION_NOT_STARTED nakon isteka RedirectUrl-a je konačan neuspjeh', () => {
    const snap: AssertSnapshot = {
      kind: 'error',
      httpStatus: 400,
      errorName: 'TRANSACTION_NOT_STARTED',
      transactionId: null,
    };
    const row = intent({
      redirectExpiresAt: new Date(T0 + 20 * 60 * 1000).toISOString(),
    });
    expect(classifyAssert(snap, row, T0 + 21 * 60 * 1000)).toBe('terminal_unpaid');
  });

  it('TOKEN_EXPIRED i TRANSACTION_ABORTED su konačan neuspjeh sesije', () => {
    for (const errorName of ['TOKEN_EXPIRED', 'TRANSACTION_ABORTED']) {
      expect(
        classifyAssert(
          { kind: 'error', httpStatus: 400, errorName, transactionId: null },
          intent(),
          T0,
        ),
      ).toBe('terminal_unpaid');
    }
  });

  it('COMMUNICATION_TIMEOUT i nedostupan Saferpay ostaju nejasni', () => {
    expect(
      classifyAssert(
        {
          kind: 'error',
          httpStatus: 500,
          errorName: 'COMMUNICATION_TIMEOUT',
          transactionId: null,
        },
        intent(),
        T0 + PAYMENT_HOLD_MS + 1000,
      ),
    ).toBe('uncertain');
    expect(classifyAssert({ kind: 'unreachable' }, intent(), T0)).toBe('uncertain');
  });

  it('nepoznat ErrorName ne oslobađa termin', () => {
    expect(
      classifyAssert(
        { kind: 'error', httpStatus: 400, errorName: 'SOMETHING_NEW', transactionId: null },
        intent(),
        T0 + PAYMENT_HOLD_MS + 1000,
      ),
    ).toBe('uncertain');
  });

  it('TRANSACTION_IN_WRONG_STATE bez dokumentiranog napuštanja nije konačan neuspjeh', () => {
    const afterHour = T0 + SAFERPAY_ABANDON_AFTER_MS + 1000;
    const row = intent({
      redirectExpiresAt: new Date(T0 + 20 * 60 * 1000).toISOString(),
      lastAssertClass: 'abandoned_unconfirmed',
    });
    expect(
      classifyAssert(
        {
          kind: 'error',
          httpStatus: 402,
          errorName: 'TRANSACTION_IN_WRONG_STATE',
          transactionId: null,
          behavior: 'RETRY',
          errorDetail: ['Transaction still in progress or abandoned by the payer.'],
        },
        row,
        afterHour,
      ),
    ).toBe('uncertain');
    expect(
      classifyAssert(
        {
          kind: 'error',
          httpStatus: 402,
          errorName: 'TRANSACTION_IN_WRONG_STATE',
          transactionId: null,
          behavior: 'DO_NOT_RETRY',
          errorDetail: ['Capture is not allowed in this state.'],
        },
        row,
        afterHour,
      ),
    ).toBe('uncertain');
  });

  it('prvi dokumentirani napušteni Assert ne otkazuje ni nakon oba roka', () => {
    const row = intent({
      redirectExpiresAt: new Date(T0 + 20 * 60 * 1000).toISOString(),
      lastAssertClass: null,
    });
    expect(
      classifyAssert(abandonedWrongState(), row, T0 + SAFERPAY_ABANDON_AFTER_MS + 1000),
    ).toBe('abandoned_unconfirmed');
  });

  it('ponovljeni napušteni Assert prije 60 minuta ili prije isteka RedirectUrl-a ne otkazuje', () => {
    const repeated = intent({
      redirectExpiresAt: new Date(T0 + 20 * 60 * 1000).toISOString(),
      lastAssertClass: 'abandoned_unconfirmed',
    });
    expect(
      classifyAssert(abandonedWrongState(), repeated, T0 + SAFERPAY_ABANDON_AFTER_MS - 1),
    ).toBe('abandoned_unconfirmed');

    const redirectOpen = intent({
      redirectExpiresAt: new Date(T0 + 70 * 60 * 1000).toISOString(),
      lastAssertClass: 'abandoned_unconfirmed',
    });
    expect(
      classifyAssert(
        abandonedWrongState(),
        redirectOpen,
        T0 + SAFERPAY_ABANDON_AFTER_MS + 1000,
      ),
    ).toBe('abandoned_unconfirmed');

    const noRedirect = intent({
      redirectExpiresAt: null,
      lastAssertClass: 'abandoned_unconfirmed',
    });
    expect(
      classifyAssert(abandonedWrongState(), noRedirect, T0 + SAFERPAY_ABANDON_AFTER_MS + 1000),
    ).toBe('abandoned_unconfirmed');
  });

  it('ponovljeni napušteni Assert nakon 60 minuta i isteka RedirectUrl-a je neuspjeh', () => {
    const row = intent({
      redirectExpiresAt: new Date(T0 + 20 * 60 * 1000).toISOString(),
      lastAssertClass: 'abandoned_unconfirmed',
    });
    expect(
      classifyAssert(abandonedWrongState(), row, T0 + SAFERPAY_ABANDON_AFTER_MS + 1000),
    ).toBe('terminal_unpaid');
  });

  it('autorizacija i dalje ima prednost nad prethodnim napuštenim Assertom', () => {
    const row = intent({ lastAssertClass: 'abandoned_unconfirmed' });
    expect(
      classifyAssert({ kind: 'authorized', transactionId: 'tx' }, row, T0),
    ).toBe('paid');
    expect(
      classifyAssert(
        { kind: 'captured', transactionId: 'tx', captureId: 'cap' },
        row,
        T0,
      ),
    ).toBe('paid');
  });

  it('AUTHORIZED i CAPTURED su plaćeno', () => {
    expect(
      classifyAssert(
        { kind: 'authorized', transactionId: 'tx' },
        intent(),
        T0,
      ),
    ).toBe('paid');
    expect(
      classifyAssert(
        { kind: 'captured', transactionId: 'tx', captureId: 'cap' },
        intent(),
        T0,
      ),
    ).toBe('paid');
  });

  it('fail notify sam nije dokaz da uplate nema', () => {
    expect(failNotifyIsNotProof()).toBe(false);
  });
});

describe('oslobađanje termina', () => {
  const after = T0 + PAYMENT_HOLD_MS + 1000;

  it('prije 30 minuta ne oslobađa', () => {
    expect(
      decideHoldRelease({
        booking: booking(),
        intents: [],
        classes: {},
        nowMs: T0 + PAYMENT_HOLD_MS - 1,
      }).action,
    ).toBe('keep');
  });

  it('nakon roka bez ijedne sesije oslobađa', () => {
    expect(
      decideHoldRelease({
        booking: booking(),
        intents: [],
        classes: {},
        nowMs: after,
      }),
    ).toEqual({ action: 'release' });
  });

  it('nepotvrđeni napušteni Assert ne oslobađa', () => {
    const row = intent();
    expect(
      decideHoldRelease({
        booking: booking(),
        intents: [row],
        classes: { [row.id]: 'abandoned_unconfirmed' },
        nowMs: after,
      }),
    ).toEqual({ action: 'keep', reason: 'abandoned_unconfirmed' });
  });

  it('nejasan Assert ne oslobađa', () => {
    const row = intent();
    expect(
      decideHoldRelease({
        booking: booking(),
        intents: [row],
        classes: { [row.id]: 'uncertain' },
        nowMs: after,
      }),
    ).toEqual({ action: 'keep', reason: 'uncertain' });
  });

  it('sesija koja se još može platiti ne oslobađa ni nakon 30 minuta', () => {
    const row = intent({
      redirectExpiresAt: new Date(T0 + 50 * 60 * 1000).toISOString(),
    });
    const hold = booking({
      paymentHoldUntil: new Date(T0 + 50 * 60 * 1000).toISOString(),
    });
    expect(
      decideHoldRelease({
        booking: hold,
        intents: [row],
        classes: { [row.id]: 'still_open' },
        nowMs: T0 + 40 * 60 * 1000,
      }).action,
    ).toBe('keep');
  });

  it('konačan neuspjeh nakon roka oslobađa', () => {
    const row = intent();
    expect(
      decideHoldRelease({
        booking: booking(),
        intents: [row],
        classes: { [row.id]: 'terminal_unpaid' },
        nowMs: after,
      }),
    ).toEqual({ action: 'release' });
  });

  it('plaćena autorizacija ide u potvrdu, ne u otkaz', () => {
    const row = intent();
    expect(
      decideHoldRelease({
        booking: booking(),
        intents: [row],
        classes: { [row.id]: 'paid' },
        nowMs: after,
      }),
    ).toEqual({ action: 'settle_paid', intentId: row.id });
  });

  it('svježi finalizing sprječava otkaz usred Capturea', () => {
    expect(
      decideHoldRelease({
        booking: booking({
          paymentFinalizingAt: new Date(after - 1000).toISOString(),
          paymentFinalizingIntentId: 'intent-1',
        }),
        intents: [intent()],
        classes: { 'intent-1': 'terminal_unpaid' },
        nowMs: after,
      }),
    ).toEqual({ action: 'keep', reason: 'finalizing' });
  });

  it('bez payment_hold_until (stari red) cron ne dira rezervaciju', () => {
    expect(
      decideHoldRelease({
        booking: booking({ paymentHoldUntil: null }),
        intents: [],
        classes: {},
        nowMs: after,
      }),
    ).toEqual({ action: 'skip', reason: 'no_deadline' });
  });
});

describe('zakašnjeli novac', () => {
  it('pending + AUTHORIZED ide u Capture i potvrdu', () => {
    expect(
      decideMoneyMovement({
        gate: 'proceed',
        snapshot: { kind: 'authorized', transactionId: 'tx' },
      }),
    ).toEqual({ action: 'capture_and_confirm' });
  });

  it('već CAPTURED ne radi drugi Capture, samo potvrdu', () => {
    expect(
      decideMoneyMovement({
        gate: 'proceed',
        snapshot: { kind: 'captured', transactionId: 'tx', captureId: 'cap' },
      }),
    ).toEqual({ action: 'confirm_captured' });
  });

  it('autorizacija nakon oslobođenog termina se poništava', () => {
    expect(
      decideMoneyMovement({
        gate: 'void_released',
        snapshot: { kind: 'authorized', transactionId: 'tx' },
      }),
    ).toEqual({ action: 'void_authorization', reason: 'booking_released' });
  });

  it('već povučena uplata nakon oslobođenja ide u povrat', () => {
    expect(
      decideMoneyMovement({
        gate: 'void_released',
        snapshot: { kind: 'captured', transactionId: 'tx', captureId: 'cap' },
      }),
    ).toEqual({ action: 'refund_capture', reason: 'booking_released' });
  });

  it('druga uspjela sesija poništava novu autorizaciju', () => {
    expect(
      decideMoneyMovement({
        gate: 'void_duplicate',
        snapshot: { kind: 'authorized', transactionId: 'tx' },
      }),
    ).toEqual({ action: 'void_authorization', reason: 'already_paid_other' });
  });

  it('paralelni Capture dobiva in_progress, ne drugi Capture', () => {
    expect(
      decideMoneyMovement({
        gate: 'in_progress',
        snapshot: { kind: 'authorized', transactionId: 'tx' },
      }),
    ).toEqual({ action: 'in_progress' });
  });

  it('već succeeded intent se ne provodi ponovno', () => {
    expect(
      decideMoneyMovement({
        gate: 'already_succeeded',
        snapshot: { kind: 'authorized', transactionId: 'tx' },
      }),
    ).toEqual({ action: 'already_done' });
  });
});
