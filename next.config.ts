import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  // Stari guide slugovi (pogrešan grad) → Daruvar vodiči
  async redirects() {
    return [
      {
        source: '/guides/sto-posjetiti-u-zadru',
        destination: '/guides/sto-posjetiti-u-daruvaru',
        permanent: true,
      },
      {
        source: '/guides/kako-planirati-odmor-u-zadru',
        destination: '/guides/kako-planirati-odmor-u-daruvaru',
        permanent: true,
      },
      {
        source: '/:locale(en|de)/guides/sto-posjetiti-u-zadru',
        destination: '/:locale/guides/sto-posjetiti-u-daruvaru',
        permanent: true,
      },
      {
        source: '/:locale(en|de)/guides/kako-planirati-odmor-u-zadru',
        destination: '/:locale/guides/kako-planirati-odmor-u-daruvaru',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
