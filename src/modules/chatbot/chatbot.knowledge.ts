/**
 * Knowledge base za chatbot (Faza 1 — zamrznuto, bez UI-ja).
 *
 * Odgovori za `source: 'faq'` čitaju se iz
 *   messages/{locale}.json → travelerQuestions.faq.{messageFaqId}.a
 * Za `house_rules` → HOUSE_RULES / property-details.i18n (isti id).
 * Za `booking_config` → konstante u booking.config.ts (MIN_NIGHTS, DEPOSIT_PERCENT…).
 *
 * status:
 * - approved — smije ići u bot
 * - draft_on_site — na webu, ali nije zamrznuto za bot
 * - pending_client — nema odobrenog javnog odgovora; bot šuti i eskalira
 *
 * conflicts[] = poznate nedosljednosti na webu. Bot ne “ispravlja” ih;
 * koristi navedeni source, a konflikt ostaje za klijenta.
 */

export type KnowledgeStatus = 'draft_on_site' | 'pending_client' | 'approved';

export type KnowledgeSource = 'faq' | 'house_rules' | 'booking_config';

export type KnowledgeTopic = {
  id: string;
  /** next-intl key under travelerQuestions.faq.{id} — null ako nije u FAQ-u */
  messageFaqId: string | null;
  /** id u HOUSE_RULES ako je izvor kućni red */
  houseRuleId?: string;
  category: 'stay' | 'amenities' | 'location' | 'booking' | 'policy' | 'payment';
  status: KnowledgeStatus;
  source: KnowledgeSource | null;
  /** Kratka napomena (interno; nije copy za gosta) */
  clientPrompt: string;
  /** Poznate nedosljednosti na webu — ne izmišljati rješenje */
  conflicts?: readonly string[];
};

/** FAQ već na home (TravelerQuestionsSection) — zamrznuto za bot */
const ON_SITE_FAQ: KnowledgeTopic[] = [
  {
    id: 'parking',
    messageFaqId: 'parking',
    category: 'amenities',
    status: 'approved',
    source: 'faq',
    clientPrompt: 'Besplatan privatan parking uz objekt.',
  },
  {
    id: 'breakfast',
    messageFaqId: 'breakfast',
    category: 'amenities',
    status: 'approved',
    source: 'faq',
    clientPrompt:
      'FAQ: doručak se naručuje pri rezervaciji. Cijene po dobi su u temi children_ages (kućni red), ne u FAQ-u.',
  },
  {
    id: 'wifi',
    messageFaqId: 'wifi',
    category: 'amenities',
    status: 'approved',
    source: 'faq',
    clientPrompt: 'Besplatan Wi-Fi u sobama i zajedničkim prostorima.',
  },
  {
    id: 'therms',
    messageFaqId: 'therms',
    category: 'location',
    status: 'approved',
    source: 'faq',
    clientPrompt: 'Toplice na pješačkoj udaljenosti od nekoliko minuta.',
  },
  {
    id: 'attractions',
    messageFaqId: 'attractions',
    category: 'location',
    status: 'approved',
    source: 'faq',
    clientPrompt: 'Park dvorca Janković, toplice, crkva Sv. Trojstva, centar.',
  },
  {
    id: 'pets',
    messageFaqId: 'pets',
    houseRuleId: 'pets',
    category: 'policy',
    status: 'approved',
    source: 'faq',
    clientPrompt:
      'Opće pravilo: ljubimci uz najavu, 15 €/dan. U opisu Wellness Apartmana i Apartmana (ginko-spa-2 / ginko-spa-1) piše da ljubimci nisu dozvoljeni.',
    conflicts: [
      'FAQ + kućni red: ljubimci dopušteni uz najavu, 15 €/dan.',
      'rooms.config ginko-spa-1 i ginko-spa-2: „Kućni ljubimci nisu dozvoljeni.”',
    ],
  },
  {
    id: 'checkin',
    messageFaqId: 'checkin',
    houseRuleId: 'checkin',
    category: 'stay',
    status: 'approved',
    source: 'faq',
    clientPrompt: 'Fleksibilna / samostalna prijava; upute prije dolaska.',
  },
  {
    id: 'checkinTimes',
    messageFaqId: 'checkinTimes',
    houseRuleId: 'checkin',
    category: 'stay',
    status: 'approved',
    source: 'faq',
    clientPrompt:
      'Bot koristi FAQ/kućni red: prijava 14:00–22:00, odjava do 10:00. Booking traka i widget još kažu 11:00.',
    conflicts: [
      'FAQ, kućni red, footer, email, i18n metadata: odjava do 10:00.',
      'bookingPage.strip, sidebar, BookingWidget, rooms/[slug]: odjava do 11:00.',
    ],
  },
  {
    id: 'wellness',
    messageFaqId: 'wellness',
    category: 'amenities',
    status: 'approved',
    source: 'faq',
    clientPrompt: 'Wellness (sauna, jacuzzi) samo uz wellness apartman (ginko-spa-2).',
  },
  {
    id: 'families',
    messageFaqId: 'families',
    category: 'stay',
    status: 'approved',
    source: 'faq',
    clientPrompt: 'Neke sobe do 4 gosta; detalji kapaciteta u rooms.config.',
  },
  {
    id: 'booking',
    messageFaqId: 'booking',
    category: 'booking',
    status: 'approved',
    source: 'faq',
    clientPrompt: 'Rezervacija: obrazac na webu, e-pošta, telefon. Bot ne rezervira.',
  },
  {
    id: 'cancellation',
    messageFaqId: 'cancellation',
    houseRuleId: 'cancellation',
    category: 'policy',
    status: 'approved',
    source: 'faq',
    clientPrompt: 'Besplatno otkazivanje i povrat depozita do 14 dana prije dolaska.',
  },
];

