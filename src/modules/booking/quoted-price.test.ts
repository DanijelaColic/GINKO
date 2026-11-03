import { describe, expect, it } from 'vitest';
import { evaluateQuotedPrice, pricesMatch } from './quoted-price';

describe('pricesMatch', () => {
  it('podudara jednake iznose', () => {
    expect(pricesMatch(120, 120)).toBe(true);
    expect(pricesMatch(120.001, 120)).toBe(true);
  });

  it('razlikuje različite iznose', () => {
    expect(pricesMatch(120, 135)).toBe(false);
  });
});

describe('evaluateQuotedPrice', () => {
  const server = { totalPrice: 200, deposit: 100 };

  it('ok kad quote odgovara serveru', () => {
    expect(
      evaluateQuotedPrice({
        quoted: { totalPrice: 200, deposit: 100 },
        server,
      }),
    ).toBe('ok');
  });

  it('price_changed kad se total razlikuje', () => {
    expect(
      evaluateQuotedPrice({
        quoted: { totalPrice: 180, deposit: 100 },
        server,
      }),
    ).toBe('price_changed');
  });

  it('nema bypassa — zastarjeli quote ostaje price_changed', () => {
    expect(
      evaluateQuotedPrice({
        quoted: { totalPrice: 180, deposit: 90 },
        server,
      }),
    ).toBe('price_changed');
  });

  it('missing_quote bez klijentskog quotea', () => {
    expect(
      evaluateQuotedPrice({
        quoted: { totalPrice: null, deposit: null },
        server,
      }),
    ).toBe('missing_quote');
  });

  it('nakon UI potvrde: novi quote koji se podudara → ok', () => {
    expect(
      evaluateQuotedPrice({
        quoted: { totalPrice: 200, deposit: 100 },
        server,
      }),
    ).toBe('ok');
  });
});
