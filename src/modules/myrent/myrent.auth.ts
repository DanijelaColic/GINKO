/**
 * MyRent API Token Generation — server-only.
 * POST https://auth.my-rent.net/auth/generate
 * Docs: https://myrent.readme.io/reference/token-generation
 */

import {
  getMyRentConfig,
  MYRENT_TOKEN_TTL_MS,
  type MyRentEnvConfig,
} from './myrent.config';

type TokenCache = {
  token: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;
let inflight: Promise<string> | null = null;

export class MyRentAuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'MyRentAuthError';
    this.status = status;
  }
}

export function clearMyRentTokenCache(): void {
  tokenCache = null;
}

function readTokenFromResponse(data: unknown): string {
  if (!data || typeof data !== 'object') {
    throw new MyRentAuthError(502, 'MyRent auth: neočekivan odgovor (nije objekt).');
  }
  const token = (data as { token?: unknown }).token;
  if (typeof token !== 'string' || !token.trim()) {
    throw new MyRentAuthError(502, 'MyRent auth: odgovor nema polje token.');
  }
  return token.trim();
}

async function requestNewToken(config: MyRentEnvConfig): Promise<string> {
  const res = await fetch(config.authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      user_guid: config.userGuid,
      Authorization: config.apiAuth,
    },
    body: JSON.stringify({
      user_id: config.userId,
      public_key: config.publicKey,
      auth_key: config.authKey,
    }),
    cache: 'no-store',
  });

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    // Nikad ne logiraj body (može sadržavati dijelove credentials odgovora)
    throw new MyRentAuthError(
      res.status,
      `MyRent auth generate failed (HTTP ${res.status}).`,
    );
  }

  return readTokenFromResponse(json);
}

/**
 * Vraća važeći MyRent token (keš ~40 min).
 * forceRefresh=true zaobilazi keš (npr. nakon 401 na API-ju).
 */
export async function getMyRentToken(options?: {
  forceRefresh?: boolean;
}): Promise<string> {
  const forceRefresh = options?.forceRefresh === true;
  const now = Date.now();

  if (
    !forceRefresh &&
    tokenCache &&
    tokenCache.expiresAt > now &&
    tokenCache.token
  ) {
    return tokenCache.token;
  }

  if (!forceRefresh && inflight) {
    return inflight;
  }

  const config = getMyRentConfig();
  inflight = (async () => {
    try {
      const token = await requestNewToken(config);
      tokenCache = {
        token,
        expiresAt: Date.now() + MYRENT_TOKEN_TTL_MS,
      };
      return token;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Smoke: generira token, ne vraća vrijednost — samo OK / greška. */
export async function probeMyRentAuth(): Promise<{
  ok: true;
  tokenCachedUntil: string;
}> {
  clearMyRentTokenCache();
  await getMyRentToken({ forceRefresh: true });
  return {
    ok: true,
    tokenCachedUntil: new Date(
      tokenCache?.expiresAt ?? Date.now() + MYRENT_TOKEN_TTL_MS,
    ).toISOString(),
  };
}
