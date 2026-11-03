import { describe, expect, it } from 'vitest';
import {
  isMyRentPricingEnabled,
  isMyRentPricingMock,
  isMyRentPricingMockBlockedOnProduction,
  isMyRentPricingMockRequested,
  isVercelProductionEnv,
} from './myrent.pricing-config';

describe('isMyRentPricingEnabled', () => {
  it('zadano je isključeno', () => {
    expect(isMyRentPricingEnabled({})).toBe(false);
  });

  it('uključuje se samo eksplicitnim true', () => {
    expect(isMyRentPricingEnabled({ MYRENT_PRICING_ENABLED: 'true' })).toBe(
      true,
    );
    expect(isMyRentPricingEnabled({ MYRENT_PRICING_ENABLED: '1' })).toBe(true);
    expect(isMyRentPricingEnabled({ MYRENT_PRICING_ENABLED: 'false' })).toBe(
      false,
    );
  });
});

describe('isMyRentPricingMock / Production gate', () => {
  it('mock zahtijeva ENABLED + MOCK', () => {
    expect(
      isMyRentPricingMock({
        MYRENT_PRICING_MOCK: 'true',
      }),
    ).toBe(false);

    expect(
      isMyRentPricingMock({
        MYRENT_PRICING_ENABLED: 'true',
        MYRENT_PRICING_MOCK: 'true',
      }),
    ).toBe(true);
  });

  it('mock je zabranjen na VERCEL_ENV=production', () => {
    const prod = {
      MYRENT_PRICING_ENABLED: 'true',
      MYRENT_PRICING_MOCK: 'true',
      VERCEL_ENV: 'production',
    };
    expect(isVercelProductionEnv(prod)).toBe(true);
    expect(isMyRentPricingMockRequested(prod)).toBe(true);
    expect(isMyRentPricingMock(prod)).toBe(false);
    expect(isMyRentPricingMockBlockedOnProduction(prod)).toBe(true);
  });

  it('mock radi na preview / development', () => {
    expect(
      isMyRentPricingMock({
        MYRENT_PRICING_ENABLED: 'true',
        MYRENT_PRICING_MOCK: 'true',
        VERCEL_ENV: 'preview',
      }),
    ).toBe(true);

    expect(
      isMyRentPricingMock({
        MYRENT_PRICING_ENABLED: 'true',
        MYRENT_PRICING_MOCK: 'true',
        VERCEL_ENV: 'development',
      }),
    ).toBe(true);

    expect(
      isMyRentPricingMock({
        MYRENT_PRICING_ENABLED: 'true',
        MYRENT_PRICING_MOCK: 'true',
      }),
    ).toBe(true);
  });

  it('blocked flag false kad MOCK nije zatražen', () => {
    expect(
      isMyRentPricingMockBlockedOnProduction({
        MYRENT_PRICING_ENABLED: 'true',
        VERCEL_ENV: 'production',
      }),
    ).toBe(false);
  });
});
