/**
 * Read-only reconcile: pronađi MyRent rezervaciju po jedinstvenoj Ginko oznaci u napomeni.
 * Nikad ne zaključuje podudaranje samo po sobi + datumima.
 * Ne poziva write endpointe.
 */

import { myrentRequest } from './myrent.client';

export const GINKO_BOOKING_NOTE_PREFIX = 'Ginko booking:';

/** Jedinstvena oznaka u MyRent note polju — koristi se za reconcile. */
export function ginkoBookingNoteMarker(bookingId: string): string {
  return `${GINKO_BOOKING_NOTE_PREFIX} ${bookingId}`;
}

export function noteContainsGinkoBookingMarker(
  note: string | null | undefined,
  bookingId: string,
): boolean {
  if (!note || !bookingId) return false;
  return note.includes(ginkoBookingNoteMarker(bookingId));
}

export type MyRentRentNoteCandidate = {
  id: string | number | null;
  guid?: string | null;
  object_id?: number | null;
  note?: string | null;
  date_from?: string | null;
  date_until?: string | null;
};

/**
 * Od kandidata ostavi samo one s točnom Ginko oznakom u note.
 * 0 ili >1 pogodaka → null (ručna provjera; nikad soba+datumi sami).
 */
export function findUniqueRentByGinkoNoteMarker(
  candidates: MyRentRentNoteCandidate[],
  bookingId: string,
): MyRentRentNoteCandidate | null {
  const matches = candidates.filter((c) =>
    noteContainsGinkoBookingMarker(c.note, bookingId),
  );
  if (matches.length !== 1) return null;
  return matches[0] ?? null;
}

function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function unwrapRentDetail(raw: unknown): Record<string, unknown> | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return first && typeof first === 'object'
      ? (first as Record<string, unknown>)
      : null;
  }
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  return null;
}

export type MyRentReconcileResult =
  | {
      found: true;
      rentId: string;
      rentGuid: string | null;
    }
  | {
      found: false;
      reason: string;
    };

/**
 * Read-only potraga: rent_list → rent_get, match isključivo po note markeru.
 * objectId / datumi su samo za sužavanje liste kandidata, ne za zaključak.
 */
export async function reconcileMyRentRentByBookingNote(params: {
  bookingId: string;
  objectId: number;
  checkIn: string;
  checkOut: string;
}): Promise<MyRentReconcileResult> {
  const { bookingId, objectId, checkIn, checkOut } = params;
  if (!bookingId) {
    return { found: false, reason: 'Nedostaje bookingId za reconcile.' };
  }

  const dateFrom = addDaysIso(checkIn, -3);
  const dateUntil = addDaysIso(checkOut, 3);

  let listRaw: unknown;
  try {
    listRaw = await myrentRequest<unknown>({
      method: 'GET',
      path: '/user/rent_list',
      query: {
        date_from: dateFrom,
        date_until: dateUntil,
        type: 'check_in',
        active: '',
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'MyRent rent_list greška';
    return { found: false, reason: message };
  }

  const list = Array.isArray(listRaw) ? listRaw : [];
  const listRows = list.filter((row): row is Record<string, unknown> =>
    Boolean(row && typeof row === 'object'),
  );

  // Sužavanje kandidata (ne dokaz podudaranja)
  const candidates = listRows.filter((row) => {
    const oid = Number(row.object_id);
    if (Number.isFinite(objectId) && objectId > 0 && oid !== objectId) {
      return false;
    }
    return typeof row.guid === 'string' && row.guid.length > 0;
  });

  const detailed: MyRentRentNoteCandidate[] = [];
  for (const row of candidates.slice(0, 40)) {
    const guid = String(row.guid);
    try {
      const raw = await myrentRequest<unknown>({
        method: 'GET',
        path: `/user/rent_get/${encodeURIComponent(guid)}`,
      });
      const detail = unwrapRentDetail(raw);
      if (!detail) continue;
      detailed.push({
        id:
          typeof detail.id === 'number' || typeof detail.id === 'string'
            ? detail.id
            : null,
        guid:
          typeof detail.guid === 'string'
            ? detail.guid
            : typeof row.guid === 'string'
              ? row.guid
              : null,
        object_id:
          typeof detail.object_id === 'number'
            ? detail.object_id
            : Number(detail.object_id) || null,
        note: typeof detail.note === 'string' ? detail.note : null,
        date_from:
          typeof detail.date_from === 'string' ? detail.date_from : null,
        date_until:
          typeof detail.date_until === 'string' ? detail.date_until : null,
      });
    } catch {
      // Jedan rent_get fail ne prekida cijeli reconcile
    }
  }

  const match = findUniqueRentByGinkoNoteMarker(detailed, bookingId);
  if (!match || match.id == null) {
    return {
      found: false,
      reason:
        'Nema pouzdanog podudaranja po Ginko oznaci u napomeni — potrebna ručna provjera.',
    };
  }

  return {
    found: true,
    rentId: String(match.id),
    rentGuid: match.guid ? String(match.guid) : null,
  };
}
