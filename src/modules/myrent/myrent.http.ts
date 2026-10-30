/**
 * Zajednički HTTP headeri za MyRent auth + API.
 * Cloudflare na auth.my-rent.net / api.my-rent.net blokira zahtjeve bez UA.
 */

export const MYRENT_USER_AGENT = 'Mozilla/5.0 (compatible; GinkoMyRent/1.0)';

/** Headeri koje šaljemo uz svaki MyRent HTTP poziv (bez credentials). */
export function myrentCommonHeaders(
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    Accept: 'application/json',
    'User-Agent': MYRENT_USER_AGENT,
    ...extra,
  };
}
