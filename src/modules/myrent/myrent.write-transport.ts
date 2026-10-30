/**
 * MyRent write transport.
 * Mock: lokalni odgovor, BEZ HTTP-a.
 * Live: POST /user/rent_add samo ako gate dozvoli (TEST/PRODUCTION LIVE ili allowlist).
 * Live POST: allowAuthRetry=false (nikad 401/403 retry).
 */

import { getMyRentToken } from './myrent.auth';
import { myrentRequest } from './myrent.client';
import {
  getMyRentWriteConfig,
  isMyRentLiveWriteAllowedForBooking,
} from './myrent.write-config';
import type { MyRentRentAddPayload } from './myrent.booking-sync.types';

export type MyRentWriteTransportResult = {
  ok: boolean;
  mode: 'mock' | 'live';
  /** Mock ID ili MyRent rent id */
  rentId: string | null;
  rentGuid: string | null;
  error: string | null;
  /** true SAMO nakon uspješnog live HTTP odgovora s nedvosmislenim ID-om */
  confirmedLiveSync: boolean;
  /**
   * true ako MyRent možda zaprimio (timeout / nejasan odgovor / {}).
   * Sync sloj: reconcile pa uncertain — bez auto-resenda.
   */
  uncertain: boolean;
};

export type ParsedMyRentRentAddResponse = {
  rentId: string | null;
  rentGuid: string | null;
  unambiguous: boolean;
};

function readIdField(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

function parseObjectIds(o: Record<string, unknown>): ParsedMyRentRentAddResponse {
  const numericOrRent =
    readIdField(o.id) ??
    readIdField(o.rent_id) ??
    readIdField(o.rentId) ??
    readIdField(o.Id) ??
    readIdField(o.ID);
  const guid =
    readIdField(o.guid) ??
    readIdField(o.rent_guid) ??
    readIdField(o.rentGuid) ??
    readIdField(o.Guid);

  const rentId = numericOrRent ?? guid;
  return {
    rentId,
    rentGuid: guid,
    unambiguous: rentId != null,
  };
}

/**
 * Ekstrakcija identifikatora iz rent_add odgovora.
 * Prazan objekt {} → unambiguous:false (poznati MyRent oblik).
 */
export function parseMyRentRentAddResponse(
  raw: unknown,
): ParsedMyRentRentAddResponse {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { rentId: String(raw), rentGuid: null, unambiguous: true };
  }
  if (typeof raw === 'string' && raw.trim()) {
    const s = raw.trim();
    if (
      (s.startsWith('{') && s.endsWith('}')) ||
      (s.startsWith('[') && s.endsWith(']'))
    ) {
      try {
        return parseMyRentRentAddResponse(JSON.parse(s) as unknown);
      } catch {
        return { rentId: s, rentGuid: null, unambiguous: true };
      }
    }
    return { rentId: s, rentGuid: null, unambiguous: true };
  }

  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      return { rentId: null, rentGuid: null, unambiguous: false };
    }
    if (raw.length === 1) {
      return parseMyRentRentAddResponse(raw[0]);
    }
    return { rentId: null, rentGuid: null, unambiguous: false };
  }

  if (raw && typeof raw === 'object') {
    return parseObjectIds(raw as Record<string, unknown>);
  }

  return { rentId: null, rentGuid: null, unambiguous: false };
}

function isTimeoutLikeError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /timeout|etimedout|econnreset|abort|network/i.test(msg);
}

/**
 * Body za /user/rent_add — dokumentirana polja + rent_source_id (WEB page).
 * Ne šaljemo rent_status_id / payment_method_id.
 */
export function buildMyRentRentAddRequestBody(
  payload: MyRentRentAddPayload,
): Record<string, unknown> {
  const userIdNum = Number(payload.user_id);
  const body: Record<string, unknown> = {
    object_id: payload.object_id,
    user_id: Number.isFinite(userIdNum) ? userIdNum : payload.user_id,
    from_date: payload.from_date,
    until_date: payload.until_date,
    erp_id: payload.erp_id,
    adults: payload.adults,
    children: payload.children,
    price: payload.price,
    in_advance: payload.in_advance,
    in_advance_paid: payload.in_advance_paid,
    paid: payload.paid,
    currency_id: payload.currency_id,
    exchange: payload.exchange,
    rent_source_id: payload.rent_source_id,
    contact_name: payload.contact_name,
    contact_email: payload.contact_email,
    note: payload.note,
  };
  if (payload.contact_tel) {
    body.contact_tel = payload.contact_tel;
  }
  return body;
}

