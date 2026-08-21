/**
 * Faza 2 matcher + Faza 3 intent (raspoloživost / legal / galerija / sobe).
 * Biraj najbližu odobrenu temu; specijalni intenti idu na deep link, ne na izmišljen odgovor.
 */

import { getMessagesForLocale } from '@/i18n/messages';
import { getHouseRules } from '@/modules/property/property-details.i18n';
import { topicsReadyForBot, type KnowledgeTopic } from './chatbot.knowledge';
import { flattenHouseRule } from './chatbot.answers';

export type ChatMatch =
  | { kind: 'topic'; topicId: string }
  | { kind: 'availability' }
  | { kind: 'legal' }
  | { kind: 'gallery' }
  | { kind: 'rooms' }
  | { kind: 'unknown' };

const DATE_RE =
  /\b\d{1,2}[.\/-]\d{1,2}(?:[.\/-]\d{2,4})?\b|\b\d{4}-\d{2}-\d{2}\b/;

const AVAILABILITY_RE =
  /slobodn|raspoloziv|dostupn|available|availability|voln[yaýí]|kalendar|calendar/;

const ROOM_PRICE_RE =
  /cijena sobe|room price|price per night|koliko kosta soba|how much is (the |a )?room|cena pokoje/;

const PRICE_EXCEPTION_RE =
  /dorucak|breakfast|snidan|ljubimc|pets|\bpet\b|\bdog\b|depozit|deposit|krevetic|crib|storno|cancel/;

const LEGAL_RE =
  /privatnost|privacy|gdpr|kolacic|cookie|uvjeti koristenja|zasada ochrany|ochrana osobnich/;

const GALLERY_RE = /galerij|fotograf|photos?\b|pictures?\b|obrazk/;

const ROOMS_OVERVIEW_RE =
  /koje sobe|pregled soba|room types?|vase sobe|seznam pokoju|jake pokoje|which rooms/;

