/**
 * Knowledge base za budući chatbot / FAQ sync.
 * Izvor istine: messages/{locale}.json → travelerQuestions.faq.*
 *
 * status:
 * - draft_on_site — već na webu, čeka klijentovo ODABRENJE
 * - pending_client — tema predložena, nema odobrenog odgovora
 * - approved — smije ići u bot (nakon klijenta)
 */

export type KnowledgeStatus = 'draft_on_site' | 'pending_client' | 'approved';

export type KnowledgeTopic = {
  id: string;
  /** next-intl key under travelerQuestions.faq.{id} — null ako još nije na stranici */
  messageFaqId: string | null;
  category: 'stay' | 'amenities' | 'location' | 'booking' | 'policy' | 'payment';
  status: KnowledgeStatus;
  /** Kratka napomena što pitati klijenta */
  clientPrompt: string;
};

/** FAQ već na home (TravelerQuestionsSection) — draft do odobrenja */
const ON_SITE_FAQ: KnowledgeTopic[] = [
  {
    id: 'parking',
    messageFaqId: 'parking',
    category: 'amenities',
    status: 'draft_on_site',
    clientPrompt: 'Potvrdi: besplatan parking, broj mjesta, rezervacija mjesta?',
  },
  {
    id: 'breakfast',
    messageFaqId: 'breakfast',
    category: 'amenities',
    status: 'draft_on_site',
    clientPrompt: 'Cijena doručka, sati, je li obavezan uz rezervaciju?',
  },
  {
    id: 'wifi',
    messageFaqId: 'wifi',
    category: 'amenities',
    status: 'draft_on_site',
    clientPrompt: 'Wi-Fi brzina / pokrivenost OK?',
  },
  {
    id: 'therms',
    messageFaqId: 'therms',
    category: 'location',
    status: 'draft_on_site',
    clientPrompt: 'Udaljenost do toplica točna?',
  },
  {
    id: 'attractions',
    messageFaqId: 'attractions',
    category: 'location',
    status: 'draft_on_site',
    clientPrompt: 'Lista atrakcija — dodati/maknuti?',
  },
  {
    id: 'pets',
    messageFaqId: 'pets',
    category: 'policy',
    status: 'draft_on_site',
    clientPrompt: 'Kućni ljubimci: cijena čišćenja, zabranjene sobe (spa)?',
  },
  {
    id: 'checkin',
    messageFaqId: 'checkin',
    category: 'stay',
    status: 'draft_on_site',
    clientPrompt: 'Self check-in / kod / kasni dolazak — točan postupak?',
  },
  {
    id: 'checkinTimes',
    messageFaqId: 'checkinTimes',
    category: 'stay',
    status: 'draft_on_site',
    clientPrompt: 'Check-in 14–22 / check-out 10 — potvrdi',
  },
  {
    id: 'wellness',
    messageFaqId: 'wellness',
    category: 'amenities',
    status: 'draft_on_site',
    clientPrompt: 'Wellness samo uz spa apartman — potvrdi',
  },
  {
    id: 'families',
    messageFaqId: 'families',
    category: 'stay',
    status: 'draft_on_site',
    clientPrompt: 'Obiteljske sobe / kapaciteti — uskladi s ginko-spa 2+2',
  },
  {
    id: 'booking',
    messageFaqId: 'booking',
    category: 'booking',
    status: 'draft_on_site',
    clientPrompt: 'Kanali rezervacije: web, email, telefon, Booking/Airbnb?',
  },
];

/** Predložene teme za bot — prazne dok klijent ne odgovori */
const PENDING_TOPICS: KnowledgeTopic[] = [
  {
    id: 'cancellation',
    messageFaqId: null,
    category: 'policy',
    status: 'pending_client',
    clientPrompt: 'Politika otkazivanja / refund depozita (rokovi, %)',
  },
  {
    id: 'deposit_payment',
    messageFaqId: null,
    category: 'payment',
    status: 'pending_client',
    clientPrompt: '50% depozit, kartica vs IBAN, ostatak na dolasku — potvrdi',
  },
  {
    id: 'children_ages',
    messageFaqId: null,
    category: 'policy',
    status: 'pending_client',
    clientPrompt: 'Djeca: od koje dobi se broje u kapacitet, pomoćni ležaj, krevetić',
  },
  {
    id: 'smoking',
    messageFaqId: null,
    category: 'policy',
    status: 'pending_client',
    clientPrompt: 'Pušenje / balkon?',
  },
  {
    id: 'min_nights',
    messageFaqId: null,
    category: 'booking',
    status: 'pending_client',
    clientPrompt: 'Minimalni broj noćenja (sezona / vikend)?',
  },
  {
    id: 'invoice',
    messageFaqId: null,
    category: 'payment',
    status: 'pending_client',
    clientPrompt: 'Račun / R1 za tvrtke — postupak',
  },
];

export const CHATBOT_KNOWLEDGE: readonly KnowledgeTopic[] = [
  ...ON_SITE_FAQ,
  ...PENDING_TOPICS,
];

export function knowledgeByStatus(status: KnowledgeStatus): KnowledgeTopic[] {
  return CHATBOT_KNOWLEDGE.filter((t) => t.status === status);
}

export function topicsReadyForBot(): KnowledgeTopic[] {
  return CHATBOT_KNOWLEDGE.filter((t) => t.status === 'approved');
}
