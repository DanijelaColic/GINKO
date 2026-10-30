import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearMyRentTokenCache, probeMyRentAuth, MyRentAuthError } from './myrent.auth';
import { myrentRequest, MyRentApiError } from './myrent.client';
import { fetchMyRentCalendar } from './myrent.calendar';
import { MYRENT_USER_AGENT, myrentCommonHeaders } from './myrent.http';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('myrentCommonHeaders', () => {
  it('uvijek šalje User-Agent i Accept: application/json', () => {
    const h = myrentCommonHeaders({ token: 'x' });
    expect(h['User-Agent']).toBe(MYRENT_USER_AGENT);
    expect(h.Accept).toBe('application/json');
    expect(h.token).toBe('x');
  });
});

describe('MyRent auth + calendar HTTP (mocked fetch)', () => {
  const envBackup = { ...process.env };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchSpy: any;

  beforeEach(() => {
    clearMyRentTokenCache();
    process.env.MYRENT_USER_GUID = 'user-guid';
    process.env.MYRENT_B2B_GUID = 'b2b-guid';
    process.env.MYRENT_API_AUTH = 'api-auth';
    process.env.MYRENT_USER_ID = '1234';
    process.env.MYRENT_PUBLIC_KEY = 'pub';
    process.env.MYRENT_AUTH_KEY = 'auth';
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    process.env = { ...envBackup };
    clearMyRentTokenCache();
    vi.restoreAllMocks();
  });

  it('auth generate šalje User-Agent + Accept i uspijeva', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { token: 'tok-1' }));
    await probeMyRentAuth();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const init = fetchSpy.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['User-Agent']).toBe(MYRENT_USER_AGENT);
    expect(headers.Accept).toBe('application/json');
  });

  it('auth 403 → MyRentAuthError (Cloudflare / zabranjen pristup)', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('<!DOCTYPE html><title>Just a moment...</title>', {
        status: 403,
        headers: { 'Content-Type': 'text/html' },
      }),
    );
    try {
      await probeMyRentAuth();
      expect.unreachable('expected MyRentAuthError');
    } catch (err) {
      expect(err).toBeInstanceOf(MyRentAuthError);
      expect((err as MyRentAuthError).status).toBe(403);
    }
  });

  it('uspješan get_calendar nakon auth-a šalje UA na API', async () => {
    fetchSpy
      .mockResolvedValueOnce(jsonResponse(200, { token: 'tok-cal' }))
      .mockResolvedValueOnce(
        jsonResponse(200, [
          {
            day: '2027-02-15',
            is_booked: 'Y',
            free: 'N',
            enable: 'Y',
          },
          {
            day: '2027-02-18',
            is_booked: 'N',
            free: 'Y',
            enable: 'Y',
            stock_available: 1,
          },
        ]),
      );

    const cal = await fetchMyRentCalendar({
      objectId: 16575,
      dateFrom: '2027-02-14',
      dateUntil: '2027-02-22',
    });

    expect(cal.occupied.map((d) => d.day)).toEqual(['2027-02-15']);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const apiInit = fetchSpy.mock.calls[1]![1] as RequestInit;
    const apiHeaders = apiInit.headers as Record<string, string>;
    expect(apiHeaders['User-Agent']).toBe(MYRENT_USER_AGENT);
    expect(apiHeaders.Accept).toBe('application/json');
    expect(apiHeaders.token).toBe('tok-cal');
  });

  it('API 403 s allowAuthRetry=false → MyRentApiError status 403', async () => {
    clearMyRentTokenCache();
    fetchSpy
      .mockResolvedValueOnce(jsonResponse(200, { token: 'tok-2' }))
      .mockResolvedValueOnce(
        new Response('Just a moment...', {
          status: 403,
          headers: { 'Content-Type': 'text/html' },
        }),
      );

    await expect(
      myrentRequest({
        method: 'GET',
        path: '/object_prices/get_calendar/',
        query: { object_id: 16575 },
        allowAuthRetry: false,
      }),
    ).rejects.toMatchObject({ name: 'MyRentApiError', status: 403 });
  });

  it('API 503 → MyRentApiError status 503', async () => {
    clearMyRentTokenCache();
    fetchSpy
      .mockResolvedValueOnce(jsonResponse(200, { token: 'tok-3' }))
      .mockResolvedValueOnce(jsonResponse(503, { error: 'unavailable' }));

    try {
      await myrentRequest({
        method: 'GET',
        path: '/object_prices/get_calendar/',
        query: { object_id: 16575 },
        allowAuthRetry: false,
      });
      expect.unreachable('expected MyRentApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(MyRentApiError);
      expect((err as MyRentApiError).status).toBe(503);
    }
  });
});
