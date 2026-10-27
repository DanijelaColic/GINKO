/**
 * MyRent User API — server-only config + mapiranje Ginko slug → object_id.
 * Docs: https://myrent.readme.io/reference/myrent-user-api
 *
 * Obje SPA ponude (ginko-spa-1 / ginko-spa-2) dijele fizičku jedinicu → isti object_id 7460.
 */

export const MYRENT_DEFAULT_AUTH_URL =
  'https://auth.my-rent.net/auth/generate';
export const MYRENT_DEFAULT_API_BASE_URL = 'https://api.my-rent.net';

/** TTL ispod službenih 45 min (2700 s) iz MyRent PHP samplea */
export const MYRENT_TOKEN_TTL_MS = 40 * 60 * 1000;

/**
 * Soba / apartman → MyRent property object_id.
 * Apartman (bez wellnessa) i Wellness Apartman = ista fizička jedinica.
 */
export const MYRENT_OBJECT_IDS: Readonly<Record<string, number>> = {
  'ginko-1': 16575,
  'ginko-2': 16578,
  'ginko-3': 16579,
  'ginko-4': 22435,
  'ginko-5': 22436,
  'ginko-6': 22437,
  'ginko-spa-1': 7460, // Apartman bez wellnessa
  'ginko-spa-2': 7460, // Apartman s wellnessom (SPA 2)
};

export type MyRentEnvConfig = {
  userGuid: string;
  b2bGuid: string;
  apiAuth: string;
  userId: string;
  publicKey: string;
  authKey: string;
  authUrl: string;
  apiBaseUrl: string;
};

export function isMyRentConfigured(): boolean {
  return Boolean(
    process.env.MYRENT_USER_GUID?.trim() &&
      process.env.MYRENT_B2B_GUID?.trim() &&
      process.env.MYRENT_API_AUTH?.trim() &&
      process.env.MYRENT_USER_ID?.trim() &&
      process.env.MYRENT_PUBLIC_KEY?.trim() &&
      process.env.MYRENT_AUTH_KEY?.trim(),
  );
}

export function getMyRentConfig(): MyRentEnvConfig {
  const userGuid = process.env.MYRENT_USER_GUID?.trim();
  const b2bGuid = process.env.MYRENT_B2B_GUID?.trim();
  const apiAuth = process.env.MYRENT_API_AUTH?.trim();
  const userId = process.env.MYRENT_USER_ID?.trim();
  const publicKey = process.env.MYRENT_PUBLIC_KEY?.trim();
  const authKey = process.env.MYRENT_AUTH_KEY?.trim();

  if (!userGuid || !b2bGuid || !apiAuth || !userId || !publicKey || !authKey) {
    throw new Error(
      'Nedostaju MyRent env varijable. Potrebno: MYRENT_USER_GUID, ' +
        'MYRENT_B2B_GUID, MYRENT_API_AUTH, MYRENT_USER_ID, ' +
        'MYRENT_PUBLIC_KEY, MYRENT_AUTH_KEY.',
    );
  }

  return {
    userGuid,
    b2bGuid,
    apiAuth,
    userId,
    publicKey,
    authKey,
    authUrl: (
      process.env.MYRENT_AUTH_URL?.trim() || MYRENT_DEFAULT_AUTH_URL
    ).replace(/\/$/, ''),
    apiBaseUrl: (
      process.env.MYRENT_API_BASE_URL?.trim() || MYRENT_DEFAULT_API_BASE_URL
    ).replace(/\/$/, ''),
  };
}

export function getMyRentObjectId(roomSlug: string): number | null {
  const id = MYRENT_OBJECT_IDS[roomSlug];
  return typeof id === 'number' ? id : null;
}

export function resolveMyRentObjectId(params: {
  roomSlug?: string | null;
  objectId?: number | null;
}): number {
  if (params.objectId != null && Number.isFinite(params.objectId)) {
    return params.objectId;
  }
  if (params.roomSlug) {
    const id = getMyRentObjectId(params.roomSlug);
    if (id != null) return id;
    throw new Error(`Nepoznat room slug za MyRent: ${params.roomSlug}`);
  }
  throw new Error('Potreban je roomSlug ili objectId.');
}

/** Svi Ginko slugovi koji dijele isti MyRent object_id (npr. SPA 1+2 → 7460). */
export function getRoomSlugsForObjectId(objectId: number): string[] {
  return Object.entries(MYRENT_OBJECT_IDS)
    .filter(([, id]) => id === objectId)
    .map(([slug]) => slug);
}
