import { routing, type AppLocale } from './routing';

function normalizePath(pathname: string) {
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

export function getLocaleFromPath(
  pathname: string | null | undefined,
): AppLocale {
  const p = normalizePath(pathname ?? '/');
  for (const locale of routing.locales) {
    if (p === `/${locale}` || p.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return routing.defaultLocale;
}

export function stripLocalePrefix(pathname: string): string {
  const p = normalizePath(pathname);
  for (const locale of routing.locales) {
    if (p === `/${locale}`) return '/';
    if (p.startsWith(`/${locale}/`)) return p.slice(locale.length + 1);
  }
  return p;
}

export function localizePath(pathname: string, locale: AppLocale): string {
  const base = stripLocalePrefix(pathname);
  if (locale === routing.defaultLocale) return base;
  return base === '/' ? `/${locale}` : `/${locale}${base}`;
}
