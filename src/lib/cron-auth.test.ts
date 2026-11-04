import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { isAuthorizedCronRequest } from './cron-auth';

describe('isAuthorizedCronRequest', () => {
  const prev = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-cron-secret-value';
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prev;
  });

  it('prihvaća Bearer CRON_SECRET', () => {
    const req = new NextRequest('https://example.com/api/cron/x', {
      headers: { authorization: 'Bearer test-cron-secret-value' },
    });
    expect(isAuthorizedCronRequest(req)).toBe(true);
  });

  it('odbija loš / nedostajući secret', () => {
    expect(
      isAuthorizedCronRequest(
        new NextRequest('https://example.com/api/cron/x'),
      ),
    ).toBe(false);
    expect(
      isAuthorizedCronRequest(
        new NextRequest('https://example.com/api/cron/x', {
          headers: { authorization: 'Bearer wrong' },
        }),
      ),
    ).toBe(false);
  });

  it('odbija ako CRON_SECRET nije postavljen', () => {
    delete process.env.CRON_SECRET;
    const req = new NextRequest('https://example.com/api/cron/x', {
      headers: { authorization: 'Bearer test-cron-secret-value' },
    });
    expect(isAuthorizedCronRequest(req)).toBe(false);
  });
});
