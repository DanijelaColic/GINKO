/**
 * Početne „Od X €/noć” za listing — MyRent Website A (read-only).
 * Cache ~1 h; ne dira checkout / resolveBookingPrice.
 */

import { unstable_cache } from 'next/cache';
import { formatDate, startOfToday, addDays } from '@/modules/booking/dates';
import { MIN_NIGHTS } from '@/modules/booking/booking.config';
import { rooms as staticRooms } from '@/modules/rooms/rooms.config';
import {
  isMyRentPricingEnabled,
  isMyRentPricingMock,
  usesMyRentStayPricing,
} from '@/modules/myrent/myrent.pricing-config';
import { getMyRentObjectId, isMyRentConfigured } from '@/modules/myrent/myrent.config';
import {
  fetchMyRentCalendar,
  isMyRentDayOccupied,
} from '@/modules/myrent/myrent.calendar';
import { fetchMyRentPricePeriodDetails } from '@/modules/myrent/myrent.price-period';
import {
  buildMockMyRentCalendarRange,
  buildMockMyRentPricePeriod,
} from '@/modules/myrent/myrent.pricing-mock';
import type { MyRentCalendarDay } from '@/modules/myrent/myrent.types';
import { addIsoDays } from '@/modules/myrent/myrent.ranges';

export const LISTING_FROM_CACHE_SECONDS = 3600;
export const LISTING_REFERENCE_ADULTS = 2;
export const LISTING_WINDOW_START_DAYS = 7;
export const LISTING_WINDOW_END_DAYS = 90;

export type ListingFromPriceEntry =
  | {
      mode: 'from';
      perNight: number;
      referenceCheckIn: string;
      referenceNights: number;
      source: 'myrent_period' | 'myrent_mock';
    }
  | { mode: 'unavailable' };

export type ListingFromPriceMap = Record<string, ListingFromPriceEntry>;

const CACHE_TAG = 'myrent-listing-from-prices';

function listingSlugs(): string[] {
  return staticRooms
    .map((r) => r.slug)
    .filter((slug) => usesMyRentStayPricing(slug, true));
}

/** Javno za testove — min noći za referentni boravak. */
export function requiredStayNightsFromDay(
  checkInDay: MyRentCalendarDay | undefined,
): number {
  const myRentMin =
    typeof checkInDay?.min_stay === 'number' && checkInDay.min_stay > 0
      ? Math.floor(checkInDay.min_stay)
      : 0;
  return Math.max(MIN_NIGHTS, myRentMin);
}

function indexDays(days: MyRentCalendarDay[]): Map<string, MyRentCalendarDay> {
  const map = new Map<string, MyRentCalendarDay>();
  for (const d of days) {
    const key = String(d.day ?? '');
    if (key) map.set(key, d);
  }
  return map;
}

/** Noći [checkIn, checkOut) moraju biti slobodne u MyRent kalendaru. */
export function stayNightsFreeInCalendar(
  byDay: Map<string, MyRentCalendarDay>,
  checkIn: string,
  nights: number,
): boolean {
  for (let i = 0; i < nights; i++) {
    const dayKey = addIsoDays(checkIn, i);
    const row = byDay.get(dayKey);
    if (!row || isMyRentDayOccupied(row)) return false;
  }
  return true;
}

function windowBounds(): { dateFrom: string; dateUntil: string } {
  const today = startOfToday();
  return {
    dateFrom: formatDate(addDays(today, LISTING_WINDOW_START_DAYS)),
    dateUntil: formatDate(addDays(today, LISTING_WINDOW_END_DAYS)),
  };
}

