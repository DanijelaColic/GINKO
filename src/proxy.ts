import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { ADMIN_COOKIE_NAME } from '@/modules/booking/booking.config';
import { verifyAdminSessionToken } from '@/lib/admin-session';

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin route guard (potpisana sesija) ────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
    const ok = await verifyAdminSessionToken(cookie?.value);

    if (!ok) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === '/admin/login') {
    const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
    const ok = await verifyAdminSessionToken(cookie?.value);
    if (ok) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Skip Next.js metadata routes from i18n processing
  const isMetadataRoute =
    pathname === '/icon' ||
    pathname.startsWith('/icon/') ||
    pathname === '/apple-icon' ||
    pathname.startsWith('/apple-icon/') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/manifest';

  if (isMetadataRoute) {
    return NextResponse.next();
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};

export default proxy;
