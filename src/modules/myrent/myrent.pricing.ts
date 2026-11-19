/**
 * Pure izračun smještajne cijene.
 *
 * SoT za rezervaciju: POST /user/price_period_details → b2b_object_price_period
 * (Website A prodajna cijena; ne base object_price_period_simple).
 * get_calendar.day.price: pomoćni prikaz / mock / legacy testovi.
 *
 * Ginko dodaci (doručak, krevetić) ostaju ovdje.
 * Pomoćni ležaj / dodatne osobe: u MyRent period putu NE naplaćuj Ginko
 * EXTRA_BED — već su u b2b_object_price_period (vidi ginkoAddonsForMyRentPricing).
 */

import type { PriceBreakdown, PriceLine } from '@/modules/booking/booking.types';
import type { PriceExtras } from '@/modules/booking/dates';
import {
  ACCOMMODATION_LABEL,
  BREAKFAST_LABEL,
  CRIB_LABEL,
  EXTRA_BED_LABEL,
} from '@/modules/booking/dates';
import {
  BREAKFAST_PRICE_PER_PERSON_PER_NIGHT,
  calculateDeposit,
  CLEANING_FEE,
  CRIB_PRICE_PER_NIGHT,
  EXTRA_BED_PRICE_PER_NIGHT,
} from '@/modules/booking/booking.config';
import { addIsoDays } from './myrent.ranges';
import type { MyRentCalendarDay } from './myrent.types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Preostala pitanja (ne blokiraju period-based aktivaciju, ali pratiti).
 */
export const MYRENT_PRICING_OPEN_QUESTIONS = [
  'Uskladiti PRICE EDIT kalendar s API-jem kad se price_default razlikuje od price (npr. prosinac).',
  'Unijeti wellness nadoplatu (€/noć) u Admin → Cijene prije aktivacije MyRent pricing flaga.',
] as const;

/**
 * Ginko dodaci uz MyRent smještaj — bez extraBeds (MyRent već obračunava goste).
 */
export function ginkoAddonsForMyRentPricing(
  extras?: PriceExtras,
): PriceExtras {
  return {
    crib: extras?.crib === true,
    breakfastPerNight: extras?.breakfastPerNight,
    breakfastGuests: extras?.breakfastGuests,
  };
}

/** Uključi wellness nadoplatu u noći / subtotal (bez zasebnog line itema). */
export function applySpaWellnessSurchargeToQuote(
  quote: MyRentAccommodationQuote,
  surchargePerNight: number,
): MyRentAccommodationQuote {
  if (!Number.isFinite(surchargePerNight) || surchargePerNight <= 0) {
    return quote;
  }
  const nights = quote.nights.map((n) => ({
    day: n.day,
    price: n.price + surchargePerNight,
  }));
  const accommodationSubtotal = nights.reduce((s, n) => s + n.price, 0);
  return {
    nights,
    accommodationSubtotal,
    averagePricePerNight:
      nights.length > 0
        ? Math.round(accommodationSubtotal / nights.length)
        : 0,
  };
}

export function quoteFromPeriodNights(params: {
  nights: MyRentNightPrice[];
  accommodationTotal: number;
}): MyRentAccommodationQuote {
  const nights = params.nights;
  const accommodationSubtotal = params.accommodationTotal;
  return {
    nights,
    accommodationSubtotal,
    averagePricePerNight:
      nights.length > 0
        ? Math.round(accommodationSubtotal / nights.length)
        : 0,
  };
}

export type MyRentNightPrice = {
  day: string;
  price: number;
};

export type MyRentAccommodationQuote = {
  nights: MyRentNightPrice[];
  accommodationSubtotal: number;
  /** Aritmetički prosjek noći (za price_per_night u bookingu). */
  averagePricePerNight: number;
};

export class MyRentPricingError extends Error {
  readonly code:
    | 'invalid_range'
    | 'missing_day'
    | 'missing_price'
    | 'invalid_price';

  constructor(
    code: MyRentPricingError['code'],
    message: string,
  ) {
    super(message);
    this.name = 'MyRentPricingError';
    this.code = code;
  }
}

