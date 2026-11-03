/**
 * Async MyRent pricing za guest quote / POST bookings.
 *
 * SoT: POST /user/price_period_details (+ SPA wellness nadoplata iz Ginko configa)
 * + Ginko dodaci (doručak, krevetić) bez Ginko EXTRA_BED.
 *
 * Fail-closed: API greška → MyRentPricingUnavailableError (osim mock moda).
 */

import type { PriceBreakdown } from '@/modules/booking/booking.types';
import type { PriceExtras } from '@/modules/booking/dates';
import { MyRentAuthError } from './myrent.auth';
import { MyRentApiError } from './myrent.client';
import { getMyRentObjectId, isMyRentConfigured } from './myrent.config';
import {
  isMyRentPricingMock,
  isMyRentPricingMockBlockedOnProduction,
} from './myrent.pricing-config';
import { buildMockMyRentPricePeriod } from './myrent.pricing-mock';
import {
  applySpaWellnessSurchargeToQuote,
  buildPriceBreakdownFromMyRentNights,
  ginkoAddonsForMyRentPricing,
  MyRentPricingError,
  quoteFromPeriodNights,
  stayNightDates,
  type MyRentAccommodationQuote,
} from './myrent.pricing';
import { fetchMyRentPricePeriodDetails } from './myrent.price-period';
import {
  SpaWellnessSurchargeNotConfiguredError,
  spaWellnessSurchargePerNightForSlug,
} from './myrent.spa-pricing';

export class MyRentPricingUnavailableError extends Error {
  constructor(message = 'MyRent cijene trenutno nisu dostupne.') {
    super(message);
    this.name = 'MyRentPricingUnavailableError';
  }
}

export type MyRentStayPriceResult = {
  source: 'myrent_period' | 'myrent_mock';
  objectId: number | null;
  quote: MyRentAccommodationQuote;
  breakdown: PriceBreakdown;
};

function assertStayRange(checkIn: string, checkOut: string): void {
  const nights = stayNightDates(checkIn, checkOut);
  if (nights.length < 1) {
    throw new MyRentPricingError(
      'invalid_range',
      'checkOut mora biti strogo nakon checkIn.',
    );
  }
}

async function loadPeriodQuote(params: {
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  objectId: number | null;
}): Promise<{
  source: 'myrent_period' | 'myrent_mock';
  accommodationTotal: number;
  nights: MyRentAccommodationQuote['nights'];
}> {
  if (isMyRentPricingMockBlockedOnProduction()) {
    console.error(
      '[myrent-pricing] MYRENT_PRICING_MOCK ignoriran na VERCEL_ENV=production — live path only.',
    );
  }

  if (isMyRentPricingMock()) {
    const mock = buildMockMyRentPricePeriod({
      roomSlug: params.roomSlug,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      adults: params.adults,
      children: params.children,
    });
    return {
      source: 'myrent_mock',
      accommodationTotal: mock.accommodationTotal,
      nights: mock.nights,
    };
  }

  if (!isMyRentConfigured()) {
    throw new MyRentPricingUnavailableError(
      'MyRent nije konfiguriran (nedostaju MYRENT_* env varijable).',
    );
  }

  if (params.objectId == null) {
    throw new MyRentPricingUnavailableError(
      `Nema MyRent object_id za sobu: ${params.roomSlug}`,
    );
  }

  try {
    const period = await fetchMyRentPricePeriodDetails({
      objectId: params.objectId,
      dateFrom: params.checkIn,
      dateUntil: params.checkOut,
      adults: params.adults,
      children: params.children,
    });
    return {
      source: 'myrent_period',
      accommodationTotal: period.accommodationTotal,
      nights: period.nights,
    };
  } catch (err) {
    if (err instanceof MyRentPricingError) {
      throw new MyRentPricingUnavailableError(err.message);
    }
    if (err instanceof MyRentAuthError || err instanceof MyRentApiError) {
      throw new MyRentPricingUnavailableError('MyRent cijene nisu dostupne.');
    }
    if (err instanceof MyRentPricingUnavailableError) throw err;
    throw new MyRentPricingUnavailableError('MyRent cijene nisu dostupne.');
  }
}

/**
 * Svježi MyRent stay price za slug + datume + goste.
 * SPA-2: MyRent baza + (spa-2.price − spa-1.price) po noći, ubačeno u smještaj.
 */
export async function fetchMyRentStayPrice(params: {
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  extras?: PriceExtras;
}): Promise<MyRentStayPriceResult> {
  assertStayRange(params.checkIn, params.checkOut);

  const adults = Math.max(1, Math.floor(params.adults ?? 2));
  const children = Math.max(0, Math.floor(params.children ?? 0));
  const objectId = getMyRentObjectId(params.roomSlug);

  const loaded = await loadPeriodQuote({
    roomSlug: params.roomSlug,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults,
    children,
    objectId,
  });

  try {
    let quote = quoteFromPeriodNights({
      nights: loaded.nights,
      accommodationTotal: loaded.accommodationTotal,
    });

    // SPA-2: admin nadoplata × noći; ako nije unesena → SpaWellnessSurchargeNotConfiguredError
    const spaPerNight = await spaWellnessSurchargePerNightForSlug(
      params.roomSlug,
    );
    quote = applySpaWellnessSurchargeToQuote(quote, spaPerNight);

    const breakdown = buildPriceBreakdownFromMyRentNights(
      quote,
      ginkoAddonsForMyRentPricing(params.extras),
    );

    return {
      source: loaded.source,
      objectId,
      quote,
      breakdown,
    };
  } catch (err) {
    if (err instanceof SpaWellnessSurchargeNotConfiguredError) throw err;
    if (err instanceof MyRentPricingError) {
      throw new MyRentPricingUnavailableError(err.message);
    }
    throw err;
  }
}

export type { MyRentAccommodationQuote };
