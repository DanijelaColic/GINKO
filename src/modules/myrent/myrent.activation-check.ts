/**
 * Read-only provjera nakon rent_add.
 * live_ok ne znači da je termin blokiran — treba active=Y i sve noći u kalendaru.
 * Ne zove write API.
 */

import {
  fetchMyRentCalendar,
  isMyRentDayOccupied,
} from './myrent.calendar';
import type { MyRentCalendarDay } from './myrent.types';
import { addIsoDays } from './myrent.ranges';
import { myrentRequest } from './myrent.client';
import { parseRentActiveFlag, type RentActiveStatus } from './myrent.inbound-cancel';
import { isMyRentConfigured } from './myrent.config';
import { getMyRentSyncStore } from './myrent.sync-store';
import {
  dispatchMyRentActivationAlert,
  type ActivationAlertDispatch,
} from './myrent.activation-alert';

export type ActivationIssue =
  | 'not_yet_active'
  | 'calendar_open'
  | 'check_failed';

export type StayNight = string;

/** Noći boravka [checkIn, checkOut). Dan odlaska nije noć boravka. */
export function stayNights(checkIn: string, checkOut: string): StayNight[] {
  if (!checkIn || !checkOut || checkOut <= checkIn) return [];
  const nights: string[] = [];
  for (let day = checkIn; day < checkOut; day = addIsoDays(day, 1)) {
    nights.push(day);
    if (nights.length > 370) break;
  }
  return nights;
}

export function calendarCoversEveryNight(
  days: readonly MyRentCalendarDay[],
  nights: readonly string[],
): boolean {
  if (nights.length === 0) return false;
  const byDay = new Map(days.map((d) => [String(d.day ?? ''), d]));
  return nights.every((night) => {
    const row = byDay.get(night);
    return row != null && isMyRentDayOccupied(row);
  });
}

export function activationIssueFor(params: {
  active: RentActiveStatus;
  calendarBlocked: boolean;
}): ActivationIssue | null {
  if (params.active === 'unknown') return 'check_failed';
  if (params.active !== 'Y') return 'not_yet_active';
  if (!params.calendarBlocked) return 'calendar_open';
  return null;
}

export type ActivationObservation = {
  active: RentActiveStatus;
  calendarBlocked: boolean;
  issue: ActivationIssue | null;
  seenActiveAt: string | null;
};

export async function readMyRentActivation(params: {
  rentGuid: string | null | undefined;
  objectId: number;
  checkIn: string;
  checkOut: string;
  nowIso?: string;
  fetchActive?: (guid: string) => Promise<RentActiveStatus>;
  fetchDays?: (input: {
    objectId: number;
    dateFrom: string;
    dateUntil: string;
  }) => Promise<MyRentCalendarDay[]>;
}): Promise<ActivationObservation> {
  const nowIso = params.nowIso ?? new Date().toISOString();
  const nights = stayNights(params.checkIn, params.checkOut);
  const guid = params.rentGuid?.trim() || '';

  if (!guid || nights.length === 0 || !params.objectId) {
    return {
      active: 'unknown',
      calendarBlocked: false,
      issue: 'check_failed',
      seenActiveAt: null,
    };
  }

  const fetchActive =
    params.fetchActive ??
    (async (rentGuid: string) => {
      const raw = await myrentRequest<unknown>({
        method: 'GET',
        path: `/user/rent_get/${encodeURIComponent(rentGuid)}`,
      });
      return parseRentActiveFlag(raw);
    });

  const fetchDays =
    params.fetchDays ??
    (async (input) => {
      const cal = await fetchMyRentCalendar({
        objectId: input.objectId,
        dateFrom: input.dateFrom,
        dateUntil: input.dateUntil,
      });
      return cal.days;
    });

  try {
    const lastNight = nights[nights.length - 1]!;
    const [active, days] = await Promise.all([
      fetchActive(guid),
      fetchDays({
        objectId: params.objectId,
        dateFrom: nights[0]!,
        dateUntil: lastNight,
      }),
    ]);
    const calendarBlocked = calendarCoversEveryNight(days, nights);
    return {
      active,
      calendarBlocked,
      issue: activationIssueFor({ active, calendarBlocked }),
      seenActiveAt: active === 'Y' ? nowIso : null,
    };
  } catch {
    return {
      active: 'unknown',
      calendarBlocked: false,
      issue: 'check_failed',
      seenActiveAt: null,
    };
  }
}

/**
 * Nakon live_ok. Ne mijenja booking, Saferpay ni rent_add.
 * Ako shema 019 nije primijenjena, bilježi se samo u logu.
 */
export async function observeMyRentActivationAfterLiveOk(params: {
  bookingId: string;
  rentGuid: string | null | undefined;
  objectId: number;
  checkIn: string;
  checkOut: string;
  nowIso?: string;
}): Promise<ActivationAlertDispatch | null> {
  if (!isMyRentConfigured()) {
    return null;
  }

  const observation = await readMyRentActivation(params);
  const store = getMyRentSyncStore();
  if (!store.recordActivationObservation) return null;

  try {
    await store.recordActivationObservation({
      bookingId: params.bookingId,
      seenActiveAt: observation.seenActiveAt,
      calendarBlocked: observation.issue === 'check_failed'
        ? null
        : observation.calendarBlocked,
      activationIssue: observation.issue,
      checkedAt: params.nowIso ?? new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/seen_active_at|calendar_blocked|activation_issue|schema cache/i.test(message)) {
      console.error(
        '[myrent-activation] migracija 019 nije primijenjena — nema otkazivanja:',
        params.bookingId,
      );
      return null;
    }
    console.error('[myrent-activation] zapis provjere nije uspio:', params.bookingId, message);
    return null;
  }

  if (!observation.issue) return null;

  return dispatchMyRentActivationAlert({
    bookingId: params.bookingId,
    issue: observation.issue,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
  });
}
