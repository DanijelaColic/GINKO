/**
 * Chatbot / asistent — konfiguracija.
 *
 * Faza 2: in-page FAQ widget (default).
 * WhatsApp FAB ostaje opcionalan (Navbar već ima WhatsApp).
 */

import { CONTACT_WHATSAPP_URL } from '@/modules/booking/booking.config';

export type ChatAssistantMode = 'whatsapp' | 'disabled' | 'widget';

const MODE_RAW = (process.env.NEXT_PUBLIC_CHAT_MODE ?? 'widget').toLowerCase();

export const CHAT_ASSISTANT_MODE: ChatAssistantMode =
  MODE_RAW === 'disabled' || MODE_RAW === 'widget' || MODE_RAW === 'whatsapp'
    ? MODE_RAW
    : 'widget';

/**
 * Floating WhatsApp launcher (donji desni kut). Default OFF — Navbar već ima WhatsApp.
 * Uključi: NEXT_PUBLIC_CHAT_LAUNCHER=1 i NEXT_PUBLIC_CHAT_MODE=whatsapp
 */
export const CHAT_LAUNCHER_ENABLED =
  process.env.NEXT_PUBLIC_CHAT_LAUNCHER === '1' ||
  process.env.NEXT_PUBLIC_CHAT_LAUNCHER === 'true';

/** Prefill poruka za wa.me — po localeu */
export const CHAT_WHATSAPP_PREFILL: Record<string, string> = {
  hr: 'Pozdrav! Imam pitanje u vezi smještaja u Ginko Boutique Rooms & Wellness.',
  en: 'Hello! I have a question about staying at Ginko Boutique Rooms & Wellness.',
  cs: 'Ahoj! Mám dotaz k ubytování v Ginko Boutique Rooms & Wellness.',
};

export function getWhatsAppPrefill(locale: string): string {
  return CHAT_WHATSAPP_PREFILL[locale] ?? CHAT_WHATSAPP_PREFILL.hr;
}

export function buildWhatsAppHref(locale: string): string {
  const base = CONTACT_WHATSAPP_URL.replace(/\?.*$/, '');
  const text = encodeURIComponent(getWhatsAppPrefill(locale));
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}text=${text}`;
}

/** @deprecated Koristi getWhatsAppPrefill(locale) */
export const CHAT_WHATSAPP_PREFILL_HR = CHAT_WHATSAPP_PREFILL.hr;

/** Čipovi u widgetu — FAQ id-evi, isti tekst kao na naslovnici */
export const CHATBOT_SUGGESTION_IDS = [
  'parking',
  'breakfast',
  'wifi',
  'checkinTimes',
  'pets',
  'wellness',
  'cancellation',
] as const;

export type ChatbotSuggestionId = (typeof CHATBOT_SUGGESTION_IDS)[number];
