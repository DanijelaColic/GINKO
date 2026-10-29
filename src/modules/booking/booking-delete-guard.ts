/**
 * Zaštita od hard-delete rezervacija s uspješnom naplatom.
 * Bez SQL migracije: otkaži (status=cancelled) umjesto brisanja — plaćanja ostaju.
 */

export type BookingDeleteBlockReason =
  | 'deposit_paid'
  | 'payment_succeeded'
  | 'not_found';

export function isHardDeleteBlockedByDeposit(depositPaid: boolean): boolean {
  return depositPaid === true;
}

export function bookingDeleteBlockedMessage(
  reason: BookingDeleteBlockReason,
): string {
  switch (reason) {
    case 'deposit_paid':
    case 'payment_succeeded':
      return (
        'Rezervacija ima evidentiranu uspješnu naplatu i ne smije se brisati. ' +
        'Otkažite je (status Otkazano) da sačuvate povijest plaćanja.'
      );
    case 'not_found':
      return 'Rezervacija nije pronađena.';
    default:
      return 'Brisanje nije dopušteno.';
  }
}
