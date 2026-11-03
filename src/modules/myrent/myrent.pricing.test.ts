import { describe, expect, it } from 'vitest';
import {
  buildPriceBreakdownFromMyRentNights,
  calculatePriceFromMyRentCalendarDays,
  MyRentPricingError,
  quoteAccommodationFromCalendarDays,
  stayNightDates,
} from './myrent.pricing';
import type { MyRentCalendarDay } from './myrent.types';

function day(date: string, price: number): MyRentCalendarDay {
  return { day: date, price, free: 'Y', enable: 'Y', is_booked: 'N' };
}

describe('stayNightDates', () => {
  it('vraća [checkIn, checkOut) noći', () => {
    expect(stayNightDates('2027-02-18', '2027-02-21')).toEqual([
      '2027-02-18',
      '2027-02-19',
      '2027-02-20',
    ]);
  });

  it('baca za prazan raspon', () => {
    expect(() => stayNightDates('2027-02-18', '2027-02-18')).toThrow(
      MyRentPricingError,
    );
  });
});

describe('quoteAccommodationFromCalendarDays', () => {
  it('zbraja sezonske cijene po noćima', () => {
    const quote = quoteAccommodationFromCalendarDays({
      checkIn: '2027-07-01',
      checkOut: '2027-07-04',
      days: [
        day('2027-07-01', 80),
        day('2027-07-02', 95),
        day('2027-07-03', 95),
        day('2027-07-04', 999), // check-out dan — ne ulazi
      ],
    });

    expect(quote.nights).toEqual([
      { day: '2027-07-01', price: 80 },
      { day: '2027-07-02', price: 95 },
      { day: '2027-07-03', price: 95 },
    ]);
    expect(quote.accommodationSubtotal).toBe(270);
    expect(quote.averagePricePerNight).toBe(90);
  });

  it('podržava različite vikend cijene', () => {
    // pet–ned: Fri 60, Sat 90, Sun 90 → check-out pon
    const quote = quoteAccommodationFromCalendarDays({
      checkIn: '2027-02-19', // petak
      checkOut: '2027-02-22', // ponedjeljak
      days: [
        day('2027-02-19', 60),
        day('2027-02-20', 90),
        day('2027-02-21', 90),
      ],
    });
    expect(quote.accommodationSubtotal).toBe(240);
  });

  it('reflektira promjenu cijene na jednoj noći', () => {
    const before = quoteAccommodationFromCalendarDays({
      checkIn: '2027-03-01',
      checkOut: '2027-03-03',
      days: [day('2027-03-01', 60), day('2027-03-02', 60)],
    });
    const after = quoteAccommodationFromCalendarDays({
      checkIn: '2027-03-01',
      checkOut: '2027-03-03',
      days: [day('2027-03-01', 60), day('2027-03-02', 75)],
    });
    expect(before.accommodationSubtotal).toBe(120);
    expect(after.accommodationSubtotal).toBe(135);
  });

  it('baca ako nedostaje dan u kalendaru', () => {
    expect(() =>
      quoteAccommodationFromCalendarDays({
        checkIn: '2027-03-01',
        checkOut: '2027-03-03',
        days: [day('2027-03-01', 60)],
      }),
    ).toThrow(/nema dan/i);
  });

  it('baca ako nedostaje price', () => {
    expect(() =>
      quoteAccommodationFromCalendarDays({
        checkIn: '2027-03-01',
        checkOut: '2027-03-02',
        days: [{ day: '2027-03-01', free: 'Y' }],
      }),
    ).toThrow(MyRentPricingError);
  });
});

describe('buildPriceBreakdownFromMyRentNights', () => {
  it('dodaje Ginko dodatke i 50% depozit', () => {
    const { breakdown } = calculatePriceFromMyRentCalendarDays({
      checkIn: '2027-04-01',
      checkOut: '2027-04-03',
      days: [day('2027-04-01', 100), day('2027-04-02', 100)],
      extras: {
        extraBeds: 1,
        crib: true,
        breakfastPerNight: 15,
      },
    });

    // smještaj 200 + extra bed 40 + crib 40 + breakfast 30 = 310
    expect(breakdown.totalPrice).toBe(310);
    expect(breakdown.deposit).toBe(155);
    expect(breakdown.nights).toBe(2);
    expect(breakdown.lines.map((l) => l.label)).toEqual([
      'Smještaj',
      'Pomoćni ležaj',
      'Dječji krevetić',
      'Doručak (buffet)',
    ]);
  });

  it('kod različitih noći subtotal je točan zbroj, ne prosjek×nights', () => {
    const breakdown = buildPriceBreakdownFromMyRentNights({
      nights: [
        { day: '2027-05-01', price: 50 },
        { day: '2027-05-02', price: 70 },
      ],
      accommodationSubtotal: 120,
      averagePricePerNight: 60,
    });
    const acc = breakdown.lines.find((l) => l.label === 'Smještaj');
    expect(acc?.subtotal).toBe(120);
    expect(acc?.pricePerNight).toBe(60);
    expect(breakdown.deposit).toBe(60);
  });
});
