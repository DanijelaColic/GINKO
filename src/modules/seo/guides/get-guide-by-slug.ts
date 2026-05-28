import type { AppLocale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { GUIDES } from './guides-content';
import type { GuideArticle } from './guide-types';

export function getGuideBySlug(locale: AppLocale, slug: string): GuideArticle | undefined {
  const requestedLocale = routing.locales.includes(locale) ? locale : routing.defaultLocale;

  return (
    GUIDES.find((guide) => guide.locale === requestedLocale && guide.slug === slug) ??
    GUIDES.find((guide) => guide.locale === routing.defaultLocale && guide.slug === slug)
  );
}
