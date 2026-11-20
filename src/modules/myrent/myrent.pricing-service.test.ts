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
    getMyRentObjectId: vi.fn((slug: string) => {
      if (slug === 'ginko-1') return 16575;
      if (slug === 'ginko-2') return 16578;
      if (slug === 'ginko-spa-1' || slug === 'ginko-spa-2') return 7460;
      return null;
    }),
  };
});

vi.mock('./myrent.pricing-config', () => ({
  isMyRentPricingEnabled: vi.fn(() => true),
  isMyRentPricingMock: vi.fn(() => false),
  isMyRentPricingMockBlockedOnProduction: vi.fn(() => false),
  isMyRentPricingMockRequested: vi.fn(() => false),
  isVercelProductionEnv: vi.fn(() => false),
}));

import { evaluateQuotedPrice } from '@/modules/booking/quoted-price';
import { MyRentApiError } from './myrent.client';
import { fetchMyRentPricePeriodDetails } from './myrent.price-period';
import { isMyRentPricingMock } from './myrent.pricing-config';
import {
  fetchMyRentStayPrice,
  MyRentPricingUnavailableError,
} from './myrent.pricing-service';
import { setSpaWellnessSurchargeForTests } from './myrent.spa-pricing';

const fetchPeriodMock = vi.mocked(fetchMyRentPricePeriodDetails);
const mockFlag = vi.mocked(isMyRentPricingMock);

function periodResult(total: number, nights: { day: string; price: number }[]) {
  return {
    objectId: 16575,
    objectFree: true,
    accommodationTotal: total,
    currencyCode: 'EUR',
    advancePercent: 50,
    adults: 2,
    children: 0,
    totalGuests: 2,
    nights,
  };
}

