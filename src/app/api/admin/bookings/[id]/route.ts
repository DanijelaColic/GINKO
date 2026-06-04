// Copied from Villa-Jurina/src/app/api/admin/bookings/[id]/route.ts
// Adaptations: apartment_slug → room_slug, email via @/lib/email
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import { getRoomBySlug } from '@/modules/rooms/room.repository';
import { parseLocalDate, diffDays, calculatePrice } from '@/modules/booking/dates';
import { sendConfirmationEmail } from '@/lib/email';
import { createBookingViewToken, getBookingConfirmationUrl } from '@/lib/bookingConfirmation';
import type { Booking } from '@/modules/booking/booking.types';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/bookings/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const updates: Partial<Booking> & Record<string, unknown> = await request.json();

  const supabase = createServerSupabaseClient();

  if (updates._resend_email === true) {
    const { data: booking } = await supabase.from('bookings').select('*').eq('id', id).single();
    if (!booking) return NextResponse.json({ error: 'Nije pronađeno' }, { status: 404 });

    const room = getRoomBySlug(booking.room_slug);
    if (booking.guest_email) {
      const token = createBookingViewToken(booking.id, booking.guest_email);
      const confirmationUrl = getBookingConfirmationUrl(booking.id, token);
      const locale =
        booking.locale === 'en' || booking.locale === 'de' ? booking.locale : 'hr';

      await sendConfirmationEmail({
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        guestPhone: booking.guest_phone,
        roomName: room?.name ?? booking.room_slug,
        checkIn: parseLocalDate(booking.check_in),
        checkOut: parseLocalDate(booking.check_out),
        nights: booking.nights,
        totalPrice: booking.total_price,
        deposit: booking.deposit,
        bookingId: booking.id,
        confirmationUrl,
        locale,
      }).catch((err) => console.error('[email] resend failed:', err));
    }
    return NextResponse.json({ success: true });
  }

  const needsRecalc = updates.check_in || updates.check_out || updates.room_slug;

  let existing: Booking | null = null;
  if (needsRecalc) {
    const { data } = await supabase.from('bookings').select('*').eq('id', id).single();
    existing = data;
  }

  if (needsRecalc && existing) {
    const slug = (updates.room_slug as string | undefined) ?? existing.room_slug;
    const checkIn = parseLocalDate(
      (updates.check_in as string | undefined) ?? existing.check_in,
    );
    const checkOut = parseLocalDate(
      (updates.check_out as string | undefined) ?? existing.check_out,
    );
    const room = getRoomBySlug(slug);

    if (room && checkOut > checkIn) {
      const nights = diffDays(checkOut, checkIn);
      const priceData = calculatePrice(checkIn, checkOut, room);
      updates.nights = nights;
      updates.total_price = priceData.totalPrice;
      updates.deposit = priceData.deposit;
      updates.price_per_night = Math.round(priceData.totalPrice / nights);
    }
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/bookings/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('bookings').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
