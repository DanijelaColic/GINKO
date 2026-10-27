/**
 * Adapter: MyRent zauzete noći (YYYY-MM-DD) → Ginko BookedRange[].
 * Poluotvoreni interval [check_in, check_out): dan odlaska ostaje slobodan za novi dolazak.
 */

import type { BookedRange } from '@/modules/booking/booking.types';
import type { MyRentCalendarDay } from './myrent.types';
import { isMyRentDayOccupied } from './myrent.calendar';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Dodaj N dana na YYYY-MM-DD (UTC kalendar, bez timezone pomaka). */
export function addIsoDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/**
 * Uzastopne zauzete noći → rangeovi.
 * Primjer: 27.–28.10. zauzeto → { check_in: '2026-10-27', check_out: '2026-10-29' }
 * pa je 29.10. slobodan za check-in.
 */
export function occupiedDatesToBookedRanges(
  occupiedDates: readonly string[],
): BookedRange[] {
  const sorted = [
    ...new Set(
      occupiedDates.filter(
        (d): d is string => typeof d === 'string' && DATE_RE.test(d),
      ),
    ),
  ].sort();

  if (sorted.length === 0) return [];

  const ranges: BookedRange[] = [];
  let rangeStart = sorted[0]!;
  let prev = sorted[0]!;

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i]!;
    if (cur === addIsoDays(prev, 1)) {
      prev = cur;
      continue;
    }
    ranges.push({
      check_in: rangeStart,
      check_out: addIsoDays(prev, 1),
    });
    rangeStart = cur;
    prev = cur;
  }

  ranges.push({
    check_in: rangeStart,
    check_out: addIsoDays(prev, 1),
  });

  return ranges;
}

export function myRentDaysToBookedRanges(
  days: readonly MyRentCalendarDay[],
): BookedRange[] {
  const occupied = days
    .filter(isMyRentDayOccupied)
    .map((d) => String(d.day))
    .filter((d) => DATE_RE.test(d));
  return occupiedDatesToBookedRanges(occupied);
}

/** Proširi BookedRange[] u skup zauzetih noći (YYYY-MM-DD). */
export function bookedRangesToOccupiedNights(
  ranges: readonly BookedRange[],
): Set<string> {
  const nights = new Set<string>();
  for (const r of ranges) {
    if (!r?.check_in || !r?.check_out || r.check_out <= r.check_in) continue;
    let d = r.check_in;
    while (d < r.check_out) {
      nights.add(d);
      d = addIsoDays(d, 1);
    }
  }
  return nights;
}

/**
 * Makni noći pokrivene lokalnim Ginko rezervacijama iz MyRent rangeova
 * (izbjegava dvostruki prikaz istog termina u Timelineu).
 */
export function subtractOccupiedRanges(
  source: readonly BookedRange[],
  subtract: readonly BookedRange[],
): BookedRange[] {
  const sourceNights = bookedRangesToOccupiedNights(source);
  if (sourceNights.size === 0) return [];
  const covered = bookedRangesToOccupiedNights(subtract);
  for (const night of covered) {
    sourceNights.delete(night);
  }
  return occupiedDatesToBookedRanges([...sourceNights]);
}
