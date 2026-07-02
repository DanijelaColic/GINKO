import { NextRequest, NextResponse } from 'next/server';
import { sendGuestQuestionNotification } from '@/lib/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_QUESTION_LENGTH = 300;

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtjev' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Neispravan zahtjev' }, { status: 400 });
  }

  const { email, question, locale } = body as Record<string, unknown>;

  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: 'Unesite ispravnu e-poštu' }, { status: 400 });
  }

  if (typeof question !== 'string') {
    return NextResponse.json({ error: 'Unesite pitanje' }, { status: 400 });
  }

  const trimmedQuestion = question.trim();

  if (trimmedQuestion.length < 10) {
    return NextResponse.json(
      { error: 'Pitanje mora imati najmanje 10 znakova' },
      { status: 400 },
    );
  }

  if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: `Pitanje može imati najviše ${MAX_QUESTION_LENGTH} znakova` },
      { status: 400 },
    );
  }

  const validLocale =
    locale === 'en' || locale === 'de' || locale === 'hr' ? locale : 'hr';

  try {
    await sendGuestQuestionNotification({
      guestEmail: email.trim(),
      question: trimmedQuestion,
      locale: validLocale,
    });
  } catch (err) {
    console.error('[questions] send failed:', err);
    return NextResponse.json(
      { error: 'Slanje nije uspjelo. Pokušajte ponovo.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
