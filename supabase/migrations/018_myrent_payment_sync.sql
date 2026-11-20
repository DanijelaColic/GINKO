-- MyRent payment_add evidencija (depozit → MyRent Payments).
-- Pokreni RUČNO u Supabase SQL Editoru (ne automatski iz agenta).
-- Ne mijenja bookings / postojeće myrent_booking_sync retke.

create table if not exists myrent_payment_sync (
  id                    uuid primary key default gen_random_uuid(),
  booking_id            uuid not null references bookings(id) on delete cascade,
  status                text not null default 'pending'
    check (status in (
      'pending',
      'live_ok',
      'skipped_disabled',
      'skipped_duplicate',
      'skipped_already_paid',
      'uncertain',
      'failed'
    )),
  myrent_rent_id        text not null,
  payment_method_id     integer not null,
  amount                numeric(10, 2) not null,
  currency_id           integer not null default 2,
  last_error            text,
  attempt_count         integer not null default 0,
  sync_lock_until       timestamptz,
  last_attempted_at     timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint myrent_payment_sync_booking_unique unique (booking_id)
);

create index if not exists myrent_payment_sync_status_idx
  on myrent_payment_sync (status);

create index if not exists myrent_payment_sync_attention_idx
  on myrent_payment_sync (status)
  where status in ('uncertain', 'failed');

comment on table myrent_payment_sync is
  'Evidencija Ginko→MyRent payment_add (depozit). uncertain = bez auto-resenda.';

alter table myrent_payment_sync enable row level security;

-- Jedan paralelni pokušaj; uncertain / live_ok trajno blokiraju novi POST.
create or replace function acquire_myrent_payment_sync_lock(
  p_booking_id uuid,
  p_myrent_rent_id text,
  p_payment_method_id integer,
  p_amount numeric,
  p_lock_ttl_seconds integer default 60
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row myrent_payment_sync%rowtype;
  v_lock_until timestamptz :=
    now() + make_interval(secs => greatest(p_lock_ttl_seconds, 1));
begin
  insert into myrent_payment_sync (
    booking_id,
    status,
    myrent_rent_id,
    payment_method_id,
    amount,
    attempt_count,
    sync_lock_until,
    last_attempted_at,
    updated_at
  ) values (
    p_booking_id,
    'pending',
    p_myrent_rent_id,
    p_payment_method_id,
    p_amount,
    0,
    v_lock_until,
    now(),
    now()
  )
  on conflict (booking_id) do update set
    myrent_rent_id = excluded.myrent_rent_id,
    payment_method_id = excluded.payment_method_id,
    amount = excluded.amount,
    sync_lock_until = excluded.sync_lock_until,
    updated_at = now()
  where
    myrent_payment_sync.status is distinct from 'live_ok'
    and myrent_payment_sync.status is distinct from 'uncertain'
    and (
      myrent_payment_sync.sync_lock_until is null
      or myrent_payment_sync.sync_lock_until < now()
    )
  returning * into v_row;

  if found then
    return jsonb_build_object(
      'acquired', true,
      'reason', null,
      'row', to_jsonb(v_row)
    );
  end if;

  select * into v_row
  from myrent_payment_sync
  where booking_id = p_booking_id;

  if not found then
    return jsonb_build_object(
      'acquired', false,
      'reason', 'error',
      'row', null
    );
  end if;

  if v_row.status = 'live_ok' then
    return jsonb_build_object(
      'acquired', false,
      'reason', 'already_synced',
      'row', to_jsonb(v_row)
    );
  end if;

  if v_row.status = 'uncertain' then
    return jsonb_build_object(
      'acquired', false,
      'reason', 'uncertain',
      'row', to_jsonb(v_row)
    );
  end if;

  return jsonb_build_object(
    'acquired', false,
    'reason', 'locked',
    'row', to_jsonb(v_row)
  );
end;
$$;

comment on function acquire_myrent_payment_sync_lock(uuid, text, integer, numeric, integer) is
  'Atomski lock za MyRent payment_add. live_ok i uncertain blokiraju novi POST.';

revoke all on function acquire_myrent_payment_sync_lock(uuid, text, integer, numeric, integer) from public;
grant execute on function acquire_myrent_payment_sync_lock(uuid, text, integer, numeric, integer) to service_role;