/**
 * Gostu vidljiv status na /booking/confirmation.
 * „Potvrđeno” samo kad je bookings.status === 'confirmed'.
 */

export type GuestConfirmationViewState =
  | 'unpaid'
  | 'paid_pending_confirm'
  | 'confirmed'
  | 'cancelled';

export type GuestConfirmationInput = {
  status: string;
  depositPaid: boolean;
};

export function getGuestConfirmationViewState(
  input: GuestConfirmationInput,
): GuestConfirmationViewState {
  if (input.status === 'cancelled') return 'cancelled';
  if (input.status === 'confirmed') return 'confirmed';
  if (input.depositPaid === true) return 'paid_pending_confirm';
  return 'unpaid';
}

/** Smije li se slati gostu email „Rezervacija potvrđena”? */
export function shouldSendGuestConfirmationEmail(status: string): boolean {
  return status === 'confirmed';
}
