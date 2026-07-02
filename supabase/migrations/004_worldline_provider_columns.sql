-- Rename Stripe-specific payment columns to provider-neutral names (Worldline migration).
-- Run in Supabase SQL Editor after 003_payments.sql.

alter table payment_intents
  rename column stripe_payment_intent_id to provider_payment_id;

alter table payment_transactions
  rename column stripe_charge_id to provider_transaction_id;

alter table webhook_events
  rename column stripe_event_id to provider_event_id;

comment on column payment_intents.provider_payment_id is
  'Worldline hostedCheckoutId (or legacy Stripe pi_/cs_ id)';

comment on column payment_transactions.provider_transaction_id is
  'Worldline payment/refund id (or legacy Stripe charge/refund id)';

comment on column webhook_events.provider_event_id is
  'Worldline webhook event id (or legacy Stripe evt_ id)';
