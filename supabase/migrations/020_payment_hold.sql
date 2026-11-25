-- Privremena blokada neplaćene rezervacije i jedna aktivna Saferpay sesija.
-- Ne otkazuje postojeće redove (payment_hold_until ostaje NULL dok ga app ne postavi).
-- Ne dira MyRent. Ne radi Capture/Refund. Cron se NE zakazuje ovom migracijom.

alter table bookings
  add column if not exists payment_hold_until timestamptz,
  add column if not exists payment_hold_released_at timestamptz,
  add column if not exists payment_finalizing_at timestamptz,
  add column if not exists payment_finalizing_intent_id uuid;

comment on column bookings.payment_hold_until is
  'Termin je blokiran barem do ovog trenutka. NULL = stari red, cron ga ne oslobađa.';
comment on column bookings.payment_finalizing_at is
  'Compare-and-set: Capture je u tijeku. Cron ne otkazuje dok guard ne istekne.';

create index if not exists bookings_payment_hold_due_idx
  on bookings (payment_hold_until)
  where status = 'pending' and deposit_paid = false and payment_hold_until is not null;

-- Jedan otvoreni payment intent po rezervaciji (drugi insert padne i u utrci).
create unique index if not exists payment_intents_one_open_per_booking
  on payment_intents (booking_id)
  where status in (
    'creating',
    'requires_payment_method',
    'requires_confirmation',
    'requires_action',
    'processing',
    'requires_capture'
  );

create table if not exists payment_admin_alerts (
  id                 uuid primary key default gen_random_uuid(),
  booking_id         uuid references bookings(id) on delete cascade,
  payment_intent_id  uuid,
  kind               text not null check (kind in (
    'late_authorization_voided',
    'late_capture_refunded',
    'late_payment_needs_review'
  )),
  message            text not null,
  created_at         timestamptz not null default now()
);

alter table payment_admin_alerts enable row level security;

drop policy if exists "Service role full access payment_admin_alerts"
  on payment_admin_alerts;
create policy "Service role full access payment_admin_alerts"
  on payment_admin_alerts using (true) with check (true);

-- ── claim: jedna sesija, FOR UPDATE ──────────────────────────────

