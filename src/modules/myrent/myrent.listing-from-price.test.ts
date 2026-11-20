import { describe, expect, it } from 'vitest';
import type { MyRentCalendarDay } from './myrent.types';
import {
  requiredStayNightsFromDay,
  stayNightsFreeInCalendar,
} from './myrent.listing-from-price';

describe('listing from price helpers', () => {
  const day = (d: string, min_stay?: number): MyRentCalendarDay => ({
    day: d,
    free: 'Y',
    is_booked: 'N',
    enable: 'Y',
    min_stay,
  });

  it('requiredStayNights poštuje MyRent min_stay i Ginko MIN_NIGHTS', () => {
    expect(requiredStayNightsFromDay(undefined)).toBe(1);
    expect(requiredStayNightsFromDay(day('2026-08-01', 3))).toBe(3);
    expect(requiredStayNightsFromDay(day('2026-08-01', 1))).toBe(1);
  });

  it('stayNightsFreeInCalendar odbija zauzetu noć', () => {
    const byDay = new Map<string, MyRentCalendarDay>([
      ['2026-08-01', day('2026-08-01')],
      ['2026-08-02', { ...day('2026-08-02'), is_booked: 'Y' }],
    ]);
    expect(stayNightsFreeInCalendar(byDay, '2026-08-01', 1)).toBe(true);
    expect(stayNightsFreeInCalendar(byDay, '2026-08-01', 2)).toBe(false);
  });
});