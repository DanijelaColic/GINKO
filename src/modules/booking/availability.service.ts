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
import { logMyRentFailure } from '@/modules/myrent/myrent.diagnostics';
import {
  formatDate,
  startOfToday,
  addDays,
  isRangeAvailable,
  parseLocalDate,
} from './dates';
import type { BookedRange } from './booking.types';

/** Koliko unaprijed vučemo MyRent kalendar za guest UI. */
export const MYRENT_AVAILABILITY_HORIZON_DAYS = 365;

export class AvailabilityUnavailableError extends Error {
  constructor(message = 'Dostupnost trenutno nije dostupna.') {
    super(message);
    this.name = 'AvailabilityUnavailableError';
  }
}

/** Termin zauzet (MyRent ili lokalno) — gost treba odabrati druge datume. */
export class DatesUnavailableError extends Error {
  constructor(message = 'Odabrani termini nisu dostupni.') {
    super(message);
    this.name = 'DatesUnavailableError';
  }
}

export type FetchLocalRangesOptions = {
  /** Isključi vlastiti booking red (npr. re-check prije potvrde nakon plaćanja). */
  excludeBookingId?: string | null;
};

export type StayAvailabilityDeps = {
  fetchMyRentRangesForWindow: (
    roomSlug: string,
    dateFrom: string,
    dateUntil: string,
  ) => Promise<BookedRange[]>;
  fetchLocalRanges: (
    roomSlug: string,
    options?: FetchLocalRangesOptions,
  ) => Promise<BookedRange[]>;
};

