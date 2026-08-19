'use client';

import { useTranslations } from 'next-intl';
import { Share2 } from 'lucide-react';

export default function ShareButton() {
  const t = useTranslations('homePage');

  function handleShare() {
    if (typeof navigator === 'undefined') return;
    if (navigator.share) {
      navigator.share({
        title: t('shareTitle'),
        url: window.location.href,
      });
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  }

  return (
    <button
      onClick={handleShare}
      className="shrink-0 flex items-center gap-1.5 border border-stone text-muted hover:border-primary hover:text-primary text-xs font-medium px-3 py-2 rounded-lg transition-colors"
      aria-label={t('shareAria')}
    >
      <Share2 size={14} />
      <span className="hidden sm:inline">{t('share')}</span>
    </button>
  );
}
