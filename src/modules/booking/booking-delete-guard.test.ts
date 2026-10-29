import { describe, expect, it } from 'vitest';
import {
  bookingDeleteBlockedMessage,
  isHardDeleteBlockedByDeposit,
} from './booking-delete-guard';

describe('booking delete guard', () => {
  it('blokira hard-delete kad je deposit_paid', () => {
    expect(isHardDeleteBlockedByDeposit(true)).toBe(true);
    expect(isHardDeleteBlockedByDeposit(false)).toBe(false);
  });

  it('poruka predlaže otkazivanje umjesto brisanja', () => {
    expect(bookingDeleteBlockedMessage('deposit_paid')).toMatch(/Otkažite/i);
    expect(bookingDeleteBlockedMessage('payment_succeeded')).toMatch(/povijest plaćanja/i);
  });
});
