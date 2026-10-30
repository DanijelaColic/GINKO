/**
 * Zaštita MyRent write operacija.
 * Default: ISKLJUČENO + mock — nikad HTTP write prema MyRentu.
 *
 * TEST LIVE (sve confirmed+paid na odobrenoj test instalaciji, bez UUID allowliste):
 *   MYRENT_WRITE_ENABLED=true
 *   MYRENT_WRITE_MODE=live
 *   MYRENT_LIVE_SCOPE=test
 *   MYRENT_TEST_LIVE_CONFIRM=I_UNDERSTAND_TEST_LIVE_MYRENT_WRITE
 *   MYRENT_LIVE_INSTALL_ID=<id>
 *   MYRENT_EXPECTED_INSTALL_ID=<isti id>
 *   MYRENT_TEST_LIVE_SITE_HOSTS=ginko-tau.vercel.app
 *   + runtime: SAFERPAY_BASE_URL mora biti test.saferpay.com (ili default fallback)
 *
 * PRODUCTION LIVE (trajni automatski prijenos — ZADANO ISKLJUČEN):
 *   MYRENT_WRITE_ENABLED=true
 *   MYRENT_WRITE_MODE=live
 *   MYRENT_LIVE_SCOPE=production
 *   MYRENT_PRODUCTION_LIVE_CONFIRM=I_UNDERSTAND_PRODUCTION_LIVE_MYRENT_WRITE
 *
 * Opcionalni debug allowlist (jedan UUID):
 *   MYRENT_LIVE_WRITE_CONFIRM=I_UNDERSTAND_LIVE_MYRENT_WRITE
 *   MYRENT_LIVE_WRITE_BOOKING_ALLOWLIST=<uuid>[,uuid…]
 */

export type MyRentWriteMode = 'mock' | 'live';

export type MyRentLiveScope = 'off' | 'test' | 'production';

export type MyRentWriteConfig = {
  enabled: boolean;
  mode: MyRentWriteMode;
  scope: MyRentLiveScope;
};

/** Allowlist debug confirm (naslijeđeno). */
export const MYRENT_LIVE_WRITE_CONFIRM_TOKEN =
  'I_UNDERSTAND_LIVE_MYRENT_WRITE';

/** TEST LIVE confirm — namjerno drugačiji od production. */
export const MYRENT_TEST_LIVE_CONFIRM_TOKEN =
  'I_UNDERSTAND_TEST_LIVE_MYRENT_WRITE';

/** PRODUCTION LIVE confirm — nikad ne postavljati bez zasebnog odobrenja. */
export const MYRENT_PRODUCTION_LIVE_CONFIRM_TOKEN =
  'I_UNDERSTAND_PRODUCTION_LIVE_MYRENT_WRITE';

function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined || raw.trim() === '') return defaultValue;
  const v = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return defaultValue;
}

function parseLiveScope(raw: string | undefined): MyRentLiveScope {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'test') return 'test';
  if (v === 'production' || v === 'prod') return 'production';
  return 'off';
}

/**
 * Zadano: WRITE_ENABLED=false, WRITE_MODE=mock, SCOPE=off.
 */
export function getMyRentWriteConfig(): MyRentWriteConfig {
  const enabled = parseBool(process.env.MYRENT_WRITE_ENABLED, false);
  const modeRaw = (process.env.MYRENT_WRITE_MODE ?? 'mock').trim().toLowerCase();
  const mode: MyRentWriteMode = modeRaw === 'live' ? 'live' : 'mock';
  const scope = parseLiveScope(process.env.MYRENT_LIVE_SCOPE);
  return { enabled, mode, scope };
}

/** Parse allowlist — zarezi ili whitespace. Prazno = nema allowlist live. */
export function getMyRentLiveWriteAllowlist(): string[] {
  const raw = process.env.MYRENT_LIVE_WRITE_BOOKING_ALLOWLIST?.trim() ?? '';
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getConfiguredSiteHosts(): string[] {
  const hosts: string[] = [];
  for (const raw of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
  ]) {
    const v = raw?.trim();
    if (!v) continue;
    try {
      hosts.push(new URL(v).hostname.toLowerCase());
    } catch {
      // ignore invalid URL
    }
  }
  return [...new Set(hosts)];
}

