// Phase 7: replaced mock adapter with real Supabase reads.
// Used by server components that need availability data server-side.
// The booking API routes (src/app/api/bookings/route.ts) use Supabase directly
// for overlap checks to keep atomic read-validate-insert logic in one place.

import { createServerSupabaseClient } from '@/lib/supabase';
import type { BookedRange, BookingCreateInput } from './booking.types';

export async function getBookedRanges(roomSlug: string): Promise<BookedRange[]> {
  try {
    const supabase = createServerSupabaseClient();

    const [bookingsRes, blockedRes, externalRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('room_slug', roomSlug)
        .neq('status', 'cancelled'),
      supabase
        .from('blocked_dates')
        .select('check_in, check_out')
        .eq('room_slug', roomSlug),
      // Phase 9: include imported iCal events in availability
      supabase
        .from('external_calendar_events')
        .select('starts_on, ends_on')
        .eq('room_slug', roomSlug),
    ]);

    return [
      ...(bookingsRes.data ?? []),
      ...(blockedRes.data ?? []),
      // Map starts_on/ends_on to BookedRange shape (check_in/check_out)
      ...(externalRes.data ?? []).map((e) => ({
        check_in: e.starts_on,
        check_out: e.ends_on,
      })),
    ];
  } catch (err) {
    console.error('[booking.repository] getBookedRanges:', err);
    return [];
  }
}

/**
 * Direct booking creation — thin wrapper used when creating bookings
 * outside of the HTTP API (e.g. admin server actions in future phases).
 * The public API route (POST /api/bookings) handles validation + overlap check
 * and calls Supabase directly for atomicity.
 */
export async function createBooking(
  data: BookingCreateInput & {
    nights: number;
    price_per_night: number;
    total_price: number;
    deposit: number;
  },
): Promise<{ id: string }> {
  const supabase = createServerSupabaseClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      room_slug: data.room_slug,
      check_in: data.check_in,
      check_out: data.check_out,
      nights: data.nights,
      guest_name: data.guest_name,
      guest_email: data.guest_email,
      guest_phone: data.guest_phone ?? null,
      adults: data.adults,
      children: data.children,
      price_per_night: data.price_per_night,
      total_price: data.total_price,
      deposit: data.deposit,
      status: 'pending',
      locale: data.locale ?? 'hr',
      notes: data.notes ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return { id: booking.id };
}
