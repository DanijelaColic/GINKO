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
// Javni kontakt na stranici — uvijek info@ginko-sobe.com (ne iz env-a)
export const CONTACT_EMAIL = 'info@ginko-sobe.com';
export const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'ginkosobe3@gmail.com';
export const OWNER_PHONE = process.env.OWNER_PHONE ?? '';

const DEFAULT_CONTACT_PHONE_TEL = '+385959000799';
const DEFAULT_CONTACT_PHONE_DISPLAY = '095 9000 799';

/** E.164 format za tel: linkove (NEXT_PUBLIC za klijentske komponente) */
export const CONTACT_PHONE_TEL =
  process.env.NEXT_PUBLIC_CONTACT_PHONE ||
  process.env.CONTACT_PHONE ||
  process.env.OWNER_PHONE ||
  DEFAULT_CONTACT_PHONE_TEL;

export const CONTACT_PHONE_DISPLAY =
  process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY || DEFAULT_CONTACT_PHONE_DISPLAY;

/** WhatsApp chat URL */
export const CONTACT_WHATSAPP_URL =
  process.env.NEXT_PUBLIC_OWNER_WHATSAPP_URL ||
  process.env.OWNER_WHATSAPP_URL ||
  `https://wa.me/${DEFAULT_CONTACT_PHONE_TEL.replace(/\D/g, '')}`;

/** @deprecated Koristi CONTACT_WHATSAPP_URL */
export const OWNER_WHATSAPP = CONTACT_WHATSAPP_URL;

// ── Plaćanje (HUB3 / SEPA QR) ────────────────────────────────────
export const RECIPIENT_IBAN = process.env.RECIPIENT_IBAN ?? '';
export const RECIPIENT_NAME = process.env.RECIPIENT_NAME ?? '';
export const RECIPIENT_BIC = process.env.RECIPIENT_BIC ?? '';
export const RECIPIENT_BANK_NAME = process.env.RECIPIENT_BANK_NAME ?? '';

// ── Poslovni uvjeti ───────────────────────────────────────────────
/** 50% depozit pri rezervaciji; ostatak u smještajnom objektu */
export const DEPOSIT_PERCENT = 0.5;

/** Ostatak se plaća u smještajnom objektu pri dolasku (ne online) */
export const BALANCE_DAYS_BEFORE_CHECK_IN = 0;

/** Minimalni boravak: 1 noć */
export const MIN_NIGHTS = 1;

/** Nema fiksne naknade za čišćenje sobe (uključeno u cijenu) */
export const CLEANING_FEE = 0;

/** Cijena čišćenja za kućne ljubimce (€ / dan) */
export const PET_CLEANING_FEE_PER_DAY = 15;

/** Besplatno otkazivanje i povrat depozita do N dana prije dolaska */
export const FREE_CANCELLATION_DAYS = 14;

/** Puni pravni naziv voditelja obrade (politika privatnosti) */
export const LEGAL_NAME = 'Ginko sobe Daruvar';

/** OIB voditelja obrade */
export const COMPANY_OIB = '83373570591';

/** Pomoćni ležaj: 20 €/noć */
export const EXTRA_BED_PRICE_PER_NIGHT = 20;

/** Dječji krevetić: 20 €/noć (besplatno ako dijete spava s roditeljima bez krevetića) */
export const CRIB_PRICE_PER_NIGHT = 20;

/** Buffet doručak: puna cijena (odrasli i djeca 13+) €/osoba/noć */
export const BREAKFAST_PRICE_PER_PERSON_PER_NIGHT = 15;

/** Doručak za djecu 3–12 godina (50%) */
export const BREAKFAST_PRICE_CHILD_3_12 = 7.5;

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
  SURROUNDINGS_SECTION_ID,
  FACILITIES_SECTION_ID,
  QUESTIONS_SECTION_ID,
] as const;

export const PROPERTY_NAV_ITEMS = [
  { key: 'overview', id: OVERVIEW_SECTION_ID },
  { key: 'availability', id: AVAILABILITY_SECTION_ID },
  { key: 'reviews', id: REVIEWS_SECTION_ID },
  { key: 'surroundings', id: SURROUNDINGS_SECTION_ID },
  { key: 'facilities', id: FACILITIES_SECTION_ID },
  { key: 'questions', id: QUESTIONS_SECTION_ID },
] as const;

/** Desktop navbar — samo ključne sekcije; mobilni drawer koristi PROPERTY_NAV_ITEMS */
export const PROPERTY_NAV_ITEMS_DESKTOP = [
  { key: 'availability', id: AVAILABILITY_SECTION_ID },
  { key: 'reviews', id: REVIEWS_SECTION_ID },
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
  /** Starosti djece, npr. "7,3" */
  childAges?: string;
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
  if (params.childAges) q.set('childAges', params.childAges);
  // Query prije hash-a — inače browser ne parsira checkIn/checkOut iz location.search
  return `/?${q.toString()}#${AVAILABILITY_SECTION_ID}`;
}

/** Čita query parametre iz search stringa ili legacy URL-a (/#raspolozivost?checkIn=...) */
export function getAvailabilitySearchParams(
  search: string,
  hash = '',
): URLSearchParams {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (params.toString()) return params;

  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  const qIndex = fragment.indexOf('?');
  if (qIndex !== -1) {
    return new URLSearchParams(fragment.slice(qIndex + 1));
  }
  return params;
}

export function propertySectionIdFromHash(hash: string): string {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  return fragment.split('?')[0];
}

export function buildBookingHref(params: {
  room: string;
  checkIn: string;
  checkOut: string;
  adults?: number | string;
  children?: number | string;
  /** Starosti djece, npr. "7,3" */
  childAges?: string;
  /** Broj osoba uz doručak (0 = bez doručka); >0 = doručak uključen */
  breakfast?: number;
  /** Početni korak booking widgeta (1 = datumi, 2 = podaci, 3 = plaćanje) */
  step?: 1 | 2 | 3;
}) {
  const q = new URLSearchParams({
    room: params.room,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
  });
  if (params.adults != null) q.set('adults', String(params.adults));
  if (params.children != null) q.set('children', String(params.children));
  if (params.childAges) q.set('childAges', params.childAges);
  if (params.breakfast != null && params.breakfast > 0) q.set('breakfast', String(params.breakfast));
  if (params.step != null) q.set('step', String(params.step));
  return `/booking?${q.toString()}`;
}

// ── Admin ─────────────────────────────────────────────────────────
export const ADMIN_COOKIE_NAME = process.env.ADMIN_COOKIE_NAME ?? 'ginko_admin';
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
