/**
 * booking.repository.ts — mock adapter
 * Phase 3: returns empty availability and a synthetic booking ID.
 * Replace with Supabase client calls in Phase 4.
 */

import type { BookedRange, BookingCreateInput } from './booking.types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getBookedRanges(roomSlug: string): Promise<BookedRange[]> {
  // Mock: no existing bookings — replace with Supabase query in Phase 4
  return [];
}

export async function createBooking(
  data: BookingCreateInput,
): Promise<{ id: string }> {
  // Mock: log and return synthetic ID
  console.log('[mock] createBooking', data);
  const id = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return { id };
}
