/**
 * SPA 1 (bez wellnessa) i SPA 2 (s wellnessom) dijele MyRent object_id 7460.
 * MyRent vraća istu baznu cijenu; wellness nadoplata (€/noć) je zasebna
 * admin postavka u Supabase `site_settings` (ključ
 * `spa_wellness_surcharge_per_night`).
 *
 * NULL / nedostaje → wellness varijanta se ne smije kotirati ni rezervirati
 * dok MyRent pricing nije aktivan (legacy put i dalje koristi room.price).
 */

import { createServerSupabaseClient } from '@/lib/supabase';

export const MYRENT_SPA_STANDARD_SLUG = 'ginko-spa-1';
export const MYRENT_SPA_WELLNESS_SLUG = 'ginko-spa-2';

export const SPA_WELLNESS_SURCHARGE_SETTING_KEY =
  'spa_wellness_surcharge_per_night';

export class SpaWellnessSurchargeNotConfiguredError extends Error {
  constructor(
    message = 'Wellness nadoplata nije postavljena u administraciji.',
  ) {
    super(message);
    this.name = 'SpaWellnessSurchargeNotConfiguredError';
  }
}

/** Test-only override: undefined = čitaj DB; null = nije postavljeno; number = vrijednost. */
let testOverride: number | null | undefined = undefined;

export function setSpaWellnessSurchargeForTests(
  value: number | null | undefined,
): void {
  testOverride = value;
}

function normalizeSurcharge(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Dohvati admin nadoplatu (€/noć). null = nije unesena.
 */
export async function getSpaWellnessSurchargePerNight(): Promise<number | null> {
  if (testOverride !== undefined) {
    return testOverride;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('value_numeric')
    .eq('key', SPA_WELLNESS_SURCHARGE_SETTING_KEY)
    .maybeSingle();

  if (error) {
    console.error(
      '[spa-wellness] site_settings read failed:',
      error.message,
    );
    return null;
  }

  return normalizeSurcharge(data?.value_numeric);
}

/**
 * Spremi nadoplatu. null briše / označi kao „nije postavljeno“.
 * Baca Error za negativne / NaN (osim null).
 */
export async function setSpaWellnessSurchargePerNight(
  value: number | null,
): Promise<number | null> {
  if (value !== null) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Wellness nadoplata mora biti broj >= 0 ili prazno.');
    }
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('site_settings')
    .upsert(
      {
        key: SPA_WELLNESS_SURCHARGE_SETTING_KEY,
        value_numeric: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    )
    .select('value_numeric')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeSurcharge(data?.value_numeric);
}

/**
 * Za ginko-spa-2: vraća nadoplatu ili baca ako nije postavljena.
 * Za ostale slugove: 0.
 */
export async function spaWellnessSurchargePerNightForSlug(
  roomSlug: string,
): Promise<number> {
  if (roomSlug !== MYRENT_SPA_WELLNESS_SLUG) return 0;

  const value = await getSpaWellnessSurchargePerNight();
  if (value == null) {
    throw new SpaWellnessSurchargeNotConfiguredError();
  }
  return value;
}
