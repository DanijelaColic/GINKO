'use client';

import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  CHAT_ASSISTANT_MODE,
  CHAT_LAUNCHER_ENABLED,
  buildWhatsAppHref,
} from '@/modules/chatbot';
import ChatWidget from '@/components/hotel/ChatWidget';

/**
 * Javni chat: FAQ widget (default) ili opcionalni WhatsApp FAB.
 * Skriven na /admin.
 */
export default function ChatLauncher() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('navbar');

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  if (CHAT_ASSISTANT_MODE === 'disabled') {
    return null;
  }

  if (CHAT_ASSISTANT_MODE === 'widget') {
    return <ChatWidget />;
  }

  if (!CHAT_LAUNCHER_ENABLED) {
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
