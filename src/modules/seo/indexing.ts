import type { Metadata } from 'next';

type EnvLike = Record<string, string | undefined>;

/**
 * Kad je true, site ne smije ići u Google indeks.
 * - SEO_NOINDEX=1 → eksplicitno (Vercel Production do DNS flipa)
 * - VERCEL_ENV=preview|development → automatski
 *
 * VERCEL_ENV=production bez SEO_NOINDEX → indexable (cutover).
 */
export function isSeoNoindexEnvironment(env: EnvLike = process.env): boolean {
  const noindexFlag = (env.SEO_NOINDEX ?? '').trim();
  if (noindexFlag === '1' || noindexFlag.toLowerCase() === 'true') return true;

  const vercelEnv = (env.VERCEL_ENV ?? '').trim().toLowerCase();
  return vercelEnv === 'preview' || vercelEnv === 'development';
}

/** robots meta za layout / stranice koje žele “javni” index kad nije noindex env. */
export function getIndexingRobots(env: EnvLike = process.env): Metadata['robots'] {
  if (isSeoNoindexEnvironment(env)) {
    return { index: false, follow: false };
  }

  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  };
}

/**
 * Stranica traži index:true, ali SEO_NOINDEX / preview mora pobijediti.
 * Confirmation i slično šalju forceNoindex.
 */
export function resolvePageRobots(
  requested: Metadata['robots'] | undefined,
  env: EnvLike = process.env,
): Metadata['robots'] | undefined {
  if (isSeoNoindexEnvironment(env)) {
    return { index: false, follow: false };
  }
  return requested;
}
