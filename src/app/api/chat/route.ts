import { NextRequest, NextResponse } from 'next/server';
import { guestApiError } from '@/lib/guest-api-error';
import { getValidLocale } from '@/i18n/messages';
import type { ChatApiResponse } from '@/modules/chatbot/chatbot.api';
import {
  matchGuestQuestion,
  type ChatMatch,
} from '@/modules/chatbot/chatbot.match';
import { askChatLlm, isChatLlmConfigured } from '@/modules/chatbot/chatbot.llm';

const MAX_QUESTION_LENGTH = 300;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;

const hitsByIp = new Map<string, number[]>();

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hitsByIp.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hitsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  hitsByIp.set(ip, recent);
  return false;
}

function matchToResponse(match: ChatMatch): ChatApiResponse {
  if (match.kind === 'unknown') return { kind: 'escalate' };
  if (match.kind === 'topic') return { kind: 'topic', topicId: match.topicId };
  return { kind: match.kind };
}

export async function POST(request: NextRequest) {
  if (rateLimited(clientIp(request))) {
    return guestApiError('rateLimited', 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return guestApiError('invalidRequest', 400);
  }

  if (!body || typeof body !== 'object') {
    return guestApiError('invalidRequest', 400);
  }

  const { question, locale } = body as Record<string, unknown>;

  if (typeof question !== 'string') {
    return guestApiError('missingQuestion', 400);
  }

  const trimmed = question.trim();
  if (trimmed.length < 2) {
    return guestApiError('questionTooShort', 400);
  }
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return guestApiError('questionTooLong', 400);
  }

  const validLocale = getValidLocale(typeof locale === 'string' ? locale : 'hr');
  const match = matchGuestQuestion(trimmed, validLocale);

  if (
    match.kind === 'availability' ||
    match.kind === 'legal' ||
    match.kind === 'gallery' ||
    match.kind === 'rooms'
  ) {
    return NextResponse.json(matchToResponse(match));
  }

  if (!isChatLlmConfigured()) {
    return NextResponse.json(matchToResponse(match));
  }

  const llm = await askChatLlm({ question: trimmed, locale: validLocale });
  return NextResponse.json(llm satisfies ChatApiResponse);
}
