// Mock booking API — Phase 3
// GET  /api/bookings?room={slug}  → returns [] (no bookings yet)
// POST /api/bookings              → validates + returns { bookingId }
// Replace with Supabase-backed implementation in Phase 4

import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/modules/rooms/room.repository';
import { getBookedRanges, createBooking } from '@/modules/booking/booking.repository';
import { diffDays, parseLocalDate } from '@/modules/booking/dates';
import { MIN_NIGHTS } from '@/modules/booking/booking.config';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('room') ?? '';
  const ranges = await getBookedRanges(slug);
  return NextResponse.json(ranges);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      room_slug,
      check_in,
      check_out,
      guest_name,
      guest_email,
      guest_phone,
      adults,
      children,
      notes,
      locale,
    } = body;

    if (!room_slug || !check_in || !check_out || !guest_name || !guest_email) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const room = getRoom(room_slug, locale ?? 'hr');
    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }
    if (room.fullyBooked) {
      return NextResponse.json({ error: 'Room is not available.' }, { status: 409 });
    }

    const ci = parseLocalDate(check_in);
    const co = parseLocalDate(check_out);
    const nights = diffDays(co, ci);

    if (nights < MIN_NIGHTS) {
      return NextResponse.json(
        { error: `Minimum stay is ${MIN_NIGHTS} nights.` },
        { status: 422 },
      );
    }

    const totalGuests = (adults ?? 1) + (children ?? 0);
    if (totalGuests > room.capacity) {
      return NextResponse.json(
        { error: `Room ${room.name} accepts maximum ${room.capacity} guests.` },
        { status: 422 },
      );
    }

    const { id } = await createBooking({
      room_slug,
      check_in,
      check_out,
      guest_name,
      guest_email,
      guest_phone,
      adults: adults ?? 1,
      children: children ?? 0,
      notes,
      locale,
    });

    return NextResponse.json({ bookingId: id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
