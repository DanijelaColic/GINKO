/**
 * Sigurna dijagnostika neuspješnih MyRent HTTP poziva.
 * Nikad ne logira tokene, ključeve, Authorization ni cijeli body.
 */

export type MyRentFailureStep =
  | 'config'
  | 'auth_generate'
  | 'calendar_api'
  | 'api';

export type MyRentResponseBodyKind = 'json' | 'html' | 'other' | 'empty';

export type MyRentFailureDiag = {
  configured: boolean;
  step: MyRentFailureStep;
  httpStatus: number | null;
  bodyKind: MyRentResponseBodyKind;
  cloudflareChallenge: boolean;
};

/** Klasificira tekst odgovora bez spremanja sadržaja. */
export function classifyMyRentResponseText(text: string): {
  bodyKind: MyRentResponseBodyKind;
  cloudflareChallenge: boolean;
} {
  const trimmed = text.trim();
  if (!trimmed) {
    return { bodyKind: 'empty', cloudflareChallenge: false };
  }

  const head = trimmed.slice(0, 400).toLowerCase();
  const cloudflareChallenge =
    head.includes('just a moment') ||
    head.includes('cf-browser-verification') ||
    head.includes('cdn-cgi/challenge') ||
    (head.includes('attention required') && head.includes('cloudflare'));

  if (
    head.startsWith('<!doctype html') ||
    head.startsWith('<html') ||
    cloudflareChallenge
  ) {
    return {
      bodyKind: 'html',
      cloudflareChallenge:
        cloudflareChallenge || head.includes('just a moment'),
    };
  }

  try {
    JSON.parse(trimmed);
    return { bodyKind: 'json', cloudflareChallenge: false };
  } catch {
    return { bodyKind: 'other', cloudflareChallenge };
  }
}

export function failureStepForApiPath(path: string): MyRentFailureStep {
  return path.includes('get_calendar') ? 'calendar_api' : 'api';
}

/** Strukturirani log — samo dijagnostička polja. */
export function logMyRentFailure(diag: MyRentFailureDiag): void {
  console.error('[myrent-diag]', JSON.stringify(diag));
}
