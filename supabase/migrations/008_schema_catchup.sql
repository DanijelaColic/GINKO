-- 008_schema_catchup.sql
-- Production was behind local migrations: guest fields (004) applied,
-- but extra bed (005), breakfast/wellness (006), and payment provider
-- renames (004_worldline) were never applied. Idempotent catch-up.

-- ── bookings: columns required by POST /api/bookings ──────────────

alter table bookings
  add column if not exists needs_extra_bed boolean not null default false;

alter table bookings
  add column if not exists breakfast_guests integer not null default 0;

alter table bookings
  add column if not exists include_wellness boolean not null default false;

comment on column bookings.needs_extra_bed is
  'Guest requested an extra bed (+20 €/night, subject to availability)';
comment on column bookings.breakfast_guests is
  'Number of guests requesting breakfast (0 = none)';
comment on column bookings.include_wellness is
  'Wellness included (true for ginko-spa-2 / wellness apartment bookings)';

-- ── payment tables: Stripe → provider-neutral column names ────────
-- Safe if already renamed (checks information_schema first).

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payment_intents'
      and column_name = 'stripe_payment_intent_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payment_intents'
      and column_name = 'provider_payment_id'
  ) then
    alter table payment_intents
      rename column stripe_payment_intent_id to provider_payment_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payment_transactions'
      and column_name = 'stripe_charge_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payment_transactions'
      and column_name = 'provider_transaction_id'
  ) then
    alter table payment_transactions
      rename column stripe_charge_id to provider_transaction_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'webhook_events'
      and column_name = 'stripe_event_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'webhook_events'
      and column_name = 'provider_event_id'
  ) then
    alter table webhook_events
      rename column stripe_event_id to provider_event_id;
  end if;
end $$;

comment on column payment_intents.provider_payment_id is
  'Saferpay Payment Page Token (or legacy Worldline/Stripe id)';
comment on column payment_transactions.provider_transaction_id is
  'Saferpay Transaction/Capture/Refund id (or legacy provider id)';
comment on column webhook_events.provider_event_id is
  'Saferpay notify id (saferpay_<orderId>_<result>) or legacy provider event id';
