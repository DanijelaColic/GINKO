/**
 * Best-effort rate limit za admin login (in-memory na serverless isolate).
 * Na Vercelu se resetira na cold start / drugoj instanci — i dalje usporava
 * brute-force; Turnstile pokriva ostatak.
 * Portano s Villa-Velebita booking-admin/lib/login-rate-limit.ts
 */

type Bucket = {
  /** Broj neuspjelih pokušaja u prozoru */
  failures: number;
  /** Početak trenutnog prozora (ms) */
  windowStart: number;
  /** Ako je postavljen, IP je zaključan do ovog timestampa */
  lockedUntil: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const LOCKOUT_MS = 30 * 60 * 1000;

type GlobalRateLimit = typeof globalThis & {
  __ginkoAdminLoginRateLimit?: Map<string, Bucket>;
};

function getStore(): Map<string, Bucket> {
  const g = globalThis as GlobalRateLimit;
  if (!g.__ginkoAdminLoginRateLimit) {
    g.__ginkoAdminLoginRateLimit = new Map();
  }
  return g.__ginkoAdminLoginRateLimit;
}

function pruneIfNeeded(store: Map<string, Bucket>, key: string, now: number): Bucket {
  let bucket = store.get(key);
  if (!bucket) {
    bucket = { failures: 0, windowStart: now, lockedUntil: 0 };
    store.set(key, bucket);
    return bucket;
  }

  if (bucket.lockedUntil && bucket.lockedUntil <= now) {
    bucket.lockedUntil = 0;
    bucket.failures = 0;
    bucket.windowStart = now;
  }

  if (now - bucket.windowStart >= WINDOW_MS && !bucket.lockedUntil) {
    bucket.failures = 0;
    bucket.windowStart = now;
  }

  return bucket;
}

export function getClientIp(request: {
  headers: { get(name: string): string | null };
}): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

/** Provjera prije obrade lozinke — blokira ako je IP u lockoutu. */
export function checkLoginAllowed(ip: string): RateLimitResult {
  const now = Date.now();
  const store = getStore();
  const bucket = pruneIfNeeded(store, ip, now);

  if (bucket.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.lockedUntil - now) / 1000)),
    };
  }

  return { allowed: true };
}

/** Neuspješan login — broji failure; nakon MAX_FAILURES → lockout. */
export function recordLoginFailure(ip: string): RateLimitResult {
  const now = Date.now();
  const store = getStore();
  const bucket = pruneIfNeeded(store, ip, now);

  bucket.failures += 1;

  if (bucket.failures >= MAX_FAILURES) {
    bucket.lockedUntil = now + LOCKOUT_MS;
    bucket.failures = 0;
    bucket.windowStart = now;
    return {
      allowed: false,
      retryAfterSec: Math.ceil(LOCKOUT_MS / 1000),
    };
  }

  return { allowed: true };
}

/** Uspješan login — reset brojača za IP. */
export function clearLoginFailures(ip: string): void {
  getStore().delete(ip);
}

export function formatLockoutMessage(retryAfterSec: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSec / 60));
  return `Previše neuspjelih pokušaja. Pokušajte ponovno za ${minutes} min.`;
}
