// Copied 1:1 from Villa-Velebita/src/modules/booking-admin/lib/dates.ts
// (imports updated to point to local booking.config + booking.types)

import type { BookedRange } from './booking.types';
import type { Room } from '@/modules/rooms/room.types';
import {
  DEPOSIT_PERCENT,
  CLEANING_FEE,
  EXTRA_BED_PRICE_PER_NIGHT,
  CRIB_PRICE_PER_NIGHT,
  BREAKFAST_PRICE_PER_PERSON_PER_NIGHT,
} from './booking.config';
import type { PriceBreakdown } from './booking.types';

// ── Osnovni date helpers ──────────────────────────────────────────

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isBeforeDay(a: Date, b: Date): boolean {
  return !isSameDay(a, b) && a < b;
}

export function diffDays(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / 86400000);
}

/** Parsira "YYYY-MM-DD" bez timezone konverzije */
export function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(date: Date, locale = 'hr'): string {
  void locale;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(date: Date, locale = 'hr'): string {
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(date: Date, locale = 'hr'): string {
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

// ── Dostupnost ────────────────────────────────────────────────────

/** Dan je zauzet ako check_in <= dan < check_out */
export function isDateBooked(date: Date, ranges: BookedRange[]): boolean {
  return ranges.some(({ check_in, check_out }) => {
    const ci = parseLocalDate(check_in);
    const co = parseLocalDate(check_out);
    return date >= ci && date < co;
  });
}

export function isRangeAvailable(
  checkIn: Date,
  checkOut: Date,
  ranges: BookedRange[],
): boolean {
  let d = new Date(checkIn);
  while (d < checkOut) {
    if (isDateBooked(d, ranges)) return false;
    d = addDays(d, 1);
  }
  return true;
}

/** Pronađi prvi zauzeti dan strogo nakon checkIn */
export function getFirstBlockedAfter(checkIn: Date, ranges: BookedRange[]): Date | null {
  let d = addDays(checkIn, 1);
  for (let i = 0; i < 365; i++) {
    if (isDateBooked(d, ranges)) return d;
    d = addDays(d, 1);
  }
  return null;
}

// ── Kalendar ──────────────────────────────────────────────────────

/** Generiraj grid za prikaz mjeseca (null za prazne ćelije, ponedjeljak = 0) */
export function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const grid: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push(new Date(year, month, d));
  }
  return grid;
}

// ── Cijena ───────────────────────────────────────────────────────

export type PriceExtras = {
  /** Broj pomoćnih ležajeva (0 ili 1) */
  extraBeds?: number;
  /** Dječji krevetić: true = naplatiti 20 €/noć */
  crib?: boolean;
  /** Buffet doručak: broj osoba (0 = bez doručka) */
  breakfastGuests?: number;
};

export const EXTRA_BED_LABEL = 'Pomoćni ležaj';
export const CRIB_LABEL = 'Dječji krevetić';
export const BREAKFAST_LABEL = 'Doručak (buffet)';
export const ACCOMMODATION_LABEL = 'Smještaj';

export function calculatePrice(
  checkIn: Date,
  checkOut: Date,
  room: Room,
  extras?: PriceExtras,
): PriceBreakdown {
  const nights = diffDays(checkOut, checkIn);
  const lines: PriceBreakdown['lines'] = [];

  if (nights > 0) {
    lines.push({
      label: ACCOMMODATION_LABEL,
      nights,
      pricePerNight: room.price,
      subtotal: nights * room.price,
    });
  }

  const rawAccommodationPrice = nights * room.price;

  // Dodaci (izvan čišćenja — uvijek puna cijena)
  const extraBedCount = extras?.extraBeds ?? 0;
  if (extraBedCount > 0) {
    lines.push({
      label: EXTRA_BED_LABEL,
      nights,
      pricePerNight: EXTRA_BED_PRICE_PER_NIGHT,
      subtotal: nights * EXTRA_BED_PRICE_PER_NIGHT * extraBedCount,
    });
  }

  if (extras?.crib) {
    lines.push({
      label: CRIB_LABEL,
      nights,
      pricePerNight: CRIB_PRICE_PER_NIGHT,
      subtotal: nights * CRIB_PRICE_PER_NIGHT,
    });
  }

  const breakfastCount = extras?.breakfastGuests ?? 0;
  if (breakfastCount > 0) {
    const pricePerNight = BREAKFAST_PRICE_PER_PERSON_PER_NIGHT * breakfastCount;
    lines.push({
      label: BREAKFAST_LABEL,
      nights,
      pricePerNight,
      subtotal: nights * pricePerNight,
    });
  }

  const extrasTotal =
    (extraBedCount > 0 ? nights * EXTRA_BED_PRICE_PER_NIGHT * extraBedCount : 0) +
    (extras?.crib ? nights * CRIB_PRICE_PER_NIGHT : 0) +
    (breakfastCount > 0 ? nights * BREAKFAST_PRICE_PER_PERSON_PER_NIGHT * breakfastCount : 0);

  const totalPrice = rawAccommodationPrice + CLEANING_FEE + extrasTotal;
  const deposit = Math.round(totalPrice * DEPOSIT_PERCENT);

  return {
    nights,
    totalPrice,
    deposit,
    lines,
    discountAmount: 0,
    cleaningFee: CLEANING_FEE,
  };
}
