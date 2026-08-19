import { NextResponse } from 'next/server';

export function guestApiError(code: string, status: number) {
  return NextResponse.json({ error: code }, { status });
}

/** Map a stable API `error` code to a next-intl string; never show raw HR to the guest. */
export function guestErrorMessage(
  code: string | undefined,
  hasKey: (key: string) => boolean,
  translate: (key: string) => string,
  keyPrefix: string,
  fallbackKey: string,
): string {
  if (code && hasKey(`${keyPrefix}.${code}`)) {
    return translate(`${keyPrefix}.${code}`);
  }
  return translate(fallbackKey);
}
