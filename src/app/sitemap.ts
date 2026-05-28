import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { GUIDES } from '@/modules/seo/guides/guides-content';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ginko-sobe.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { pathname: '/', changeFrequency: 'weekly', priority: 1 },
    { pathname: '/rooms', changeFrequency: 'monthly', priority: 0.95 },
    { pathname: '/booking', changeFrequency: 'weekly', priority: 0.9 },
    { pathname: '/guides', changeFrequency: 'weekly', priority: 0.8 },
    { pathname: '/gallery', changeFrequency: 'monthly', priority: 0.75 },
    { pathname: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
    { pathname: '/cookies', changeFrequency: 'yearly', priority: 0.2 },
  ] as const;

  const guideRoutes = Array.from(new Set(GUIDES.map((guide) => `/guides/${guide.slug}`))).map(
    (pathname) => ({
      pathname,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    }),
  );

  const allRoutes = [...staticRoutes, ...guideRoutes];

  const toLocalizedPath = (locale: string, pathname: string) => {
    const normalizedPath = pathname === '/' ? '' : pathname;

    if (locale === routing.defaultLocale) {
      return normalizedPath || '/';
    }

    return `/${locale}${normalizedPath}`;
  };

  const getLanguageAlternates = (pathname: string) => ({
    ...Object.fromEntries(
      routing.locales.map((locale) => [locale, `${BASE_URL}${toLocalizedPath(locale, pathname)}`]),
    ),
    'x-default': `${BASE_URL}${toLocalizedPath(routing.defaultLocale, pathname)}`,
  });

  return allRoutes.map(({ pathname, changeFrequency, priority }) => {
    const defaultLocalePath = toLocalizedPath(routing.defaultLocale, pathname);

    return {
      url: `${BASE_URL}${defaultLocalePath}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: {
        languages: getLanguageAlternates(pathname),
      },
    };
  });
}
