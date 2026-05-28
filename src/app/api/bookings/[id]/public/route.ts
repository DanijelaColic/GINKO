// Adapted from VJ/src/app/api/bookings/[id]/public/route.ts
// Changes: apartment_slug → room_slug, getApartment → getRoomBySlug,
//          payment info driven by booking.config env vars instead of hardcoded values.
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getRoomBySlug } from '@/modules/rooms/room.repository';
import { formatDisplayDate, parseLocalDate } from '@/modules/booking/dates';
import { verifyBookingViewToken } from '@/lib/bookingConfirmation';
import {
  RECIPIENT_IBAN,
  RECIPIENT_NAME,
  RECIPIENT_BIC,
  RECIPIENT_BANK_NAME,
  SITE_NAME,
} from '@/modules/booking/booking.config';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const token = new URL(request.url).searchParams.get('token')?.trim() ?? '';

    if (!id || !token) {
      return NextResponse.json({ error: 'Nedostaju parametri' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(
        'id, room_slug, check_in, check_out, nights, guest_name, guest_email, total_price, deposit, status, created_at',
      )
      .eq('id', id)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Rezervacija nije pronađena' }, { status: 404 });
    }

    if (!verifyBookingViewToken(token, booking.id, booking.guest_email)) {
      return NextResponse.json({ error: 'Nevažeći pristupni token' }, { status: 403 });
    }

    const room = getRoomBySlug(booking.room_slug);
    const checkInDate = parseLocalDate(booking.check_in);
    const checkOutDate = parseLocalDate(booking.check_out);
    const pricePerNight =
      booking.nights > 0
        ? Math.round(booking.total_price / booking.nights)
        : booking.total_price;

    return NextResponse.json({
      id: booking.id,
      reference: `REZ-${booking.id.substring(0, 8).toUpperCase()}`,
      status: booking.status,
      guestName: booking.guest_name,
      roomName: room?.name ?? booking.room_slug,
      checkIn: formatDisplayDate(checkInDate),
      checkOut: formatDisplayDate(checkOutDate),
      nights: booking.nights,
      pricePerNight,
      totalPrice: booking.total_price,
      deposit: booking.deposit,
      createdAt: booking.created_at,
      payment: {
        recipient: RECIPIENT_NAME,
        iban: RECIPIENT_IBAN,
        bic: RECIPIENT_BIC,
        bankName: RECIPIENT_BANK_NAME,
        description: `Rezervacija ${SITE_NAME}`,
      },
    });
  } catch (err) {
    console.error('GET /api/bookings/[id]/public:', err);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju potvrde rezervacije' },
      { status: 500 },
    );
  }
}
