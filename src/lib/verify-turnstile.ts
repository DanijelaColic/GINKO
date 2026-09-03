/**
 * Cloudflare Turnstile server-side verify.
 * Ako TURNSTILE_SECRET_KEY nije postavljen → skip (lokalni dev).
 * U produkciji postavi secret + NEXT_PUBLIC_TURNSTILE_SITE_KEY.
 * Portano s Villa-Velebita booking-admin/lib/verify-turnstile.ts
 */

type TurnstileVerifyResponse = {
  success: boolean;
  'error-codes'?: string[];
};

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

export async function verifyTurnstileToken(
  token: unknown,
  remoteip?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  // Bez secret-a: ne blokiraj lokalni/dev login (CAPTCHA još nije uključena).
  if (!secret) {
    return { ok: true };
  }

  if (typeof token !== 'string' || !token.trim()) {
    return { ok: false, error: 'Potrebna je CAPTCHA provjera. Osvježite stranicu.' };
  }

  try {
    const body = new URLSearchParams();
    body.set('secret', secret);
    body.set('response', token.trim());
    if (remoteip && remoteip !== 'unknown') {
      body.set('remoteip', remoteip);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      console.error('[turnstile] siteverify HTTP', res.status);
      return {
        ok: false,
        error: 'CAPTCHA provjera trenutno nije dostupna. Pokušajte ponovno.',
      };
    }

    const data = (await res.json()) as TurnstileVerifyResponse;
    if (!data.success) {
      console.warn('[turnstile] failed', data['error-codes']);
      return { ok: false, error: 'CAPTCHA nije uspjela. Pokušajte ponovno.' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[turnstile] verify error', err);
    return {
      ok: false,
      error: 'CAPTCHA provjera trenutno nije dostupna. Pokušajte ponovno.',
    };
  }
}
