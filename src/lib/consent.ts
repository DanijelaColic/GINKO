const CONSENT_KEY = 'ginko_cookie_consent';

export type ConsentValue = 'accepted' | 'declined' | null;

export function getStoredConsent(): ConsentValue {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'accepted' || stored === 'declined') return stored;
  } catch {
    // localStorage unavailable (private browsing edge cases)
  }
  return null;
}

export function storeConsent(value: 'accepted' | 'declined'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // ignore
  }
}

export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // ignore
  }
}
