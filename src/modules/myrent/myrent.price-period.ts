/**
 * POST /user/price_period_details — ukupna cijena smještaja za datume + goste.
 * Docs: https://myrent.readme.io/reference/calculate-price-copy
 *
 * SoT (Website A / WEB page): b2b_object_price_period (+ day.price_b2b).
 * Empirijski potvrđeno A/B testom (Website A % → b2b_*). Bez tihog fallbacka
 * na object_price_period_simple (base rate).
 *
 * Read-only. date_until = Ginko checkOut (checkout dan; noći = [from, until)).
 */

import { myrentRequest } from './myrent.client';
import { MyRentPricingError, stayNightDates } from './myrent.pricing';
import type { MyRentNightPrice } from './myrent.pricing';

export type MyRentPricePeriodParams = {
  objectId: number;
  dateFrom: string;
  dateUntil: string;
  adults: number;
  children: number;
  pets?: number;
};

export type MyRentPricePeriodDay = {
  day: string;
  price: number;
  priceDef: number | null;
  priceExtra: number;
  extraFrom: number;
};

export type MyRentPricePeriodResult = {
  objectId: number;
  objectFree: boolean;
  /**
   * Website (A) prodajna cijena smještaja (EUR) iz b2b_object_price_period —
   * uključuje channel markup i MyRent dodatne osobe. Nije base rate.
   */
  accommodationTotal: number;
  currencyCode: string;
  advancePercent: number;
  adults: number;
  children: number;
  totalGuests: number;
  /** Noći [dateFrom, dateUntil) — Website dnevne cijene (price_b2b) + udio guest extra. */
  nights: MyRentNightPrice[];
};

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function parseJsonField(value: unknown): unknown {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  return value;
}

function pickRow(data: unknown): Record<string, unknown> {
  if (Array.isArray(data) && data.length > 0 && data[0] && typeof data[0] === 'object') {
    return data[0] as Record<string, unknown>;
  }
  if (data && typeof data === 'object') {
    return data as Record<string, unknown>;
  }
  throw new MyRentPricingError(
    'invalid_price',
    'MyRent price_period_details: neočekivan odgovor.',
  );
}

/**
 * Raspodjeli Website period total na noći: day.price (price_b2b) + udio guest
 * extra-a, tako da zbroj noći === accommodationTotal.
 */
export function distributePeriodTotalAcrossNights(params: {
  checkIn: string;
  checkOut: string;
  accommodationTotal: number;
  dayRows: MyRentPricePeriodDay[];
}): MyRentNightPrice[] {
  const nightDates = stayNightDates(params.checkIn, params.checkOut);
  const byDay = new Map(params.dayRows.map((d) => [d.day, d]));
  const dayPrices = nightDates.map((day) => {
    const row = byDay.get(day);
    return row?.price ?? null;
  });

  if (dayPrices.some((b) => b == null || b < 0)) {
    // Nema pouzdanih dnevnih Website cijena → ravnomjerno iz period totala
    const n = nightDates.length;
    const each =
      n > 0 ? Math.round((params.accommodationTotal / n) * 100) / 100 : 0;
    return nightDates.map((day) => ({ day, price: each }));
  }

  const daySum = (dayPrices as number[]).reduce((a, b) => a + b, 0);
  const extraPool = params.accommodationTotal - daySum;
  const n = nightDates.length;

  if (n === 0) return [];

  // Raspodjeli extraPool po noćima (zadnja noć dobije ostatak radi zaokruživanja)
  const nights: MyRentNightPrice[] = [];
  let allocated = 0;
  for (let i = 0; i < n; i++) {
    const day = nightDates[i]!;
    const dayPrice = dayPrices[i] as number;
    let price: number;
    if (i === n - 1) {
      price = Math.round((params.accommodationTotal - allocated) * 100) / 100;
    } else {
      const share = n > 0 ? extraPool / n : 0;
      price = Math.round((dayPrice + share) * 100) / 100;
      allocated += price;
    }
    nights.push({ day, price });
  }
  return nights;
}