export type AssertStayAvailableOptions = {
  excludeBookingId?: string | null;
};

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
  options?: FetchLocalRangesOptions,
): Promise<BookedRange[]> {
  const slugsToCheck = getAvailabilitySlugsForRoom(roomSlug);
  const supabase = createServerSupabaseClient();
  const excludeId = options?.excludeBookingId?.trim() || null;

  let bookingsQuery = supabase
    .from('bookings')
    .select('id, check_in, check_out')
    .in('room_slug', slugsToCheck)
    .neq('status', 'cancelled');

  if (excludeId) {
    bookingsQuery = bookingsQuery.neq('id', excludeId);
  }

  const [bookingsRes, blockedRes, externalRes] = await Promise.all([
    bookingsQuery,
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
    ...(bookingsRes.data ?? []).map((b) => ({
      check_in: b.check_in as string,
      check_out: b.check_out as string,
    })),
    ...(blockedRes.data ?? []),
    ...(externalRes.data ?? []).map((e) => ({
      check_in: e.starts_on as string,
      check_out: e.ends_on as string,
    })),
  ];
}

async function fetchMyRentBookedRangesForWindow(
  roomSlug: string,
  dateFrom: string,
  dateUntil: string,
): Promise<BookedRange[]> {
  if (!isMyRentConfigured()) {
    logMyRentFailure({
      configured: false,
      step: 'config',
      httpStatus: null,
      bodyKind: 'empty',
      cloudflareChallenge: false,
    });
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

  try {
    const calendar = await fetchMyRentCalendar({
      objectId,
      roomSlug,
      dateFrom,
      dateUntil,
    });
    return occupiedDatesToBookedRanges(calendar.occupied.map((d) => d.day));
  } catch (err) {
    if (err instanceof AvailabilityUnavailableError) throw err;
    if (err instanceof MyRentAuthError || err instanceof MyRentApiError) {
      throw new AvailabilityUnavailableError('MyRent kalendar nije dostupan.');
    }
    throw new AvailabilityUnavailableError('MyRent kalendar nije dostupan.');
  }
}

async function fetchMyRentBookedRanges(
  roomSlug: string,
): Promise<BookedRange[]> {
  const from = formatDate(startOfToday());
  const until = formatDate(
    addDays(startOfToday(), MYRENT_AVAILABILITY_HORIZON_DAYS),
  );
  return fetchMyRentBookedRangesForWindow(roomSlug, from, until);
}

const defaultStayDeps: StayAvailabilityDeps = {
  fetchMyRentRangesForWindow: fetchMyRentBookedRangesForWindow,
  fetchLocalRanges: fetchLocalBookedRanges,
};

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

/**
 * Svježa provjera prije POST rezervacije ili prije potvrde nakon plaćanja.
 * - MyRent fail → AvailabilityUnavailableError (ne potvrđuj)
 * - overlap MyRent ∪ lokalno → DatesUnavailableError
 * - options.excludeBookingId: lokalni red ne blokira sam sebe
 * SPA 1/2 dijele object_id 7460 + linkedSlugs u lokalnom fetchu.
 */
export async function assertBookingStayAvailable(
  roomSlug: string,
  checkInIso: string,
  checkOutIso: string,
  deps: StayAvailabilityDeps = defaultStayDeps,
  options?: AssertStayAvailableOptions,
): Promise<void> {
  const room = getRoomBySlug(roomSlug);
  if (!room) {
    throw new AvailabilityUnavailableError(`Nepoznata soba: ${roomSlug}`);
  }

  const checkInDate = parseLocalDate(checkInIso);
  const checkOutDate = parseLocalDate(checkOutIso);
  if (!(checkOutDate > checkInDate)) {
    throw new DatesUnavailableError('Neispravan raspon datuma.');
  }

  // Uski prozor oko boravka — svježi MyRent read (ne keširani GET horizon)
  const myrentRanges = await deps.fetchMyRentRangesForWindow(
    roomSlug,
    checkInIso,
    checkOutIso,
  );
  const localRanges = await deps.fetchLocalRanges(roomSlug, {
    excludeBookingId: options?.excludeBookingId,
  });
  const ranges = mergeBookedRanges([...myrentRanges, ...localRanges]);

  if (!isRangeAvailable(checkInDate, checkOutDate, ranges)) {
    throw new DatesUnavailableError();
  }
}

export type ConfirmAvailabilityResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'unavailable' | 'myrent_down' | 'missing_booking' | 'error';
      message: string;
    };

/**
 * Re-check prije konačne potvrde (npr. nakon budućeg Saferpay uspjeha).
 * Isključuje vlastiti booking_id iz lokalnih rangeova.
 * Ne šalje email, ne piše u MyRent, ne mijenja naplatu — samo provjera.
 */
export async function recheckAvailabilityBeforeBookingConfirm(
  bookingId: string,
  deps: StayAvailabilityDeps = defaultStayDeps,
): Promise<ConfirmAvailabilityResult> {
  const id = bookingId?.trim();
  if (!id) {
    return { ok: false, reason: 'missing_booking', message: 'Nedostaje booking id.' };
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('bookings')
      .select('id, room_slug, check_in, check_out, status')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        reason: 'error',
        message: error.message || 'Greška učitavanja rezervacije.',
      };
    }
    if (!data) {
      return {
        ok: false,
        reason: 'missing_booking',
        message: 'Rezervacija nije pronađena.',
      };
    }
    if (data.status === 'cancelled') {
      return {
        ok: false,
        reason: 'unavailable',
        message: 'Rezervacija je otkazana.',
      };
    }

    await assertBookingStayAvailable(
      data.room_slug as string,
      data.check_in as string,
      data.check_out as string,
      deps,
      { excludeBookingId: id },
    );
    return { ok: true };
  } catch (err) {
    if (err instanceof DatesUnavailableError) {
      return {
        ok: false,
        reason: 'unavailable',
        message: err.message || 'Termin više nije dostupan.',
      };
    }
    if (err instanceof AvailabilityUnavailableError) {
      return {
        ok: false,
        reason: 'myrent_down',
        message: err.message || 'MyRent kalendar nije dostupan.',
      };
    }
    return {
      ok: false,
      reason: 'error',
      message: err instanceof Error ? err.message : 'Greška provjere dostupnosti.',
    };
  }
}

// Re-export date helpers used by older imports of this module
export { isDateBooked, isRangeAvailable, getFirstBlockedAfter } from './dates';
