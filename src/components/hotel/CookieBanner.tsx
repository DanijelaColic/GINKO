'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getStoredConsent, storeConsent } from '@/lib/consent';
import { setAnalyticsConsent } from '@/modules/analytics';

export function CookieBanner() {
  const t = useTranslations('cookieBanner');
  // Initialise from localStorage immediately — avoids a setState call inside useEffect.
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return getStoredConsent() === null;
  });

  useEffect(() => {
    // Re-apply stored consent to the analytics service on every mount.
    const stored = getStoredConsent();
    if (stored !== null) {
      setAnalyticsConsent(stored === 'accepted');
    }
  }, []);

  function accept() {
    storeConsent('accepted');
    setAnalyticsConsent(true);
    setVisible(false);
  }

  function decline() {
    storeConsent('declined');
    setAnalyticsConsent(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t('ariaLabel')}
      className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-xl rounded-2xl border border-stone/20 bg-white p-5 shadow-lg sm:left-auto sm:right-6 sm:max-w-sm"
    >
      <p className="text-sm text-text/80 leading-relaxed mb-4">
        {t('body')}{' '}
        <Link href="/cookies" className="font-medium text-accent hover:underline">
          {t('learnMore')}
        </Link>
      </p>
      <div className="flex gap-2">
        <button
          onClick={accept}
          className="flex-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          {t('accept')}
        </button>
        <button
          onClick={decline}
          className="flex-1 rounded-full border border-stone/30 px-4 py-2 text-sm font-medium text-text/70 transition-colors hover:border-text/40"
        >
          {t('decline')}
        </button>
      </div>
    </div>
  );
}
