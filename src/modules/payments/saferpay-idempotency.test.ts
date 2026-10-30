import { describe, expect, it } from 'vitest';
import { formatSafeErrorMessage } from './safe-error';

/**
 * Dokumentira očekivano ponašanje idempotencije (bez stvarnog Saferpay/DB).
 * Pravi syncSaferpayPayment short-circuit je u payment.service.ts:
 * - intent.status === 'succeeded' → ensureMyRentSync (oporavak) pa return bez Capture
 * - confirmIfPending samo WHERE status=pending
 * - charge unique constraint guta duplicate
 * - MyRent greška nikad ne poništava succeeded / confirmed
 */

describe('Saferpay notify idempotency contracts', () => {
  it('provider_event_id je stabilan po orderId+result', () => {
    const orderId = 'f428613afc4a4211a73604878ef715bc';
    const eventId = `saferpay_${orderId}_success`;
    expect(eventId).toBe(
      'saferpay_f428613afc4a4211a73604878ef715bc_success',
    );
  });

  it('duplicate DB greška se prepoznaje iz safe message', () => {
    const msg = formatSafeErrorMessage({
      code: '23505',
      message: 'duplicate key value violates unique constraint',
    });
    expect(/unique|duplicate|23505/i.test(msg)).toBe(true);
  });

  it('webhook payload ne smije sadržavati PII polja u ugovoru', () => {
    const payload = { orderId: 'abc', result: 'success' as const };
    expect(payload).toEqual({ orderId: 'abc', result: 'success' });
    expect(payload).not.toHaveProperty('guest_email');
    expect(payload).not.toHaveProperty('card');
    expect(payload).not.toHaveProperty('password');
  });
});