async function calendarForSlug(
  roomSlug: string,
  dateFrom: string,
  dateUntil: string,
  calendarByObject: Map<number, MyRentCalendarDay[]>,
): Promise<MyRentCalendarDay[]> {
  const objectId = getMyRentObjectId(roomSlug);
  if (objectId == null) return [];

  if (calendarByObject.has(objectId)) {
    return calendarByObject.get(objectId)!;
  }

  let days: MyRentCalendarDay[];
  try {
    if (isMyRentPricingMock()) {
      days = buildMockMyRentCalendarRange({ roomSlug, dateFrom, dateUntil });
    } else {
      const cal = await fetchMyRentCalendar({
        roomSlug,
        objectId,
        dateFrom,
        dateUntil,
      });
      days = cal.days;
    }
    calendarByObject.set(objectId, days);
    return days;
  } catch {
    calendarByObject.set(objectId, []);
    return [];
  }
}

async function quoteReferenceStay(params: {
  roomSlug: string;
  checkIn: string;
  checkOut: string;
}): Promise<{ perNight: number; total: number; nights: number; source: 'myrent_period' | 'myrent_mock' } | null> {
  const adults = LISTING_REFERENCE_ADULTS;
  const children = 0;

  if (isMyRentPricingMock()) {
    const mock = buildMockMyRentPricePeriod({
      roomSlug: params.roomSlug,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      adults,
      children,
    });
    const nights = mock.nights.length;
    if (nights < 1) return null;
    return {
      perNight: Math.round(mock.accommodationTotal / nights),
      total: mock.accommodationTotal,
      nights,
      source: 'myrent_mock',
    };
  }

  const objectId = getMyRentObjectId(params.roomSlug);
  if (objectId == null || !isMyRentConfigured()) return null;

  try {
    const period = await fetchMyRentPricePeriodDetails({
      objectId,
      dateFrom: params.checkIn,
      dateUntil: params.checkOut,
      adults,
      children,
    });
    const nights = period.nights.length;
    if (nights < 1 || period.accommodationTotal <= 0) return null;
    return {
      perNight: Math.round(period.accommodationTotal / nights),
      total: period.accommodationTotal,
      nights,
      source: 'myrent_period',
    };
  } catch {
    return null;
  }
}

export async function computeListingFromPriceMap(): Promise<ListingFromPriceMap> {
  if (!isMyRentPricingEnabled()) return {};

  const { dateFrom, dateUntil } = windowBounds();
  const calendarByObject = new Map<number, MyRentCalendarDay[]>();
  const out: ListingFromPriceMap = {};

  for (const slug of listingSlugs()) {
    const days = await calendarForSlug(slug, dateFrom, dateUntil, calendarByObject);
    const byDay = indexDays(days);

    let found: ListingFromPriceEntry = { mode: 'unavailable' };

    for (let d = dateFrom; d <= dateUntil; d = addIsoDays(d, 1)) {
      const row = byDay.get(d);
      if (!row || isMyRentDayOccupied(row)) continue;

      const nights = requiredStayNightsFromDay(row);
      const checkOut = addIsoDays(d, nights);
      if (checkOut > addIsoDays(dateUntil, 1)) continue;
      if (!stayNightsFreeInCalendar(byDay, d, nights)) continue;

      const quote = await quoteReferenceStay({
        roomSlug: slug,
        checkIn: d,
        checkOut,
      });
      if (!quote) continue;

      found = {
        mode: 'from',
        perNight: quote.perNight,
        referenceCheckIn: d,
        referenceNights: quote.nights,
        source: quote.source,
      };
      break;
    }

    out[slug] = found;
  }

  return out;
}

async function computeListingFromPriceMapCached(): Promise<ListingFromPriceMap> {
  return computeListingFromPriceMap();
}

const getCachedListingFromPriceMap = unstable_cache(
  computeListingFromPriceMapCached,
  [CACHE_TAG],
  { revalidate: LISTING_FROM_CACHE_SECONDS, tags: [CACHE_TAG] },
);

/** Mapa slug → početna „od” cijena (prazan ako je pricing flag off). */
export async function getListingFromPriceMap(): Promise<ListingFromPriceMap> {
  if (!isMyRentPricingEnabled()) return {};
  return getCachedListingFromPriceMap();
}