create or replace function public.claim_booking_payment_session(
  p_booking_id uuid,
  p_amount integer,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  b bookings%rowtype;
  open_row payment_intents%rowtype;
  new_id uuid;
  exp_at timestamptz;
  payable boolean;
  stale_creating boolean;
begin
  select * into b from bookings where id = p_booking_id for update;
  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;
  if b.status = 'cancelled' then
    return jsonb_build_object('result', 'cancelled');
  end if;
  if b.status = 'confirmed' or b.deposit_paid is true then
    return jsonb_build_object('result', 'already_paid');
  end if;

  select * into open_row
  from payment_intents
  where booking_id = p_booking_id
    and status in (
      'creating',
      'requires_payment_method',
      'requires_confirmation',
      'requires_action',
      'processing',
      'requires_capture'
    )
  order by created_at desc
  for update
  limit 1;

  if found then
    stale_creating :=
      open_row.status = 'creating'
      and coalesce(open_row.metadata->>'saferpay_token', '') = ''
      and open_row.created_at <= now() - interval '2 minutes';

    if stale_creating then
      update payment_intents
      set status = 'cancelled', updated_at = now()
      where id = open_row.id and status = 'creating';
    else
      begin
        if coalesce(open_row.metadata->>'saferpay_redirect_expires_at', '') <> '' then
          exp_at := (open_row.metadata->>'saferpay_redirect_expires_at')::timestamptz;
        else
          exp_at := null;
        end if;
      exception when others then
        exp_at := null;
      end;

      if open_row.status = 'creating' and coalesce(open_row.metadata->>'saferpay_token', '') = '' then
        payable := open_row.created_at > now() - interval '2 minutes';
      elsif exp_at is not null then
        payable := exp_at > now();
      elsif coalesce(open_row.metadata->>'saferpay_redirect_expires_at', '') <> '' and exp_at is null then
        payable := true;
      else
        payable := open_row.created_at > now() - interval '1 hour';
      end if;

      if payable then
        return jsonb_build_object('result', 'session_active', 'intent_id', open_row.id);
      end if;

      if coalesce(open_row.metadata->>'saferpay_token', '') <> '' then
        return jsonb_build_object(
          'result', 'needs_assert',
          'intent_id', open_row.id,
          'order_id', open_row.metadata->>'order_id'
        );
      end if;

      return jsonb_build_object('result', 'session_active', 'intent_id', open_row.id);
    end if;
  end if;

  insert into payment_intents (
    booking_id,
    provider_payment_id,
    amount,
    currency,
    status,
    metadata
  ) values (
    p_booking_id,
    'creating:' || gen_random_uuid()::text,
    p_amount,
    coalesce(nullif(p_currency, ''), 'eur'),
    'creating',
    jsonb_build_object('claimed_at', now())
  )
  returning id into new_id;

  update bookings
  set payment_hold_until = greatest(
    coalesce(payment_hold_until, now() + interval '30 minutes'),
    now() + interval '30 minutes'
  )
  where id = p_booking_id;

  return jsonb_build_object('result', 'claimed', 'intent_id', new_id);
end;
$$;

create or replace function public.supersede_booking_payment_session(
  p_booking_id uuid,
  p_intent_id uuid,
  p_amount integer,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  b bookings%rowtype;
  closed int;
  still uuid;
begin
  select * into b from bookings where id = p_booking_id for update;
  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;
  if b.status = 'cancelled' then
    return jsonb_build_object('result', 'cancelled');
  end if;
  if b.status = 'confirmed' or b.deposit_paid is true then
    return jsonb_build_object('result', 'already_paid');
  end if;

  update payment_intents
  set status = 'cancelled', updated_at = now()
  where id = p_intent_id
    and booking_id = p_booking_id
    and status in (
      'creating',
      'requires_payment_method',
      'requires_confirmation',
      'requires_action',
      'processing',
      'requires_capture'
    );

  GET DIAGNOSTICS closed = ROW_COUNT;

  select id into still
  from payment_intents
  where booking_id = p_booking_id
    and status in (
      'creating',
      'requires_payment_method',
      'requires_confirmation',
      'requires_action',
      'processing',
      'requires_capture'
    )
  limit 1;

  if still is not null then
    return jsonb_build_object('result', 'session_active', 'intent_id', still);
  end if;

  return public.claim_booking_payment_session(p_booking_id, p_amount, p_currency);
end;
$$;

create or replace function public.complete_booking_payment_claim(
  p_intent_id uuid,
  p_token text,
  p_order_id text,
  p_redirect_expires timestamptz,
  p_hold_until timestamptz,
  p_metadata jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  booking uuid;
  updated int;
begin
  update payment_intents
  set
    status = 'requires_payment_method',
    provider_payment_id = p_token,
    metadata = coalesce(metadata, '{}'::jsonb)
      || coalesce(p_metadata, '{}'::jsonb)
      || jsonb_build_object(
        'order_id', p_order_id,
        'saferpay_token', p_token,
        'saferpay_redirect_expires_at', p_redirect_expires,
        'provider', 'saferpay'
      ),
    updated_at = now()
  where id = p_intent_id
    and status = 'creating'
  returning booking_id into booking;

  GET DIAGNOSTICS updated = ROW_COUNT;
  if updated <> 1 then
    return false;
  end if;

  update bookings
  set payment_hold_until = greatest(
    coalesce(payment_hold_until, p_hold_until),
    p_hold_until
  )
  where id = booking;

  return true;
end;
$$;

create or replace function public.abort_booking_payment_claim(p_intent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update payment_intents
  set status = 'cancelled', updated_at = now()
  where id = p_intent_id
    and status = 'creating';
end;
$$;

-- Samo jedan poziv smije ući u Capture, uključujući isti intent.
-- Svježi finalizing blokira paralelni Capture. Ako proces stane, novi
-- pokušaj smije proći tek nakon 10 minuta. To je dulje od Saferpay
-- processing timeouta (100 s). Ako je prvi Capture već uspio, Saferpay
-- tada vraća TRANSACTION_ALREADY_CAPTURED i ne naplaćuje drugi put.
create or replace function public.begin_deposit_capture(
  p_booking_id uuid,
  p_intent_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  b bookings%rowtype;
  updated int;
begin
  select * into b from bookings where id = p_booking_id for update;
  if not found or b.status = 'cancelled' then
    return 'void_released';
  end if;
  if b.status = 'confirmed' or b.deposit_paid is true then
    return 'void_duplicate';
  end if;

  if exists (
    select 1 from payment_intents
    where booking_id = p_booking_id
      and id <> p_intent_id
      and status = 'succeeded'
  ) then
    return 'void_duplicate';
  end if;

  perform 1 from payment_intents where id = p_intent_id for update;

  if exists (
    select 1 from payment_intents
    where id = p_intent_id and status = 'succeeded'
  ) then
    return 'already_succeeded';
  end if;

  update bookings
  set
    payment_finalizing_at = now(),
    payment_finalizing_intent_id = p_intent_id
  where id = p_booking_id
    and status = 'pending'
    and deposit_paid = false
    and (
      payment_finalizing_at is null
      or payment_finalizing_at < now() - interval '10 minutes'
    );

  GET DIAGNOSTICS updated = ROW_COUNT;
  if updated = 1 then
    return 'proceed';
  end if;
  return 'in_progress';
end;
$$;

create or replace function public.clear_deposit_finalizing(
  p_booking_id uuid,
  p_intent_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update bookings
  set payment_finalizing_at = null,
      payment_finalizing_intent_id = null
  where id = p_booking_id
    and payment_finalizing_intent_id = p_intent_id;
end;
$$;

-- Atomski otkaz: 0 redova ako je netko u međuvremenu potvrdio ili ušao u Capture.
create or replace function public.release_unpaid_booking_hold(p_booking_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated int;
begin
  update bookings
  set
    status = 'cancelled',
    payment_hold_released_at = now(),
    payment_finalizing_at = null,
    payment_finalizing_intent_id = null
  where id = p_booking_id
    and status = 'pending'
    and deposit_paid = false
    and payment_hold_until is not null
    and payment_hold_until <= now()
    and (
      payment_finalizing_at is null
      or payment_finalizing_at < now() - interval '10 minutes'
    );

  GET DIAGNOSTICS updated = ROW_COUNT;
  return updated = 1;
end;
$$;

revoke all on function public.claim_booking_payment_session(uuid, integer, text) from public, anon, authenticated;
revoke all on function public.supersede_booking_payment_session(uuid, uuid, integer, text) from public, anon, authenticated;
revoke all on function public.complete_booking_payment_claim(uuid, text, text, timestamptz, timestamptz, jsonb) from public, anon, authenticated;
revoke all on function public.abort_booking_payment_claim(uuid) from public, anon, authenticated;
revoke all on function public.begin_deposit_capture(uuid, uuid) from public, anon, authenticated;
revoke all on function public.clear_deposit_finalizing(uuid, uuid) from public, anon, authenticated;
revoke all on function public.release_unpaid_booking_hold(uuid) from public, anon, authenticated;

grant execute on function public.claim_booking_payment_session(uuid, integer, text) to service_role;
grant execute on function public.supersede_booking_payment_session(uuid, uuid, integer, text) to service_role;
grant execute on function public.complete_booking_payment_claim(uuid, text, text, timestamptz, timestamptz, jsonb) to service_role;
grant execute on function public.abort_booking_payment_claim(uuid) to service_role;
grant execute on function public.begin_deposit_capture(uuid, uuid) to service_role;
grant execute on function public.clear_deposit_finalizing(uuid, uuid) to service_role;
grant execute on function public.release_unpaid_booking_hold(uuid) to service_role;
