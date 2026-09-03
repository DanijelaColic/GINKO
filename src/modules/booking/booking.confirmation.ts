// Server-side booking confirmation payload — shared by API route and confirmation page.

import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyBookingViewToken } from '@/lib/bookingConfirmation';
import { getRoom, getRoomBySlug } from '@/modules/rooms/room.repository';
import { getValidLocale } from '@/i18n/messages';
import { formatDisplayDate, parseLocalDate, calculatePrice } from '@/modules/booking/dates';
import {
  RECIPIENT_IBAN,
  RECIPIENT_NAME,
  RECIPIENT_BIC,
  RECIPIENT_BANK_NAME,
  SITE_NAME,
} from '@/modules/booking/booking.config';
import type { BookingConfirmationData } from './booking.types';

export async function getBookingConfirmationData(
  bookingId: string,
  token: string,
  localeRaw?: string,
): Promise<BookingConfirmationData | null> {
  const trimmedToken = token.trim();
  if (!bookingId || !trimmedToken) return null;

  const locale = getValidLocale(localeRaw);

  try {
    const supabase = createServerSupabaseClient();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(
        'id, room_slug, check_in, check_out, nights, guest_name, guest_first_name, guest_email, total_price, deposit, deposit_paid, status, created_at, adults, children',
      )
      .eq('id', bookingId)
      .single();

    if (error || !booking) return null;

    if (!verifyBookingViewToken(trimmedToken, booking.id, booking.guest_email)) {
      return null;
    }

    const room =
      (await getRoom(booking.room_slug, locale)) ?? getRoomBySlug(booking.room_slug);
    if (!room) return null;

    const checkInDate = parseLocalDate(booking.check_in);
    const checkOutDate = parseLocalDate(booking.check_out);
    const pricePerNight =
      booking.nights > 0
        ? Math.round(booking.total_price / booking.nights)
        : booking.total_price;

    const priceBreakdown = calculatePrice(checkInDate, checkOutDate, room);

    return {
      id: booking.id,
      reference: `REZ-${booking.id.substring(0, 8).toUpperCase()}`,
      status: booking.status as BookingConfirmationData['status'],
      guestName: booking.guest_name,
      guestFirstName: (booking.guest_first_name as string | null) ?? null,
      guestEmail: booking.guest_email,
      roomName: room.name,
      room,
      checkIn: formatDisplayDate(checkInDate, locale),
      checkOut: formatDisplayDate(checkOutDate, locale),
      checkInIso: booking.check_in,
      checkOutIso: booking.check_out,
      nights: booking.nights,
      adults: booking.adults ?? 1,
      children: booking.children ?? 0,
      pricePerNight,
      totalPrice: booking.total_price,
      deposit: booking.deposit,
      depositPaid: booking.deposit_paid === true,
      priceBreakdown,
      createdAt: booking.created_at,
      payment: {
        recipient: RECIPIENT_NAME,
        iban: RECIPIENT_IBAN,
        bic: RECIPIENT_BIC,
        bankName: RECIPIENT_BANK_NAME,
        description: `Rezervacija ${SITE_NAME}`,
      },
    };
  } catch {
    return null;
  }
}
