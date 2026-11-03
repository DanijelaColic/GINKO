import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Room } from '@/modules/rooms/room.types';
import { parseLocalDate } from './dates';

vi.mock('@/modules/myrent/myrent.pricing-config', () => ({
  isMyRentPricingEnabled: vi.fn(() => false),
}));

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
});
