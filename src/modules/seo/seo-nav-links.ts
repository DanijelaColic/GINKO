import type { AppLocale } from '@/i18n/routing';
import { GUIDE_HUB_BY_LOCALE } from '@/modules/seo/guides/guides-content';

export type SeoNavLink = {
  href: string;
  label: string;
};

/** Vodič + SEO pages — single source for footer and InternalLinks. */
export function getSeoNavLinks(locale: AppLocale): SeoNavLink[] {
  const hub = GUIDE_HUB_BY_LOCALE[locale];

  return [{ href: '/guides', label: hub.title }];
}
