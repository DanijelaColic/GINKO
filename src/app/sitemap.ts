import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { GUIDES } from '@/modules/seo/guides/guides-content';
import { LANDING_PAGE_PATHS } from '@/modules/seo/landing-pages/landing-enriched-types';
import { rooms } from '@/modules/rooms/rooms.config';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ginko-sobe.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { pathname: '/', changeFrequency: 'weekly' as const, priority: 1 },
    { pathname: '/rooms', changeFrequency: 'monthly' as const, priority: 0.95 },
    { pathname: '/booking', changeFrequency: 'weekly' as const, priority: 0.9 },
    { pathname: '/guides', changeFrequency: 'weekly' as const, priority: 0.8 },
    { pathname: '/gallery', changeFrequency: 'monthly' as const, priority: 0.75 },
    ...LANDING_PAGE_PATHS.map((key) => ({
      pathname: `/${key}`,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    })),
    { pathname: '/privacy', changeFrequency: 'yearly' as const, priority: 0.2 },
    { pathname: '/cookies', changeFrequency: 'yearly' as const, priority: 0.2 },
  ];

  const roomRoutes = rooms.map((room) => ({
    pathname: `/rooms/${room.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  const guideRoutes = Array.from(new Set(GUIDES.map((guide) => `/guides/${guide.slug}`))).map(
    (pathname) => ({
      pathname,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    }),
  );

  const allRoutes = [...staticRoutes, ...roomRoutes, ...guideRoutes];

  const toLocalizedPath = (locale: string, pathname: string) => {
    const normalizedPath = pathname === '/' ? '' : pathname;

    if (locale === routing.defaultLocale) {
      return normalizedPath || '/';
    }

    return `/${locale}${normalizedPath}`;
  };

  const getLanguageAlternates = (pathname: string) => ({
    ...Object.fromEntries(
      routing.locales.map((locale) => [
        locale,
        `${BASE_URL}${toLocalizedPath(locale, pathname)}`,
      ]),
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
