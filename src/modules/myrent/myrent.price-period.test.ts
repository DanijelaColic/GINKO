import { describe, expect, it } from 'vitest';
import {
  distributePeriodTotalAcrossNights,
  normalizeMyRentPricePeriodPayload,
} from './myrent.price-period';
import { MyRentPricingError } from './myrent.pricing';

describe('distributePeriodTotalAcrossNights', () => {
  it('zbroj noći === Website period total (uključujući guest extra)', () => {
    const nights = distributePeriodTotalAcrossNights({
      checkIn: '2027-03-15',
      checkOut: '2027-03-17',
      accommodationTotal: 130,
      dayRows: [
        {
          day: '2027-03-15',
          price: 50,
          priceDef: 50,
          priceExtra: 15,
          extraFrom: 2,
        },
        {
          day: '2027-03-16',
          price: 50,
          priceDef: 50,
          priceExtra: 15,
          extraFrom: 2,
        },
        {
          day: '2027-03-17',
          price: 50,
          priceDef: 50,
          priceExtra: 15,
          extraFrom: 2,
        },
      ],
    });
    expect(nights).toHaveLength(2);
    expect(nights.reduce((s, n) => s + n.price, 0)).toBe(130);
  });
});

describe('normalizeMyRentPricePeriodPayload (Website A / b2b_*)', () => {
  it('koristi b2b_object_price_period + price_b2b (ne base 50)', () => {
    const raw = [
      {
        object_id: 16575,
        object_free: 'Y',
        object_price_period: 50,
        object_price_period_simple: 50,
        b2b_object_price_period: 60,
        sum: JSON.stringify({
          adults: '2',
          children: '0',
          total_guests: '2',
          object_price_period: '50.00',
          object_advance_percent: '50',
          currency_code: 'EUR',
        }),
        days: JSON.stringify([
          {
            day: '2026-11-25',
            price: '50.0000',
            price_b2b: '60.0000',
            price_extra: 0,
            extra_from: 0,
          },
          {
            day: '2026-11-26',
            price: '50.0000',
            price_b2b: '60.0000',
            price_extra: 0,
            extra_from: 0,
          },
        ]),
      },
    ];

    const result = normalizeMyRentPricePeriodPayload(raw, {
      objectId: 16575,
      dateFrom: '2026-11-25',
      dateUntil: '2026-11-26',
      adults: 2,
      children: 0,
    });

    expect(result.accommodationTotal).toBe(60);
    expect(result.nights).toHaveLength(1);
    expect(result.nights[0]?.price).toBe(60);
    expect(result.nights.reduce((s, n) => s + n.price, 0)).toBe(60);
  });

  it('2 noći: b2b total 120, bez dvostrukog markupa', () => {
    const raw = [
      {
        object_id: 16575,
        object_free: 'Y',
        object_price_period_simple: 100,
        b2b_object_price_period: 120,
        days: JSON.stringify([
          { day: '2026-11-25', price: '50', price_b2b: '60' },
          { day: '2026-11-26', price: '50', price_b2b: '60' },
          { day: '2026-11-27', price: '50', price_b2b: '60' },
        ]),
      },
    ];

    const result = normalizeMyRentPricePeriodPayload(raw, {
      objectId: 16575,
      dateFrom: '2026-11-25',
      dateUntil: '2026-11-27',
      adults: 2,
      children: 0,
    });

    expect(result.accommodationTotal).toBe(120);
    expect(result.nights).toHaveLength(2);
    expect(result.nights.reduce((s, n) => s + n.price, 0)).toBe(120);
  });

  it('fail-closed ako nedostaje b2b_object_price_period (ne pada na base)', () => {
    const raw = [
      {
        object_id: 16575,
        object_price_period_simple: 50,
        object_price_period: 50,
        // b2b_object_price_period namjerno izostavljen
        days: JSON.stringify([
          { day: '2026-11-25', price: '50', price_b2b: '60' },
        ]),
      },
    ];

    expect(() =>
      normalizeMyRentPricePeriodPayload(raw, {
        objectId: 16575,
        dateFrom: '2026-11-25',
        dateUntil: '2026-11-26',
        adults: 2,
        children: 0,
      }),
    ).toThrow(MyRentPricingError);

    try {
      normalizeMyRentPricePeriodPayload(raw, {
        objectId: 16575,
        dateFrom: '2026-11-25',
        dateUntil: '2026-11-26',
        adults: 2,
        children: 0,
      });
    } catch (err) {
      expect(err).toBeInstanceOf(MyRentPricingError);
      expect((err as MyRentPricingError).message).toMatch(
        /b2b_object_price_period/,
      );
    }
  });
});
