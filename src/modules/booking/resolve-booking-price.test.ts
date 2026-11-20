import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Room } from '@/modules/rooms/room.types';
import { parseLocalDate } from './dates';

vi.mock('@/modules/myrent/myrent.pricing-config', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/modules/myrent/myrent.pricing-config')>();
  return {
    ...actual,
    isMyRentPricingEnabled: vi.fn(() => false),
  };
});

vi.mock('@/modules/myrent/myrent.pricing-service', () => ({
  fetchMyRentStayPrice: vi.fn(),
  MyRentPricingUnavailableError: class extends Error {
    constructor(message?: string) {
      super(message);
      this.name = 'MyRentPricingUnavailableError';
    }
  },
}));

import { isMyRentPricingEnabled } from '@/modules/myrent/myrent.pricing-config';
import { fetchMyRentStayPrice } from '@/modules/myrent/myrent.pricing-service';
import { resolveBookingPrice } from './resolve-booking-price';

const room = {
  slug: 'ginko-1',
  price: 60,
  name: 'Ginko 1',
  capacity: 2,
} as Room;

const isEnabled = vi.mocked(isMyRentPricingEnabled);
const fetchStay = vi.mocked(fetchMyRentStayPrice);

describe('resolveBookingPrice', () => {
  beforeEach(() => {
    isEnabled.mockReturnValue(false);
    fetchStay.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('s isključenim flagom koristi legacy room.price (ne zove MyRent)', async () => {
    const resolved = await resolveBookingPrice({
      room,
      checkIn: parseLocalDate('2027-08-01'),
      checkOut: parseLocalDate('2027-08-03'),
    });

    expect(resolved.source).toBe('legacy_room_price');
    expect(resolved.breakdown.totalPrice).toBe(120);
    expect(resolved.breakdown.deposit).toBe(60);
    expect(fetchStay).not.toHaveBeenCalled();
  });

  it('s uključenim flagom koristi MyRent stay price (period)', async () => {
    isEnabled.mockReturnValue(true);
    fetchStay.mockResolvedValue({
      source: 'myrent_period',
      objectId: 16575,
      quote: {
        nights: [
          { day: '2027-08-01', price: 70 },
          { day: '2027-08-02', price: 90 },
        ],
        accommodationSubtotal: 160,
        averagePricePerNight: 80,
      },
      breakdown: {
        nights: 2,
        totalPrice: 160,
        deposit: 80,
        lines: [
          {
            label: 'Smještaj',
            nights: 2,
            pricePerNight: 80,
            subtotal: 160,
          },
        ],
        discountAmount: 0,
        cleaningFee: 0,
      },
    });

    const resolved = await resolveBookingPrice({
      room,
      checkIn: parseLocalDate('2027-08-01'),
      checkOut: parseLocalDate('2027-08-03'),
      adults: 2,
      children: 0,
    });

    expect(resolved.source).toBe('myrent_period');
    expect(resolved.breakdown.totalPrice).toBe(160);
    expect(resolved.breakdown.deposit).toBe(80);
    expect(fetchStay).toHaveBeenCalledWith(
      expect.objectContaining({
        roomSlug: 'ginko-1',
        adults: 2,
        children: 0,
      }),
    );
  });

  it('flag uključen + ginko-spa-1 → legacy 90 €/noć (ne MyRent)', async () => {
    isEnabled.mockReturnValue(true);
    const spaRoom = {
      slug: 'ginko-spa-1',
      price: 90,
      name: 'Apartman',
      capacity: 4,
    } as Room;

    const one = await resolveBookingPrice({
      room: spaRoom,
      checkIn: parseLocalDate('2027-09-01'),
      checkOut: parseLocalDate('2027-09-02'),
    });
    expect(one.source).toBe('legacy_room_price');
    expect(one.breakdown.totalPrice).toBe(90);
    expect(one.breakdown.deposit).toBe(45);

    const two = await resolveBookingPrice({
      room: spaRoom,
      checkIn: parseLocalDate('2027-09-01'),
      checkOut: parseLocalDate('2027-09-03'),
    });
    expect(two.breakdown.totalPrice).toBe(180);
    expect(two.breakdown.deposit).toBe(90);

    const three = await resolveBookingPrice({
      room: spaRoom,
      checkIn: parseLocalDate('2027-09-01'),
      checkOut: parseLocalDate('2027-09-04'),
    });
    expect(three.breakdown.totalPrice).toBe(270);
    expect(three.breakdown.deposit).toBe(135);
    expect(fetchStay).not.toHaveBeenCalled();
  });
});
