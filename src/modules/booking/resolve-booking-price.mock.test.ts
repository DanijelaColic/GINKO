import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Room } from '@/modules/rooms/room.types';
import { parseLocalDate } from './dates';

const room = {
  slug: 'ginko-1',
  price: 60,
  name: 'Ginko 1',
  capacity: 2,
} as Room;

describe('resolveBookingPrice mock mode (env)', () => {
  const prevEnabled = process.env.MYRENT_PRICING_ENABLED;
  const prevMock = process.env.MYRENT_PRICING_MOCK;

  afterEach(() => {
    if (prevEnabled === undefined) delete process.env.MYRENT_PRICING_ENABLED;
    else process.env.MYRENT_PRICING_ENABLED = prevEnabled;
    if (prevMock === undefined) delete process.env.MYRENT_PRICING_MOCK;
    else process.env.MYRENT_PRICING_MOCK = prevMock;
    vi.resetModules();
  });

  it('ENABLED+MOCK → source myrent_mock, flat baza + doručak, depozit 50%', async () => {
    process.env.MYRENT_PRICING_ENABLED = 'true';
    process.env.MYRENT_PRICING_MOCK = 'true';
    delete process.env.VERCEL_ENV;
    vi.resetModules();

    const { resolveBookingPrice } = await import('./resolve-booking-price');
    const resolved = await resolveBookingPrice({
      room,
      checkIn: parseLocalDate('2027-02-19'),
      checkOut: parseLocalDate('2027-02-22'),
      adults: 2,
      children: 0,
      extras: { breakfastPerNight: 15 },
    });

    expect(resolved.source).toBe('myrent_mock');
    // 50×3 noći + 15×3 doručak = 195
    expect(resolved.breakdown.totalPrice).toBe(195);
    expect(resolved.breakdown.deposit).toBe(97.5);
    expect(resolved.ratesVary).toBe(false);
    expect(resolved.nightlyRates).toHaveLength(3);
  });

  it('flag off → legacy flat room.price', async () => {
    process.env.MYRENT_PRICING_ENABLED = 'false';
    delete process.env.MYRENT_PRICING_MOCK;
    vi.resetModules();

    const { resolveBookingPrice } = await import('./resolve-booking-price');
    const resolved = await resolveBookingPrice({
      room,
      checkIn: parseLocalDate('2027-02-19'),
      checkOut: parseLocalDate('2027-02-22'),
    });

    expect(resolved.source).toBe('legacy_room_price');
    expect(resolved.breakdown.totalPrice).toBe(180); // 60×3
    expect(resolved.ratesVary).toBe(false);
  });
});
