/**
 * MyRent → Ginko: periodična sinkronizacija otkazivanja.
 *
 * Samo confirmed bookinge s live_ok syncom + myrent_rent_id.
 * active=N → bookings.status=cancelled + audit.
 * Nikad Saferpay refund. Fail-closed pri API grešci / nejasnom odgovoru.
 */

import { createServerSupabaseClient } from '@/lib/supabase';
import { myrentRequest, MyRentApiError } from './myrent.client';
import { MyRentAuthError } from './myrent.auth';

export const MYRENT_INBOUND_CANCEL_REASON =
  'myrent_rent_active_N';

export type InboundCancelCandidate = {
  bookingId: string;
  bookingStatus: string;
  checkIn: string;
  checkOut: string;
  myrentRentId: string;
  myrentRentGuid: string | null;
};

export type RentActiveStatus = 'Y' | 'N' | 'unknown';

export type InboundCancelAction =
  | {
      bookingId: string;
      myrentRentId: string;
      outcome: 'cancelled';
      previousStatus: string;
    }
  | {
      bookingId: string;
      myrentRentId: string;
      outcome: 'skipped_already_cancelled' | 'skipped_still_active' | 'skipped_unknown';
      detail?: string;
    }
  | {
      bookingId: string;
      myrentRentId: string;
      outcome: 'error';
      detail: string;
    };

export type InboundCancelSyncResult = {
  scanned: number;
  cancelled: number;
  skipped: number;
  errors: number;
  actions: InboundCancelAction[];
};

/** UTC YYYY-MM-DD — ne sinkaj povijesne (check_out < today). */
export function utcTodayIsoDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function shouldScanBookingForInboundCancel(params: {
  bookingStatus: string;
  checkOut: string;
  myrentRentId: string | null | undefined;
  syncStatus: string;
  confirmedLiveSync: boolean;
  todayIso?: string;
}): boolean {
  if (params.bookingStatus !== 'confirmed') return false;
  if (params.syncStatus !== 'live_ok') return false;
  if (params.confirmedLiveSync !== true) return false;
  const rentId = params.myrentRentId?.trim() ?? '';
  if (!rentId) return false;
  const today = params.todayIso ?? utcTodayIsoDate();
  // check_out >= today → još relevantno za raspoloživost
  return params.checkOut >= today;
}

function unwrapRentRow(raw: unknown): Record<string, unknown> | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return first && typeof first === 'object'
      ? (first as Record<string, unknown>)
      : null;
  }
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  return null;
}

export function parseRentActiveFlag(raw: unknown): RentActiveStatus {
  const row = unwrapRentRow(raw);
  if (!row) return 'unknown';
  const active = row.active;
  if (active === 'Y' || active === 'y' || active === true || active === 1) {
    return 'Y';
  }
  if (active === 'N' || active === 'n' || active === false || active === 0) {
    return 'N';
  }
  if (typeof active === 'string') {
    const v = active.trim().toUpperCase();
    if (v === 'Y') return 'Y';
    if (v === 'N') return 'N';
  }
  return 'unknown';
}

function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export type InboundCancelDeps = {
  listCandidates: () => Promise<InboundCancelCandidate[]>;
  fetchRentActive: (
    candidate: InboundCancelCandidate,
  ) => Promise<RentActiveStatus>;
  cancelBookingIfConfirmed: (params: {
    bookingId: string;
    myrentRentId: string;
    myrentRentGuid: string | null;
    reason: string;
  }) => Promise<'cancelled' | 'already_cancelled'>;
  nowIso?: () => string;
};

