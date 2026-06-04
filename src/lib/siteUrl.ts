export function normalizeSiteUrl(input?: string | null): string | null {
  const raw = input?.trim();
  if (!raw) return null;

  const withProtocol =
    raw.startsWith('http://') || raw.startsWith('https://')
      ? raw
      : `https://${raw}`;

  try {
    const url = new URL(withProtocol);
    const host = url.hostname.toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    // Allow localhost only in development (booking confirmation redirect).
    if (isLocal && process.env.NODE_ENV !== 'development') return null;
    return `${url.protocol}//${url.host}`.replace(/\/$/, '');
  } catch {
    return null;
  }
}

/** Prefer request Origin/Referer (dev), then env, then production default. */
export function getSiteUrlFromRequest(originOrReferer?: string | null): string {
  if (originOrReferer) {
    try {
      const origin = originOrReferer.startsWith('http')
        ? originOrReferer
        : new URL(originOrReferer).origin;
      const normalized = normalizeSiteUrl(origin);
      if (normalized) return normalized;
    } catch {
      // fall through
    }
  }
  return getSiteUrl();
}

export function getSiteUrl(): string {
  return (
    normalizeSiteUrl(process.env.SITE_URL) ??
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    'https://ginko-sobe.com'
  );
}
