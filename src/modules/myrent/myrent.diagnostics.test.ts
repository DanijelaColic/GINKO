import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  classifyMyRentResponseText,
  failureStepForApiPath,
  logMyRentFailure,
} from './myrent.diagnostics';

describe('classifyMyRentResponseText', () => {
  it('prepoznaje Cloudflare HTML challenge', () => {
    const r = classifyMyRentResponseText(
      '<!DOCTYPE html><html><title>Just a moment...</title></html>',
    );
    expect(r.bodyKind).toBe('html');
    expect(r.cloudflareChallenge).toBe(true);
  });

  it('prepoznaje MyRent JSON', () => {
    const r = classifyMyRentResponseText('{"token":"x"}');
    expect(r.bodyKind).toBe('json');
    expect(r.cloudflareChallenge).toBe(false);
  });

  it('prazan body → empty', () => {
    expect(classifyMyRentResponseText('')).toEqual({
      bodyKind: 'empty',
      cloudflareChallenge: false,
    });
  });

  it('obični HTML bez challenge markera → html, cloudflare false', () => {
    const r = classifyMyRentResponseText('<html><body>error</body></html>');
    expect(r.bodyKind).toBe('html');
    expect(r.cloudflareChallenge).toBe(false);
  });
});

describe('failureStepForApiPath', () => {
  it('get_calendar → calendar_api', () => {
    expect(failureStepForApiPath('/object_prices/get_calendar/')).toBe(
      'calendar_api',
    );
  });

  it('ostalo → api', () => {
    expect(failureStepForApiPath('/user/rent_add')).toBe('api');
  });
});

describe('logMyRentFailure', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logira samo sigurna polja, bez bodyja', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logMyRentFailure({
      configured: true,
      step: 'auth_generate',
      httpStatus: 403,
      bodyKind: 'html',
      cloudflareChallenge: true,
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const [prefix, payload] = spy.mock.calls[0]!;
    expect(prefix).toBe('[myrent-diag]');
    expect(JSON.parse(String(payload))).toEqual({
      configured: true,
      step: 'auth_generate',
      httpStatus: 403,
      bodyKind: 'html',
      cloudflareChallenge: true,
    });
  });
});
