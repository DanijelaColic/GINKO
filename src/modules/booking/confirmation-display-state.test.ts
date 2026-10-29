import { describe, expect, it } from 'vitest';
import {
  getGuestConfirmationViewState,
  shouldSendGuestConfirmationEmail,
} from './confirmation-display-state';

describe('getGuestConfirmationViewState', () => {
  it('deposit_paid + pending → paid_pending_confirm (ne confirmed)', () => {
    expect(
      getGuestConfirmationViewState({ status: 'pending', depositPaid: true }),
    ).toBe('paid_pending_confirm');
  });

  it('confirmed → confirmed čak i bez depositPaid flaga', () => {
    expect(
      getGuestConfirmationViewState({ status: 'confirmed', depositPaid: true }),
    ).toBe('confirmed');
    expect(
      getGuestConfirmationViewState({ status: 'confirmed', depositPaid: false }),
    ).toBe('confirmed');
  });

  it('pending bez uplate → unpaid', () => {
    expect(
      getGuestConfirmationViewState({ status: 'pending', depositPaid: false }),
    ).toBe('unpaid');
  });

  it('cancelled ima prednost', () => {
    expect(
      getGuestConfirmationViewState({ status: 'cancelled', depositPaid: true }),
    ).toBe('cancelled');
  });
});

describe('shouldSendGuestConfirmationEmail', () => {
  it('šalje samo kad je confirmed', () => {
    expect(shouldSendGuestConfirmationEmail('confirmed')).toBe(true);
    expect(shouldSendGuestConfirmationEmail('pending')).toBe(false);
    expect(shouldSendGuestConfirmationEmail('cancelled')).toBe(false);
  });
});