export function normalizeMyRentPricePeriodPayload(
  data: unknown,
  params: Pick<
    MyRentPricePeriodParams,
    'objectId' | 'dateFrom' | 'dateUntil' | 'adults' | 'children'
  >,
): MyRentPricePeriodResult {
  const row = pickRow(data);
  const sum = parseJsonField(row.sum) as Record<string, unknown> | null;
  const daysRaw = parseJsonField(row.days);

  // Website (A) SoT — bez fallbacka na base object_price_period*
  const accommodationTotal =
    toFiniteNumber(row.b2b_object_price_period) ??
    toFiniteNumber(sum?.b2b_object_price_period);

  if (accommodationTotal == null || accommodationTotal < 0) {
    console.error(
      '[myrent-pricing] missing b2b_object_price_period (Website A)',
      {
        objectId: params.objectId,
        dateFrom: params.dateFrom,
        dateUntil: params.dateUntil,
        hasBaseSimple: toFiniteNumber(row.object_price_period_simple) != null,
      },
    );
    throw new MyRentPricingError(
      'missing_price',
      'MyRent price_period_details nema b2b_object_price_period (Website cijena).',
    );
  }

  const dayRows: MyRentPricePeriodDay[] = Array.isArray(daysRaw)
    ? daysRaw.map((d) => {
        const day = d as Record<string, unknown>;
        // Samo price_b2b — ne day.price (base), da se channel markup ne izgubi
        // i da se ne miješa base s Website totalom.
        const websiteDayPrice = toFiniteNumber(day.price_b2b);
        return {
          day: String(day.day ?? ''),
          price: websiteDayPrice != null && websiteDayPrice >= 0 ? websiteDayPrice : -1,
          priceDef: toFiniteNumber(day.price_def),
          priceExtra: toFiniteNumber(day.price_extra) ?? 0,
          extraFrom: toFiniteNumber(day.extra_from) ?? 0,
        };
      })
    : [];

  const nights = distributePeriodTotalAcrossNights({
    checkIn: params.dateFrom,
    checkOut: params.dateUntil,
    accommodationTotal,
    dayRows,
  });

  const currencyCode =
    (typeof sum?.currency_code === 'string' && sum.currency_code) || 'EUR';
  const advancePercent =
    toFiniteNumber(sum?.object_advance_percent) ?? 50;
  const objectFree =
    String(row.object_free ?? sum?.object_free ?? 'Y').toUpperCase() === 'Y' ||
    String(row.object_free ?? '') === '1';

  return {
    objectId: toFiniteNumber(row.object_id) ?? params.objectId,
    objectFree,
    accommodationTotal,
    currencyCode,
    advancePercent,
    adults: toFiniteNumber(sum?.adults) ?? params.adults,
    children: toFiniteNumber(sum?.children) ?? params.children,
    totalGuests:
      toFiniteNumber(sum?.total_guests) ?? params.adults + params.children,
    nights,
  };
}

export async function fetchMyRentPricePeriodDetails(
  params: MyRentPricePeriodParams,
): Promise<MyRentPricePeriodResult> {
  const adults = Math.max(1, Math.floor(params.adults));
  const children = Math.max(0, Math.floor(params.children));

  const raw = await myrentRequest<unknown>({
    method: 'POST',
    path: '/user/price_period_details',
    body: {
      object_id: params.objectId,
      date_from: params.dateFrom,
      date_until: params.dateUntil,
      adults,
      children,
      pets: params.pets ?? 0,
      item_id: -1,
      customer_id: -1,
    },
  });

  return normalizeMyRentPricePeriodPayload(raw, {
    objectId: params.objectId,
    dateFrom: params.dateFrom,
    dateUntil: params.dateUntil,
    adults,
    children,
  });
}
