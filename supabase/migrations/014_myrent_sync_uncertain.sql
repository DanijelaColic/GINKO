-- MyRent sync: status uncertain + trajna zabrana auto-resenda.
-- Pokreni RUČNO u Supabase SQL Editoru (ne automatski iz agenta).
-- Ne mijenja postojeće bookings / payment retke.

-- Dozvoli status uncertain (timeout / nejasan odgovor — moguće da je MyRent zaprimio).
alter table myrent_booking_sync
  drop constraint if exists myrent_booking_sync_status_check;

alter table myrent_booking_sync
  add constraint myrent_booking_sync_status_check
  check (status in (
    'pending',
    'mocked_ok',
    'live_ok',
    'skipped_duplicate',
    'skipped_disabled',
    'uncertain',
    'failed'
  ));

comment on column myrent_booking_sync.status is
  'mocked_ok = simulacija. live_ok = potvrđen MyRent upis. uncertain = moguće zaprimljeno, bez auto-resenda.';

-- Atomski lock: blokira confirmed_live_sync=true I status=uncertain (trajno).
-- mocked_ok i dalje smije ponovno steći lock za kasniji live sync.
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
    and myrent_booking_sync.status is distinct from 'uncertain'
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

  if v_row.confirmed_live_sync = true then
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

comment on function acquire_myrent_booking_sync_lock(uuid, text, integer, integer) is
  'Atomski sync lock. Terminalno: confirmed_live_sync ili status=uncertain (bez auto-resenda).';

revoke all on function acquire_myrent_booking_sync_lock(uuid, text, integer, integer) from public;
grant execute on function acquire_myrent_booking_sync_lock(uuid, text, integer, integer) to service_role;
