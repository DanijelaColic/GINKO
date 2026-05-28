// New — Singleton server-side Stripe client with typed env validation.
// Import `stripe` from this module anywhere server-side Stripe SDK calls are needed.
// Never import this in client components or expose the secret key to the browser.

import Stripe from 'stripe';

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'Nedostaje STRIPE_SECRET_KEY u .env.local. ' +
        'Dodaj Stripe secret key (sk_test_... ili sk_live_...) u env varijable.',
    );
  }
  return key;
}

// Module-level singleton — reused across server-side requests in the same process.
let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(getStripeSecretKey(), {
      // Pinned API version — matches stripe@22.x. Update deliberately when upgrading.
      apiVersion: '2026-05-27.dahlia',
      typescript: true,
    });
  }
  return _stripe;
}

// ── Client-side publishable key ───────────────────────────────────
// Safe to call in server components/API routes to forward to the browser.
export function getStripePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      'Nedostaje NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY u .env.local.',
    );
  }
  return key;
}

// ── Webhook secret ────────────────────────────────────────────────
export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      'Nedostaje STRIPE_WEBHOOK_SECRET u .env.local. ' +
        'Generiraj ga u Stripe Dashboard → Webhooks → Add endpoint.',
    );
  }
  return secret;
}
