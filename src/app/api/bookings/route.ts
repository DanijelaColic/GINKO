// Adapted from VJ/src/app/api/bookings/route.ts
// Changes: apartment_slug → room_slug, getApartment → getRoomBySlug (static config),
//          removed VJ email integration (Phase 8+), added confirmation token response,
//          added blocked_dates overlap check alongside booking overlap check.
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getRoomBySlug } from '@/modules/rooms/room.repository';
import {
  parseLocalDate,
  isRangeAvailable,
  diffDays,
  calculatePrice,
} from '@/modules/booking/dates';
import { MIN_NIGHTS } from '@/modules/booking/booking.config';
import {
  createBookingViewToken,
  getBookingConfirmationPath,
  getBookingConfirmationUrlFromRequest,
} from '@/lib/bookingConfirmation';
import { sendNewBookingEmails } from '@/lib/email';
import type { BookedRange } from '@/modules/booking/booking.types';

// GET /api/bookings?room=slug
// Returns booked date ranges for the calendar component
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('room');

  if (!slug) {
    return NextResponse.json({ error: 'Nedostaje parametar room' }, { status: 400 });
  }

  const room = getRoomBySlug(slug);
  if (!room) {
    return NextResponse.json({ error: 'Soba nije pronađena' }, { status: 404 });
  }

  try {
    const supabase = createServerSupabaseClient();

    const [bookingsRes, blockedRes, externalRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('room_slug', slug)
        .neq('status', 'cancelled'),
      supabase
        .from('blocked_dates')
        .select('check_in, check_out')
        .eq('room_slug', slug),
      // Phase 9: include external iCal-imported events
      supabase
        .from('external_calendar_events')
        .select('starts_on, ends_on')
        .eq('room_slug', slug),
    ]);

    if (bookingsRes.error) throw bookingsRes.error;

    const ranges: BookedRange[] = [
      ...(bookingsRes.data ?? []),
      ...(blockedRes.data ?? []),
      ...(externalRes.data ?? []).map((e) => ({
        check_in: e.starts_on as string,
        check_out: e.ends_on as string,
      })),
    ];

    return NextResponse.json(ranges);
  } catch (err) {
    const detail =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : String(err);
    console.error('GET /api/bookings:', detail);
    return NextResponse.json({ error: 'Greška pri dohvatu rezervacija' }, { status: 500 });
  }
}

// POST /api/bookings
// Creates a new booking after server-side validation + overlap check
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
      locale: bodyLocale,
    } = body;

    const locale: 'hr' | 'en' | 'de' =
      bodyLocale === 'en' || bodyLocale === 'de' ? bodyLocale : 'hr';

    if (!room_slug || !check_in || !check_out || !guest_name || !guest_email) {
      return NextResponse.json({ error: 'Nedostaju obavezna polja' }, { status: 400 });
    }

    const room = getRoomBySlug(room_slug);
    if (!room) {
      return NextResponse.json({ error: 'Soba nije pronađena' }, { status: 404 });
    }

    const checkInDate = parseLocalDate(check_in);
    const checkOutDate = parseLocalDate(check_out);

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: 'Datum odjave mora biti nakon datuma dolaska' },
        { status: 400 },
      );
    }

    const nights = diffDays(checkOutDate, checkInDate);

    if (nights < MIN_NIGHTS) {
      return NextResponse.json(
        { error: `Minimalni boravak su ${MIN_NIGHTS} noći` },
        { status: 400 },
      );
    }

    const totalGuests = (adults ?? 1) + (children ?? 0);
    if (totalGuests > room.capacity) {
      return NextResponse.json(
        { error: `Soba ${room.name} prima maksimalno ${room.capacity} osoba.` },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();

    // Overlap check: confirmed/pending bookings + blocked dates + external iCal events
    const [bookingsRes, blockedRes, externalRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('room_slug', room_slug)
        .neq('status', 'cancelled'),
      supabase
        .from('blocked_dates')
        .select('check_in, check_out')
        .eq('room_slug', room_slug),
      supabase
        .from('external_calendar_events')
        .select('starts_on, ends_on')
        .eq('room_slug', room_slug),
    ]);

    const existingRanges: BookedRange[] = [
      ...(bookingsRes.data ?? []),
      ...(blockedRes.data ?? []),
      ...(externalRes.data ?? []).map((e) => ({
        check_in: e.starts_on as string,
        check_out: e.ends_on as string,
      })),
    ];

    if (!isRangeAvailable(checkInDate, checkOutDate, existingRanges)) {
      return NextResponse.json(
        { error: 'Odabrani termini su već zauzeti. Molimo odaberite druge datume.' },
        { status: 409 },
      );
    }

    // Server-side pricing (source of truth)
    const priceData = calculatePrice(checkInDate, checkOutDate, room);
    const { totalPrice, deposit } = priceData;
    const avgPricePerNight = Math.round(totalPrice / nights);

    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        room_slug,
        check_in,
        check_out,
        nights,
        guest_name,
        guest_email,
        guest_phone: guest_phone || null,
        adults: adults ?? 1,
        children: children ?? 0,
        price_per_night: avgPricePerNight,
        total_price: totalPrice,
        deposit,
        status: 'pending',
        locale,
        notes: notes || null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const confirmationToken = createBookingViewToken(booking.id, guest_email);
    const origin = request.headers.get('origin') ?? request.headers.get('referer');
    const confirmationPath = getBookingConfirmationPath(booking.id, confirmationToken);
    const confirmationUrl = getBookingConfirmationUrlFromRequest(
      booking.id,
      confirmationToken,
      origin,
    );

    // Email: gost + obavijest vlasniku (ginkosobe3@gmail.com) — ne blokira odgovor
    void sendNewBookingEmails({
      guestName: guest_name,
      guestEmail: guest_email,
      guestPhone: guest_phone,
      roomName: room.name,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      totalPrice,
      deposit,
      bookingId: booking.id,
      confirmationUrl,
      locale,
    }).catch((err) => console.error('[email] sendNewBookingEmails:', err));

    return NextResponse.json(
      { success: true, bookingId: booking.id, confirmationPath, confirmationUrl },
      { status: 201 },
    );
  } catch (err) {
    console.error('POST /api/bookings:', err);
    return NextResponse.json(
      { error: 'Greška pri kreiranju rezervacije. Pokušajte ponovo ili nas kontaktirajte.' },
      { status: 500 },
    );
  }
}
