/**
 * 301 mapa sa starog MyRent portala (ginko-sobe.com) na novi Next.js site.
 *
 * Pripremljeno za cutover — aktivno u next.config.ts redirects().
 * DNS / produkcijski flip se radi zasebno; preview ostaje noindex.
 *
 * Napomena: locale `de` je uključen jer stari portal / zastarjeli linkovi
 * mogu imati /de/… iako nova app trenutno nudi hr/en/cs.
 */

export type LegacyRedirect = {
  source: string;
  destination: string;
  permanent: true;
};

/** MyRent portal rute → nove kanonske putanje. */
export const MYRENT_LEGACY_REDIRECTS: LegacyRedirect[] = [
  // Bez locale prefixa
  { source: '/users/:path*', destination: '/', permanent: true },
  { source: '/objects/:path*', destination: '/rooms', permanent: true },
  { source: '/pictures/:path*', destination: '/gallery', permanent: true },
  { source: '/reviews/:path*', destination: '/', permanent: true },

  // HR (default locale na novom siteu bez /hr prefixa)
  { source: '/hr', destination: '/', permanent: true },
  { source: '/hr/', destination: '/', permanent: true },
  { source: '/hr/users/:path*', destination: '/', permanent: true },
  { source: '/hr/objects/:path*', destination: '/rooms', permanent: true },
  { source: '/hr/pictures/:path*', destination: '/gallery', permanent: true },
  { source: '/hr/reviews/:path*', destination: '/', permanent: true },

  // EN / CS (postojeći locales na novom siteu)
  {
    source: '/:locale(en|cs)/users/:path*',
    destination: '/:locale',
    permanent: true,
  },
  {
    source: '/:locale(en|cs)/objects/:path*',
    destination: '/:locale/rooms',
    permanent: true,
  },
  {
    source: '/:locale(en|cs)/pictures/:path*',
    destination: '/:locale/gallery',
    permanent: true,
  },
  {
    source: '/:locale(en|cs)/reviews/:path*',
    destination: '/:locale',
    permanent: true,
  },

  // DE legacy → EN (DE još nije u routing.locales)
  { source: '/de/users/:path*', destination: '/en', permanent: true },
  { source: '/de/objects/:path*', destination: '/en/rooms', permanent: true },
  { source: '/de/pictures/:path*', destination: '/en/gallery', permanent: true },
  { source: '/de/reviews/:path*', destination: '/en', permanent: true },
  { source: '/de', destination: '/en', permanent: true },
];

/** Stari guide slugovi (Zadar copy-paste) → Daruvar vodiči. */
export const LEGACY_GUIDE_REDIRECTS: LegacyRedirect[] = [
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
    source: '/:locale(en|cs)/guides/sto-posjetiti-u-zadru',
    destination: '/:locale/guides/sto-posjetiti-u-daruvaru',
    permanent: true,
  },
  {
    source: '/:locale(en|cs)/guides/kako-planirati-odmor-u-zadru',
    destination: '/:locale/guides/kako-planirati-odmor-u-daruvaru',
    permanent: true,
  },
  {
    source: '/de/guides/sto-posjetiti-u-zadru',
    destination: '/en/guides/sto-posjetiti-u-daruvaru',
    permanent: true,
  },
  {
    source: '/de/guides/kako-planirati-odmor-u-zadru',
    destination: '/en/guides/kako-planirati-odmor-u-daruvaru',
    permanent: true,
  },
];

export const ALL_LEGACY_REDIRECTS: LegacyRedirect[] = [
  ...MYRENT_LEGACY_REDIRECTS,
  ...LEGACY_GUIDE_REDIRECTS,
];
