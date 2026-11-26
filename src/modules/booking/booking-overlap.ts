// Jedinica zauzetosti mora biti ista u migraciji 021 i u ovom modulu.
// ginko-spa-1 i ginko-spa-2 dijele MyRent object_id 7460.
// Otkazane rezervacije nisu u constraintu. Pending s isteklim holdom jest,
// dok cron ne postavi status cancelled.

import { NextResponse } from 'next/server';

export const SHARED_SPA_ROOM_SLUGS = ['ginko-spa-1', 'ginko-spa-2'] as const;

export const SHARED_SPA_OCCUPANCY_UNIT = 'unit:7460';

export const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'] as const;

export const BOOKING_OVERLAP_CONSTRAINT = 'bookings_no_active_overlap';

export const BOOKING_OVERLAP_ADMIN_MESSAGE =
  'Termin se preklapa s drugom aktivnom rezervacijom iste smještajne jedinice.';

export function occupancyUnitForSlug(roomSlug: string): string {
  if (
    (SHARED_SPA_ROOM_SLUGS as readonly string[]).includes(roomSlug)
  ) {
    return SHARED_SPA_OCCUPANCY_UNIT;
  }
  return `room:${roomSlug}`;
}

export function isBookingOverlapConflict(
  error: { code?: string | null; message?: string | null } | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === '23P01') return true;
  return (error.message ?? '').includes(BOOKING_OVERLAP_CONSTRAINT);
}

export function bookingOverlapConflictResponse() {
  return NextResponse.json(
    {
      error: BOOKING_OVERLAP_ADMIN_MESSAGE,
      code: 'datesUnavailable',
    },
    { status: 409 },
  );
}
