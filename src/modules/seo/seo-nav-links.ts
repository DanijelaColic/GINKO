import type { AppLocale } from '@/i18n/routing';
import { GUIDE_HUB_BY_LOCALE } from '@/modules/seo/guides/guides-content';
import { getLandingPageContent } from '@/modules/seo/landing-pages/content';
import { LANDING_PAGE_PATHS } from '@/modules/seo/landing-pages/landing-enriched-types';

export type SeoNavLink = {
  href: string;
  label: string;
};

/** Vodič + SEO landing pages — single source for footer and InternalLinks. */
export function getSeoNavLinks(locale: AppLocale): SeoNavLink[] {
  const hub = GUIDE_HUB_BY_LOCALE[locale];

  const landingLinks = LANDING_PAGE_PATHS.map((key) => {
    const content = getLandingPageContent(key, locale);
    return { href: `/${key}`, label: content.breadcrumbLabel };
  });

  return [{ href: '/guides', label: hub.title }, ...landingLinks];
}
