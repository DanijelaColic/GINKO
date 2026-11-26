// Adapted from VJ/src/app/api/bookings/route.ts
// Changes: apartment_slug → room_slug, getApartment → getRoomBySlug (static config),
//          removed VJ email integration (Phase 8+), added confirmation token response,
//          added blocked_dates overlap check alongside booking overlap check.
// GET: MyRent (SoT) ∪ lokalni izvori; fail-closed ako MyRent nije dostupan.
// POST: svježi MyRent re-check ∪ lokalni overlap prije inserta; Saferpay nepromijenjen.
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getRoomBySlug } from '@/modules/rooms/room.repository';
import {
  parseLocalDate,
  diffDays,
} from '@/modules/booking/dates';
import {
  assertBookingStayAvailable,
  AvailabilityUnavailableError,
  DatesUnavailableError,
  getGuestBookedRanges,
} from '@/modules/booking/availability.service';
import { resolveBookingPrice } from '@/modules/booking/resolve-booking-price';
import { evaluateQuotedPrice } from '@/modules/booking/quoted-price';
import { MyRentPricingUnavailableError } from '@/modules/myrent/myrent.pricing-service';
import { SpaWellnessSurchargeNotConfiguredError } from '@/modules/myrent/myrent.spa-pricing';
import {
  isMyRentPricingEnabled,
  usesMyRentStayPricing,
} from '@/modules/myrent/myrent.pricing-config';
import { MIN_NIGHTS } from '@/modules/booking/booking.config';
import { guestApiError } from '@/lib/guest-api-error';
import {
  calculateBreakfastPerNight,
  roomFitsGuests,
  roomNeedsExtraBed,
} from '@/modules/booking/guest-occupancy';
import {
  createBookingViewToken,
  getBookingConfirmationPath,
  getBookingConfirmationUrlFromRequest,
} from '@/lib/bookingConfirmation';
import { sendOwnerNewBookingNotification } from '@/lib/email';
import { holdUntilFrom } from '@/modules/payments/payment-hold.policy';
import { getValidLocale } from '@/i18n/messages';
import { isBookingOverlapConflict } from '@/modules/booking/booking-overlap';

