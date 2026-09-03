// Adapted 1:1 from VJ/src/lib/bookingConfirmation.ts
// Changes: getBookingConfirmationPath updated to use Ginko's /booking/confirmation route.
import { createHmac, timingSafeEqual } from 'crypto';
import { getValidLocale } from '@/i18n/messages';
import { localizePath } from '@/i18n/pathnames';
import type { AppLocale } from '@/i18n/routing';
import { getSiteUrl, getSiteUrlFromRequest } from './siteUrl';

function getBookingViewSecret(): string {
  const secret = process.env.BOOKING_VIEW_SECRET?.trim();
  if (!secret) {
    throw new Error(
      'BOOKING_VIEW_SECRET nije postavljen (env.local / Vercel Environment Variables)',
    );
  }
  return secret;
}

export function createBookingViewToken(bookingId: string, guestEmail: string): string {
  return createHmac('sha256', getBookingViewSecret())
    .update(`${bookingId}:${guestEmail.toLowerCase().trim()}`)
    .digest('hex');
}

export function verifyBookingViewToken(
  token: string,
  bookingId: string,
  guestEmail: string,
): boolean {
  const expected = createBookingViewToken(bookingId, guestEmail);
  const provided = token.trim();
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export function getBookingConfirmationPath(
  bookingId: string,
  token: string,
  locale?: string | null,
): string {
  const loc = getValidLocale(locale);
  const params = new URLSearchParams({ token });
  return `${localizePath(`/booking/confirmation/${bookingId}`, loc)}?${params.toString()}`;
}

export function getBookingConfirmationUrl(
  bookingId: string,
  token: string,
  baseUrl?: string,
  locale?: string | null,
): string {
  const site = baseUrl ?? getSiteUrl();
  return `${site}${getBookingConfirmationPath(bookingId, token, locale)}`;
}

/** Build absolute confirmation URL using the incoming request origin when available. */
export function getBookingConfirmationUrlFromRequest(
  bookingId: string,
  token: string,
  originOrReferer?: string | null,
  locale?: string | null,
): string {
  return getBookingConfirmationUrl(
    bookingId,
    token,
    getSiteUrlFromRequest(originOrReferer),
    locale,
  );
}

/** Saferpay Payment Page LanguageCode (ISO 639-1). */
export function toSaferpayLanguageCode(locale?: string | null): AppLocale {
  return getValidLocale(locale);
}
