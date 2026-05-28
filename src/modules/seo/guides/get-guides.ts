import type { AppLocale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { GUIDES } from './guides-content';
import type { GuideListItem } from './guide-types';

export function getGuides(locale: AppLocale): GuideListItem[] {
  const requestedLocale = routing.locales.includes(locale) ? locale : routing.defaultLocale;

  const localizedGuides = GUIDES.filter((guide) => guide.locale === requestedLocale);
  const guidesForLocale =
    localizedGuides.length > 0
      ? localizedGuides
      : GUIDES.filter((guide) => guide.locale === routing.defaultLocale);

  return guidesForLocale
    .slice()
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .map(({ slug, title, description, publishedAt, readingTime, coverImage }) => ({
      slug,
      title,
      description,
      publishedAt,
      readingTime,
      coverImage,
    }));
}
