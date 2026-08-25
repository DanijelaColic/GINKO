import type { AppLocale } from '@/i18n/routing';

/** Shared UI chrome for landing templates (not SEO fields). */
export const LANDING_RESERVATION_HEADING: Record<AppLocale, string> = {
  hr: 'Rezervacija i planiranje boravka',
  en: 'Reservation and stay planning',
  cs: 'Rezervace a plánování pobytu',
};

export const LANDING_ROOMS_LINK_LABEL: Record<AppLocale, string> = {
  hr: 'Sobe',
  en: 'Rooms',
  cs: 'Pokoje',
};

export const LANDING_GUIDES_LINK_LABEL: Record<AppLocale, string> = {
  hr: 'Vodič',
  en: 'Guide',
  cs: 'Průvodce',
};
