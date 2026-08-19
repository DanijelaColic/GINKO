'use client';

import { MessageCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  CHAT_ASSISTANT_MODE,
  CHAT_LAUNCHER_ENABLED,
  buildWhatsAppHref,
} from '@/modules/chatbot';

/**
 * Opcionalni floating CTA. Uključen samo ako je
 * NEXT_PUBLIC_CHAT_LAUNCHER=1 i mode !== disabled.
 * widget mode: placeholder (još nije implementiran).
 */
export default function ChatLauncher() {
  const locale = useLocale();
  const t = useTranslations('navbar');

  if (!CHAT_LAUNCHER_ENABLED || CHAT_ASSISTANT_MODE === 'disabled') {
    return null;
  }

  if (CHAT_ASSISTANT_MODE === 'widget') {
    // Slot za budući embedded widget — bez UI dok nije spreman
    return null;
  }

  return (
    <a
      href={buildWhatsAppHref(locale)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('whatsapp')}
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <MessageCircle size={26} aria-hidden />
    </a>
  );
}
