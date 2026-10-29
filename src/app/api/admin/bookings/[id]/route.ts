// Copied from Villa-Jurina/src/app/api/admin/bookings/[id]/route.ts
// Adaptations: apartment_slug → room_slug, email via @/lib/email
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import { getRoomBySlug } from '@/modules/rooms/room.repository';
import { parseLocalDate, diffDays, calculatePrice } from '@/modules/booking/dates';
import { sendConfirmationEmail, notifyGuestBookingConfirmed, bookingRowToEmailData } from '@/lib/email';
import { createBookingViewToken, getBookingConfirmationUrlFromRequest } from '@/lib/bookingConfirmation';
import { checkBookingHardDeleteAllowed } from '@/modules/booking/booking-delete-policy';
import type { Booking } from '@/modules/booking/booking.types';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/bookings/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!(await isAdminAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const updates: Partial<Booking> & Record<string, unknown> = await request.json();

  const supabase = createServerSupabaseClient();

  if (updates._resend_email === true) {
    const { data: booking } = await supabase.from('bookings').select('*').eq('id', id).single();
    if (!booking) return NextResponse.json({ error: 'Nije pronađeno' }, { status: 404 });

    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        {
          error:
            'Email potvrde šalje se samo za potvrđene rezervacije (status confirmed).',
        },
        { status: 409 },
      );
    }

    if (booking.guest_email) {
      const token = createBookingViewToken(booking.id, booking.guest_email);
      const origin = request.headers.get('origin') ?? request.headers.get('referer');
      const confirmationUrl = getBookingConfirmationUrlFromRequest(
        booking.id,
        token,
        origin,
      );

      await sendConfirmationEmail(
        bookingRowToEmailData(booking as Record<string, unknown>, { confirmationUrl }),
      ).catch((err) => console.error('[email] resend failed:', err));
    }
    return NextResponse.json({ success: true });
  }

  const needsRecalc = updates.check_in || updates.check_out || updates.room_slug;

  let existing: Booking | null = null;
  if (needsRecalc || updates.deposit_paid === true) {
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

  // Bankovna uplata: gost prima potvrdu kad admin označi depozit kao plaćen
  if (
    existing &&
    updates.deposit_paid === true &&
    !existing.deposit_paid
  ) {
    void notifyGuestBookingConfirmed(id).catch((err) =>
      console.error('[email] notifyGuestBookingConfirmed (admin):', err),
    );
  }

  return NextResponse.json(data);
}

// DELETE /api/admin/bookings/[id]
// Plaćene rezervacije: nemoj hard-delete — otkaži da ostane povijest plaćanja.
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await isAdminAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const check = await checkBookingHardDeleteAllowed(supabase, id);
  if (!check.allowed) {
    return NextResponse.json(
      {
        error: check.message,
        code: check.reason,
        hint: 'cancel_instead',
      },
      { status: check.reason === 'not_found' ? 404 : 409 },
    );
  }

  const { error } = await supabase.from('bookings').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
