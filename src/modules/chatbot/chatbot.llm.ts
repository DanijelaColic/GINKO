/**
 * OpenAI poziv za Fazu 4. Bez SDK-a — jedan fetch.
 * Ako nema ključa, caller koristi keyword matcher.
 */

import { topicsReadyForBot } from './chatbot.knowledge';
import { buildKnowledgePack } from './chatbot.knowledge-pack';
import type { ChatApiResponse } from './chatbot.api';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export function isChatLlmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

type LlmJson = {
  intent?: string;
  topicId?: string | null;
  text?: string;
};

function parseLlmPayload(raw: string): ChatApiResponse {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  let data: LlmJson;
  try {
    data = JSON.parse(cleaned) as LlmJson;
  } catch {
    return { kind: 'escalate' };
  }

  const intent = data.intent;
  if (intent === 'escalate') return { kind: 'escalate' };
  if (intent === 'availability') return { kind: 'availability' };
  if (intent === 'legal') return { kind: 'legal' };
  if (intent === 'gallery') return { kind: 'gallery' };
  if (intent === 'rooms') return { kind: 'rooms' };
  if (intent !== 'answer') return { kind: 'escalate' };

  const text = typeof data.text === 'string' ? data.text.trim() : '';
  if (!text) return { kind: 'escalate' };

  const topicId =
    typeof data.topicId === 'string' &&
    topicsReadyForBot().some((topic) => topic.id === data.topicId)
      ? data.topicId
      : undefined;

  return { kind: 'llm', text, topicId };
}

export async function askChatLlm(input: {
  question: string;
  locale: string;
}): Promise<ChatApiResponse> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { kind: 'escalate' };

  const model = process.env.OPENAI_CHAT_MODEL?.trim() || 'gpt-4o-mini';
  const locale = input.locale === 'en' || input.locale === 'cs' ? input.locale : 'hr';
  const knowledge = buildKnowledgePack(locale);

  const system = [
    'You are the Ginko Boutique Rooms & Wellness website assistant.',
    `Reply in language: ${locale} (hr = Croatian, en = English, cs = Czech).`,
    'Use ONLY the approved knowledge. Never invent prices, availability, room status, or policies.',
    'Never take a booking. Never quote a live calendar or a price for specific dates.',
    'If the question is not covered, intent=escalate (empty text).',
    'If they ask about dates / free rooms / calendar, intent=availability.',
    'If they ask about privacy/cookies/GDPR, intent=legal.',
    'If they ask for photos/gallery, intent=gallery.',
    'If they ask which rooms exist in general, intent=rooms.',
    'Otherwise intent=answer with 1–4 short sentences grounded in the knowledge.',
    'topicId: one approved topic id if relevant, else null.',
    'Return JSON only: {"intent":"answer"|"escalate"|"availability"|"legal"|"gallery"|"rooms","topicId":string|null,"text":string}',
    '',
    knowledge,
  ].join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: input.question },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error('[chat-llm] OpenAI HTTP', res.status);
      return { kind: 'escalate' };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return { kind: 'escalate' };
    return parseLlmPayload(content);
  } catch (err) {
    console.error('[chat-llm] failed:', err);
    return { kind: 'escalate' };
  } finally {
    clearTimeout(timer);
  }
}
