import { describe, expect, it } from 'vitest';
import {
  getIndexingRobots,
  isSeoNoindexEnvironment,
  resolvePageRobots,
} from './indexing';

describe('isSeoNoindexEnvironment', () => {
  it('production bez flaga → indexable', () => {
    expect(
      isSeoNoindexEnvironment({ VERCEL_ENV: 'production', SEO_NOINDEX: undefined }),
    ).toBe(false);
  });

  it('production + SEO_NOINDEX=1 → noindex (P0 do DNS flipa)', () => {
    expect(
      isSeoNoindexEnvironment({ VERCEL_ENV: 'production', SEO_NOINDEX: '1' }),
    ).toBe(true);
  });

  it('production + SEO_NOINDEX=true → noindex', () => {
    expect(
      isSeoNoindexEnvironment({ VERCEL_ENV: 'production', SEO_NOINDEX: 'true' }),
    ).toBe(true);
  });

  it('preview → noindex čak i bez flaga', () => {
    expect(isSeoNoindexEnvironment({ VERCEL_ENV: 'preview' })).toBe(true);
  });

  it('development → noindex', () => {
    expect(isSeoNoindexEnvironment({ VERCEL_ENV: 'development' })).toBe(true);
  });
});

describe('getIndexingRobots / resolvePageRobots', () => {
  it('production + SEO_NOINDEX=1 vraća index:false', () => {
    const robots = getIndexingRobots({ VERCEL_ENV: 'production', SEO_NOINDEX: '1' });
    expect(robots).toEqual({ index: false, follow: false });
  });

  it('production bez flaga vraća index:true', () => {
    const robots = getIndexingRobots({ VERCEL_ENV: 'production' });
    expect(robots).toMatchObject({ index: true, follow: true });
  });

  it('stranica s robots index:true ne može overrideati SEO_NOINDEX', () => {
    const resolved = resolvePageRobots(
      { index: true },
      { VERCEL_ENV: 'production', SEO_NOINDEX: '1' },
    );
    expect(resolved).toEqual({ index: false, follow: false });
  });

  it('bez noindex propušta traženi robots', () => {
    const requested = { index: true as const };
    expect(resolvePageRobots(requested, { VERCEL_ENV: 'production' })).toEqual(requested);
  });
});
