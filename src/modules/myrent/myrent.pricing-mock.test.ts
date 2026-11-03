import { describe, expect, it } from 'vitest';
import {
  buildMockMyRentCalendarDays,
  buildMockMyRentPricePeriod,
} from './myrent.pricing-mock';
import {
  applySpaWellnessSurchargeToQuote,
  buildPriceBreakdownFromMyRentNights,
  ginkoAddonsForMyRentPricing,
  quoteFromPeriodNights,
} from './myrent.pricing';
import {
  setSpaWellnessSurchargeForTests,
} from './myrent.spa-pricing';

describe('buildMockMyRentCalendarDays', () => {
  it('vraća flat bazu (kao live API) za radne i vikend dane', () => {
    const days = buildMockMyRentCalendarDays({
      roomSlug: 'ginko-1',
      checkIn: '2027-02-19',
      checkOut: '2027-02-22',
    });
    const byDay = Object.fromEntries(days.map((d) => [d.day, d.price]));
    expect(byDay['2027-02-19']).toBe(50);
    expect(byDay['2027-02-20']).toBe(50);
    expect(byDay['2027-02-21']).toBe(50);
  });
});

describe('buildMockMyRentPricePeriod', () => {
  it('2 gosta = baza × noći', () => {
    const period = buildMockMyRentPricePeriod({
      roomSlug: 'ginko-2',
      checkIn: '2027-03-15',
      checkOut: '2027-03-17',
      adults: 2,
      children: 0,
    });
    expect(period.accommodationTotal).toBe(100);
  });

  it('3 gosta na Ginko 2 = baza + 15€ extra × noći', () => {
    const period = buildMockMyRentPricePeriod({
      roomSlug: 'ginko-2',
      checkIn: '2027-03-15',
      checkOut: '2027-03-17',
      adults: 3,
      children: 0,
    });
    expect(period.accommodationTotal).toBe(130);
  });

  it('SPA mock baza ista za spa-1 i spa-2; wellness se dodaje izvan mocka', () => {
    setSpaWellnessSurchargeForTests(100);
    const a = buildMockMyRentPricePeriod({
      roomSlug: 'ginko-spa-1',
      checkIn: '2027-03-15',
      checkOut: '2027-03-17',
      adults: 2,
      children: 0,
    });
    const b = buildMockMyRentPricePeriod({
      roomSlug: 'ginko-spa-2',
      checkIn: '2027-03-15',
      checkOut: '2027-03-17',
      adults: 2,
      children: 0,
    });
    expect(a.accommodationTotal).toBe(390);
    expect(b.accommodationTotal).toBe(390);

    let quote = quoteFromPeriodNights({
      nights: b.nights,
      accommodationTotal: b.accommodationTotal,
    });
    quote = applySpaWellnessSurchargeToQuote(quote, 100);
    const breakdown = buildPriceBreakdownFromMyRentNights(
      quote,
      ginkoAddonsForMyRentPricing({ breakfastPerNight: 15 }),
    );
    // 390 + 100×2 + 30 breakfast
    expect(breakdown.totalPrice).toBe(390 + 200 + 30);
    expect(breakdown.deposit).toBe(breakdown.totalPrice * 0.5);
    setSpaWellnessSurchargeForTests(undefined);
  });
});
