/**
 * Admin-facing razlikovanje plaćanja vs potvrde rezervacije.
 * Koristi postojeća polja (deposit_paid + status) — bez nove migracije.
 */

export type BookingPaymentAdminState =
  | 'cancelled'
  | 'unpaid_pending'
  | 'unpaid_confirmed'
  | 'paid_confirmed'
  /** Depozit plaćen, ali status još nije confirmed (npr. availability re-check fail) */
  | 'paid_unconfirmed';

export type BookingPaymentStateInput = {
  status: string;
  deposit_paid: boolean;
};

export function getBookingPaymentAdminState(
  booking: BookingPaymentStateInput,
): BookingPaymentAdminState {
  if (booking.status === 'cancelled') return 'cancelled';
  if (booking.deposit_paid && booking.status === 'confirmed') return 'paid_confirmed';
  if (booking.deposit_paid && booking.status === 'pending') return 'paid_unconfirmed';
  if (!booking.deposit_paid && booking.status === 'confirmed') return 'unpaid_confirmed';
  return 'unpaid_pending';
}

export function bookingPaymentAdminLabel(state: BookingPaymentAdminState): string {
  switch (state) {
    case 'paid_confirmed':
      return 'Plaćeno i potvrđeno';
    case 'paid_unconfirmed':
      return 'Plaćeno — nije potvrđeno';
    case 'unpaid_confirmed':
      return 'Potvrđeno — depozit nije plaćen';
    case 'unpaid_pending':
      return 'Na čekanju — nije plaćeno';
    case 'cancelled':
      return 'Otkazano';
    default:
      return state;
  }
}

export function isPaidUnconfirmedBooking(booking: BookingPaymentStateInput): boolean {
  return getBookingPaymentAdminState(booking) === 'paid_unconfirmed';
}
