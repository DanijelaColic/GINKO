/**
 * Mock MyRent cijene za lokalni/UI razvoj (MYRENT_PRICING_MOCK=true).
 * Nije stvarni MyRent odgovor — nikad na Vercel Production.
 *
 * SPA 1/2 dijele istu mock bazu (kao object_id 7460); wellness nadoplata
 * se dodaje u pricing-service iz Ginko room.price razlike.
 */

import type { MyRentCalendarDay } from './myrent.types';
import { addIsoDays } from './myrent.ranges';
import {
  distributePeriodTotalAcrossNights,
  type MyRentPricePeriodDay,
} from './myrent.price-period';
import { stayNightDates, type MyRentNightPrice } from './myrent.pricing';

/** Bazne mock cijene po sobi (€/noć) — MyRent-like baza (bez wellness nadoplate). */
const MOCK_BASE_BY_SLUG: Readonly<Record<string, number>> = {
  'ginko-1': 50,
  'ginko-2': 50,
  'ginko-3': 50,
  'ginko-4': 50,
  'ginko-5': 50,
  'ginko-6': 42,
  // Isti object_id 7460 — ista baza; spa-2 dobiva Ginko surcharge u serviceu
  'ginko-spa-1': 195,
  'ginko-spa-2': 195,
};

/** Mock price_extra / extra_from po slug (kao live API). */
const MOCK_EXTRA_BY_SLUG: Readonly<
  Record<string, { priceExtra: number; extraFrom: number }>
> = {
  'ginko-1': { priceExtra: 0, extraFrom: 0 },
  'ginko-2': { priceExtra: 15, extraFrom: 2 },
  'ginko-3': { priceExtra: 15, extraFrom: 2 },
  'ginko-4': { priceExtra: 15, extraFrom: 2 },
  'ginko-5': { priceExtra: 0, extraFrom: 0 },
  'ginko-6': { priceExtra: 0, extraFrom: 0 },
  'ginko-spa-1': { priceExtra: 50, extraFrom: 2 },
  'ginko-spa-2': { priceExtra: 50, extraFrom: 2 },
};

const DEFAULT_BASE = 50;
const WEEKEND_UPLIFT = 0; // live API je flat — mock prati to
const JULY_UPLIFT = 0;

function utcDow(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}

function mockNightlyPrice(iso: string, roomSlug: string): number {
  const base = MOCK_BASE_BY_SLUG[roomSlug] ?? DEFAULT_BASE;
  const dow = utcDow(iso);
  const weekend = dow === 5 || dow === 6 ? WEEKEND_UPLIFT : 0;
  const month = Number(iso.slice(5, 7));
  const seasonal = month === 7 ? JULY_UPLIFT : 0;
  return base + weekend + seasonal;
}

/**
 * Generira mock kalendarske dane za [checkIn, checkOut) noći
 * (plus opc. checkOut dan za sličnost API-ju).
 */
export function buildMockMyRentCalendarDays(params: {
  roomSlug: string;
  checkIn: string;
  checkOut: string;
}): MyRentCalendarDay[] {
  const nights = stayNightDates(params.checkIn, params.checkOut);
  const extra = MOCK_EXTRA_BY_SLUG[params.roomSlug] ?? {
    priceExtra: 0,
    extraFrom: 0,
  };
  const days: MyRentCalendarDay[] = nights.map((day) => ({
    day,
    price: mockNightlyPrice(day, params.roomSlug),
    price1: mockNightlyPrice(day, params.roomSlug),
    price_default: mockNightlyPrice(day, params.roomSlug),
    price_extra: extra.priceExtra,
    price_extra_child: 0,
    extra_from: extra.extraFrom,
    free: 'Y',
    enable: 'Y',
    is_booked: 'N',
    stock_available: 1,
    stock_free: 1,
  }));

  days.push({
    day: params.checkOut,
    price: mockNightlyPrice(params.checkOut, params.roomSlug),
    free: 'Y',
    enable: 'Y',
    is_booked: 'N',
    stock_available: 1,
  });

  return days;
}

/** Inclusive range helper za šire mockove. */
export function buildMockMyRentCalendarRange(params: {
  roomSlug: string;
  dateFrom: string;
  dateUntil: string;
}): MyRentCalendarDay[] {
  const days: MyRentCalendarDay[] = [];
  let d = params.dateFrom;
  while (d <= params.dateUntil) {
    days.push({
      day: d,
      price: mockNightlyPrice(d, params.roomSlug),
      free: 'Y',
      enable: 'Y',
      is_booked: 'N',
      stock_available: 1,
      stock_free: 1,
    });
    d = addIsoDays(d, 1);
  }
  return days;
}

/**
 * Mock price_period_details: baza × noći + guest extras (kao live API).
 */
export function buildMockMyRentPricePeriod(params: {
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}): {
  accommodationTotal: number;
  nights: MyRentNightPrice[];
} {
  const nightDates = stayNightDates(params.checkIn, params.checkOut);
  const extra = MOCK_EXTRA_BY_SLUG[params.roomSlug] ?? {
    priceExtra: 0,
    extraFrom: 0,
  };
  const guests = Math.max(1, params.adults) + Math.max(0, params.children);
  const billableExtras =
    extra.priceExtra > 0 && extra.extraFrom > 0
      ? Math.max(0, guests - extra.extraFrom)
      : 0;

  const dayRows: MyRentPricePeriodDay[] = nightDates.map((day) => ({
    day,
    price: mockNightlyPrice(day, params.roomSlug),
    priceDef: mockNightlyPrice(day, params.roomSlug),
    priceExtra: extra.priceExtra,
    extraFrom: extra.extraFrom,
  }));

  const baseSum = dayRows.reduce((s, d) => s + d.price, 0);
  const accommodationTotal =
    baseSum + billableExtras * extra.priceExtra * nightDates.length;

  const nights = distributePeriodTotalAcrossNights({
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    accommodationTotal,
    dayRows,
  });

  return { accommodationTotal, nights };
}
