/**
 * booking.config.ts — Ginko Sobe
 * Adapted from Villa-Velebita/src/modules/booking-admin/booking.config.ts
 * Config-driven approach preserved; villa-specific data replaced with Ginko domain.
 */

// ── Brand ──────────────────────────────────────────────────────────
export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME ?? 'Ginko Boutique Rooms & Wellness';
export const SITE_LOCATION = process.env.NEXT_PUBLIC_SITE_LOCATION ?? 'Hrvatska';

// ── Kontakt ───────────────────────────────────────────────────────
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? 'info@ginko-sobe.com';
export const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'ginkosobe3@gmail.com';
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

/** Minimalni boravak: 1 noć */
export const MIN_NIGHTS = 1;

/** Nema fiksne naknade za čišćenje (uključeno u cijenu sobe) */
export const CLEANING_FEE = 0;

/** Popust za dulji boravak: od 7 noći → 10% */
export const LONG_STAY_DISCOUNT_NIGHTS = 7;
export const LONG_STAY_DISCOUNT_RATE = 0.1;

/** Visoka sezona: srpanj i kolovoz */
export const HIGH_SEASON_MONTHS: number[] = [7, 8];

export const HIGH_SEASON_LABEL = 'Visoka sezona';
export const OFF_SEASON_LABEL = 'Van sezone';

// ── Navigacija (raspoloživost → rezervacija) ─────────────────────
export const OVERVIEW_SECTION_ID = 'pregled';
export const AVAILABILITY_SECTION_ID = 'raspolozivost';
export const REVIEWS_SECTION_ID = 'recenzije';
export const QUESTIONS_SECTION_ID = 'pitanja';
export const SURROUNDINGS_SECTION_ID = 'okolica';
export const FACILITIES_SECTION_ID = 'sadrzaji';

export const PROPERTY_SUBNAV_SECTION_IDS = [
  OVERVIEW_SECTION_ID,
  AVAILABILITY_SECTION_ID,
  REVIEWS_SECTION_ID,
  QUESTIONS_SECTION_ID,
  SURROUNDINGS_SECTION_ID,
  FACILITIES_SECTION_ID,
] as const;

export const PROPERTY_NAV_ITEMS = [
  { key: 'overview', id: OVERVIEW_SECTION_ID },
  { key: 'availability', id: AVAILABILITY_SECTION_ID },
  { key: 'reviews', id: REVIEWS_SECTION_ID },
  { key: 'questions', id: QUESTIONS_SECTION_ID },
  { key: 'surroundings', id: SURROUNDINGS_SECTION_ID },
  { key: 'facilities', id: FACILITIES_SECTION_ID },
] as const;

export function propertySectionHref(id: string) {
  return `/#${id}`;
}

export const AVAILABILITY_SECTION_HREF = `/#${AVAILABILITY_SECTION_ID}` as const;

export function buildAvailabilityHref(params?: {
  room?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number | string;
  children?: number | string;
}) {
  if (!params?.room && !params?.checkIn && !params?.checkOut) {
    return AVAILABILITY_SECTION_HREF;
  }
  const q = new URLSearchParams();
  if (params.room) q.set('room', params.room);
  if (params.checkIn) q.set('checkIn', params.checkIn);
  if (params.checkOut) q.set('checkOut', params.checkOut);
  if (params.adults != null) q.set('adults', String(params.adults));
  if (params.children != null) q.set('children', String(params.children));
  return `${AVAILABILITY_SECTION_HREF}?${q.toString()}`;
}

export function buildBookingHref(params: {
  room: string;
  checkIn: string;
  checkOut: string;
  adults?: number | string;
  children?: number | string;
}) {
  const q = new URLSearchParams({
    room: params.room,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
  });
  if (params.adults != null) q.set('adults', String(params.adults));
  if (params.children != null) q.set('children', String(params.children));
  return `/booking?${q.toString()}`;
}

// ── Admin ─────────────────────────────────────────────────────────
export const ADMIN_COOKIE_NAME = process.env.ADMIN_COOKIE_NAME ?? 'ginko_admin';
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
