/**
 * Server-side izbor izvora cijene za quote API i POST /api/bookings.
 *
 * - MYRENT_PRICING_ENABLED off (default) → legacy calculatePrice(room.price)
 * - on → MyRent b2b_object_price_period / Website A (+ SPA wellness) + Ginko dodaci
 */

import type { Room } from '@/modules/rooms/room.types';
import type { NightlyRate, PriceBreakdown } from './booking.types';
import { calculatePrice, type PriceExtras } from './dates';
import { formatDate } from './dates';
import { isMyRentPricingEnabled } from '@/modules/myrent/myrent.pricing-config';
import { fetchMyRentStayPrice } from '@/modules/myrent/myrent.pricing-service';

export type BookingPriceSource =
  | 'legacy_room_price'
  | 'myrent_period'
  | 'myrent_mock'
  /** @deprecated zamijenjen s myrent_period — ostaje zbog starih odgovora */
  | 'myrent_calendar';

export type ResolvedBookingPrice = {
  source: BookingPriceSource;
  breakdown: PriceBreakdown;
  /** Za price_per_night u bookingu (total / nights, uključuje dodatke). */
  pricePerNight: number;
  nightlyRates: NightlyRate[];
  ratesVary: boolean;
};

function withLegacyNightlyRates(
  breakdown: PriceBreakdown,
): Pick<ResolvedBookingPrice, 'nightlyRates' | 'ratesVary' | 'breakdown'> {
  return {
    breakdown: {
      ...breakdown,
      nightlyRates: undefined,
      ratesVary: false,
    },
    nightlyRates: [],
    ratesVary: false,
  };
}

export async function resolveBookingPrice(params: {
  room: Room;
  checkIn: Date;
  checkOut: Date;
  adults?: number;
  children?: number;
  extras?: PriceExtras;
}): Promise<ResolvedBookingPrice> {
  if (!isMyRentPricingEnabled()) {
    const breakdown = calculatePrice(
      params.checkIn,
      params.checkOut,
      params.room,
      params.extras,
    );
    const pricePerNight =
      breakdown.nights > 0
        ? Math.round(breakdown.totalPrice / breakdown.nights)
        : 0;
    const legacy = withLegacyNightlyRates(breakdown);
    return {
      source: 'legacy_room_price',
      breakdown: legacy.breakdown,
      pricePerNight,
      nightlyRates: legacy.nightlyRates,
      ratesVary: legacy.ratesVary,
    };
  }

  const checkIn = formatDate(params.checkIn);
  const checkOut = formatDate(params.checkOut);
  const result = await fetchMyRentStayPrice({
    roomSlug: params.room.slug,
    checkIn,
    checkOut,
    adults: params.adults,
    children: params.children,
    extras: params.extras,
  });

  const { breakdown } = result;
  const pricePerNight =
    breakdown.nights > 0
      ? Math.round(breakdown.totalPrice / breakdown.nights)
      : 0;

  return {
    source: result.source,
    breakdown,
    pricePerNight,
    nightlyRates: breakdown.nightlyRates ?? [],
    ratesVary: breakdown.ratesVary === true,
  };
}
