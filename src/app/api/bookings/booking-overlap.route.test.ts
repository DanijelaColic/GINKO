import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: () => ({
    from: () => ({
      insert: () => ({
        select: () => ({
          single: async () => ({
            data: null,
            error: {
              code: '23P01',
              message:
                'conflicting key value violates exclusion constraint "bookings_no_active_overlap"',
            },
          }),
        }),
      }),
    }),
  }),
}));

vi.mock('@/modules/booking/availability.service', () => ({
  assertBookingStayAvailable: vi.fn(async () => undefined),
  getGuestBookedRanges: vi.fn(),
  AvailabilityUnavailableError: class AvailabilityUnavailableError extends Error {},
  DatesUnavailableError: class DatesUnavailableError extends Error {},
}));

vi.mock('@/modules/booking/resolve-booking-price', () => ({
  resolveBookingPrice: vi.fn(async () => ({
    breakdown: { totalPrice: 120, deposit: 30 },
    pricePerNight: 60,
    source: 'legacy',
    nightlyRates: [],
    ratesVary: false,
  })),
}));

vi.mock('@/modules/myrent/myrent.pricing-config', () => ({
  isMyRentPricingEnabled: () => false,
  usesMyRentStayPricing: () => false,
}));

vi.mock('@/lib/email', () => ({
  sendOwnerNewBookingNotification: vi.fn(async () => undefined),
}));

import { POST } from './route';

describe('guest booking overlap', () => {
  it('paralelni insert vraća datesUnavailable i ne nastavlja prema naplati', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          room_slug: 'ginko-1',
          check_in: '2027-07-01',
          check_out: '2027-07-03',
          guest_name: 'Gost',
          guest_email: 'gost@example.com',
          adults: 1,
          children: 0,
        }),
      }),
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'datesUnavailable' });
  });
});
