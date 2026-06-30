// Copied from Villa-Jurina/src/lib/apartments.ts → getPriceForDate
// Booking logic (availability checks, reservation creation) comes in a later phase

import type { Room } from './room.types';

export function getPriceForDate(room: Room, _date: Date): number {
  return room.price;
}