/**
 * Teme koje nisu u FAQ-u, ali jesu javno na webu (kućni red / booking.config).
 * invoice ostaje pending — forma prima naziv tvrtke, nema objavljenog R1 postupka.
 */
const FROM_HOUSE_RULES: KnowledgeTopic[] = [
  {
    id: 'deposit_payment',
    messageFaqId: null,
    houseRuleId: 'payment',
    category: 'payment',
    status: 'approved',
    source: 'house_rules',
    clientPrompt:
      'Depozit 50% pri slanju upita (DEPOSIT_PERCENT); ostatak u objektu pri dolasku.',
  },
  {
    id: 'children_ages',
    messageFaqId: null,
    houseRuleId: 'children',
    category: 'policy',
    status: 'approved',
    source: 'house_rules',
    clientPrompt:
      'Djeca svih dobi dobrodošla. Doručak: 0–2 gratis, 3–12 = 7,50 €, 13+ = 15 €. Krevetić 20 €/noć. Pomoćni ležaj 20 €/noć (Ginko 2–4 i apartmani).',
  },
  {
    id: 'smoking',
    messageFaqId: null,
    houseRuleId: 'smoking',
    category: 'policy',
    status: 'approved',
    source: 'house_rules',
    clientPrompt: 'Zabranjeno u sobama; dopušteno na terasama i u dvorištu.',
  },
  {
    id: 'min_nights',
    messageFaqId: null,
    category: 'booking',
    status: 'approved',
    source: 'booking_config',
    clientPrompt: 'MIN_NIGHTS = 1. Nema objavljenog sezonskog / vikend minimuma.',
  },
];

const PENDING_TOPICS: KnowledgeTopic[] = [
  {
    id: 'invoice',
    messageFaqId: null,
    category: 'payment',
    status: 'pending_client',
    source: null,
    clientPrompt:
      'Račun / R1 za tvrtke — postupak nije na FAQ-u ni u kućnom redu. Forma rezervacije prima naziv tvrtke. Bot ne odgovara dok klijent ne odobri copy.',
  },
];

export const CHATBOT_KNOWLEDGE: readonly KnowledgeTopic[] = [
  ...ON_SITE_FAQ,
  ...FROM_HOUSE_RULES,
  ...PENDING_TOPICS,
];

export function knowledgeByStatus(status: KnowledgeStatus): KnowledgeTopic[] {
  return CHATBOT_KNOWLEDGE.filter((t) => t.status === status);
}

export function topicsReadyForBot(): KnowledgeTopic[] {
  return CHATBOT_KNOWLEDGE.filter((t) => t.status === 'approved');
}

export function topicsWithConflicts(): KnowledgeTopic[] {
  return CHATBOT_KNOWLEDGE.filter((t) => (t.conflicts?.length ?? 0) > 0);
}
