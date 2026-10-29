/**
 * Serverska provjera: smije li se hard-delete booking.
 * Plaćene rezervacije → otkaži, ne briši (čuva payment_intents).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  bookingDeleteBlockedMessage,
  type BookingDeleteBlockReason,
} from './booking-delete-guard';

export type BookingDeleteCheckResult =
  | { allowed: true }
  | { allowed: false; reason: BookingDeleteBlockReason; message: string };

export async function checkBookingHardDeleteAllowed(
  supabase: SupabaseClient,
  bookingId: string,
): Promise<BookingDeleteCheckResult> {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, deposit_paid')
    .eq('id', bookingId)
    .maybeSingle();

  if (error) throw error;
  if (!booking) {
    return {
      allowed: false,
      reason: 'not_found',
      message: bookingDeleteBlockedMessage('not_found'),
    };
  }

  if (booking.deposit_paid === true) {
    return {
      allowed: false,
      reason: 'deposit_paid',
      message: bookingDeleteBlockedMessage('deposit_paid'),
    };
  }

  const { data: paidIntent, error: intentError } = await supabase
    .from('payment_intents')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('status', 'succeeded')
    .limit(1)
    .maybeSingle();

  if (intentError) throw intentError;

  if (paidIntent) {
    return {
      allowed: false,
      reason: 'payment_succeeded',
      message: bookingDeleteBlockedMessage('payment_succeeded'),
    };
  }

  return { allowed: true };
}
