'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { getStoredConsent } from '@/lib/consent';
import { getAnalyticsConsent, setAnalyticsConsent } from '@/modules/analytics';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? '';

/**
 * Loads GA4 only when:
 * - NEXT_PUBLIC_GA_MEASUREMENT_ID is set
 * - user accepted analytics cookies
 */
export default function AnalyticsScripts() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    function sync() {
      const stored = getStoredConsent();
      if (stored === 'accepted') setAnalyticsConsent(true);
      if (stored === 'declined') setAnalyticsConsent(false);
      setEnabled(Boolean(GA_ID) && getAnalyticsConsent());
    }

    sync();
    window.addEventListener('ginko:analytics-consent', sync);
    return () => window.removeEventListener('ginko:analytics-consent', sync);
  }, []);

  if (!enabled || !GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('consent', 'default', { analytics_storage: 'granted' });
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