/**
 * Live HTTP — samo ako isMyRentLiveWriteAllowedForBooking.
 * Auth se osvježava PRIJE poziva; POST bez 401/403 retryja.
 */
export async function executeLiveMyRentRentAdd(
  payload: MyRentRentAddPayload,
): Promise<MyRentWriteTransportResult> {
  if (!isMyRentLiveWriteAllowedForBooking(payload.erp_id)) {
    return {
      ok: false,
      mode: 'live',
      rentId: null,
      rentGuid: null,
      error:
        'MyRent live write nije dozvoljen za ovaj booking (live gate).',
      confirmedLiveSync: false,
      uncertain: false,
    };
  }

  const cfg = getMyRentWriteConfig();
  if (!cfg.enabled || cfg.mode !== 'live') {
    return {
      ok: false,
      mode: 'live',
      rentId: null,
      rentGuid: null,
      error: 'MyRent live write zahtijeva MYRENT_WRITE_ENABLED=true i MODE=live.',
      confirmedLiveSync: false,
      uncertain: false,
    };
  }

  const body = buildMyRentRentAddRequestBody(payload);

  try {
    // Token već treba biti osvježen u sync sloju prije claima; ovdje bez retryja.
    const raw = await myrentRequest<unknown>({
      method: 'POST',
      path: '/user/rent_add',
      body,
      allowAuthRetry: false,
    });
    const parsed = parseMyRentRentAddResponse(raw);
    if (!parsed.unambiguous || !parsed.rentId) {
      return {
        ok: false,
        mode: 'live',
        rentId: null,
        rentGuid: parsed.rentGuid,
        error:
          'MyRent /user/rent_add odgovor bez nedvosmislenog rent ID-a — status uncertain.',
        confirmedLiveSync: false,
        uncertain: true,
      };
    }
    return {
      ok: true,
      mode: 'live',
      rentId: parsed.rentId,
      rentGuid: parsed.rentGuid,
      error: null,
      confirmedLiveSync: true,
      uncertain: false,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'MyRent /user/rent_add greška';
    if (isTimeoutLikeError(err)) {
      return {
        ok: false,
        mode: 'live',
        rentId: null,
        rentGuid: null,
        error: `MyRent timeout / prekid veze — moguće da je rezervacija zaprimljena: ${message}`,
        confirmedLiveSync: false,
        uncertain: true,
      };
    }
    // Nakon claima: i jasan HTTP fail tretira sync sloj kao uncertain (bez drugog POST-a).
    return {
      ok: false,
      mode: 'live',
      rentId: null,
      rentGuid: null,
      error: message,
      confirmedLiveSync: false,
      uncertain: true,
    };
  }
}

/** Osvježi token prije claima / live POST-a (bez write retryja). */
export async function prepareMyRentAuthForLiveWrite(): Promise<void> {
  await getMyRentToken({ forceRefresh: true });
}

/**
 * Jedina javna točka za write.
 * Live HTTP samo ako gate dozvoli (TEST/PRODUCTION LIVE ili allowlist).
 */
export async function transportMyRentRentAdd(
  payload: MyRentRentAddPayload,
): Promise<MyRentWriteTransportResult> {
  const cfg = getMyRentWriteConfig();

  if (!isMyRentLiveWriteAllowedForBooking(payload.erp_id)) {
    if (!cfg.enabled) {
      return {
        ok: false,
        mode: 'mock',
        rentId: null,
        rentGuid: null,
        error: 'MyRent write isključen (MYRENT_WRITE_ENABLED=false).',
        confirmedLiveSync: false,
        uncertain: false,
      };
    }

    if (cfg.mode === 'mock') {
      return {
        ok: true,
        mode: 'mock',
        rentId: `mock_rent_${payload.erp_id.slice(0, 8)}`,
        rentGuid: null,
        error: null,
        confirmedLiveSync: false,
        uncertain: false,
      };
    }

    // mode=live u env, ali gate nije otvoren — BEZ HTTP-a
    return {
      ok: false,
      mode: 'live',
      rentId: null,
      rentGuid: null,
      error:
        'MyRent live write nije dozvoljen (scope/confirm/install) — nema HTTP poziva.',
      confirmedLiveSync: false,
      uncertain: false,
    };
  }

  return executeLiveMyRentRentAdd(payload);
}
