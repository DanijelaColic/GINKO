/**
 * Feature flag za MyRent → Ginko guest pricing.
 *
 * ZADANO ISKLJUČENO — legacy `calculatePrice(room.price)` ostaje SoT.
 * Aktivacija (tek nakon odobrenja + deploy):
 *   MYRENT_PRICING_ENABLED=true
 *
 * Live put: POST /user/price_period_details → b2b_object_price_period
 * (Website A) + SPA wellness nadoplata iz Ginko.
 *
 * Mock (lokalni UI / testovi):
 *   MYRENT_PRICING_ENABLED=true
 *   MYRENT_PRICING_MOCK=true
 *
 * MOCK je ZABRANJEN na Vercel Production (VERCEL_ENV=production), čak i ako
 * je MYRENT_PRICING_MOCK=true — tada se koristi live period API (ili fail-closed).
 */

function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined || raw.trim() === '') return defaultValue;
  const v = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return defaultValue;
}

/** Env subset za testabilnost (bez obaveznog NODE_ENV). */
export type PricingEnv = Record<string, string | undefined>;

/** Vercel Production runtime (ne preview / development). */
export function isVercelProductionEnv(
  env: PricingEnv = process.env,
): boolean {
  return (env.VERCEL_ENV ?? '').trim().toLowerCase() === 'production';
}

/** True samo kad je MYRENT_PRICING_ENABLED eksplicitno uključen. */
export function isMyRentPricingEnabled(
  env: PricingEnv = process.env,
): boolean {
  return parseBool(env.MYRENT_PRICING_ENABLED, false);
}

/**
 * True ako je mock eksplicitno zatražen env-om (bez Production gate-a).
 * Koristi se za detekciju misconfiguration na Productionu.
 */
export function isMyRentPricingMockRequested(
  env: PricingEnv = process.env,
): boolean {
  return (
    isMyRentPricingEnabled(env) &&
    parseBool(env.MYRENT_PRICING_MOCK, false)
  );
}

/**
 * Mock kalendar umjesto live get_calendar.
 * Nikad na VERCEL_ENV=production — čak i ako je MOCK=true.
 */
export function isMyRentPricingMock(
  env: PricingEnv = process.env,
): boolean {
  if (isVercelProductionEnv(env)) return false;
  return isMyRentPricingMockRequested(env);
}

/**
 * MOCK=true + pricing enabled na Productionu → opasna misconfig.
 * Mock se ne koristi; caller može logirati / fail-closed po potrebi.
 */
export function isMyRentPricingMockBlockedOnProduction(
  env: PricingEnv = process.env,
): boolean {
  return isMyRentPricingMockRequested(env) && isVercelProductionEnv(env);
}
