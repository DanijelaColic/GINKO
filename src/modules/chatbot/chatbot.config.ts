/**
 * Chatbot / asistent — konfiguracija (bez embedded LLM widgeta za sada).
 *
 * Odluka (Faza 4):
 * - MVP: WhatsApp deep link (već u Navbar) + opcionalni floating launcher
 * - Kasnije: embedded widget može zamijeniti mode bez mijenjanja knowledge baze
 */

export type ChatAssistantMode = 'whatsapp' | 'disabled' | 'widget';

const MODE_RAW = (process.env.NEXT_PUBLIC_CHAT_MODE ?? 'whatsapp').toLowerCase();

export const CHAT_ASSISTANT_MODE: ChatAssistantMode =
  MODE_RAW === 'disabled' || MODE_RAW === 'widget' || MODE_RAW === 'whatsapp'
    ? MODE_RAW
    : 'whatsapp';

/**
 * Floating launcher (donji desni kut). Default OFF — Navbar već ima WhatsApp.
 * Uključi: NEXT_PUBLIC_CHAT_LAUNCHER=1
 */
export const CHAT_LAUNCHER_ENABLED =
  process.env.NEXT_PUBLIC_CHAT_LAUNCHER === '1' ||
  process.env.NEXT_PUBLIC_CHAT_LAUNCHER === 'true';

/** Prefill poruka za wa.me (HR default; locale override kasnije) */
export const CHAT_WHATSAPP_PREFILL_HR =
  'Pozdrav! Imam pitanje u vezi smještaja u Ginko Boutique Rooms & Wellness.';
