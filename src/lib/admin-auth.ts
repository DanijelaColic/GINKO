/**
 * Admin auth — potpisana sesija + timing-safe lozinka.
 * Portano s Villa-Velebita booking-admin/lib/admin-auth.ts
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_MAX_AGE } from '@/modules/booking/booking.config';
import { verifyAdminSessionToken } from './admin-session';

export { ADMIN_COOKIE_NAME, ADMIN_COOKIE_MAX_AGE };
export {
  createAdminSessionToken,
  getAdminSessionSecret,
  verifyAdminSessionToken,
} from './admin-session';

/** Usporedba preko SHA-256 + timingSafeEqual (ista duljina digest-a; bez curenja duljine lozinke). */
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? '';
  if (!expected || typeof input !== 'string') return false;

  const a = createHash('sha256').update(input, 'utf8').digest();
  const b = createHash('sha256').update(expected, 'utf8').digest();
  return timingSafeEqual(a, b);
}

/** @deprecated Koristi se samo kao fallback secret za potpis sesije; ne stavlja se u cookie. */
export function getAdminToken(): string {
  return process.env.ADMIN_TOKEN ?? '';
}

/** Provjera u Server Componentima (async, koristi next/headers) */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE_NAME);
  return verifyAdminSessionToken(cookie?.value);
}

/** Provjera u API Route Handlerima (iz NextRequest) */
export async function isAdminAuthenticatedFromRequest(
  request: NextRequest,
): Promise<boolean> {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
  return verifyAdminSessionToken(cookie?.value);
}
