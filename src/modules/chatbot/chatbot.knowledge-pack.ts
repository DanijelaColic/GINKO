/**
 * Tekstualni paket odobrenog znanja za LLM (Faza 4).
 * Samo approved teme + već objavljeni izuzeci iz opisa soba.
 */

import { getMessagesForLocale } from '@/i18n/messages';
import {
  CRIB_PRICE_PER_NIGHT,
  DEPOSIT_PERCENT,
  EXTRA_BED_PRICE_PER_NIGHT,
  FREE_CANCELLATION_DAYS,
  MIN_NIGHTS,
  PET_CLEANING_FEE_PER_DAY,
} from '@/modules/booking/booking.config';
import { getHouseRules } from '@/modules/property/property-details.i18n';
import { flattenHouseRule } from './chatbot.answers';
import { chatbotRulesForLocale } from './chatbot.rules';
import { topicsReadyForBot } from './chatbot.knowledge';

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export function buildKnowledgePack(locale: string): string {
  const messages = getMessagesForLocale(locale) as {
    travelerQuestions?: { faq?: Record<string, { q?: string; a?: string }> };
  };
  const faq = messages.travelerQuestions?.faq ?? {};
  const rules = getHouseRules(locale);
  const blocks: string[] = [];

  for (const topic of topicsReadyForBot()) {
    const parts: string[] = [`### ${topic.id}`];
    if (topic.messageFaqId && faq[topic.messageFaqId]) {
      const entry = faq[topic.messageFaqId];
      if (entry.q) parts.push(`Q: ${stripTags(entry.q)}`);
      if (entry.a) parts.push(`A: ${stripTags(entry.a)}`);
    }
    if (topic.houseRuleId) {
      const rule = rules.find((item) => item.id === topic.houseRuleId);
      if (rule) {
        parts.push(`${rule.title}: ${flattenHouseRule(rule)}`);
      }
    }
    if (topic.source === 'booking_config') {
      parts.push(`Minimum stay: ${MIN_NIGHTS} night(s).`);
    }
    blocks.push(parts.join('\n'));
  }

  const extras = [
    `Deposit: ${Math.round(DEPOSIT_PERCENT * 100)}% when booking; remainder on arrival at the property.`,
    `Free cancellation / deposit refund until ${FREE_CANCELLATION_DAYS} days before arrival.`,
    `Pet cleaning fee: ${PET_CLEANING_FEE_PER_DAY} EUR per day. Pets allowed on request in all rooms and apartments.`,
    `Crib: ${CRIB_PRICE_PER_NIGHT} EUR / night. Extra bed: ${EXTRA_BED_PRICE_PER_NIGHT} EUR / night.`,
    'Check-out: by 10:00.',
  ];

  return [
    'APPROVED KNOWLEDGE (only source of facts):',
    blocks.join('\n\n'),
    '',
    'PUBLISHED NOTES:',
    extras.map((line) => `- ${line}`).join('\n'),
    '',
    'RULES:',
    chatbotRulesForLocale(locale)
      .map((line) => `- ${line}`)
      .join('\n'),
  ].join('\n');
}