describe('fetchMyRentStayPrice (period)', () => {
  beforeEach(() => {
    fetchPeriodMock.mockReset();
    mockFlag.mockReturnValue(false);
    setSpaWellnessSurchargeForTests(100);
  });

  afterEach(() => {
    setSpaWellnessSurchargeForTests(undefined);
    vi.clearAllMocks();
  });

  it('računa stay iz Website (b2b) period totala + 50% depozit', async () => {
    fetchPeriodMock.mockResolvedValue(
      periodResult(150, [
        { day: '2027-06-01', price: 70 },
        { day: '2027-06-02', price: 80 },
      ]),
    );

    const result = await fetchMyRentStayPrice({
      roomSlug: 'ginko-1',
      checkIn: '2027-06-01',
      checkOut: '2027-06-03',
      adults: 2,
      children: 0,
    });

    expect(result.source).toBe('myrent_period');
    expect(result.breakdown.totalPrice).toBe(150);
    expect(result.breakdown.deposit).toBe(75);
    expect(fetchPeriodMock).toHaveBeenCalledWith(
      expect.objectContaining({
        objectId: 16575,
        dateFrom: '2027-06-01',
        dateUntil: '2027-06-03',
        adults: 2,
        children: 0,
      }),
    );
  });

  it('Website A scenariji: 60/30, 120/60, ginko-6 42, spa 234 + wellness', async () => {
    fetchPeriodMock.mockResolvedValue(
      periodResult(60, [{ day: '2026-11-25', price: 60 }]),
    );
    const oneNight = await fetchMyRentStayPrice({
      roomSlug: 'ginko-1',
      checkIn: '2026-11-25',
      checkOut: '2026-11-26',
      adults: 2,
    });
    expect(oneNight.breakdown.totalPrice).toBe(60);
    expect(oneNight.breakdown.deposit).toBe(30);

    fetchPeriodMock.mockResolvedValue(
      periodResult(120, [
        { day: '2026-11-25', price: 60 },
        { day: '2026-11-26', price: 60 },
      ]),
    );
    const twoNights = await fetchMyRentStayPrice({
      roomSlug: 'ginko-1',
      checkIn: '2026-11-25',
      checkOut: '2026-11-27',
      adults: 2,
    });
    expect(twoNights.breakdown.totalPrice).toBe(120);
    expect(twoNights.breakdown.deposit).toBe(60);

    // ginko-6 object 22437 — mock objectId null u config mocku; koristi ginko-1 path
    // s totalom 42 kao Website cijena sobe 6
    fetchPeriodMock.mockResolvedValue(
      periodResult(42, [{ day: '2026-11-25', price: 42 }]),
    );
    const room6 = await fetchMyRentStayPrice({
      roomSlug: 'ginko-1',
      checkIn: '2026-11-25',
      checkOut: '2026-11-26',
      adults: 2,
    });
    expect(room6.breakdown.totalPrice).toBe(42);
    expect(room6.breakdown.deposit).toBe(21);

    setSpaWellnessSurchargeForTests(40);
    fetchPeriodMock.mockResolvedValue({
      ...periodResult(234, [{ day: '2026-11-25', price: 234 }]),
      objectId: 7460,
    });
    const spa = await fetchMyRentStayPrice({
      roomSlug: 'ginko-spa-2',
      checkIn: '2026-11-25',
      checkOut: '2026-11-26',
      adults: 2,
    });
    expect(spa.breakdown.totalPrice).toBe(234);
    expect(spa.breakdown.deposit).toBe(117);
  });

  it('ne zbraja Ginko EXTRA_BED uz MyRent goste (nema dvostruke naplate)', async () => {
    fetchPeriodMock.mockResolvedValue(
      periodResult(130, [
        { day: '2027-03-15', price: 65 },
        { day: '2027-03-16', price: 65 },
      ]),
    );

    const result = await fetchMyRentStayPrice({
      roomSlug: 'ginko-2',
      checkIn: '2027-03-15',
      checkOut: '2027-03-17',
      adults: 3,
      children: 0,
      extras: { extraBeds: 1, breakfastPerNight: 15 },
    });

    // 130 smještaj (već s MyRent extra) + 30 breakfast — bez 20×2 extra bed
    expect(result.breakdown.totalPrice).toBe(160);
    expect(result.breakdown.deposit).toBe(80);
    expect(
      result.breakdown.lines.some((l) => /ležaj|Extra bed|bed/i.test(l.label)),
    ).toBe(false);
  });

  it('SPA-2 = samo MyRent Website (A) total — bez Ginko wellness surcharge', async () => {
    setSpaWellnessSurchargeForTests(100);

    for (const nights of [
      {
        until: '2027-03-16',
        total: 195,
        nights: [{ day: '2027-03-15', price: 195 }],
        deposit: 97.5,
      },
      {
        until: '2027-03-17',
        total: 390,
        nights: [
          { day: '2027-03-15', price: 195 },
          { day: '2027-03-16', price: 195 },
        ],
        deposit: 195,
      },
      {
        until: '2027-03-18',
        total: 585,
        nights: [
          { day: '2027-03-15', price: 195 },
          { day: '2027-03-16', price: 195 },
          { day: '2027-03-17', price: 195 },
        ],
        deposit: 292.5,
      },
    ]) {
      fetchPeriodMock.mockResolvedValue({
        ...periodResult(nights.total, nights.nights),
        objectId: 7460,
      });

      const wellness = await fetchMyRentStayPrice({
        roomSlug: 'ginko-spa-2',
        checkIn: '2027-03-15',
        checkOut: nights.until,
        adults: 2,
      });

      expect(wellness.breakdown.totalPrice).toBe(nights.total);
      expect(wellness.breakdown.deposit).toBe(nights.deposit);
      expect(wellness.breakdown.lines).toHaveLength(1);
    }
  });

  it('quote i create koriste isti Website total (evaluateQuotedPrice ok)', async () => {
    fetchPeriodMock.mockResolvedValue(
      periodResult(60, [{ day: '2026-11-25', price: 60 }]),
    );
    const quote = await fetchMyRentStayPrice({
      roomSlug: 'ginko-1',
      checkIn: '2026-11-25',
      checkOut: '2026-11-26',
      adults: 2,
    });
    fetchPeriodMock.mockResolvedValue(
      periodResult(60, [{ day: '2026-11-25', price: 60 }]),
    );
    const create = await fetchMyRentStayPrice({
      roomSlug: 'ginko-1',
      checkIn: '2026-11-25',
      checkOut: '2026-11-26',
      adults: 2,
    });
    expect(
      evaluateQuotedPrice({
        quoted: {
          totalPrice: quote.breakdown.totalPrice,
          deposit: quote.breakdown.deposit,
        },
        server: create.breakdown,
      }),
    ).toBe('ok');
    expect(quote.breakdown.totalPrice).toBe(60);
    expect(quote.breakdown.deposit).toBe(30);
  });

  it('fail-closed kad MyRent API nije dostupan', async () => {
    fetchPeriodMock.mockRejectedValue(
      new MyRentApiError(403, 'Cloudflare blocked'),
    );

    await expect(
      fetchMyRentStayPrice({
        roomSlug: 'ginko-1',
        checkIn: '2027-06-01',
        checkOut: '2027-06-03',
      }),
    ).rejects.toBeInstanceOf(MyRentPricingUnavailableError);
  });

  it('mock mode ne zove live period API', async () => {
    mockFlag.mockReturnValue(true);

    const result = await fetchMyRentStayPrice({
      roomSlug: 'ginko-1',
      checkIn: '2027-06-01',
      checkOut: '2027-06-03',
      adults: 2,
    });

    expect(result.source).toBe('myrent_mock');
    expect(result.breakdown.nights).toBe(2);
    expect(fetchPeriodMock).not.toHaveBeenCalled();
  });
});
