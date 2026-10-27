import { describe, expect, it } from 'vitest';
import {
  addIsoDays,
  occupiedDatesToBookedRanges,
  myRentDaysToBookedRanges,
} from './myrent.ranges';
import { isDateBooked, isRangeAvailable, parseLocalDate } from '@/modules/booking/dates';
import {
  getMyRentObjectId,
  getRoomSlugsForObjectId,
  MYRENT_OBJECT_IDS,
} from './myrent.config';
import type { MyRentCalendarDay } from './myrent.types';

describe('occupiedDatesToBookedRanges', () => {
  it('pretvara uzastopne zauzete noći u poluotvoreni BookedRange', () => {
    const ranges = occupiedDatesToBookedRanges([
      '2026-10-27',
      '2026-10-28',
    ]);
    expect(ranges).toEqual([
      { check_in: '2026-10-27', check_out: '2026-10-29' },
    ]);
  });

  it('dan odlaska ostaje slobodan za novi dolazak', () => {
    const ranges = occupiedDatesToBookedRanges([
      '2026-10-27',
      '2026-10-28',
    ]);
    // Noći 27. i 28. zauzete; 29. = checkout prethodnog gosta → slobodan check-in
    expect(isDateBooked(parseLocalDate('2026-10-27'), ranges)).toBe(true);
    expect(isDateBooked(parseLocalDate('2026-10-28'), ranges)).toBe(true);
    expect(isDateBooked(parseLocalDate('2026-10-29'), ranges)).toBe(false);
    expect(
      isRangeAvailable(
        parseLocalDate('2026-10-29'),
        parseLocalDate('2026-10-31'),
        ranges,
      ),
    ).toBe(true);
  });

  it('dijeli nepovezane blokove u više rangeova', () => {
    const ranges = occupiedDatesToBookedRanges([
      '2026-10-27',
      '2026-10-28',
      '2026-10-30',
      '2026-10-31',
      '2026-11-14',
    ]);
    expect(ranges).toEqual([
      { check_in: '2026-10-27', check_out: '2026-10-29' },
      { check_in: '2026-10-30', check_out: '2026-11-01' },
      { check_in: '2026-11-14', check_out: '2026-11-15' },
    ]);
  });

  it('vraća prazan niz za prazan ulaz', () => {
    expect(occupiedDatesToBookedRanges([])).toEqual([]);
  });

  it('addIsoDays radi preko mjeseca', () => {
    expect(addIsoDays('2026-10-31', 1)).toBe('2026-11-01');
  });
});

describe('myRentDaysToBookedRanges', () => {
  it('koristi is_booked/free flagove iz MyRent dana', () => {
    const days: MyRentCalendarDay[] = [
      {
        day: '2026-11-03',
        is_booked: 'Y',
        free: 'N',
        enable: 'Y',
        stock_available: 0,
      },
      {
        day: '2026-11-04',
        is_booked: 'Y',
        free: 'N',
        enable: 'Y',
        stock_available: 0,
      },
      {
        day: '2026-11-05',
        is_booked: 'N',
        free: 'Y',
        enable: 'Y',
        stock_available: 1,
      },
    ];
    expect(myRentDaysToBookedRanges(days)).toEqual([
      { check_in: '2026-11-03', check_out: '2026-11-05' },
    ]);
    expect(isDateBooked(parseLocalDate('2026-11-05'), myRentDaysToBookedRanges(days))).toBe(
      false,
    );
  });
});

describe('SPA 2 shared object_id 7460', () => {
  it('oba slugа mapiraju na isti object_id', () => {
    expect(getMyRentObjectId('ginko-spa-1')).toBe(7460);
    expect(getMyRentObjectId('ginko-spa-2')).toBe(7460);
    expect(MYRENT_OBJECT_IDS['ginko-spa-1']).toBe(MYRENT_OBJECT_IDS['ginko-spa-2']);
  });

  it('getRoomSlugsForObjectId vraća obje SPA ponude', () => {
    const slugs = getRoomSlugsForObjectId(7460).sort();
    expect(slugs).toEqual(['ginko-spa-1', 'ginko-spa-2']);
  });

  it('isti MyRent zauzeti dani → identični BookedRange za obje ponude', () => {
    const occupied = [
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
    ];
    const wellnessRanges = occupiedDatesToBookedRanges(occupied);
    const apartmentRanges = occupiedDatesToBookedRanges(occupied);
    expect(wellnessRanges).toEqual(apartmentRanges);
    expect(wellnessRanges).toEqual([
      { check_in: '2026-10-27', check_out: '2026-10-30' },
      { check_in: '2026-11-03', check_out: '2026-11-06' },
    ]);
  });
});
