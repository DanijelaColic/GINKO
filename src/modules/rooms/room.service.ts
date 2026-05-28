// Copied from Villa-Jurina/src/lib/apartments.ts → getPriceForDate
// Booking logic (availability checks, reservation creation) comes in a later phase

import type { Room } from './room.types';

export function getPriceForDate(room: Room, date: Date): number {
  const month = date.getMonth() + 1; // 1-indexed
  if (month === 7 || month === 8) {
    return room.priceHighSeason;
  }
  return room.priceOffSeason;
}
