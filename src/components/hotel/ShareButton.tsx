'use client';

import { Share2 } from 'lucide-react';

export default function ShareButton() {
  function handleShare() {
    if (typeof navigator === 'undefined') return;
    if (navigator.share) {
      navigator.share({
        title: 'Ginko Boutique Rooms & Wellness Daruvar',
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
      aria-label="Podijeli link"
    >
      <Share2 size={14} />
      <span className="hidden sm:inline">Podijeli</span>
    </button>
  );
}
