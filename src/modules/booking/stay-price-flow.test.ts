/**
 * End-to-end logika: quote → usporedba → priceChanged → novi quote → ok.
 * Bez HTTP/Saferpay/MyRent mreže (mock kalendar).
 * Nema accept_updated_price bypassa.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Room } from '@/modules/rooms/room.types';
import { parseLocalDate } from './dates';
import { evaluateQuotedPrice } from './quoted-price';

const room = {
  slug: 'ginko-1',
  price: 60,
  name: 'Ginko 1',
  capacity: 2,
} as Room;

describe('stay price display → confirm flow', () => {
  const prevEnabled = process.env.MYRENT_PRICING_ENABLED;
  const prevMock = process.env.MYRENT_PRICING_MOCK;
  const prevVercel = process.env.VERCEL_ENV;

  afterEach(() => {
    if (prevEnabled === undefined) delete process.env.MYRENT_PRICING_ENABLED;
    else process.env.MYRENT_PRICING_ENABLED = prevEnabled;
    if (prevMock === undefined) delete process.env.MYRENT_PRICING_MOCK;
    else process.env.MYRENT_PRICING_MOCK = prevMock;
    if (prevVercel === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevVercel;
    vi.resetModules();
  });

  it('isti quote na prikazu i create → ok', async () => {
    process.env.MYRENT_PRICING_ENABLED = 'true';
    process.env.MYRENT_PRICING_MOCK = 'true';
    delete process.env.VERCEL_ENV;
    vi.resetModules();

    const { resolveBookingPrice } = await import('./resolve-booking-price');

    const displayed = await resolveBookingPrice({
      room,
      checkIn: parseLocalDate('2027-03-01'),
      checkOut: parseLocalDate('2027-03-03'),
    });

    const atCreate = await resolveBookingPrice({
      room,
      checkIn: parseLocalDate('2027-03-01'),
      checkOut: parseLocalDate('2027-03-03'),
    });

    expect(displayed.breakdown.totalPrice).toBe(atCreate.breakdown.totalPrice);
    expect(
      evaluateQuotedPrice({
        quoted: {
          totalPrice: displayed.breakdown.totalPrice,
          deposit: displayed.breakdown.deposit,
        },
        server: atCreate.breakdown,
      }),
    ).toBe('ok');
  });

  it('promjena → price_changed; tek novi podudarajući quote → ok', async () => {
    process.env.MYRENT_PRICING_ENABLED = 'true';
    process.env.MYRENT_PRICING_MOCK = 'true';
    delete process.env.VERCEL_ENV;
    vi.resetModules();

    const { resolveBookingPrice } = await import('./resolve-booking-price');

    const atCreate = await resolveBookingPrice({
      room,
      checkIn: parseLocalDate('2027-03-01'),
      checkOut: parseLocalDate('2027-03-03'),
    });

    const staleQuoted = {
      totalPrice: atCreate.breakdown.totalPrice - 20,
      deposit: atCreate.breakdown.deposit - 10,
    };

    expect(
      evaluateQuotedPrice({
        quoted: staleQuoted,
        server: atCreate.breakdown,
      }),
    ).toBe('price_changed');

    // UI prikaže novi iznos; gost potvrdi; šalje NOVI quote (ne bypass flag)
    expect(
      evaluateQuotedPrice({
        quoted: {
          totalPrice: atCreate.breakdown.totalPrice,
          deposit: atCreate.breakdown.deposit,
        },
        server: atCreate.breakdown,
      }),
    ).toBe('ok');
  });

  it('ponovna promjena nakon potvrde opet zahtijeva novi quote', async () => {
    const firstServer = { totalPrice: 200, deposit: 100 };
    const secondServer = { totalPrice: 220, deposit: 110 };

    // Gost je potvrdio 200/100
    expect(
      evaluateQuotedPrice({
        quoted: { totalPrice: 200, deposit: 100 },
        server: firstServer,
      }),
    ).toBe('ok');

    // Cijena se opet promijenila prije create
    expect(
      evaluateQuotedPrice({
        quoted: { totalPrice: 200, deposit: 100 },
        server: secondServer,
      }),
    ).toBe('price_changed');

    // Mora poslati 220/110
    expect(
      evaluateQuotedPrice({
        quoted: { totalPrice: 220, deposit: 110 },
        server: secondServer,
      }),
    ).toBe('ok');
  });

  it('dodaci (crib) ulaze jednom u total', async () => {
    process.env.MYRENT_PRICING_ENABLED = 'true';
    process.env.MYRENT_PRICING_MOCK = 'true';
    delete process.env.VERCEL_ENV;
    vi.resetModules();

    const { resolveBookingPrice } = await import('./resolve-booking-price');

    const base = await resolveBookingPrice({
      room,
      checkIn: parseLocalDate('2027-03-01'),
      checkOut: parseLocalDate('2027-03-03'),
    });
    const withCrib = await resolveBookingPrice({
      room,
      checkIn: parseLocalDate('2027-03-01'),
      checkOut: parseLocalDate('2027-03-03'),
      extras: { crib: true },
    });

    expect(withCrib.breakdown.totalPrice - base.breakdown.totalPrice).toBe(40);
    expect(
      withCrib.breakdown.lines.filter((l) => l.label === 'Dječji krevetić'),
    ).toHaveLength(1);
  });

  it('flag OFF → legacy room.price (nepromijenjeno)', async () => {
    process.env.MYRENT_PRICING_ENABLED = 'false';
    delete process.env.MYRENT_PRICING_MOCK;
    delete process.env.VERCEL_ENV;
    vi.resetModules();

    const { resolveBookingPrice } = await import('./resolve-booking-price');
    const resolved = await resolveBookingPrice({
      room,
      checkIn: parseLocalDate('2027-03-01'),
      checkOut: parseLocalDate('2027-03-03'),
    });

    expect(resolved.source).toBe('legacy_room_price');
    expect(resolved.breakdown.totalPrice).toBe(120);
    expect(resolved.breakdown.deposit).toBe(60);
  });
});
