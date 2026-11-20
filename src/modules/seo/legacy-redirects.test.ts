import { describe, expect, it } from 'vitest';
import {
  ALL_LEGACY_REDIRECTS,
  LEGACY_GUIDE_REDIRECTS,
  MYRENT_LEGACY_REDIRECTS,
} from './legacy-redirects';

/** Minimalni matcher za Next.js-style source patterne koje koristimo. */
function matchSource(sourcePattern: string, path: string): boolean {
  let i = 0;
  let out = '^';
  const s = sourcePattern;

  while (i < s.length) {
    if (s.startsWith(':locale(', i)) {
      const end = s.indexOf(')', i);
      const alts = s.slice(i + ':locale('.length, end);
      out += `(?:${alts})`;
      i = end + 1;
      continue;
    }
    if (s.startsWith(':path*', i)) {
      out += '.*';
      i += ':path*'.length;
      continue;
    }
    if (s[i] === ':' && /[A-Za-z_]/.test(s[i + 1] ?? '')) {
      let j = i + 1;
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j]!)) j += 1;
      out += '[^/]+';
      i = j;
      continue;
    }
    const ch = s[i]!;
    out += /[.*+?^${}()|[\]\\]/.test(ch) ? `\\${ch}` : ch;
    i += 1;
  }

  out += '$';
  return new RegExp(out).test(path);
}

function resolveDestination(destination: string, path: string) {
  const localeMatch = path.match(/^\/(en|cs|de)(?:\/|$)/);
  const locale = localeMatch?.[1];
  if (!locale) return destination;
  return destination.replaceAll(':locale', locale);
}

describe('MYRENT_LEGACY_REDIRECTS', () => {
  it('sve su permanent: true (301)', () => {
    for (const rule of ALL_LEGACY_REDIRECTS) {
      expect(rule.permanent).toBe(true);
    }
  });

  it('mapira ključne MyRent URL-ove na nove rute', () => {
    const cases: Array<{ path: string; expectedDest: string }> = [
      { path: '/en/objects/list', expectedDest: '/en/rooms' },
      { path: '/en/users/about', expectedDest: '/en' },
      { path: '/en/pictures/gallery', expectedDest: '/en/gallery' },
      { path: '/en/reviews/list', expectedDest: '/en' },
      { path: '/objects/list', expectedDest: '/rooms' },
      { path: '/pictures/gallery', expectedDest: '/gallery' },
      { path: '/users/about', expectedDest: '/' },
      { path: '/hr/objects/list', expectedDest: '/rooms' },
      { path: '/cs/objects/list', expectedDest: '/cs/rooms' },
      { path: '/de/pictures/gallery', expectedDest: '/en/gallery' },
      { path: '/de/objects/list', expectedDest: '/en/rooms' },
    ];

    for (const { path, expectedDest } of cases) {
      const rule = MYRENT_LEGACY_REDIRECTS.find((r) => matchSource(r.source, path));
      expect(rule, `nema redirect za ${path}`).toBeTruthy();
      expect(resolveDestination(rule!.destination, path)).toBe(expectedDest);
    }
  });

  it('mapira stare Zadar guide slugove', () => {
    const rule = LEGACY_GUIDE_REDIRECTS.find((r) =>
      matchSource(r.source, '/guides/sto-posjetiti-u-zadru'),
    );
    expect(rule?.destination).toBe('/guides/sto-posjetiti-u-daruvaru');

    const en = LEGACY_GUIDE_REDIRECTS.find((r) =>
      matchSource(r.source, '/en/guides/kako-planirati-odmor-u-zadru'),
    );
    expect(en, 'nema EN Zadar guide redirect').toBeTruthy();
    expect(resolveDestination(en!.destination, '/en/guides/kako-planirati-odmor-u-zadru')).toBe(
      '/en/guides/kako-planirati-odmor-u-daruvaru',
    );
  });

  it('nema konflikta source patterna (jedinstveni source stringovi)', () => {
    const sources = ALL_LEGACY_REDIRECTS.map((r) => r.source);
    expect(new Set(sources).size).toBe(sources.length);
  });

  it('ima točno 25 permanent redirect pravila (19 MyRent + 6 guide)', () => {
    expect(MYRENT_LEGACY_REDIRECTS).toHaveLength(19);
    expect(LEGACY_GUIDE_REDIRECTS).toHaveLength(6);
    expect(ALL_LEGACY_REDIRECTS).toHaveLength(25);
  });
});
