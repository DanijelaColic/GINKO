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
 * legal_adjacent = pravni ton (privacy/cookies u messages).
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
    namespace: 'bookingConfirmation',
    bucket: 'ui',
    approxKeys: 22,
    notes: 'Potvrda rezervacije + kartično plaćanje + checkout greške',
  },
  {
    namespace: 'errorPage',
    bucket: 'ui',
    approxKeys: 4,
    notes: 'Root error.tsx — gost-facing crash',
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
    notes: 'Forma, validacije, koraci — prioritet za EN/CS UX',
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
    approxKeys: 7,
    notes: 'Hub chrome + CTA na članku; članci u modules/seo/guides (HR/EN/CS)',
  },
  {
    namespace: 'galleryPage',
    bucket: 'ui',
    approxKeys: 7,
    notes: 'Galerija naslov/meta + chrome kolaža + kategorije u gallery.i18n',
  },
  {
    namespace: 'privacyPage',
    bucket: 'legal_adjacent',
    approxKeys: 40,
    notes: 'GDPR politika privatnosti',
  },
  {
    namespace: 'cookiesPage',
    bucket: 'legal_adjacent',
    approxKeys: 20,
    notes: 'Politika kolačića',
  },
  {
    namespace: 'cookieBanner',
    bucket: 'legal_adjacent',
    approxKeys: 5,
    notes: 'Consent banner',
  },
  {
    namespace: 'homePage',
    bucket: 'marketing',
    approxKeys: 75,
    notes: 'Hero, features, availability labels — zamrzni HR prije EN/CS',
  },
  {
    namespace: 'travelerQuestions',
    bucket: 'marketing',
    approxKeys: 44,
    notes: 'FAQ Q/A — ista baza za chatbot knowledge',
  },
  {
    namespace: 'chatbot',
    bucket: 'ui',
    approxKeys: 36,
    notes: 'In-page FAQ widget chrome + Faza 3 deep linkovi + Faza 4 thinking',
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
    notes: 'EN opisi gotovi (Faza 1); CS opisi gotovi (Faza 6)',
  },
  {
    path: 'src/modules/seo/guides/guides-content.ts',
    bucket: 'marketing' as const,
    notes: 'SEO guide članci — HR + EN + CS (Faza 7)',
  },
  {
    path: 'src/modules/property/property-details.i18n.ts',
    bucket: 'marketing' as const,
    notes: 'Naslovnica: sadržaji, okolica, kućni red, recenzije chrome — HR/EN/CS',
  },
  {
    path: 'src/lib/email.ts',
    bucket: 'ui' as const,
    notes: 'Email predmeti/tijela hr/en/cs',
  },
] as const;

export function namespacesByBucket(bucket: I18nBucket): I18nNamespaceInfo[] {
  return I18N_NAMESPACES.filter((n) => n.bucket === bucket);
}
