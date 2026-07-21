/**
 * Occupancy + age-based pricing rules for search and booking.
 *
 * Beds: children ≤ CHILD_SHARES_BED_MAX_AGE sleep with parents (no own bed).
 * Extra bed: auto when bedsNeeded > baseOccupancy on rooms with extraBedAvailable.
 * Breakfast: 0–2 gratis · 3–12 half · 13+ full (adults always full).
 */

import type { Room } from '@/modules/rooms/room.types';
import {
  BREAKFAST_PRICE_PER_PERSON_PER_NIGHT,
  BREAKFAST_PRICE_CHILD_3_12,
} from './booking.config';

/** Dijete do ove dobi (uključivo) spava s roditeljima — ne broji se u ležaje. */
export const CHILD_SHARES_BED_MAX_AGE = 2;

/** Gornja granica polovičnog doručka (uključivo). */
export const CHILD_BREAKFAST_HALF_MAX_AGE = 12;

export const MAX_ADULTS = 4;
export const MAX_CHILDREN = 4;
export const MAX_CHILD_AGE = 17;

/** Bazni kapacitet bez pomoćnog ležaja (za 2+1 sobe = capacity − 1). */
export function getBaseOccupancy(room: Room): number {
  if (room.extraBedAvailable && room.capacity > 1) {
    return room.capacity - 1;
  }
  return room.capacity;
}

/** Broj ležaja koje grupa treba (bebe/mala djeca ne broje). */
export function countBedsNeeded(adults: number, childAges: number[]): number {
  const childrenNeedingBed = childAges.filter(
    (age) => age > CHILD_SHARES_BED_MAX_AGE,
  ).length;
  return Math.max(0, adults) + childrenNeedingBed;
}

/**
 * Za filter u searchu: nepoznata starost = dijete treba vlastiti ležaj
 * (konzervativno — ne prikazuj premalu sobu dok se starost ne odabere).
 */
export function countBedsNeededWithPartialAges(
  adults: number,
  children: number,
  childAges: Array<number | null>,
): number {
  let needing = 0;
  for (let i = 0; i < children; i++) {
    const age = childAges[i];
    if (age === null || age === undefined || age > CHILD_SHARES_BED_MAX_AGE) {
      needing += 1;
    }
  }
  return Math.max(0, adults) + needing;
}

/** Treba li automatski naplatiti pomoćni ležaj. */
export function roomNeedsExtraBed(
  room: Room,
  adults: number,
  childAges: number[],
): boolean {
  if (!room.extraBedAvailable) return false;
  const beds = countBedsNeeded(adults, childAges);
  return beds > getBaseOccupancy(room);
}

/** Soba prima grupu s obzirom na ležaje (ne headcount). */
export function roomFitsGuests(
  room: Room,
  adults: number,
  childAges: number[],
): boolean {
  const beds = countBedsNeeded(adults, childAges);
  if (beds === 0) return true;
  return beds <= room.capacity;
}

/** Filter u listi: koristi partial ages (null = treba ležaj). */
export function roomFitsGuestsPartial(
  room: Room,
  adults: number,
  children: number,
  childAges: Array<number | null>,
): boolean {
  const beds = countBedsNeededWithPartialAges(adults, children, childAges);
  if (beds === 0) return true;
  return beds <= room.capacity;
}

export function breakfastPriceForChildAge(age: number): number {
  if (age <= CHILD_SHARES_BED_MAX_AGE) return 0;
  if (age <= CHILD_BREAKFAST_HALF_MAX_AGE) return BREAKFAST_PRICE_CHILD_3_12;
  return BREAKFAST_PRICE_PER_PERSON_PER_NIGHT;
}

/** Ukupna cijena doručka po noći za cijelu grupu. */
export function calculateBreakfastPerNight(
  adults: number,
  childAges: number[],
): number {
  const adultTotal =
    Math.max(0, adults) * BREAKFAST_PRICE_PER_PERSON_PER_NIGHT;
  const childTotal = childAges.reduce(
    (sum, age) => sum + breakfastPriceForChildAge(age),
    0,
  );
  return adultTotal + childTotal;
}

/** Normalizira ages[] na točan broj djece (dopunjava null → treba odabir). */
export function resizeChildAges(
  ages: Array<number | null>,
  count: number,
): Array<number | null> {
  const next = ages.slice(0, count);
  while (next.length < count) next.push(null);
  return next;
}

export function parseChildAgesParam(value: string | null | undefined): number[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 0 && n <= MAX_CHILD_AGE);
}

export function serializeChildAges(ages: number[]): string {
  return ages.join(',');
}

export function childAgesComplete(
  children: number,
  ages: Array<number | null>,
): boolean {
  if (children <= 0) return true;
  if (ages.length < children) return false;
  return ages.slice(0, children).every((a) => a !== null && a >= 0);
}

export function resolvedChildAges(
  children: number,
  ages: Array<number | null>,
): number[] {
  return ages.slice(0, children).map((a) => (a === null ? 0 : a));
}
