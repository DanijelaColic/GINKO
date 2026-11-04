/**
 * Zaštita cron HTTP poziva (Supabase pg_net / ručni trigger).
 * Zahtijeva Authorization: Bearer ${CRON_SECRET}.
 * Bez postavljenog CRON_SECRET svi pozivi se odbijaju.
 */

import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export function getCronSecret(): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  return secret || null;
}

export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const expected = getCronSecret();
  if (!expected) return false;

  const header = request.headers.get('authorization')?.trim() ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match?.[1]) return false;

  const provided = match[1].trim();
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
