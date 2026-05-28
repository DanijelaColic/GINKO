/**
 * booking.config.ts — Ginko Sobe
 * Adapted from Villa-Velebita/src/modules/booking-admin/booking.config.ts
 * Config-driven approach preserved; villa-specific data replaced with Ginko domain.
 */

// ── Brand ──────────────────────────────────────────────────────────
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Ginko Sobe';
export const SITE_LOCATION = process.env.NEXT_PUBLIC_SITE_LOCATION ?? 'Hrvatska';

// ── Kontakt ───────────────────────────────────────────────────────
export const OWNER_EMAIL = process.env.OWNER_EMAIL ?? '';
export const OWNER_PHONE = process.env.OWNER_PHONE ?? '';
export const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP_URL ?? '';

// ── Plaćanje (HUB3 / SEPA QR) ────────────────────────────────────
export const RECIPIENT_IBAN = process.env.RECIPIENT_IBAN ?? '';
export const RECIPIENT_NAME = process.env.RECIPIENT_NAME ?? '';
export const RECIPIENT_BIC = process.env.RECIPIENT_BIC ?? '';
export const RECIPIENT_BANK_NAME = process.env.RECIPIENT_BANK_NAME ?? '';

// ── Poslovni uvjeti ───────────────────────────────────────────────
/** 30% depozit pri rezervaciji */
export const DEPOSIT_PERCENT = 0.3;

/** Ostatak (70%) — platiti ovoliko dana prije dolaska */
export const BALANCE_DAYS_BEFORE_CHECK_IN = 14;

/** Minimalni boravak: 2 noći */
export const MIN_NIGHTS = 2;

/** Nema fiksne naknade za čišćenje (uključeno u cijenu sobe) */
export const CLEANING_FEE = 0;

/** Popust za dulji boravak: od 7 noći → 10% */
export const LONG_STAY_DISCOUNT_NIGHTS = 7;
export const LONG_STAY_DISCOUNT_RATE = 0.1;

/** Visoka sezona: srpanj i kolovoz */
export const HIGH_SEASON_MONTHS: number[] = [7, 8];

export const HIGH_SEASON_LABEL = 'Visoka sezona';
export const OFF_SEASON_LABEL = 'Van sezone';

// ── Admin ─────────────────────────────────────────────────────────
export const ADMIN_COOKIE_NAME = process.env.ADMIN_COOKIE_NAME ?? 'ginko_admin';
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
