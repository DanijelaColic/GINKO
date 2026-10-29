/**
 * MyRent write transport.
 * Mock: lokalni odgovor, BEZ HTTP-a.
 * Live: pripremljen POST /user/rent_add, ali hard-gated dok
 * isMyRentLiveWriteAllowed() !== true (trenutno uvijek false).
 *
 * NEPOZNATO / potvrditi s MyRent podrškom prije aktivacije:
 * - rent_source_id, rent_status_id, payment_method_id
 * - točan oblik 200 odgovora (rent id polje)
 * - ponašanje pri duplom erp_id
 * - wellness item vs note-only za object 7460
 */

import { myrentRequest } from './myrent.client';
import {
  getMyRentWriteConfig,
  isMyRentLiveWriteAllowed,
} from './myrent.write-config';
import type { MyRentRentAddPayload } from './myrent.booking-sync.types';

export type MyRentWriteTransportResult = {
  ok: boolean;
  mode: 'mock' | 'live';
  /** Mock ID ili MyRent rent id */
  rentId: string | null;
  error: string | null;
  /** true SAMO nakon uspješnog live HTTP odgovora */
  confirmedLiveSync: boolean;
};

/**
 * Body za /user/rent_add — samo dokumentirana polja koja imamo.
 * Ne šaljemo nagađane ID-eve (rent_source_id, payment_method_id, …).
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
    contact_name: payload.contact_name,
    contact_email: payload.contact_email,
    note: payload.note,
  };
  if (payload.contact_tel) {
    body.contact_tel = payload.contact_tel;
  }
  // TODO (MyRent podrška): rent_source_id, rent_status_id, payment_method_id,
  // contact_country_id, language_id, check_in/out times, wellness item_list
  return body;
}

/**
 * Ekstrakcija rent ID-a iz odgovora — oblik nije službeno dokumentiran.
 * Prihvaća number | string | { id | rent_id | rentId }.
 */
export function parseMyRentRentAddResponse(raw: unknown): string | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    for (const key of ['id', 'rent_id', 'rentId', 'Id', 'ID']) {
      const v = o[key];
      if (typeof v === 'number' && Number.isFinite(v)) return String(v);
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
  }
  return null;
}

/**
 * Live HTTP — smije se zvati SAMO kad isMyRentLiveWriteAllowed() === true.
 * U ovoj fazi nikad se ne poziva iz transportMyRentRentAdd.
 */
export async function executeLiveMyRentRentAdd(
  payload: MyRentRentAddPayload,
): Promise<MyRentWriteTransportResult> {
  if (!isMyRentLiveWriteAllowed()) {
    return {
      ok: false,
      mode: 'live',
      rentId: null,
      error:
        'MyRent live write hard-gate: isMyRentLiveWriteAllowed()=false (nema HTTP).',
      confirmedLiveSync: false,
    };
  }

  const cfg = getMyRentWriteConfig();
  if (!cfg.enabled || cfg.mode !== 'live') {
    return {
      ok: false,
      mode: 'live',
      rentId: null,
      error: 'MyRent live write zahtijeva MYRENT_WRITE_ENABLED=true i MODE=live.',
      confirmedLiveSync: false,
    };
  }

  const body = buildMyRentRentAddRequestBody(payload);

  try {
    const raw = await myrentRequest<unknown>({
      method: 'POST',
      path: '/user/rent_add',
      body,
    });
    const rentId = parseMyRentRentAddResponse(raw);
    if (!rentId) {
      return {
        ok: false,
        mode: 'live',
        rentId: null,
        error:
          'MyRent /user/rent_add odgovor bez prepoznatljivog rent ID-a (oblik treba potvrditi s podrškom).',
        confirmedLiveSync: false,
      };
    }
    return {
      ok: true,
      mode: 'live',
      rentId,
      error: null,
      confirmedLiveSync: true,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'MyRent /user/rent_add greška';
    return {
      ok: false,
      mode: 'live',
      rentId: null,
      error: message,
      confirmedLiveSync: false,
    };
  }
}

/**
 * Jedina javna točka za write. Live HTTP ostaje potpuno isključen.
 */
export async function transportMyRentRentAdd(
  payload: MyRentRentAddPayload,
): Promise<MyRentWriteTransportResult> {
  const cfg = getMyRentWriteConfig();

  // Hard stop: nikakav live HTTP dok gate nije otvoren
  if (!isMyRentLiveWriteAllowed()) {
    if (!cfg.enabled) {
      return {
        ok: false,
        mode: 'mock',
        rentId: null,
        error: 'MyRent write isključen (MYRENT_WRITE_ENABLED=false).',
        confirmedLiveSync: false,
      };
    }

    if (cfg.mode === 'mock') {
      return {
        ok: true,
        mode: 'mock',
        rentId: `mock_rent_${payload.erp_id.slice(0, 8)}`,
        error: null,
        confirmedLiveSync: false,
      };
    }

    // mode=live u env, ali hard-gate još zatvoren — BEZ HTTP-a
    return {
      ok: false,
      mode: 'live',
      rentId: null,
      error:
        'MyRent live write nije aktiviran u ovoj verziji (nema HTTP poziva).',
      confirmedLiveSync: false,
    };
  }

  return executeLiveMyRentRentAdd(payload);
}
