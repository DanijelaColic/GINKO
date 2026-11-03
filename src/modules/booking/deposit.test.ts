import { describe, expect, it } from 'vitest';
import {
  calculateDeposit,
  DEPOSIT_PERCENT,
} from './booking.config';
import { calculatePrice } from './dates';
import { buildPriceBreakdownFromMyRentNights } from '@/modules/myrent/myrent.pricing';
import { eurToCents, centsToEur } from '@/modules/payments/payment.types';
import type { Room } from '@/modules/rooms/room.types';

const stubRoom = {
  slug: 'test-room',
  accommodationType: 'soba' as const,
  name: 'Test',
  tagline: '',
  description: '',
  capacity: 2,
  capacityNote: '',
  size: 20,
  beds: '1',
  view: false,
  balcony: false,
  floors: 1,
  price: 60,
  fullyBooked: false,
  amenities: [] as string[],
  images: [] as string[],
  extraBedAvailable: false,
} satisfies Room;

describe('calculateDeposit (50% na 2 decimale)', () => {
  it('585 → 292.50 (ne 293)', () => {
    expect(calculateDeposit(585)).toBe(292.5);
    expect(calculateDeposit(585, DEPOSIT_PERCENT)).toBe(292.5);
  });

  it('parni total ostaje cijeli euro', () => {
    expect(calculateDeposit(100)).toBe(50);
    expect(calculateDeposit(390)).toBe(195);
    expect(calculateDeposit(470)).toBe(235);
  });

  it('decimalni total (npr. 99.99 → 50.00)', () => {
    expect(calculateDeposit(99.99)).toBe(50);
    expect(calculateDeposit(100.01)).toBe(50.01);
    expect(calculateDeposit(123.45)).toBe(61.73); // 12345/2 = 6172.5 → 6173 centi
  });

  it('eurToCents(deposit) usklađen sa centima iz totala', () => {
    const total = 585;
    const deposit = calculateDeposit(total);
    expect(eurToCents(deposit)).toBe(29250);
    expect(centsToEur(eurToCents(deposit))).toBe(292.5);

    const odd = calculateDeposit(123.45);
    expect(eurToCents(odd)).toBe(6173);
  });

  it('ne-finite / negativno → 0', () => {
    expect(calculateDeposit(Number.NaN)).toBe(0);
    expect(calculateDeposit(-10)).toBe(0);
  });
});

describe('legacy calculatePrice deposit', () => {
  it('koristi 2-decimalni depozit', () => {
    // 3 noći × 65 = 195 → deposit 97.5
    const room = { ...stubRoom, price: 65 };
    const checkIn = new Date(2027, 2, 1); // local
    const checkOut = new Date(2027, 2, 4);
    const breakdown = calculatePrice(checkIn, checkOut, room);
    expect(breakdown.totalPrice).toBe(195);
    expect(breakdown.deposit).toBe(97.5);
    expect(eurToCents(breakdown.deposit)).toBe(9750);
  });
});

describe('MyRent buildPriceBreakdownFromMyRentNights deposit', () => {
  it('585 smještaj → deposit 292.50', () => {
    const breakdown = buildPriceBreakdownFromMyRentNights({
      nights: [
        { day: '2026-12-05', price: 195 },
        { day: '2026-12-06', price: 195 },
        { day: '2026-12-07', price: 195 },
      ],
      accommodationSubtotal: 585,
      averagePricePerNight: 195,
    });
    expect(breakdown.totalPrice).toBe(585);
    expect(breakdown.deposit).toBe(292.5);
    expect(eurToCents(breakdown.deposit)).toBe(29250);
  });
});
