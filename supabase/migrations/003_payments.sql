-- Phase 10: Stripe payment foundation tables
-- Run in Supabase SQL Editor after 002_channels.sql

-- ─────────────────────────────────────────────────────────────────
-- PAYMENT INTENTS
-- One record per Stripe PaymentIntent, linked to a booking.
-- amount is in the smallest currency unit (EUR cent = 1/100 EUR).
-- ─────────────────────────────────────────────────────────────────

create table if not exists payment_intents (
  id                       uuid    default gen_random_uuid() primary key,
  booking_id               uuid    references bookings(id) on delete cascade,
  stripe_payment_intent_id text    not null unique,
  amount                   integer not null,          -- e.g. 15000 = €150.00
  currency                 text    not null default 'eur',
  status                   text    not null default 'requires_payment_method',
    -- Stripe statuses: requires_payment_method | requires_confirmation |
    --                  requires_action | processing | requires_capture |
    --                  cancelled | succeeded
  client_secret            text,                      -- used by Stripe.js on frontend
  metadata                 jsonb   not null default '{}',
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

create index if not exists payment_intents_booking_idx on payment_intents (booking_id);
create index if not exists payment_intents_status_idx  on payment_intents (status);

-- ─────────────────────────────────────────────────────────────────
-- PAYMENT TRANSACTIONS
-- Individual charge / refund events linked to a PaymentIntent.
-- ─────────────────────────────────────────────────────────────────

create table if not exists payment_transactions (
  id                  uuid    default gen_random_uuid() primary key,
  payment_intent_id   uuid    references payment_intents(id) on delete cascade,
  stripe_charge_id    text    unique,
  type                text    not null,               -- 'charge' | 'refund'
  amount              integer not null,
  currency            text    not null default 'eur',
  status              text    not null,               -- 'succeeded' | 'failed' | 'pending'
  failure_reason      text,
  metadata            jsonb   not null default '{}',
  created_at          timestamptz default now()
);

create index if not exists payment_transactions_intent_idx on payment_transactions (payment_intent_id);

-- ─────────────────────────────────────────────────────────────────
-- WEBHOOK EVENTS
-- Idempotent log of every Stripe webhook delivery.
-- processed = false means handler has not run yet (or failed).
-- ─────────────────────────────────────────────────────────────────

create table if not exists webhook_events (
  id              uuid    default gen_random_uuid() primary key,
  stripe_event_id text    not null unique,
  type            text    not null,                   -- e.g. 'payment_intent.succeeded'
  payload         jsonb   not null,
  processed       boolean not null default false,
  processed_at    timestamptz,
  error           text,
  created_at      timestamptz default now()
);

create index if not exists webhook_events_processed_idx on webhook_events (processed, created_at);

-- ─────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (service role bypasses; still document intent)
-- ─────────────────────────────────────────────────────────────────

alter table payment_intents     enable row level security;
alter table payment_transactions enable row level security;
alter table webhook_events       enable row level security;

create policy "Service role full access payment_intents"
  on payment_intents using (true) with check (true);

create policy "Service role full access payment_transactions"
  on payment_transactions using (true) with check (true);

create policy "Service role full access webhook_events"
  on webhook_events using (true) with check (true);
