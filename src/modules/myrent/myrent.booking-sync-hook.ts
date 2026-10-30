/**
 * Povezivanje s uspješnim Saferpay plaćanjem.
 * Ne mijenja naplatu ni email gostu — samo fire-and-forget sync pokušaj.
 */

import { createServerSupabaseClient } from '@/lib/supabase';
import { syncBookingToMyRentAfterPayment } from './myrent.booking-sync';
import type { BookingForMyRentSync } from './myrent.booking-payload';

/**
 * Učitaj booking (read-only) i pokreni MyRent sync nakon plaćanja.
 * Greške se gutaju / bilježe — nikad ne bacaju u Saferpay handler.
 */
export async function queueMyRentSyncAfterPayment(
  bookingId: string,
): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('bookings')
      .select(
        'id, room_slug, check_in, check_out, guest_name, guest_email, guest_phone, adults, children, total_price, deposit, deposit_paid, include_wellness, notes, status',
      )
      .eq('id', bookingId)
      .maybeSingle();

    if (error || !data) {
      console.error(
        '[myrent-sync] cannot load booking for sync:',
        bookingId,
        error?.message,
      );
      return;
    }

    const booking = data as BookingForMyRentSync;
    const result = await syncBookingToMyRentAfterPayment({
      ...booking,
      deposit_paid: true,
    });

    if (result?.adminAlert) {
      console.error(
        '[myrent-sync] ADMIN ALERT:',
        result.adminAlert.bookingId,
        result.adminAlert.message,
      );
    } else if (result?.record.status === 'mocked_ok') {
      console.info(
        '[myrent-sync] mock OK (nije live MyRent upis):',
        bookingId,
        'object',
        result.record.objectId,
      );
    } else if (result?.record.status === 'skipped_disabled') {
      console.info(
        '[myrent-sync] write disabled — nema MyRent upisa:',
        bookingId,
      );
    } else if (result?.record.status === 'uncertain') {
      console.error(
        '[myrent-sync] UNCERTAIN — bez auto-resenda, ručna provjera:',
        bookingId,
        result.record.error,
      );
    }
  } catch (err) {
    console.error(
      '[myrent-sync] queue after payment error:',
      bookingId,
      err instanceof Error ? err.message : err,
    );
  }
}

/** @deprecated Koristi queueMyRentSyncAfterPayment */
export const voidMyRentSyncAfterPayment = queueMyRentSyncAfterPayment;
