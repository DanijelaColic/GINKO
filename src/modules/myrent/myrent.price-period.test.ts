import { describe, expect, it } from 'vitest';
import {
  distributePeriodTotalAcrossNights,
  normalizeMyRentPricePeriodPayload,
} from './myrent.price-period';

describe('distributePeriodTotalAcrossNights', () => {
  it('zbroj noći === period total (uključujući guest extra)', () => {
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

describe('normalizeMyRentPricePeriodPayload', () => {
  it('parsira docs-like odgovor (sum/days kao string JSON)', () => {
    const raw = [
      {
        object_id: 16575,
        object_free: 'Y',
        object_price_period: 100,
        object_price_period_simple: 100,
        sum: JSON.stringify({
          adults: '2',
          children: '0',
          total_guests: '2',
          object_price_period: '100.00',
          object_advance_percent: '50',
          currency_code: 'EUR',
        }),
        days: JSON.stringify([
          { day: '2027-03-15', price: '50.0000', price_extra: 0, extra_from: 0 },
          { day: '2027-03-16', price: '50.0000', price_extra: 0, extra_from: 0 },
          { day: '2027-03-17', price: '50.0000', price_extra: 0, extra_from: 0 },
        ]),
      },
    ];

    const result = normalizeMyRentPricePeriodPayload(raw, {
      objectId: 16575,
      dateFrom: '2027-03-15',
      dateUntil: '2027-03-17',
      adults: 2,
      children: 0,
    });

    expect(result.accommodationTotal).toBe(100);
    expect(result.currencyCode).toBe('EUR');
    expect(result.nights).toHaveLength(2);
    expect(result.nights.reduce((s, n) => s + n.price, 0)).toBe(100);
  });
});
