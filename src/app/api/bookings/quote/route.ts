/**
 * POST /api/bookings/quote
 *
 * Zajednički serverski izračun cijene za UI prikaz i usklađenost s POST /api/bookings.
 * - MYRENT_PRICING_ENABLED=false → legacy room.price (isti calculatePrice)
 * - true → MyRent price_period_details (+ SPA nadoplata) + Ginko dodaci + 50% depozit
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoomBySlug } from '@/modules/rooms/room.repository';
import { parseLocalDate, diffDays } from '@/modules/booking/dates';
import { resolveBookingPrice } from '@/modules/booking/resolve-booking-price';
import { MyRentPricingUnavailableError } from '@/modules/myrent/myrent.pricing-service';
import { SpaWellnessSurchargeNotConfiguredError } from '@/modules/myrent/myrent.spa-pricing';
import { MIN_NIGHTS } from '@/modules/booking/booking.config';
import { guestApiError } from '@/lib/guest-api-error';
import type { StayPriceQuoteRequest } from '@/modules/booking/quote.types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StayPriceQuoteRequest;
    const {
      room_slug,
      check_in,
      check_out,
      adults,
      children,
      extra_beds,
      crib,
      breakfast_per_night,
      breakfast_guests,
    } = body;

    if (!room_slug || !check_in || !check_out) {
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

    const resolved = await resolveBookingPrice({
      room,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      adults: typeof adults === 'number' ? adults : 2,
      children: typeof children === 'number' ? children : 0,
      extras: {
        // extraBeds se na MyRent putu ignorira (gosti su u period totalu);
        // legacy put i dalje može koristiti vrijednost.
        extraBeds: typeof extra_beds === 'number' ? extra_beds : 0,
        crib: crib === true,
        breakfastPerNight:
          typeof breakfast_per_night === 'number' ? breakfast_per_night : undefined,
        breakfastGuests:
          typeof breakfast_guests === 'number' ? breakfast_guests : undefined,
      },
    });

    return NextResponse.json({
      source: resolved.source,
      breakdown: resolved.breakdown,
      pricePerNight: resolved.pricePerNight,
      nightlyRates: resolved.nightlyRates,
      ratesVary: resolved.ratesVary,
    });
  } catch (err) {
    if (err instanceof SpaWellnessSurchargeNotConfiguredError) {
      return guestApiError('wellnessSurchargeNotConfigured', 503);
    }
    if (err instanceof MyRentPricingUnavailableError) {
      return guestApiError('pricingUnavailable', 503);
    }
    console.error('POST /api/bookings/quote:', err);
    return guestApiError('fetchFailed', 500);
  }
}
