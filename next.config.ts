import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { ALL_LEGACY_REDIRECTS } from './src/modules/seo/legacy-redirects';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
    // Lokalni /public asseti; remotePatterns samo ako se ponovno uvedu vanjski URL-ovi
  },
  async redirects() {
    return ALL_LEGACY_REDIRECTS.map((rule) => ({
      source: rule.source,
      destination: rule.destination,
      permanent: rule.permanent,
    }));
  },
};

export default withNextIntl(nextConfig);
