import { NextRequest, NextResponse } from 'next/server';
import { sendGuestQuestionNotification } from '@/lib/email';
import { guestApiError } from '@/lib/guest-api-error';
import { getValidLocale } from '@/i18n/messages';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_QUESTION_LENGTH = 300;

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return guestApiError('invalidRequest', 400);
  }

  if (!body || typeof body !== 'object') {
    return guestApiError('invalidRequest', 400);
  }

  const { email, question, locale } = body as Record<string, unknown>;

  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return guestApiError('invalidEmail', 400);
  }

  if (typeof question !== 'string') {
    return guestApiError('missingQuestion', 400);
  }

  const trimmedQuestion = question.trim();

  if (trimmedQuestion.length < 3) {
    return guestApiError('questionTooShort', 400);
  }

  if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
    return guestApiError('questionTooLong', 400);
  }

  const validLocale = getValidLocale(typeof locale === 'string' ? locale : 'hr');

  try {
    await sendGuestQuestionNotification({
      guestEmail: email.trim(),
      question: trimmedQuestion,
      locale: validLocale,
    });
  } catch (err) {
    console.error('[questions] send failed:', err);
    return guestApiError('sendFailed', 500);
  }

  return NextResponse.json({ ok: true });
}
