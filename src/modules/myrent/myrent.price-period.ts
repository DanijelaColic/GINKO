/**
 * POST /user/price_period_details — ukupna cijena smještaja za datume + goste.
 * Docs: https://myrent.readme.io/reference/calculate-price-copy
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
  /** object_price_period_simple (EUR) — smještaj uključujući MyRent dodatne osobe. */
  accommodationTotal: number;
  currencyCode: string;
  advancePercent: number;
  adults: number;
  children: number;
  totalGuests: number;
  /** Noći [dateFrom, dateUntil) s baznim dnevnim cijenama (+ proporcionalni guest extra). */
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
 * Raspodjeli period total na noći: bazni day.price + udio guest extra-a,
 * tako da zbroj noći === accommodationTotal.
 */
export function distributePeriodTotalAcrossNights(params: {
  checkIn: string;
  checkOut: string;
  accommodationTotal: number;
  dayRows: MyRentPricePeriodDay[];
}): MyRentNightPrice[] {
  const nightDates = stayNightDates(params.checkIn, params.checkOut);
  const byDay = new Map(params.dayRows.map((d) => [d.day, d]));
  const bases = nightDates.map((day) => {
    const row = byDay.get(day);
    return row?.price ?? null;
  });

  if (bases.some((b) => b == null || b < 0)) {
    // Fallback: ravnomjerno
    const n = nightDates.length;
    const each =
      n > 0 ? Math.round((params.accommodationTotal / n) * 100) / 100 : 0;
    return nightDates.map((day) => ({ day, price: each }));
  }

  const baseSum = (bases as number[]).reduce((a, b) => a + b, 0);
  const extraPool = params.accommodationTotal - baseSum;
  const n = nightDates.length;

  if (n === 0) return [];

  // Raspodjeli extraPool po noćima (zadnja noć dobije ostatak radi zaokruživanja)
  const nights: MyRentNightPrice[] = [];
  let allocated = 0;
  for (let i = 0; i < n; i++) {
    const day = nightDates[i]!;
    const base = bases[i] as number;
    let price: number;
    if (i === n - 1) {
      price = Math.round((params.accommodationTotal - allocated) * 100) / 100;
    } else {
      const share = n > 0 ? extraPool / n : 0;
      price = Math.round((base + share) * 100) / 100;
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

  const accommodationTotal =
    toFiniteNumber(row.object_price_period_simple) ??
    toFiniteNumber(row.object_price_period) ??
    toFiniteNumber(sum?.object_price_period_simple) ??
    toFiniteNumber(sum?.object_price_period);

  if (accommodationTotal == null || accommodationTotal < 0) {
    throw new MyRentPricingError(
      'missing_price',
      'MyRent price_period_details nema object_price_period.',
    );
  }

  const dayRows: MyRentPricePeriodDay[] = Array.isArray(daysRaw)
    ? daysRaw.map((d) => {
        const day = d as Record<string, unknown>;
        return {
          day: String(day.day ?? ''),
          price: toFiniteNumber(day.price) ?? 0,
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
