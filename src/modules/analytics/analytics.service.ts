import type { AnalyticsEvent } from './analytics.types';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Consent state — updated by CookieBanner via setAnalyticsConsent().
// Defaults to false; no events fire until the user accepts.
let _consentGranted = false;

export function setAnalyticsConsent(value: boolean): void {
  _consentGranted = value;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ginko:analytics-consent', { detail: { granted: value } }),
    );
  }
}

export function getAnalyticsConsent(): boolean {
  return _consentGranted;
}

/**
 * Dispatch a typed analytics event.
 * Events are silently dropped when consent is not granted.
 * Forwards to GA4 when NEXT_PUBLIC_GA_MEASUREMENT_ID + gtag are available.
 */
export function track(event: AnalyticsEvent): void {
  if (!_consentGranted) return;

  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics]', event.name, event.properties);
  }

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', event.name, event.properties);
  }
}
