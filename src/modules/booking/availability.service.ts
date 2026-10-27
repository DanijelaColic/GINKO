/**
 * Guest availability: MyRent (SoT) ∪ lokalne bookings ∪ blocked_dates ∪ iCal.
 * Fail-closed: ako MyRent nije dostupan, bacamo grešku — nikad prazan "sve slobodno".
 */

import { createServerSupabaseClient } from '@/lib/supabase';
import { getRoomBySlug } from '@/modules/rooms/room.repository';
import {
  fetchMyRentCalendar,
  getMyRentObjectId,
  getRoomSlugsForObjectId,
  isMyRentConfigured,
  MyRentApiError,
  MyRentAuthError,
  occupiedDatesToBookedRanges,
} from '@/modules/myrent';
import { formatDate, startOfToday, addDays } from './dates';
import type { BookedRange } from './booking.types';

/** Koliko unaprijed vučemo MyRent kalendar za guest UI. */
export const MYRENT_AVAILABILITY_HORIZON_DAYS = 365;

export class AvailabilityUnavailableError extends Error {
  constructor(message = 'Dostupnost trenutno nije dostupna.') {
    super(message);
    this.name = 'AvailabilityUnavailableError';
  }
}

function mergeBookedRanges(ranges: BookedRange[]): BookedRange[] {
  // Dedup identičnih rangeova; overlap merge nije nužan za isDateBooked
  const seen = new Set<string>();
  const out: BookedRange[] = [];
  for (const r of ranges) {
    if (!r?.check_in || !r?.check_out) continue;
    if (r.check_out <= r.check_in) continue;
    const key = `${r.check_in}|${r.check_out}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ check_in: r.check_in, check_out: r.check_out });
  }
  return out;
}

/** Svi slugovi koji dijele fizičku jedinicu (linkedSlugs + isti MyRent object_id). */
export function getAvailabilitySlugsForRoom(roomSlug: string): string[] {
  const room = getRoomBySlug(roomSlug);
  const slugs = new Set<string>([roomSlug, ...(room?.linkedSlugs ?? [])]);
  const objectId = getMyRentObjectId(roomSlug);
  if (objectId != null) {
    for (const s of getRoomSlugsForObjectId(objectId)) slugs.add(s);
  }
  return [...slugs];
}

async function fetchLocalBookedRanges(
  roomSlug: string,
): Promise<BookedRange[]> {
  const slugsToCheck = getAvailabilitySlugsForRoom(roomSlug);
  const supabase = createServerSupabaseClient();

  const [bookingsRes, blockedRes, externalRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('check_in, check_out')
      .in('room_slug', slugsToCheck)
      .neq('status', 'cancelled'),
    supabase
      .from('blocked_dates')
      .select('check_in, check_out')
      .in('room_slug', slugsToCheck),
    supabase
      .from('external_calendar_events')
      .select('starts_on, ends_on')
      .in('room_slug', slugsToCheck),
  ]);

  if (bookingsRes.error) throw bookingsRes.error;
  if (blockedRes.error) throw blockedRes.error;
  if (externalRes.error) throw externalRes.error;

  return [
    ...(bookingsRes.data ?? []),
    ...(blockedRes.data ?? []),
    ...(externalRes.data ?? []).map((e) => ({
      check_in: e.starts_on as string,
      check_out: e.ends_on as string,
    })),
  ];
}

async function fetchMyRentBookedRanges(
  roomSlug: string,
): Promise<BookedRange[]> {
  if (!isMyRentConfigured()) {
    throw new AvailabilityUnavailableError(
      'MyRent nije konfiguriran (nedostaju MYRENT_* env varijable).',
    );
  }

  const objectId = getMyRentObjectId(roomSlug);
  if (objectId == null) {
    throw new AvailabilityUnavailableError(
      `Nema MyRent object_id za sobu: ${roomSlug}`,
    );
  }

  const from = formatDate(startOfToday());
  const until = formatDate(
    addDays(startOfToday(), MYRENT_AVAILABILITY_HORIZON_DAYS),
  );

  try {
    const calendar = await fetchMyRentCalendar({
      objectId,
      roomSlug,
      dateFrom: from,
      dateUntil: until,
    });
    return occupiedDatesToBookedRanges(calendar.occupied.map((d) => d.day));
  } catch (err) {
    if (
      err instanceof MyRentAuthError ||
      err instanceof MyRentApiError ||
      err instanceof AvailabilityUnavailableError
    ) {
      throw new AvailabilityUnavailableError(
        'MyRent kalendar nije dostupan.',
      );
    }
    throw new AvailabilityUnavailableError(
      'MyRent kalendar nije dostupan.',
    );
  }
}

/**
 * Zauzeti rangeovi za guest kalendar / availability search.
 * Baca AvailabilityUnavailableError ako MyRent ne odgovara (fail-closed).
 */
export async function getGuestBookedRanges(
  roomSlug: string,
): Promise<BookedRange[]> {
  const room = getRoomBySlug(roomSlug);
  if (!room) {
    throw new AvailabilityUnavailableError(`Nepoznata soba: ${roomSlug}`);
  }

  // MyRent prvo — fail-closed prije lokalnog mergea
  const myrentRanges = await fetchMyRentBookedRanges(roomSlug);
  const localRanges = await fetchLocalBookedRanges(roomSlug);

  return mergeBookedRanges([...myrentRanges, ...localRanges]);
}

// Re-export date helpers used by older imports of this module
export { isDateBooked, isRangeAvailable, getFirstBlockedAfter } from './dates';
