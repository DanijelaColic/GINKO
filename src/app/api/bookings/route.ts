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
import { sendOwnerNewBookingNotification } from '@/lib/email';
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

    // Uključi linked slugove (isti fizički prostor) — npr. ginko-spa-1 ↔ ginko-spa-2
    const slugsToCheck = [slug, ...(room.linkedSlugs ?? [])];

    const [bookingsRes, blockedRes, externalRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('check_in, check_out')
        .in('room_slug', slugsToCheck)
        .neq('status', 'cancelled'),
      supabase
        .from('blocked_dates')
        .select('check_in, check_out')
        .in('room_slug', slugsToCheck),
      // Phase 9: include external iCal-imported events
      supabase
        .from('external_calendar_events')
        .select('starts_on, ends_on')
        .in('room_slug', slugsToCheck),
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
      guest_first_name,
      guest_last_name,
      guest_country,
      guest_email,
      guest_phone,
      adults,
      children,
      booking_for,
      guest_staying_name,
      needs_crib,
      needs_extra_bed,
      breakfast_guests,
      is_business,
      company_name,
      vat_id,
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

    // Validacija pomoćnog ležaja
    if (needs_extra_bed === true && !room.extraBedAvailable) {
      return NextResponse.json(
        { error: `Soba ${room.name} ne podržava pomoćni ležaj.` },
        { status: 400 },
      );
    }

    // Doručak ne može biti za više osoba nego što boravi
    const bfGuests = typeof breakfast_guests === 'number' ? breakfast_guests : 0;
    if (bfGuests > (adults ?? 1) + (children ?? 0)) {
      return NextResponse.json(
        { error: 'Broj osoba uz doručak ne može biti veći od ukupnog broja gostiju.' },
        { status: 400 },
      );
    }

    const isWellnessApartment = room_slug === 'ginko-spa-2';

    const supabase = createServerSupabaseClient();

    // Overlap check uključuje linked slugove (isti fizički prostor)
    const overlapSlugs = [room_slug, ...(room.linkedSlugs ?? [])];

    // Overlap check: confirmed/pending bookings + blocked dates + external iCal events
    const [bookingsRes, blockedRes, externalRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('check_in, check_out')
        .in('room_slug', overlapSlugs)
        .neq('status', 'cancelled'),
      supabase
        .from('blocked_dates')
        .select('check_in, check_out')
        .in('room_slug', overlapSlugs),
      supabase
        .from('external_calendar_events')
        .select('starts_on, ends_on')
        .in('room_slug', overlapSlugs),
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

    // Server-side pricing (source of truth) — uključuje sve extras
    const priceData = calculatePrice(checkInDate, checkOutDate, room, {
      extraBeds: needs_extra_bed === true ? 1 : 0,
      crib: needs_crib === true,
      breakfastGuests: bfGuests,
    });
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
        guest_first_name: guest_first_name || null,
        guest_last_name: guest_last_name || null,
        guest_country: guest_country || null,
        guest_email,
        guest_phone: guest_phone || null,
        adults: adults ?? 1,
        children: children ?? 0,
        booking_for: booking_for || 'self',
        guest_staying_name: guest_staying_name || null,
        needs_crib: needs_crib === true,
        needs_extra_bed: needs_extra_bed === true,
        breakfast_guests: bfGuests,
        include_wellness: isWellnessApartment,
        is_business: is_business === true,
        company_name: company_name || null,
        vat_id: vat_id || null,
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

    // Email vlasniku odmah; gost prima potvrdu tek nakon plaćanja depozita
    void sendOwnerNewBookingNotification({
      guestName: guest_name,
      guestEmail: guest_email,
      guestPhone: guest_phone,
      guestCountry: guest_country || null,
      needsCrib: needs_crib === true,
      needsExtraBed: needs_extra_bed === true,
      breakfastGuests: bfGuests,
      includeWellness: isWellnessApartment,
      isBusiness: is_business === true,
      companyName: company_name || null,
      vatId: vat_id || null,
      bookingFor: booking_for || 'self',
      guestStayingName: guest_staying_name || null,
      roomName: room.name,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      totalPrice,
      deposit,
      bookingId: booking.id,
      confirmationUrl,
      locale,
    }).catch((err) => console.error('[email] sendOwnerNewBookingNotification:', err));

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
