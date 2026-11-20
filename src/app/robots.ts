import type { MetadataRoute } from 'next';
import { isSeoNoindexEnvironment } from '@/modules/seo/indexing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ginko-sobe.com';

export default function robots(): MetadataRoute.Robots {
  // Production + SEO_NOINDEX=1 (ili preview/dev): blokiraj crawl cijelog hosta.
  if (isSeoNoindexEnvironment()) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/booking/confirmation'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
