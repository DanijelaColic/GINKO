/**
 * Potpisana admin sesija (HMAC-SHA256).
 * Cookie više nije statični ADMIN_TOKEN — svaki login = novi jti + expiry.
 *
 * Secret: ADMIN_SESSION_SECRET (preporučeno) ili fallback ADMIN_TOKEN.
 * Portano s Villa-Velebita booking-admin/lib/admin-session.ts
 */

import { ADMIN_COOKIE_MAX_AGE } from '@/modules/booking/booking.config';

type SessionPayload = {
  /** expiry unix sec */
  e: number;
  /** issued-at unix sec */
  i: number;
  /** random session id */
  j: string;
};

function bytesToHex(data: ArrayBuffer | Uint8Array): string {
  const arr = data instanceof Uint8Array ? data : new Uint8Array(data);
  return [...arr].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export function getAdminSessionSecret(): string | null {
  const dedicated = process.env.ADMIN_SESSION_SECRET?.trim();
  if (dedicated) return dedicated;
  const fallback = process.env.ADMIN_TOKEN?.trim();
  return fallback || null;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return bytesToHex(sig);
}

function randomJti(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/** Novi session cookie value, ili null ako nema secret. */
export async function createAdminSessionToken(
  ttlSec: number = ADMIN_COOKIE_MAX_AGE,
): Promise<string | null> {
  const secret = getAdminSessionSecret();
  if (!secret) return null;

  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    e: now + ttlSec,
    i: now,
    j: randomJti(),
  };
  const body = toBase64Url(JSON.stringify(payload));
  const sig = await hmacSha256Hex(secret, body);
  return `${body}.${sig}`;
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function verifyAdminSessionToken(
  token: string | null | undefined,
): Promise<boolean> {
  const secret = getAdminSessionSecret();
  if (!secret || !token) return false;

  const dot = token.lastIndexOf('.');
  if (dot <= 0) return false;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacSha256Hex(secret, body);
  if (!timingSafeEqualHex(sig, expected)) return false;

  try {
    const json = JSON.parse(fromBase64Url(body)) as SessionPayload;
    if (
      typeof json.e !== 'number' ||
      typeof json.i !== 'number' ||
      typeof json.j !== 'string'
    ) {
      return false;
    }
    if (json.e < Math.floor(Date.now() / 1000)) return false;
    if (!json.j) return false;
    return true;
  } catch {
    return false;
  }
}
