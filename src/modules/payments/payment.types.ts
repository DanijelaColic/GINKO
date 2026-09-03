// Payment foundation types — provider-agnostic (Saferpay).

// ── Database row types ────────────────────────────────────────────

export type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'cancelled'
  | 'succeeded';

export type PaymentIntent = {
  id: string;
  booking_id: string | null;
  provider_payment_id: string;
  amount: number; // in smallest currency unit (EUR cents)
  currency: string; // 'eur'
  status: PaymentIntentStatus;
  client_secret: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type TransactionType = 'charge' | 'refund';
export type TransactionStatus = 'succeeded' | 'failed' | 'pending';

export type PaymentTransaction = {
  id: string;
  payment_intent_id: string;
  provider_transaction_id: string | null;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  failure_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type WebhookEvent = {
  id: string;
  provider_event_id: string;
  type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at: string | null;
  error: string | null;
  created_at: string;
};

// ── Service-layer types ───────────────────────────────────────────

/** Input to create a new payment session for a booking deposit */
export type CreatePaymentIntentInput = {
  booking_id: string;
  /** Amount in EUR cents (e.g. 5000 = €50.00) */
  amount_cents: number;
  currency?: string;
  /** Guest UI locale — drives Saferpay Payment Page LanguageCode */
  languageCode?: string;
  metadata?: Record<string, string>;
};

/** Return shape for create + confirm flows */
export type PaymentIntentResult = {
  id: string;
  provider_payment_id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
};

/** Lightweight status snapshot returned to the frontend */
export type PaymentStatus = {
  booking_id: string;
  intent_status: PaymentIntentStatus | null;
  amount: number;
  currency: string;
  last_transaction_status: TransactionStatus | null;
};

/** Convert whole EUR amount to cents */
export function eurToCents(eur: number): number {
  return Math.round(eur * 100);
}

/** Convert cents to whole EUR amount */
export function centsToEur(cents: number): number {
  return cents / 100;
}

/** Format cents as "€150.00" */
export function formatAmount(cents: number, currency = 'eur'): string {
  return new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(centsToEur(cents));
}
