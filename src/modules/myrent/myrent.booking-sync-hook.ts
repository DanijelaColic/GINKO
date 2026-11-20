/**
 * Povezivanje s uspješnim Saferpay plaćanjem.
 * Ne mijenja naplatu ni email gostu — samo fire-and-forget sync pokušaj.
 * Sync samo ako je booking u DB: status=confirmed AND deposit_paid=true.
 */

import { createServerSupabaseClient } from '@/lib/supabase';
import { getMyRentSyncStore } from './myrent.sync-store';
import { syncBookingToMyRentAfterPayment } from './myrent.booking-sync';
import type { BookingForMyRentSync } from './myrent.booking-payload';
import { ensureMyRentDepositPaymentSync } from './myrent.payment-sync';

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

    // Ne forsiraj deposit_paid — samo stvarno stanje iz Supabasea
    if (booking.status !== 'confirmed' || booking.deposit_paid !== true) {
      console.info(
        '[myrent-sync] skip — booking nije confirmed+deposit_paid:',
        bookingId,
        `status=${booking.status}`,
        `deposit_paid=${booking.deposit_paid}`,
      );
      return;
    }

    const result = await syncBookingToMyRentAfterPayment(booking);

    const rentId =
      result?.record.myrentRentId ??
      (await getMyRentSyncStore().get(bookingId))?.myrentRentId ??
      null;
    const rentGuid =
      result?.record.myrentRentGuid ??
      (await getMyRentSyncStore().get(bookingId))?.myrentRentGuid ??
      null;
    const rentReady =
      result?.record.status === 'live_ok' ||
      (result?.record.status === 'skipped_duplicate' && Boolean(rentId));
    if (rentReady && rentId) {
      const paymentResult = await ensureMyRentDepositPaymentSync({
        booking,
        myrentRentId: rentId,
        myrentRentGuid: rentGuid,
      });
      if (paymentResult?.adminAlert) {
        console.error(
          '[myrent-payment-sync] UNCERTAIN — bez auto-resenda:',
          bookingId,
          paymentResult.adminAlert.message,
        );
      } else if (paymentResult?.record.status === 'live_ok') {
        console.info(
          '[myrent-payment-sync] live_ok:',
          bookingId,
          'rent',
          rentId,
          'amount',
          paymentResult.record.amount,
        );
      } else if (paymentResult?.record.status === 'skipped_disabled') {
        console.info(
          '[myrent-payment-sync] skipped (gate/disabled):',
          bookingId,
          paymentResult.record.error,
        );
      }
    }

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
        '[myrent-sync] write disabled / live gate — nema MyRent upisa:',
        bookingId,
      );
    } else if (result?.record.status === 'live_ok') {
      console.info(
        '[myrent-sync] live_ok:',
        bookingId,
        'rent',
        result.record.myrentRentId,
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
