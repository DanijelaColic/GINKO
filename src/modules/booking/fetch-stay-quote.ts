/**
 * Client helper: zajednički quote endpoint.
 * Koristi se samo kad je myRentPricingEnabled prop true.
 */

import type { StayPriceQuoteResponse } from './quote.types';
import type { PriceExtras } from './dates';

export class StayQuoteError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number) {
    super(code);
    this.name = 'StayQuoteError';
    this.code = code;
    this.status = status;
  }
}

export async function fetchStayQuote(params: {
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  extras?: PriceExtras;
  quoteApiPath?: string;
}): Promise<StayPriceQuoteResponse> {
  const res = await fetch(params.quoteApiPath ?? '/api/bookings/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room_slug: params.roomSlug,
      check_in: params.checkIn,
      check_out: params.checkOut,
      adults: params.adults ?? 2,
      children: params.children ?? 0,
      extra_beds: params.extras?.extraBeds ?? 0,
      crib: params.extras?.crib === true,
      breakfast_per_night: params.extras?.breakfastPerNight,
      breakfast_guests: params.extras?.breakfastGuests,
    }),
  });

  const data = (await res.json()) as StayPriceQuoteResponse & { error?: string };
  if (!res.ok) {
    throw new StayQuoteError(
      typeof data.error === 'string' ? data.error : 'fetchFailed',
      res.status,
    );
  }
  return data;
}
