import type { AppLocale } from '@/i18n/routing';

/** Extend this union as landing pages are created. */
export type LandingPageKey =
  | 'sobe-daruvar'
  | 'privatni-smjestaj-daruvar'
  | 'wellness-daruvar'
  | 'smjestaj-uz-daruvarske-toplice';

/** Paths used in relatedLandingPages and SEO routes (no leading slash). */
export const LANDING_PAGE_PATHS = [
  'sobe-daruvar',
  'privatni-smjestaj-daruvar',
  'wellness-daruvar',
  'smjestaj-uz-daruvarske-toplice',
] as const satisfies readonly LandingPageKey[];

export function parseLandingPageKeyFromPath(path: string): LandingPageKey | null {
  const key = path.replace(/^\//, '');
  return (LANDING_PAGE_PATHS as readonly string[]).includes(key)
    ? (key as LandingPageKey)
    : null;
}

export type LandingHeroImage = {
  src: string;
  alt: string;
};

/** SEO titles + short intro; rich copy lives in landing-enriched-data.ts */
export type LandingPageBase = {
  seoTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  ctaLabel: string;
  breadcrumbLabel: string;
};

export type LandingBodySection = {
  heading: string;
  paragraphs: string[];
};

export type LandingActivityCard = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export type LandingFaqItem = {
  question: string;
  answer: string;
};

export type LandingEnrichedFields = {
  eyebrow: string;
  heroImage: LandingHeroImage;
  highlights: string[];
  sections: LandingBodySection[];
  activitiesSectionTitle: string;
  activities: LandingActivityCard[];
  midCtaTitle: string;
  midCtaBody: string;
  midCtaPrimaryLabel: string;
  midCtaGalleryLabel: string;
  faqSectionTitle: string;
  faqs: LandingFaqItem[];
  reservationIntro: string;
  guidesBlockTitle: string;
  guidesBlockIntro: string;
};

export type LandingMergedContent = LandingPageBase & LandingEnrichedFields;

export type LandingEnrichedByLocale = Record<AppLocale, LandingEnrichedFields>;

export type LandingEnrichedMap = Record<LandingPageKey, LandingEnrichedByLocale>;