/** Hostovi odobreni za TEST LIVE (env lista). */
export function getMyRentTestLiveSiteHosts(): string[] {
  const raw = process.env.MYRENT_TEST_LIVE_SITE_HOSTS?.trim() ?? '';
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Saferpay TEST okruženje.
 * Prazan / nedostajući SAFERPAY_BASE_URL → default test.saferpay.com u klijentu.
 */
export function isSaferpayTestEnvironment(): boolean {
  const base = (
    process.env.SAFERPAY_BASE_URL ?? 'https://test.saferpay.com/api'
  )
    .trim()
    .toLowerCase();
  if (!base) {
    // prazan string ≠ nullish — tretiraj kao nesigurno (ne TEST LIVE)
    return false;
  }
  return base.includes('test.saferpay.com');
}

function hasLiveWriteBaseEnabled(cfg: MyRentWriteConfig = getMyRentWriteConfig()): boolean {
  return cfg.enabled && cfg.mode === 'live';
}

/** Install ID par mora biti non-empty i jednak (nije samo domena). */
export function isMyRentInstallIdMatched(): boolean {
  const live = (process.env.MYRENT_LIVE_INSTALL_ID ?? '').trim();
  const expected = (process.env.MYRENT_EXPECTED_INSTALL_ID ?? '').trim();
  if (!live || !expected) return false;
  return live === expected;
}

/** SITE_URL host mora biti na MYRENT_TEST_LIVE_SITE_HOSTS. */
export function isMyRentTestLiveSiteHostAllowed(): boolean {
  const allowed = getMyRentTestLiveSiteHosts();
  if (allowed.length === 0) return false;
  const configured = getConfiguredSiteHosts();
  if (configured.length === 0) return false;
  return configured.some((h) => allowed.includes(h));
}

/**
 * TEST LIVE: automatski live za sve bookinge na odobrenoj test instalaciji.
 * Ne otvara se samo zbog naziva domene — treba install ID + host lista + Saferpay TEST.
 */
export function isMyRentTestLiveOpen(): boolean {
  const cfg = getMyRentWriteConfig();
  if (!hasLiveWriteBaseEnabled(cfg) || cfg.scope !== 'test') return false;

  const confirm = (process.env.MYRENT_TEST_LIVE_CONFIRM ?? '').trim();
  if (confirm !== MYRENT_TEST_LIVE_CONFIRM_TOKEN) return false;

  if (!isMyRentInstallIdMatched()) return false;
  if (!isMyRentTestLiveSiteHostAllowed()) return false;
  // Shared Production deployment → zabraniti test live nad live Saferpayom
  if (!isSaferpayTestEnvironment()) return false;

  return true;
}

/**
 * PRODUCTION LIVE: trajni automatski prijenos.
 * Zadano false — uključuje se samo eksplicitnim env-om (zasebno odobrenje).
 */
export function isMyRentProductionLiveOpen(): boolean {
  const cfg = getMyRentWriteConfig();
  if (!hasLiveWriteBaseEnabled(cfg) || cfg.scope !== 'production') {
    return false;
  }

  const confirm = (process.env.MYRENT_PRODUCTION_LIVE_CONFIRM ?? '').trim();
  return confirm === MYRENT_PRODUCTION_LIVE_CONFIRM_TOKEN;
}

/**
 * Instalacijski live (test ili production) — svi confirmed+paid bookingi.
 */
export function isMyRentGlobalLiveWriteOpen(): boolean {
  return isMyRentTestLiveOpen() || isMyRentProductionLiveOpen();
}

/** Debug allowlist: samo navedeni UUID-ovi. */
export function isMyRentAllowlistLiveForBooking(bookingId: string): boolean {
  const id = bookingId.trim();
  if (!id) return false;

  const cfg = getMyRentWriteConfig();
  if (!hasLiveWriteBaseEnabled(cfg)) return false;

  const confirm = (process.env.MYRENT_LIVE_WRITE_CONFIRM ?? '').trim();
  if (confirm !== MYRENT_LIVE_WRITE_CONFIRM_TOKEN) return false;

  const allowlist = getMyRentLiveWriteAllowlist();
  if (allowlist.length === 0) return false;

  return allowlist.includes(id);
}

/**
 * Smije li ovaj booking UUID ići na live POST /user/rent_add?
 */
export function isMyRentLiveWriteAllowedForBooking(bookingId: string): boolean {
  if (isMyRentGlobalLiveWriteOpen()) return true;
  return isMyRentAllowlistLiveForBooking(bookingId);
}

/**
 * Bez booking konteksta = instalacijski (test/production) gate.
 */
export function isMyRentLiveWriteAllowed(): boolean {
  return isMyRentGlobalLiveWriteOpen();
}

export function assertMyRentWriteNotLiveHttp(): void {
  if (isMyRentLiveWriteAllowed()) {
    const cfg = getMyRentWriteConfig();
    if (!cfg.enabled || cfg.mode !== 'live') {
      throw new Error(
        'MyRent live write je onemogućen (MYRENT_WRITE_ENABLED / MODE).',
      );
    }
  }
}