/** Noći boravka: poluotvoreni interval [checkIn, checkOut). */
export function stayNightDates(checkIn: string, checkOut: string): string[] {
  if (!DATE_RE.test(checkIn) || !DATE_RE.test(checkOut)) {
    throw new MyRentPricingError(
      'invalid_range',
      'checkIn/checkOut moraju biti YYYY-MM-DD.',
    );
  }
  if (checkOut <= checkIn) {
    throw new MyRentPricingError(
      'invalid_range',
      'checkOut mora biti strogo nakon checkIn.',
    );
  }

  const nights: string[] = [];
  let d = checkIn;
  while (d < checkOut) {
    nights.push(d);
    d = addIsoDays(d, 1);
  }
  return nights;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/**
 * Provizorno: uzmi day.price.
 * Ne koristi price_extra / price_special za kalendarski quote.
 * Website SoT je price_period_details.b2b_* (ne get_calendar).
 */
export function readCalendarNightlyPrice(
  day: MyRentCalendarDay,
): number | null {
  return toFiniteNumber(day.price);
}

export function indexCalendarDaysByDate(
  days: readonly MyRentCalendarDay[],
): Map<string, MyRentCalendarDay> {
  const map = new Map<string, MyRentCalendarDay>();
  for (const day of days) {
    const key = String(day.day ?? '');
    if (!DATE_RE.test(key)) continue;
    map.set(key, day);
  }
  return map;
}

/**
 * Zbroj MyRent dnevnih cijena za [checkIn, checkOut).
 * Baca MyRentPricingError ako nedostaje dan ili cijena.
 */
export function quoteAccommodationFromCalendarDays(params: {
  checkIn: string;
  checkOut: string;
  days: readonly MyRentCalendarDay[];
}): MyRentAccommodationQuote {
  const nightDates = stayNightDates(params.checkIn, params.checkOut);
  const byDate = indexCalendarDaysByDate(params.days);
  const nights: MyRentNightPrice[] = [];

  for (const day of nightDates) {
    const row = byDate.get(day);
    if (!row) {
      throw new MyRentPricingError(
        'missing_day',
        `MyRent kalendar nema dan ${day}.`,
      );
    }
    const price = readCalendarNightlyPrice(row);
    if (price == null) {
      throw new MyRentPricingError(
        'missing_price',
        `MyRent kalendar nema price za ${day}.`,
      );
    }
    if (price < 0) {
      throw new MyRentPricingError(
        'invalid_price',
        `MyRent price za ${day} je negativan (${price}).`,
      );
    }
    nights.push({ day, price });
  }

  const accommodationSubtotal = nights.reduce((sum, n) => sum + n.price, 0);
  const averagePricePerNight =
    nights.length > 0
      ? Math.round(accommodationSubtotal / nights.length)
      : 0;

  return { nights, accommodationSubtotal, averagePricePerNight };
}

function buildExtrasLines(
  nightsCount: number,
  extras?: PriceExtras,
): { lines: PriceLine[]; extrasTotal: number } {
  const lines: PriceLine[] = [];
  let extrasTotal = 0;
  const extraBedCount = extras?.extraBeds ?? 0;

  if (extraBedCount > 0 && nightsCount > 0) {
    const subtotal =
      nightsCount * EXTRA_BED_PRICE_PER_NIGHT * extraBedCount;
    lines.push({
      label: EXTRA_BED_LABEL,
      nights: nightsCount,
      pricePerNight: EXTRA_BED_PRICE_PER_NIGHT,
      subtotal,
    });
    extrasTotal += subtotal;
  }

  if (extras?.crib && nightsCount > 0) {
    const subtotal = nightsCount * CRIB_PRICE_PER_NIGHT;
    lines.push({
      label: CRIB_LABEL,
      nights: nightsCount,
      pricePerNight: CRIB_PRICE_PER_NIGHT,
      subtotal,
    });
    extrasTotal += subtotal;
  }

  const breakfastPerNight =
    extras?.breakfastPerNight != null && extras.breakfastPerNight > 0
      ? extras.breakfastPerNight
      : (extras?.breakfastGuests ?? 0) > 0
        ? (extras!.breakfastGuests as number) *
          BREAKFAST_PRICE_PER_PERSON_PER_NIGHT
        : 0;

  if (breakfastPerNight > 0 && nightsCount > 0) {
    const subtotal = nightsCount * breakfastPerNight;
    lines.push({
      label: BREAKFAST_LABEL,
      nights: nightsCount,
      pricePerNight: breakfastPerNight,
      subtotal,
    });
    extrasTotal += subtotal;
  }

  return { lines, extrasTotal };
}

/**
 * Cjeloviti PriceBreakdown: MyRent smještaj (po noćima) + Ginko dodaci + 50% depozit.
 * Ako su sve noći iste cijene, accommodation line koristi tu cijenu;
 * inače pricePerNight = prosjek, subtotal = točan zbroj noći.
 */
export function buildPriceBreakdownFromMyRentNights(
  quote: MyRentAccommodationQuote,
  extras?: PriceExtras,
): PriceBreakdown {
  const nightsCount = quote.nights.length;
  const lines: PriceLine[] = [];

  if (nightsCount > 0) {
    const allSame = quote.nights.every(
      (n) => n.price === quote.nights[0]!.price,
    );
    lines.push({
      label: ACCOMMODATION_LABEL,
      nights: nightsCount,
      pricePerNight: allSame
        ? quote.nights[0]!.price
        : quote.averagePricePerNight,
      subtotal: quote.accommodationSubtotal,
    });
  }

  const { lines: extraLines, extrasTotal } = buildExtrasLines(
    nightsCount,
    extras,
  );
  lines.push(...extraLines);

  const totalPrice =
    quote.accommodationSubtotal + CLEANING_FEE + extrasTotal;
  const deposit = calculateDeposit(totalPrice);
  const ratesVary =
    nightsCount > 1 &&
    quote.nights.some((n) => n.price !== quote.nights[0]!.price);

  return {
    nights: nightsCount,
    totalPrice,
    deposit,
    lines,
    discountAmount: 0,
    cleaningFee: CLEANING_FEE,
    nightlyRates: quote.nights.map((n) => ({ day: n.day, price: n.price })),
    ratesVary,
  };
}

/** Convenience: calendar days → PriceBreakdown. */
export function calculatePriceFromMyRentCalendarDays(params: {
  checkIn: string;
  checkOut: string;
  days: readonly MyRentCalendarDay[];
  extras?: PriceExtras;
}): {
  quote: MyRentAccommodationQuote;
  breakdown: PriceBreakdown;
} {
  const quote = quoteAccommodationFromCalendarDays(params);
  const breakdown = buildPriceBreakdownFromMyRentNights(quote, params.extras);
  return { quote, breakdown };
}
