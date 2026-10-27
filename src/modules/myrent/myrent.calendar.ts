/**
 * Read-only MyRent kalendar / zauzetost.
 * GET /object_prices/get_calendar/?object_id=&date_from=&date_until=&item_id=-1
 * Docs: https://myrent.readme.io/reference/calendar
 */

import { myrentRequest } from './myrent.client';
import {
  getRoomSlugsForObjectId,
  resolveMyRentObjectId,
} from './myrent.config';
import type {
  MyRentCalendarDay,
  MyRentCalendarResult,
  MyRentOccupiedDay,
} from './myrent.types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function assertDateParam(label: string, value: string): void {
  if (!DATE_RE.test(value)) {
    throw new Error(`${label} mora biti YYYY-MM-DD (dobiveno: ${value}).`);
  }
}

function yn(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Dan je zauzet / nedostupan za prodaju. */
export function isMyRentDayOccupied(day: MyRentCalendarDay): boolean {
  if (yn(day.is_booked)?.toUpperCase() === 'Y') return true;
  if (yn(day.free)?.toUpperCase() === 'N') return true;
  if (yn(day.enable)?.toUpperCase() === 'N') return true;
  const stock = num(day.stock_available);
  if (stock != null && stock <= 0) return true;
  const stockFree = num(day.stock_free);
  if (stockFree != null && stockFree <= 0) return true;
  return false;
}

export function getOccupiedReason(
  day: MyRentCalendarDay,
): MyRentOccupiedDay['reason'] {
  if (yn(day.is_booked)?.toUpperCase() === 'Y') return 'booked';
  if (yn(day.free)?.toUpperCase() === 'N') return 'not_free';
  if (yn(day.enable)?.toUpperCase() === 'N') return 'disabled';
  return 'no_stock';
}

function toOccupiedDay(day: MyRentCalendarDay): MyRentOccupiedDay {
  return {
    day: String(day.day),
    reason: getOccupiedReason(day),
    price: num(day.price),
    free: yn(day.free),
    is_booked: yn(day.is_booked),
    enable: yn(day.enable),
    stock_available: num(day.stock_available),
  };
}

function normalizeCalendarPayload(data: unknown): MyRentCalendarDay[] {
  if (Array.isArray(data)) {
    return data as MyRentCalendarDay[];
  }
  if (data && typeof data === 'object') {
    const maybe = data as { data?: unknown; days?: unknown };
    if (Array.isArray(maybe.data)) return maybe.data as MyRentCalendarDay[];
    if (Array.isArray(maybe.days)) return maybe.days as MyRentCalendarDay[];
  }
  throw new Error('MyRent calendar: odgovor nije niz dana.');
}

export async function fetchMyRentCalendar(params: {
  roomSlug?: string | null;
  objectId?: number | null;
  dateFrom: string;
  dateUntil: string;
}): Promise<MyRentCalendarResult> {
  assertDateParam('dateFrom', params.dateFrom);
  assertDateParam('dateUntil', params.dateUntil);
  if (params.dateUntil < params.dateFrom) {
    throw new Error('dateUntil mora biti >= dateFrom.');
  }

  const objectId = resolveMyRentObjectId({
    roomSlug: params.roomSlug,
    objectId: params.objectId,
  });

  const raw = await myrentRequest<unknown>({
    method: 'GET',
    // Query string u pathu — MyRent docs koriste /object_prices/get_calendar/?...
    path: '/object_prices/get_calendar/',
    query: {
      object_id: objectId,
      date_from: params.dateFrom,
      date_until: params.dateUntil,
      item_id: -1,
    },
  });

  const days = normalizeCalendarPayload(raw);
  const occupied = days.filter(isMyRentDayOccupied).map(toOccupiedDay);
  const slugs = getRoomSlugsForObjectId(objectId);
  const roomSlug =
    params.roomSlug && slugs.includes(params.roomSlug)
      ? params.roomSlug
      : slugs[0] ?? null;

  return {
    objectId,
    roomSlug,
    dateFrom: params.dateFrom,
    dateUntil: params.dateUntil,
    days,
    occupied,
    summary: {
      totalDays: days.length,
      occupiedDays: occupied.length,
      availableDays: days.length - occupied.length,
    },
  };
}

/** Samo lista zauzetih datuma (YYYY-MM-DD) — za usporedbu s MyRent UI. */
export async function fetchMyRentOccupiedDates(params: {
  roomSlug?: string | null;
  objectId?: number | null;
  dateFrom: string;
  dateUntil: string;
}): Promise<{
  objectId: number;
  roomSlugs: string[];
  occupiedDates: string[];
}> {
  const result = await fetchMyRentCalendar(params);
  return {
    objectId: result.objectId,
    roomSlugs: getRoomSlugsForObjectId(result.objectId),
    occupiedDates: result.occupied.map((d) => d.day),
  };
}
