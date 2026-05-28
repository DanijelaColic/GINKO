// Adapted 1:1 from VJ/src/lib/bookingConfirmation.ts
// Changes: getBookingConfirmationPath updated to use Ginko's /booking/confirmation route.
import { createHmac, timingSafeEqual } from 'crypto';
import { getSiteUrl } from './siteUrl';

function getBookingViewSecret(): string {
  const secret = process.env.BOOKING_VIEW_SECRET?.trim();
  if (!secret) {
    throw new Error('BOOKING_VIEW_SECRET nije postavljen u .env.local');
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

export function getBookingConfirmationPath(bookingId: string, token: string): string {
  const params = new URLSearchParams({ token });
  return `/booking/confirmation/${bookingId}?${params.toString()}`;
}

export function getBookingConfirmationUrl(bookingId: string, token: string): string {
  return `${getSiteUrl()}${getBookingConfirmationPath(bookingId, token)}`;
}
