/**
 * Production gate: MOCK nikad ne smije vratiti izmišljene cijene na Vercel Production.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./myrent.price-period', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('./myrent.price-period')>();
  return {
    ...actual,
    fetchMyRentPricePeriodDetails: vi.fn(),
  };
});

vi.mock('./myrent.config', async () => {
  const actual =
    await vi.importActual<typeof import('./myrent.config')>('./myrent.config');
  return {
    ...actual,
    isMyRentConfigured: vi.fn(() => true),
    getMyRentObjectId: vi.fn(() => 16575),
  };
});

import { MyRentApiError } from './myrent.client';
import { fetchMyRentPricePeriodDetails } from './myrent.price-period';
import { fetchMyRentStayPrice } from './myrent.pricing-service';

const fetchPeriodMock = vi.mocked(fetchMyRentPricePeriodDetails);

describe('MYRENT_PRICING_MOCK na Production', () => {
  const prev = {
    enabled: process.env.MYRENT_PRICING_ENABLED,
    mock: process.env.MYRENT_PRICING_MOCK,
    vercel: process.env.VERCEL_ENV,
  };

  beforeEach(() => {
    fetchPeriodMock.mockReset();
    process.env.MYRENT_PRICING_ENABLED = 'true';
    process.env.MYRENT_PRICING_MOCK = 'true';
    process.env.VERCEL_ENV = 'production';
  });

  afterEach(() => {
    if (prev.enabled === undefined) delete process.env.MYRENT_PRICING_ENABLED;
    else process.env.MYRENT_PRICING_ENABLED = prev.enabled;
    if (prev.mock === undefined) delete process.env.MYRENT_PRICING_MOCK;
    else process.env.MYRENT_PRICING_MOCK = prev.mock;
    if (prev.vercel === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prev.vercel;
    vi.clearAllMocks();
  });

  it('ne koristi mock — ide na live price_period_details', async () => {
    fetchPeriodMock.mockResolvedValue({
      objectId: 16575,
      objectFree: true,
      accommodationTotal: 150,
      currencyCode: 'EUR',
      advancePercent: 50,
      adults: 2,
      children: 0,
      totalGuests: 2,
      nights: [
        { day: '2027-06-01', price: 70 },
        { day: '2027-06-02', price: 80 },
      ],
    });

    const result = await fetchMyRentStayPrice({
      roomSlug: 'ginko-1',
      checkIn: '2027-06-01',
      checkOut: '2027-06-03',
    });

    expect(result.source).toBe('myrent_period');
    expect(result.breakdown.totalPrice).toBe(150);
    expect(fetchPeriodMock).toHaveBeenCalled();
  });

  it('live fail → fail-closed (ne pada natrag na mock)', async () => {
    fetchPeriodMock.mockRejectedValue(
      new MyRentApiError(403, 'Cloudflare blocked'),
    );

    await expect(
      fetchMyRentStayPrice({
        roomSlug: 'ginko-1',
        checkIn: '2027-06-01',
        checkOut: '2027-06-03',
      }),
    ).rejects.toMatchObject({ name: 'MyRentPricingUnavailableError' });

    expect(fetchPeriodMock).toHaveBeenCalled();
  });
});