/** rent_get(guid) ili rent_list match po id — bez writea. */
export async function fetchMyRentRentActiveStatus(
  candidate: InboundCancelCandidate,
): Promise<RentActiveStatus> {
  const guid = candidate.myrentRentGuid?.trim() || null;

  if (guid) {
    try {
      const raw = await myrentRequest<unknown>({
        method: 'GET',
        path: `/user/rent_get/${encodeURIComponent(guid)}`,
      });
      return parseRentActiveFlag(raw);
    } catch (err) {
      if (err instanceof MyRentAuthError || err instanceof MyRentApiError) {
        return 'unknown';
      }
      return 'unknown';
    }
  }

  // Fallback bez GUID-a: rent_list (active=Y pa active=N), match samo po myrent_rent_id.
  // Napomena: myrentRequest query builder preskače prazan active="" — zato dva poziva.
  try {
    const dateFrom = addDaysIso(candidate.checkIn, -1);
    const dateUntil = addDaysIso(candidate.checkOut, 1);
    const baseQuery = {
      date_from: dateFrom,
      date_until: dateUntil,
      type: 'check_in',
    } as const;

    const findByRentId = (raw: unknown): unknown | null => {
      const rows = Array.isArray(raw) ? raw : [];
      const matches = rows.filter((row) => {
        if (!row || typeof row !== 'object') return false;
        return (
          String((row as Record<string, unknown>).id ?? '') ===
          candidate.myrentRentId
        );
      });
      return matches.length === 1 ? matches[0] : null;
    };

    const activeList = await myrentRequest<unknown>({
      method: 'GET',
      path: '/user/rent_list',
      query: { ...baseQuery, active: 'Y' },
    });
    if (findByRentId(activeList)) return 'Y';

    const inactiveList = await myrentRequest<unknown>({
      method: 'GET',
      path: '/user/rent_list',
      query: { ...baseQuery, active: 'N' },
    });
    if (findByRentId(inactiveList)) return 'N';

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function listInboundCancelCandidatesFromSupabase(): Promise<
  InboundCancelCandidate[]
> {
  const supabase = createServerSupabaseClient();
  const today = utcTodayIsoDate();

  const { data, error } = await supabase
    .from('myrent_booking_sync')
    .select(
      `
      booking_id,
      status,
      confirmed_live_sync,
      myrent_rent_id,
      myrent_rent_guid,
      bookings!inner (
        id,
        status,
        check_in,
        check_out
      )
    `,
    )
    .eq('status', 'live_ok')
    .eq('confirmed_live_sync', true)
    .not('myrent_rent_id', 'is', null);

  if (error) throw error;

  const out: InboundCancelCandidate[] = [];
  for (const row of data ?? []) {
    const bookingRaw = row.bookings as
      | {
          id?: string;
          status?: string;
          check_in?: string;
          check_out?: string;
        }
      | {
          id?: string;
          status?: string;
          check_in?: string;
          check_out?: string;
        }[]
      | null;

    const booking = Array.isArray(bookingRaw) ? bookingRaw[0] : bookingRaw;
    if (!booking) continue;

    const candidate = {
      bookingId: String(booking.id ?? row.booking_id),
      bookingStatus: String(booking.status ?? ''),
      checkIn: String(booking.check_in ?? ''),
      checkOut: String(booking.check_out ?? ''),
      myrentRentId: String(row.myrent_rent_id ?? '').trim(),
      myrentRentGuid:
        typeof row.myrent_rent_guid === 'string' && row.myrent_rent_guid.trim()
          ? row.myrent_rent_guid.trim()
          : null,
      syncStatus: String(row.status ?? ''),
      confirmedLiveSync: row.confirmed_live_sync === true,
    };

    if (
      !shouldScanBookingForInboundCancel({
        bookingStatus: candidate.bookingStatus,
        checkOut: candidate.checkOut,
        myrentRentId: candidate.myrentRentId,
        syncStatus: candidate.syncStatus,
        confirmedLiveSync: candidate.confirmedLiveSync,
        todayIso: today,
      })
    ) {
      continue;
    }

    out.push({
      bookingId: candidate.bookingId,
      bookingStatus: candidate.bookingStatus,
      checkIn: candidate.checkIn,
      checkOut: candidate.checkOut,
      myrentRentId: candidate.myrentRentId,
      myrentRentGuid: candidate.myrentRentGuid,
    });
  }

  return out;
}

export async function cancelBookingFromMyRentInSupabase(params: {
  bookingId: string;
  myrentRentId: string;
  myrentRentGuid: string | null;
  reason: string;
}): Promise<'cancelled' | 'already_cancelled'> {
  const supabase = createServerSupabaseClient();
  const detectedAt = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', params.bookingId)
    .eq('status', 'confirmed')
    .select('id')
    .maybeSingle();

  if (updateError) throw updateError;

  if (!updated) {
    return 'already_cancelled';
  }

  const { error: auditError } = await supabase
    .from('myrent_inbound_cancel_audit')
    .insert({
      booking_id: params.bookingId,
      myrent_rent_id: params.myrentRentId,
      myrent_rent_guid: params.myrentRentGuid,
      previous_status: 'confirmed',
      new_status: 'cancelled',
      reason: params.reason,
      detected_at: detectedAt,
    });

  if (auditError) {
    // Status je već cancelled — audit grešku logiraj, ne vraćaj status natrag
    console.error(
      '[myrent-inbound-cancel] audit insert failed:',
      params.bookingId,
      auditError.message,
    );
  }

  return 'cancelled';
}

export async function runMyRentInboundCancelSync(
  deps?: Partial<InboundCancelDeps>,
): Promise<InboundCancelSyncResult> {
  const listCandidates =
    deps?.listCandidates ?? listInboundCancelCandidatesFromSupabase;
  const fetchRentActive = deps?.fetchRentActive ?? fetchMyRentRentActiveStatus;
  const cancelBookingIfConfirmed =
    deps?.cancelBookingIfConfirmed ?? cancelBookingFromMyRentInSupabase;

  const candidates = await listCandidates();
  const actions: InboundCancelAction[] = [];
  let cancelled = 0;
  let skipped = 0;
  let errors = 0;

  for (const candidate of candidates) {
    if (!candidate.myrentRentId.trim()) {
      skipped += 1;
      actions.push({
        bookingId: candidate.bookingId,
        myrentRentId: candidate.myrentRentId,
        outcome: 'skipped_unknown',
        detail: 'missing_myrent_rent_id',
      });
      continue;
    }

    if (candidate.bookingStatus === 'cancelled') {
      skipped += 1;
      actions.push({
        bookingId: candidate.bookingId,
        myrentRentId: candidate.myrentRentId,
        outcome: 'skipped_already_cancelled',
      });
      continue;
    }

    let active: RentActiveStatus;
    try {
      active = await fetchRentActive(candidate);
    } catch (err) {
      errors += 1;
      actions.push({
        bookingId: candidate.bookingId,
        myrentRentId: candidate.myrentRentId,
        outcome: 'error',
        detail: err instanceof Error ? err.message : 'fetch_active_failed',
      });
      continue;
    }

    if (active === 'Y') {
      skipped += 1;
      actions.push({
        bookingId: candidate.bookingId,
        myrentRentId: candidate.myrentRentId,
        outcome: 'skipped_still_active',
      });
      continue;
    }

    if (active !== 'N') {
      skipped += 1;
      actions.push({
        bookingId: candidate.bookingId,
        myrentRentId: candidate.myrentRentId,
        outcome: 'skipped_unknown',
        detail: 'myrent_active_unclear',
      });
      continue;
    }

    try {
      const result = await cancelBookingIfConfirmed({
        bookingId: candidate.bookingId,
        myrentRentId: candidate.myrentRentId,
        myrentRentGuid: candidate.myrentRentGuid,
        reason: MYRENT_INBOUND_CANCEL_REASON,
      });
      if (result === 'already_cancelled') {
        skipped += 1;
        actions.push({
          bookingId: candidate.bookingId,
          myrentRentId: candidate.myrentRentId,
          outcome: 'skipped_already_cancelled',
        });
      } else {
        cancelled += 1;
        actions.push({
          bookingId: candidate.bookingId,
          myrentRentId: candidate.myrentRentId,
          outcome: 'cancelled',
          previousStatus: 'confirmed',
        });
      }
    } catch (err) {
      errors += 1;
      actions.push({
        bookingId: candidate.bookingId,
        myrentRentId: candidate.myrentRentId,
        outcome: 'error',
        detail: err instanceof Error ? err.message : 'cancel_failed',
      });
    }
  }

  return {
    scanned: candidates.length,
    cancelled,
    skipped,
    errors,
    actions,
  };
}
