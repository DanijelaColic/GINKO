import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPassword,
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE,
} from '@/lib/admin-auth';
import {
  checkLoginAllowed,
  clearLoginFailures,
  formatLockoutMessage,
  getClientIp,
  recordLoginFailure,
} from '@/lib/login-rate-limit';
import { verifyTurnstileToken } from '@/lib/verify-turnstile';

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return response;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const gate = checkLoginAllowed(ip);
  if (!gate.allowed) {
    return NextResponse.json(
      { error: formatLockoutMessage(gate.retryAfterSec) },
      {
        status: 429,
        headers: { 'Retry-After': String(gate.retryAfterSec) },
      },
    );
  }

  let password: unknown;
  let turnstileToken: unknown;
  try {
    const body = await request.json();
    password = body?.password;
    turnstileToken = body?.turnstileToken;
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtjev' }, { status: 400 });
  }

  // CAPTCHA prije lozinke — botovi ne troše pokušaje na password brute-force.
  const captcha = await verifyTurnstileToken(turnstileToken, ip);
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.error }, { status: 400 });
  }

  if (typeof password !== 'string' || !verifyPassword(password)) {
    const afterFail = recordLoginFailure(ip);
    if (!afterFail.allowed) {
      return NextResponse.json(
        { error: formatLockoutMessage(afterFail.retryAfterSec) },
        {
          status: 429,
          headers: { 'Retry-After': String(afterFail.retryAfterSec) },
        },
      );
    }
    return NextResponse.json({ error: 'Netočna lozinka' }, { status: 401 });
  }

  clearLoginFailures(ip);

  const session = await createAdminSessionToken(ADMIN_COOKIE_MAX_AGE);
  if (!session) {
    return NextResponse.json(
      {
        error:
          'Admin session nije konfigurirana (nedostaje ADMIN_SESSION_SECRET ili ADMIN_TOKEN).',
      },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: '/',
  });

  return response;
}
