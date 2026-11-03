'use client';

import { useEffect, useState } from 'react';
import type { PriceBreakdown } from '@/modules/booking/booking.types';
import type { PriceExtras } from '@/modules/booking/dates';
import { formatDate } from '@/modules/booking/dates';
import {
  fetchStayQuote,
  StayQuoteError,
} from '@/modules/booking/fetch-stay-quote';
import type { StayPriceQuoteResponse } from '@/modules/booking/quote.types';

export type StayPriceQuoteState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; code: string }
  | { status: 'ready'; quote: StayPriceQuoteResponse; breakdown: PriceBreakdown };

/**
 * Dohvaća serverski quote kad je MyRent pricing UI aktivan.
 * Kad enabled=false → idle (widget koristi lokalni calculatePrice).
 */
export function useStayPriceQuote(params: {
  enabled: boolean;
  roomSlug: string | null;
  checkIn: Date | null;
  checkOut: Date | null;
  adults: number;
  children: number;
  extras: PriceExtras;
  quoteApiPath?: string;
}): StayPriceQuoteState {
  const {
    enabled,
    roomSlug,
    checkIn,
    checkOut,
    adults,
    children,
    extras,
    quoteApiPath,
  } = params;
  const [state, setState] = useState<StayPriceQuoteState>({ status: 'idle' });

  const extrasKey = JSON.stringify({
    extraBeds: extras.extraBeds ?? 0,
    crib: extras.crib === true,
    breakfastPerNight: extras.breakfastPerNight ?? 0,
    breakfastGuests: extras.breakfastGuests ?? 0,
  });

  useEffect(() => {
    if (!enabled || !roomSlug || !checkIn || !checkOut) {
      setState({ status: 'idle' });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    const extrasParsed = JSON.parse(extrasKey) as PriceExtras;

    fetchStayQuote({
      roomSlug,
      checkIn: formatDate(checkIn),
      checkOut: formatDate(checkOut),
      adults,
      children,
      extras: extrasParsed,
      quoteApiPath,
    })
      .then((quote) => {
        if (cancelled) return;
        setState({ status: 'ready', quote, breakdown: quote.breakdown });
      })
      .catch((err) => {
        if (cancelled) return;
        const code =
          err instanceof StayQuoteError ? err.code : 'pricingUnavailable';
        setState({ status: 'error', code });
      });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    roomSlug,
    checkIn,
    checkOut,
    adults,
    children,
    extrasKey,
    quoteApiPath,
  ]);

  return state;
}
