/**
 * i18n key inventory — što prevoditi kad klijent zamrzne HR sadržaj.
 * Koristi se kao checklist; nije runtime dependency (osim tipova).
 */

export type I18nBucket = 'ui' | 'marketing' | 'legal_adjacent' | 'seo';

export type I18nNamespaceInfo = {
  /** Root key u messages/{locale}.json */
  namespace: string;
  bucket: I18nBucket;
  /** Približan broj leaf keyeva (HR, 2026-08) */
  approxKeys: number;
  notes: string;
};

/**
 * UI = gumbi, labele, greške (stabilnije; može se prevoditi ranije).
 * marketing = hero, opisi, FAQ odgovori (čekaj odobrenje sadržaja).
 * seo = meta / OG / structured data.
 * legal_adjacent = pravni ton (privacy je inline u page.tsx, ne u messages).
 */
export const I18N_NAMESPACES: readonly I18nNamespaceInfo[] = [
  {
    namespace: 'navbar',
    bucket: 'ui',
    approxKeys: 11,
    notes: 'Navigacija, locale label',
  },
  {
    namespace: 'footer',
    bucket: 'ui',
    approxKeys: 10,
    notes: 'Footer linkovi',
  },
  {
    namespace: 'notFoundPage',
    bucket: 'ui',
    approxKeys: 3,
    notes: '404 copy',
  },
  {
    namespace: 'bookingWidget',
    bucket: 'ui',
    approxKeys: 125,
    notes: 'Forma, validacije, koraci — prioritet za EN/DE UX',
  },
  {
    namespace: 'bookingPage',
    bucket: 'ui',
    approxKeys: 14,
    notes: 'Booking page chrome',
  },
  {
    namespace: 'roomsPage',
    bucket: 'ui',
    approxKeys: 20,
    notes: 'Filteri, badgeovi; title/description djelomično marketing',
  },
  {
    namespace: 'roomDetailPage',
    bucket: 'ui',
    approxKeys: 27,
    notes: 'Detail chrome; room body je u rooms.config translations',
  },
  {
    namespace: 'roomDetailModal',
    bucket: 'ui',
    approxKeys: 29,
    notes: 'Modal labele',
  },
  {
    namespace: 'guidesPage',
    bucket: 'ui',
    approxKeys: 3,
    notes: 'Hub chrome; članci su u modules/seo/guides',
  },
  {
    namespace: 'homePage',
    bucket: 'marketing',
    approxKeys: 75,
    notes: 'Hero, features, availability labels — zamrzni HR prije EN/DE',
  },
  {
    namespace: 'travelerQuestions',
    bucket: 'marketing',
    approxKeys: 42,
    notes: 'FAQ Q/A — ista baza za chatbot knowledge',
  },
  {
    namespace: 'siteMetadata',
    bucket: 'seo',
    approxKeys: 3,
    notes: 'Site-level meta',
  },
  {
    namespace: 'metadata',
    bucket: 'seo',
    approxKeys: 12,
    notes: 'Layout + JSON-LD strings',
  },
] as const;

/** Izvan messages/*.json — poseban prolaz nakon odobrenja copyja */
export const I18N_OUTSIDE_MESSAGES = [
  {
    path: 'src/modules/rooms/rooms.config.ts → roomTranslations',
    bucket: 'marketing' as const,
    notes: 'EN/DE trenutačno mirror HR (TODO u configu)',
  },
  {
    path: 'src/modules/seo/guides/guides-content.ts',
    bucket: 'marketing' as const,
    notes: 'SEO guide članci',
  },
  {
    path: 'src/lib/email.ts',
    bucket: 'ui' as const,
    notes: 'Email predmeti/tijela već imaju hr/en/de grane',
  },
  {
    path: 'src/app/(public)/privacy/page.tsx + cookies/page.tsx',
    bucket: 'legal_adjacent' as const,
    notes: 'Inline HR; EN/DE page-ovi su locale re-exporti — treba prijevod',
  },
] as const;

export function namespacesByBucket(bucket: I18nBucket): I18nNamespaceInfo[] {
  return I18N_NAMESPACES.filter((n) => n.bucket === bucket);
}