// GET /api/bookings?room=slug
// Returns booked date ranges for the calendar component (MyRent + local).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('room');

  if (!slug) {
    return guestApiError('missingRoomParam', 400);
  }

  const room = getRoomBySlug(slug);
  if (!room) {
    return guestApiError('roomNotFound', 404);
  }

  try {
    const ranges = await getGuestBookedRanges(slug);
    return NextResponse.json(ranges);
  } catch (err) {
    if (err instanceof AvailabilityUnavailableError) {
      console.error('GET /api/bookings: availability unavailable');
      return guestApiError('availabilityUnavailable', 503);
    }
    const detail =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : String(err);
    console.error('GET /api/bookings:', detail);
    return guestApiError('fetchFailed', 500);
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
      child_ages,
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
      quoted_total_price,
      quoted_deposit,
    } = body;

    const locale = getValidLocale(typeof bodyLocale === 'string' ? bodyLocale : 'hr');

    if (!room_slug || !check_in || !check_out || !guest_name || !guest_email) {
      return guestApiError('missingFields', 400);
    }

    const room = getRoomBySlug(room_slug);
    if (!room) {
      return guestApiError('roomNotFound', 404);
    }

    const checkInDate = parseLocalDate(check_in);
    const checkOutDate = parseLocalDate(check_out);

    if (checkOutDate <= checkInDate) {
      return guestApiError('checkoutAfterCheckin', 400);
    }

    const nights = diffDays(checkOutDate, checkInDate);

    if (nights < MIN_NIGHTS) {
      return guestApiError('minNights', 400);
    }

    const adultsCount = typeof adults === 'number' ? adults : 1;
    const childrenCount = typeof children === 'number' ? children : 0;
    const childAges: number[] = Array.isArray(child_ages)
      ? child_ages
          .map((a: unknown) => (typeof a === 'number' ? a : parseInt(String(a), 10)))
          .filter((a: number) => !isNaN(a) && a >= 0)
          .slice(0, childrenCount)
      : Array.from({ length: childrenCount }, () => 0);

    while (childAges.length < childrenCount) childAges.push(0);

    if (!roomFitsGuests(room, adultsCount, childAges)) {
      return guestApiError('capacityExceeded', 400);
    }

    // Pomoćni ležaj — server je source of truth (ignorira client ako se ne slaže)
    const autoExtraBed = roomNeedsExtraBed(room, adultsCount, childAges);
    if (needs_extra_bed === true && !room.extraBedAvailable) {
      return guestApiError('extraBedUnavailable', 400);
    }

    // Doručak ne može biti za više osoba nego što boravi
    const bfGuests = typeof breakfast_guests === 'number' ? breakfast_guests : 0;
    if (bfGuests > adultsCount + childrenCount) {
      return guestApiError('breakfastGuestsInvalid', 400);
    }

    const breakfastPerNight =
      bfGuests > 0 ? calculateBreakfastPerNight(adultsCount, childAges) : 0;

    const isWellnessApartment = room_slug === 'ginko-spa-2';

    // Svježi MyRent + lokalni overlap (SPA 1/2 → object_id 7460 / linkedSlugs)
    try {
      await assertBookingStayAvailable(room_slug, check_in, check_out);
    } catch (err) {
      if (err instanceof AvailabilityUnavailableError) {
        return guestApiError('availabilityUnavailable', 503);
      }
      if (err instanceof DatesUnavailableError) {
        return guestApiError('datesUnavailable', 409);
      }
      throw err;
    }

    const supabase = createServerSupabaseClient();

    // Server-side pricing (SoT). Default: legacy room.price.
    // Ako MYRENT_PRICING_ENABLED=true → svježi MyRent/mock po noćima + usporedba quotea.
    let totalPrice: number;
    let deposit: number;
    let avgPricePerNight: number;
    try {
      const resolved = await resolveBookingPrice({
        room,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: adultsCount,
        children: childrenCount,
        extras: {
          // MyRent period već uključuje dodatne osobe — Ginko EXTRA_BED se ne zbraja.
          // Legacy put i dalje koristi autoExtraBed.
          extraBeds: autoExtraBed ? 1 : 0,
          crib: needs_crib === true,
          breakfastPerNight,
        },
      });
      totalPrice = resolved.breakdown.totalPrice;
      deposit = resolved.breakdown.deposit;
      avgPricePerNight = resolved.pricePerNight;

      // MyRent pricing: quote mora točno odgovarati serveru (nema klijentskog bypassa).
      // UI nakon 409 prikaže novi iznos; gost potvrdi; pošalje novi quoted_*.
      if (usesMyRentStayPricing(room_slug, isMyRentPricingEnabled())) {
        const verdict = evaluateQuotedPrice({
          quoted: {
            totalPrice:
              typeof quoted_total_price === 'number' ? quoted_total_price : null,
            deposit: typeof quoted_deposit === 'number' ? quoted_deposit : null,
          },
          server: resolved.breakdown,
        });
        if (verdict !== 'ok') {
          return NextResponse.json(
            {
              error: 'priceChanged',
              source: resolved.source,
              breakdown: resolved.breakdown,
              pricePerNight: resolved.pricePerNight,
              nightlyRates: resolved.nightlyRates,
              ratesVary: resolved.ratesVary,
            },
            { status: 409 },
          );
        }
      }
    } catch (err) {
      if (err instanceof SpaWellnessSurchargeNotConfiguredError) {
        return guestApiError('wellnessSurchargeNotConfigured', 503);
      }
      if (err instanceof MyRentPricingUnavailableError) {
        return guestApiError('pricingUnavailable', 503);
      }
      throw err;
    }

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
        adults: adultsCount,
        children: childrenCount,
        booking_for: booking_for || 'self',
        guest_staying_name: guest_staying_name || null,
        needs_crib: needs_crib === true,
        needs_extra_bed: autoExtraBed,
        breakfast_guests: bfGuests,
        include_wellness: isWellnessApartment,
        is_business: is_business === true,
        company_name: company_name || null,
        vat_id: vat_id || null,
        price_per_night: avgPricePerNight,
        total_price: totalPrice,
        deposit,
        status: 'pending',
        payment_hold_until: holdUntilFrom(Date.now()),
        locale,
        notes: notes || null,
      })
      .select()
      .single();

    if (insertError) {
      // Drugi paralelni insert: baza odbija prije Initializea.
      // Gost dobije isti datesUnavailable kao kod već zauzetog termina.
      if (isBookingOverlapConflict(insertError)) {
        return guestApiError('datesUnavailable', 409);
      }
      throw insertError;
    }

    const confirmationToken = createBookingViewToken(booking.id, guest_email);
    const origin = request.headers.get('origin') ?? request.headers.get('referer');
    const confirmationPath = getBookingConfirmationPath(
      booking.id,
      confirmationToken,
      locale,
    );
    const confirmationUrl = getBookingConfirmationUrlFromRequest(
      booking.id,
      confirmationToken,
      origin,
      locale,
    );

    // Email vlasniku odmah; gost prima potvrdu tek nakon plaćanja depozita
    void sendOwnerNewBookingNotification({
      guestName: guest_name,
      guestEmail: guest_email,
      guestPhone: guest_phone,
      guestCountry: guest_country || null,
      needsCrib: needs_crib === true,
      needsExtraBed: autoExtraBed,
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
      adults: adultsCount,
      children: childrenCount,
      status: 'pending',
      depositPaid: false,
      notes: notes || null,
      pricePerNight: avgPricePerNight,
    }).catch((err) => console.error('[email] sendOwnerNewBookingNotification:', err));

    return NextResponse.json(
      { success: true, bookingId: booking.id, confirmationPath, confirmationUrl },
      { status: 201 },
    );
  } catch (err) {
    console.error('POST /api/bookings:', err);
    return guestApiError('createFailed', 500);
  }
}
