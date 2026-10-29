import { describe, expect, it } from 'vitest';
import {
  bookingPaymentAdminLabel,
  getBookingPaymentAdminState,
  isPaidUnconfirmedBooking,
} from './booking-payment-state';

describe('booking payment admin state', () => {
  it('razlikuje plaćeno+potvrđeno od plaćeno+nepotvrđeno', () => {
    expect(
      getBookingPaymentAdminState({ status: 'confirmed', deposit_paid: true }),
    ).toBe('paid_confirmed');
    expect(
      getBookingPaymentAdminState({ status: 'pending', deposit_paid: true }),
    ).toBe('paid_unconfirmed');
    expect(
      isPaidUnconfirmedBooking({ status: 'pending', deposit_paid: true }),
    ).toBe(true);
    expect(
      isPaidUnconfirmedBooking({ status: 'confirmed', deposit_paid: true }),
    ).toBe(false);
  });

  it('labele su jasne za admina', () => {
    expect(bookingPaymentAdminLabel('paid_unconfirmed')).toMatch(/nije potvrđeno/i);
    expect(bookingPaymentAdminLabel('paid_confirmed')).toMatch(/potvrđeno/i);
  });

  it('neplaćeni pending', () => {
    expect(
      getBookingPaymentAdminState({ status: 'pending', deposit_paid: false }),
    ).toBe('unpaid_pending');
  });
});
