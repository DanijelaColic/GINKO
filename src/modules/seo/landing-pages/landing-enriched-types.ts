import type { AppLocale } from '@/i18n/routing';

/** Extend this union as landing pages are created in future phases. */
export type LandingPageKey = 'sobe-zadar' | 'privatni-smjestaj-zadar';

export const LANDING_PAGE_PATHS = ['sobe-zadar', 'privatni-smjestaj-zadar'] as const satisfies readonly LandingPageKey[];

export function parseLandingPageKeyFromPath(path: string): LandingPageKey | null {
  const key = path.replace(/^\//, '');
  return (LANDING_PAGE_PATHS as readonly string[]).includes(key) ? (key as LandingPageKey) : null;
}

export type LandingPageBase = {
  seoTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  ctaLabel: string;
  breadcrumbLabel: string;
};

export type LandingEnrichedByLocale = Record<AppLocale, LandingPageBase>;
export type LandingEnrichedMap = Record<LandingPageKey, LandingEnrichedByLocale>;
