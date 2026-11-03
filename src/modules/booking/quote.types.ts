import type { BookingPriceSource } from './resolve-booking-price';
import type { NightlyRate, PriceBreakdown } from './booking.types';

/** Odgovor zajedničkog quote API-ja (prikaz + usporedba pri create). */
export type StayPriceQuoteResponse = {
  source: BookingPriceSource;
  breakdown: PriceBreakdown;
  pricePerNight: number;
  nightlyRates: NightlyRate[];
  ratesVary: boolean;
};

export type StayPriceQuoteRequest = {
  room_slug: string;
  check_in: string;
  check_out: string;
  adults?: number;
  children?: number;
  extra_beds?: number;
  crib?: boolean;
  breakfast_per_night?: number;
  breakfast_guests?: number;
};
