-- MyRent booking sync ledger (Ginko → MyRent)
-- NE mijenja postojeće retke u bookings — samo nova tablica.
-- Pokreni RUČNO u Supabase SQL Editoru (ne automatski iz agenta).

-- ─────────────────────────────────────────────────────────────────
-- MYRENT_BOOKING_SYNC
-- Jedan red po Ginko rezervaciji. Idempotencija: UNIQUE(booking_id).
-- confirmed_live_sync = true SAMO nakon stvarnog uspješnog MyRent write-a.
-- status = mocked_ok NIJE live uspjeh.
-- sync_lock_until: zaštita od paralelnih pokušaja.
-- ─────────────────────────────────────────────────────────────────

create table if not exists myrent_booking_sync (
  id                   uuid primary key default gen_random_uuid(),
  booking_id           uuid not null references bookings(id) on delete cascade,
  status               text not null default 'pending'
    check (status in (
      'pending',
      'mocked_ok',
      'skipped_duplicate',
      'skipped_disabled',
      'failed'
    )),
  myrent_rent_id       text,
  confirmed_live_sync  boolean not null default false,
  payload_erp_id       text not null,
  object_id            integer,
  last_error           text,
  attempt_count        integer not null default 0,
  last_attempted_at    timestamptz,
  sync_lock_until      timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint myrent_booking_sync_booking_unique unique (booking_id)
);

create index if not exists myrent_booking_sync_status_idx
  on myrent_booking_sync (status);

create index if not exists myrent_booking_sync_attention_idx
  on myrent_booking_sync (confirmed_live_sync, status)
  where confirmed_live_sync = false;

comment on table myrent_booking_sync is
  'Evidencija Ginko→MyRent synca. mocked_ok ≠ live MyRent upis.';
comment on column myrent_booking_sync.confirmed_live_sync is
  'true samo nakon stvarnog uspješnog MyRent write HTTP odgovora';
comment on column myrent_booking_sync.myrent_rent_id is
  'Mock ID (mock_rent_…) ili stvarni MyRent rent id nakon live synca';
comment on column myrent_booking_sync.sync_lock_until is
  'Zaključavanje paralelnih sync pokušaja (now < sync_lock_until ⇒ zauzeto)';

-- RLS uključen, BEZ policyja: anon/authenticated nemaju pristup.
-- service_role (serverski backend) zaobilazi RLS — nema javnog USING (true).
alter table myrent_booking_sync enable row level security;

-- Atomski lock: INSERT … ON CONFLICT DO UPDATE … WHERE u jednoj transakciji.
-- RETURNING prazan ⇒ lock nije stečen (već syncano ili zaključano).
create or replace function acquire_myrent_booking_sync_lock(
  p_booking_id uuid,
  p_payload_erp_id text,
  p_object_id integer default null,
  p_lock_ttl_seconds integer default 60
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row myrent_booking_sync%rowtype;
  v_lock_until timestamptz :=
    now() + make_interval(secs => greatest(p_lock_ttl_seconds, 1));
begin
  insert into myrent_booking_sync (
    booking_id,
    status,
    confirmed_live_sync,
    payload_erp_id,
    object_id,
    attempt_count,
    sync_lock_until,
    last_attempted_at,
    updated_at
  ) values (
    p_booking_id,
    'pending',
    false,
    p_payload_erp_id,
    p_object_id,
    0,
    v_lock_until,
    now(),
    now()
  )
  on conflict (booking_id) do update set
    sync_lock_until = excluded.sync_lock_until,
    payload_erp_id = excluded.payload_erp_id,
    object_id = coalesce(excluded.object_id, myrent_booking_sync.object_id),
    updated_at = now()
  where
    myrent_booking_sync.confirmed_live_sync = false
    and myrent_booking_sync.status is distinct from 'mocked_ok'
    and (
      myrent_booking_sync.sync_lock_until is null
      or myrent_booking_sync.sync_lock_until < now()
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
  from myrent_booking_sync
  where booking_id = p_booking_id;

  if not found then
    return jsonb_build_object(
      'acquired', false,
      'reason', 'error',
      'row', null
    );
  end if;

  if v_row.confirmed_live_sync = true or v_row.status = 'mocked_ok' then
    return jsonb_build_object(
      'acquired', false,
      'reason', 'already_synced',
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

comment on function acquire_myrent_booking_sync_lock(uuid, text, integer, integer) is
  'Atomski acquire sync locka za Ginko→MyRent. Samo service_role (backend).';

revoke all on function acquire_myrent_booking_sync_lock(uuid, text, integer, integer) from public;
grant execute on function acquire_myrent_booking_sync_lock(uuid, text, integer, integer) to service_role;
