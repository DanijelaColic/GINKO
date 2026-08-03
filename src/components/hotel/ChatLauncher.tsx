'use client';

import { MessageCircle } from 'lucide-react';
import {
  CHAT_ASSISTANT_MODE,
  CHAT_LAUNCHER_ENABLED,
  CHAT_WHATSAPP_PREFILL_HR,
} from '@/modules/chatbot';
import { CONTACT_WHATSAPP_URL } from '@/modules/booking/booking.config';

function buildWhatsAppHref(): string {
  const base = CONTACT_WHATSAPP_URL.replace(/\?.*$/, '');
  const text = encodeURIComponent(CHAT_WHATSAPP_PREFILL_HR);
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}text=${text}`;
}

/**
 * Opcionalni floating CTA. Uključen samo ako je
 * NEXT_PUBLIC_CHAT_LAUNCHER=1 i mode !== disabled.
 * widget mode: placeholder (još nije implementiran).
 */
export default function ChatLauncher() {
  if (!CHAT_LAUNCHER_ENABLED || CHAT_ASSISTANT_MODE === 'disabled') {
    return null;
  }

  if (CHAT_ASSISTANT_MODE === 'widget') {
    // Slot za budući embedded widget — bez UI dok nije spreman
    return null;
  }

  return (
    <a
      href={buildWhatsAppHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat na WhatsAppu"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <MessageCircle size={26} aria-hidden />
    </a>
  );
}
