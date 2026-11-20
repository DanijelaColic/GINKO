import { describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/rooms/room.repository', () => ({
  getRoomBySlug: (slug: string) =>
    slug === 'ginko-spa-1' ? { price: 90 } : undefined,
}));

import {
  getJsonLdOfferPrice,
  getRoomPriceDisplay,
} from './room-display-price';

const myRentRoom = { slug: 'ginko-1', price: 120 };
const spa1 = { slug: 'ginko-spa-1', price: 234 };
const spa2 = { slug: 'ginko-spa-2', price: 234 };

describe('getRoomPriceDisplay', () => {
  it('flag off → legacy room.price', () => {
    expect(getRoomPriceDisplay(myRentRoom, false)).toEqual({
      mode: 'fixed',
      perNight: 120,
    });
  });

  it('flag on → MyRent slug → select_dates', () => {
    expect(getRoomPriceDisplay(myRentRoom, true)).toEqual({ mode: 'select_dates' });
    expect(getRoomPriceDisplay(spa2, true)).toEqual({ mode: 'select_dates' });
  });

  it('flag on → ginko-spa-1 → 90 € iz configa', () => {
    expect(getRoomPriceDisplay(spa1, true)).toEqual({
      mode: 'fixed',
      perNight: 90,
    });
  });
});

describe('getJsonLdOfferPrice', () => {
  it('nema price kad je select_dates', () => {
    expect(getJsonLdOfferPrice(myRentRoom, true)).toBeUndefined();
  });

  it('ima price kad je fiksno', () => {
    expect(getJsonLdOfferPrice(spa1, true)).toBe(90);
    expect(getJsonLdOfferPrice(myRentRoom, false)).toBe(120);
  });
});