/** Ključne riječi HR/EN/CS — routing, ne copy za gosta */
const TOPIC_KEYWORDS: Record<string, readonly string[]> = {
  parking: ['parking', 'parkir', 'parkoviste', 'car park'],
  breakfast: ['dorucak', 'breakfast', 'snidan'],
  wifi: ['wifi', 'wi-fi', 'internet', 'wlan'],
  therms: ['toplice', 'toplica', 'daruvarske toplice', 'lazne', 'therms'],
  attractions: [
    'atrakcij',
    'attraction',
    'dvorac',
    'castle',
    'jankovic',
    'crkva',
    'church',
    'zamek',
  ],
  pets: [
    'ljubimc',
    'pas ',
    ' dog',
    'pets',
    ' pet',
    'macka',
    'cat',
    'zvire',
    'pes ',
  ],
  checkin: [
    'kasni dolazak',
    'late arrival',
    'self check-in',
    'samostaln',
    'kljuc',
    'kod za ulaz',
    'pozdni prijezd',
  ],
  checkinTimes: [
    'check-in',
    'check-out',
    'prijava',
    'odjava',
    'prijezd',
    'odjezd',
    '14:00',
    '22:00',
    '10:00',
    'sati prijave',
  ],
  wellness: ['wellness', 'sauna', 'jacuzzi', 'jakuzzi'],
  families: ['obitelj', 'family', 'families', 'rodina', '4 gosta'],
  booking: [
    'kako rezerv',
    'how to book',
    'how do i book',
    'obrazac za rezerv',
    'booking form',
    'rezervacni formular',
  ],
  cancellation: ['otkaz', 'cancel', 'storno', 'refund', 'povrat depozita', 'zrusen'],
  invoice: [
    'r1',
    'racun za tvrt',
    'invoice',
    'faktura',
    'faktur',
    'company invoice',
    'pdv broj',
    'vat number',
  ],
  deposit_payment: [
    'depozit',
    'deposit',
    'zaloha',
    '50%',
    'ostatak iznosa',
    'remainder',
    'doplatek',
  ],
  children_ages: [
    'krevetic',
    'crib',
    'cot',
    'postylka',
    'pomocni lezaj',
    'extra bed',
    'pristylka',
    'dorucak cijena',
    'breakfast price',
    'cena snidane',
    '7,50',
    '7.50',
  ],
  smoking: ['pusenj', 'smoking', 'smoke', 'cigaret', 'kouren'],
  min_nights: [
    'minimalni boravak',
    'min noci',
    'minimum stay',
    'min nights',
    'minimalni pobyt',
  ],
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeLiveAvailability(query: string): boolean {
  const n = normalize(query);
  if (DATE_RE.test(query)) return true;
  if (
    AVAILABILITY_RE.test(n) &&
    !/check[- ]?in|check[- ]?out|prijava|odjava/.test(n)
  ) {
    return true;
  }
  if (ROOM_PRICE_RE.test(n) && !PRICE_EXCEPTION_RE.test(n)) {
    return true;
  }
  return false;
}

function looksLikeLegal(query: string): boolean {
  return LEGAL_RE.test(normalize(query));
}

function looksLikeGallery(query: string): boolean {
  return GALLERY_RE.test(normalize(query));
}

function looksLikeRoomsOverview(query: string): boolean {
  return ROOMS_OVERVIEW_RE.test(normalize(query));
}

function topicHaystack(topic: KnowledgeTopic, locale: string): string {
  const parts: string[] = [...(TOPIC_KEYWORDS[topic.id] ?? [])];
  const messages = getMessagesForLocale(locale) as {
    travelerQuestions?: { faq?: Record<string, { q?: string; a?: string }> };
  };
  const faq = messages.travelerQuestions?.faq;

  if (topic.messageFaqId && faq?.[topic.messageFaqId]?.q) {
    parts.push(faq[topic.messageFaqId].q ?? '');
  }
  if (topic.houseRuleId) {
    const rule = getHouseRules(locale).find((item) => item.id === topic.houseRuleId);
    if (rule) {
      parts.push(rule.title);
      parts.push(flattenHouseRule(rule));
    }
  }
  return normalize(parts.join(' '));
}

function scoreTopic(
  normalizedQuery: string,
  topic: KnowledgeTopic,
  locale: string,
): number {
  let score = 0;

  for (const keyword of TOPIC_KEYWORDS[topic.id] ?? []) {
    const k = normalize(keyword);
    if (k.length >= 3 && normalizedQuery.includes(k)) {
      score += k.length >= 8 ? 4 : 3;
    }
  }

  const haystack = topicHaystack(topic, locale);
  const tokens = normalizedQuery
    .split(/[^a-z0-9]+/)
    .filter((tok) => tok.length >= 4);
  for (const tok of tokens) {
    if (haystack.includes(tok)) score += 1;
  }

  return score;
}

/**
 * Vrati intent: odobrena tema, deep-link intent, ili unknown (eskalacija).
 */
export function matchGuestQuestion(query: string, locale: string): ChatMatch {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { kind: 'unknown' };
  if (looksLikeLegal(trimmed)) return { kind: 'legal' };
  if (looksLikeLiveAvailability(trimmed)) return { kind: 'availability' };

  const normalized = normalize(trimmed);
  const topics = topicsReadyForBot();
  let best: { id: string; score: number } | null = null;
  let second = 0;

  for (const topic of topics) {
    const score = scoreTopic(normalized, topic, locale);
    if (!best || score > best.score) {
      second = best?.score ?? 0;
      best = { id: topic.id, score };
    } else if (score > second) {
      second = score;
    }
  }

  if (best && best.score >= 3 && !(second >= 3 && best.score - second < 2)) {
    return { kind: 'topic', topicId: best.id };
  }

  if (looksLikeGallery(trimmed)) return { kind: 'gallery' };
  if (looksLikeRoomsOverview(trimmed)) return { kind: 'rooms' };
  return { kind: 'unknown' };
}

export function topicById(id: string): KnowledgeTopic | undefined {
  return topicsReadyForBot().find((topic) => topic.id === id);
}
