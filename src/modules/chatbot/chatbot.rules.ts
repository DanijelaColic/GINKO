/**
 * Pravila bota (Faza 1) — izvor istine za Fazu 2+ (widget / LLM).
 * Widget (Faza 2–3) smije govoriti samo iz `topicsReadyForBot()`
 * i slati gosta na postojeće stranice (raspoloživost, booking, WhatsApp…).
 */

import type { AppLocale } from '@/i18n/routing';
import { QUESTIONS_SECTION_ID } from '@/modules/booking/booking.config';

/** Što bot nikad ne smije raditi — čita Faza 2/4, ne gost. */
export const CHATBOT_CONSTRAINTS = {
  inventPrices: false,
  inventAvailability: false,
  inventPolicies: false,
  takeBookings: false,
  quoteLiveCalendar: false,
  useUnapprovedTopics: false,
} as const;

/**
 * Eskalacija kad nema odobrenog odgovora.
 * WhatsApp = postojeći Navbar deep link (`buildWhatsAppHref`).
 * Ask question = postojeća email forma na naslovnici.
 */
export const CHATBOT_ESCALATION = {
  whatsapp: true,
  askQuestionSectionId: QUESTIONS_SECTION_ID,
  bookingPath: '/booking',
} as const;

export type ChatbotRuleId =
  | 'approved_only'
  | 'no_bookings'
  | 'no_live_availability'
  | 'locale_follows_page'
  | 'escalate_unknown';

export type ChatbotRule = {
  id: ChatbotRuleId;
  hr: string;
  en: string;
  cs: string;
};

export const CHATBOT_RULES: readonly ChatbotRule[] = [
  {
    id: 'approved_only',
    hr: 'Odgovaraj samo iz odobrenih tema (FAQ na naslovnici, kućni red, uvjeti rezervacije). Ne izmišljaj cijene, uvjete ni činjenice koje nisu u toj bazi.',
    en: 'Answer only from approved topics (homepage FAQ, house rules, booking terms). Do not invent prices, policies, or facts that are not in that base.',
    cs: 'Odpovídej pouze ze schválených témat (FAQ na úvodní stránce, domácí řád, podmínky rezervace). Nevymýšlej ceny, pravidla ani fakta, která v této bázi nejsou.',
  },
  {
    id: 'no_bookings',
    hr: 'Ne preuzimaj rezervacije u chatu. Za rezervaciju uputi gosta na obrazac na stranici.',
    en: 'Do not take bookings in chat. For a reservation, send the guest to the booking form on the site.',
    cs: 'Nepřijímej rezervace v chatu. Pro rezervaci odkaž hosta na formulář na webu.',
  },
  {
    id: 'no_live_availability',
    hr: 'Ne navodi raspoloživost ni cijenu za konkretne datume. Za to uputi na pretragu raspoloživosti i obrazac rezervacije.',
    en: 'Do not quote availability or a price for specific dates. Point the guest to the availability search and the booking form.',
    cs: 'Neuváděj dostupnost ani cenu pro konkrétní termíny. Odkaz na vyhledávání dostupnosti a rezervační formulář.',
  },
  {
    id: 'locale_follows_page',
    hr: 'Jezik odgovora = jezik stranice (hr / en / cs). Koristi prevedeni FAQ i kućni red za taj locale.',
    en: 'Reply language = page language (hr / en / cs). Use the translated FAQ and house rules for that locale.',
    cs: 'Jazyk odpovědi = jazyk stránky (hr / en / cs). Použij přeložené FAQ a domácí řád pro daný locale.',
  },
  {
    id: 'escalate_unknown',
    hr: 'Ako pitanje nema odobrenu temu, ne nagađaj. Uputi na WhatsApp (isti kanal kao u izborniku) i/ili „Postavite pitanje“ na naslovnici.',
    en: 'If the question has no approved topic, do not guess. Direct the guest to WhatsApp (same channel as in the navbar) and/or “Ask a question” on the homepage.',
    cs: 'Pokud otázka nemá schválené téma, nehádej. Odkaz na WhatsApp (stejný kanál jako v navigaci) a/nebo „Položit otázku“ na úvodní stránce.',
  },
];

export function chatbotRulesForLocale(locale: string): readonly string[] {
  const loc: AppLocale = locale === 'en' || locale === 'cs' ? locale : 'hr';
  return CHATBOT_RULES.map((rule) => rule[loc]);
}
