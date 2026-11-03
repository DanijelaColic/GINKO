/**
 * Usporedba prikazane (quoted) cijene sa svježim server izračunom.
 * Koristi se pri POST /api/bookings kad je MyRent pricing aktivan.
 *
 * Nema klijentskog bypassa: quote mora točno odgovarati serveru.
 * Nakon 409 priceChanged UI prikaže novi iznos, gost potvrdi, pa pošalje
 * novi quoted_* — server ponovno uspoređuje.
 */

import type { PriceBreakdown } from './booking.types';

export type QuotedPriceInput = {
  totalPrice?: number | null;
  deposit?: number | null;
};

/** Tolerancija u centima (0 = strogo). */
const EUR_EPS = 0.005;

export function pricesMatch(a: number, b: number): boolean {
  return Math.abs(a - b) < EUR_EPS;
}

/**
 * - missing_quote: nema quoted total/deposit
 * - price_changed: quote ≠ server (uključuje zastarjeli quote nakon PRICE EDIT)
 * - ok: quote se podudara sa serverskim izračunom
 */
export function evaluateQuotedPrice(params: {
  quoted: QuotedPriceInput;
  server: Pick<PriceBreakdown, 'totalPrice' | 'deposit'>;
}): 'ok' | 'missing_quote' | 'price_changed' {
  const { quoted, server } = params;

  if (quoted.totalPrice == null || quoted.deposit == null) {
    return 'missing_quote';
  }

  if (
    pricesMatch(Number(quoted.totalPrice), server.totalPrice) &&
    pricesMatch(Number(quoted.deposit), server.deposit)
  ) {
    return 'ok';
  }

  return 'price_changed';
}
