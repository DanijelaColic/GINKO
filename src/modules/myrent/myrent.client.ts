/**
 * Authenticated fetch prema https://api.my-rent.net
 * Headers: b2b_guid, user_guid, token
 * Samo read putanje — nema create/update/cancel rezervacija.
 */

import { clearMyRentTokenCache, getMyRentToken, MyRentAuthError } from './myrent.auth';
import { getMyRentConfig } from './myrent.config';

export class MyRentApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'MyRentApiError';
    this.status = status;
  }
}

type MyRentRequestOptions = {
  method?: 'GET' | 'POST';
  path: string;
  query?: Record<string, string | number | undefined | null>;
  body?: Record<string, unknown>;
  /** Interno: već jednom retry nakon 401 */
  _retried?: boolean;
};

function buildUrl(
  apiBaseUrl: string,
  path: string,
  query?: MyRentRequestOptions['query'],
): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function myrentRequest<T = unknown>(
  options: MyRentRequestOptions,
): Promise<T> {
  const config = getMyRentConfig();
  const token = await getMyRentToken({
    forceRefresh: options._retried === true,
  });
  const method = options.method ?? 'GET';
  const url = buildUrl(config.apiBaseUrl, options.path, options.query);

  const headers: Record<string, string> = {
    b2b_guid: config.b2bGuid,
    user_guid: config.userGuid,
    token,
  };

  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: method === 'POST' && options.body
      ? JSON.stringify(options.body)
      : undefined,
    cache: 'no-store',
  });

  if ((res.status === 401 || res.status === 403) && !options._retried) {
    clearMyRentTokenCache();
    return myrentRequest<T>({ ...options, _retried: true });
  }

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
    throw new MyRentApiError(
      res.status,
      `MyRent API ${method} ${options.path} failed (HTTP ${res.status}).`,
    );
  }

  return json as T;
}

export { MyRentAuthError };
