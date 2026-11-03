import { afterEach, describe, expect, it } from 'vitest';
import {
  MYRENT_SPA_WELLNESS_SLUG,
  SpaWellnessSurchargeNotConfiguredError,
  setSpaWellnessSurchargeForTests,
  spaWellnessSurchargePerNightForSlug,
} from './myrent.spa-pricing';

describe('spa wellness surcharge (admin setting)', () => {
  afterEach(() => {
    setSpaWellnessSurchargeForTests(undefined);
  });

  it('vraća 0 za ne-wellness slugove', async () => {
    setSpaWellnessSurchargeForTests(100);
    expect(await spaWellnessSurchargePerNightForSlug('ginko-spa-1')).toBe(0);
    expect(await spaWellnessSurchargePerNightForSlug('ginko-1')).toBe(0);
  });

  it('vraća admin iznos za ginko-spa-2', async () => {
    setSpaWellnessSurchargeForTests(80);
    expect(
      await spaWellnessSurchargePerNightForSlug(MYRENT_SPA_WELLNESS_SLUG),
    ).toBe(80);
  });

  it('0 € je valjana postavka', async () => {
    setSpaWellnessSurchargeForTests(0);
    expect(
      await spaWellnessSurchargePerNightForSlug(MYRENT_SPA_WELLNESS_SLUG),
    ).toBe(0);
  });

  it('baca ako nadoplata nije unesena', async () => {
    setSpaWellnessSurchargeForTests(null);
    await expect(
      spaWellnessSurchargePerNightForSlug(MYRENT_SPA_WELLNESS_SLUG),
    ).rejects.toBeInstanceOf(SpaWellnessSurchargeNotConfiguredError);
  });
});
