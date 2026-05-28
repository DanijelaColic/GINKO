import type { AnalyticsEvent } from './analytics.types';

// Consent state — updated by CookieBanner via setAnalyticsConsent().
// Defaults to false; no events fire until the user accepts.
let _consentGranted = false;

export function setAnalyticsConsent(value: boolean): void {
  _consentGranted = value;
}

export function getAnalyticsConsent(): boolean {
  return _consentGranted;
}

/**
 * Dispatch a typed analytics event.
 * Events are silently dropped when consent is not granted.
 * Swap the console.log body for any analytics provider (GA4, Plausible, PostHog, etc.).
 */
export function track(event: AnalyticsEvent): void {
  if (!_consentGranted) return;

  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics]', event.name, event.properties);
  }

  // TODO (Phase 7+): forward to analytics provider
  // e.g. window.gtag?.('event', event.name, event.properties);
}
