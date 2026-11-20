/**
 * Read-only: je li depozit već evidentiran u MyRentu?
 */

import { myrentRequest } from './myrent.client';

function unwrapRentRow(raw: unknown): Record<string, unknown> | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return first && typeof first === 'object'
      ? (first as Record<string, unknown>)
      : null;
  }
  if (raw && typeof raw === 'object') {
    return raw as Record<string, unknown>;
  }
  return null;
}

export async function fetchMyRentAdvancePaidFlag(params: {
  rentGuid: string | null | undefined;
}): Promise<'Y' | 'N' | 'unknown'> {
  const guid = params.rentGuid?.trim();
  if (!guid) return 'unknown';
  try {
    const raw = await myrentRequest<unknown>({
      method: 'GET',
      path: `/user/rent_get/${encodeURIComponent(guid)}`,
    });
    const row = unwrapRentRow(raw);
    const flag = row?.in_advance_paid;
    if (flag === 'Y' || flag === 'N') return flag;
    return 'unknown';
  } catch {
    return 'unknown';
  }
}