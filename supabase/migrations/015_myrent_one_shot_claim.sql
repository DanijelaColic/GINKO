-- Atomski jednokratni claim za lokalni MyRent one-shot live upis.
-- Trajno rezervira pravo na JEDAN HTTP pokušaj (status=uncertain).
-- Ne ovisi o sync_lock_until TTL-u.
-- Pokreni RUČNO u Supabase SQL Editoru (ne automatski iz agenta).
-- Ne mijenja bookings / payments / Vercel env.

-- Pretpostavlja da je 014 (status uncertain) već primijenjena.

create or replace function claim_myrent_one_shot_attempt(
  p_booking_id uuid,
  p_payload_erp_id text,
  p_object_id integer default null,
  p_claim_error text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row myrent_booking_sync%rowtype;
  v_claim text := coalesce(
    nullif(trim(p_claim_error), ''),
    'MYRENT_ONE_SHOT_CLAIM|' || to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') || '|' || p_booking_id::text
  );
begin
  -- Samo jedan proces smije postaviti uncertain claim.
  -- Dozvoljen transition s pending / mocked_ok / failed / skipped_* ;
  -- zabranjen s uncertain / live_ok / confirmed_live_sync.
  insert into myrent_booking_sync (
    booking_id,
    status,
    confirmed_live_sync,
    payload_erp_id,
    object_id,
    last_error,
    attempt_count,
    sync_lock_until,
    last_attempted_at,
    updated_at
  ) values (
    p_booking_id,
    'uncertain',
    false,
    p_payload_erp_id,
    p_object_id,
    v_claim,
    1,
    null,
    now(),
    now()
  )
  on conflict (booking_id) do update set
    status = 'uncertain',
    confirmed_live_sync = false,
    payload_erp_id = excluded.payload_erp_id,
    object_id = coalesce(excluded.object_id, myrent_booking_sync.object_id),
    last_error = excluded.last_error,
    attempt_count = myrent_booking_sync.attempt_count + 1,
    sync_lock_until = null,
    last_attempted_at = now(),
    updated_at = now()
  where
    myrent_booking_sync.confirmed_live_sync = false
    and myrent_booking_sync.status is distinct from 'uncertain'
    and myrent_booking_sync.status is distinct from 'live_ok'
  returning * into v_row;

  if found then
    return jsonb_build_object(
      'claimed', true,
      'reason', null,
      'row', to_jsonb(v_row)
    );
  end if;

  select * into v_row
  from myrent_booking_sync
  where booking_id = p_booking_id;

  if not found then
    return jsonb_build_object(
      'claimed', false,
      'reason', 'error',
      'row', null
    );
  end if;

  if v_row.confirmed_live_sync = true or v_row.status = 'live_ok' then
    return jsonb_build_object(
      'claimed', false,
      'reason', 'already_synced',
      'row', to_jsonb(v_row)
    );
  end if;

  if v_row.status = 'uncertain' then
    return jsonb_build_object(
      'claimed', false,
      'reason', 'already_claimed',
      'row', to_jsonb(v_row)
    );
  end if;

  return jsonb_build_object(
    'claimed', false,
    'reason', 'error',
    'row', to_jsonb(v_row)
  );
end;
$$;

comment on function claim_myrent_one_shot_attempt(uuid, text, integer, text) is
  'Atomski one-shot claim: status=uncertain trajno; samo jedan pobjednik smije slati rent_add.';

revoke all on function claim_myrent_one_shot_attempt(uuid, text, integer, text) from public;
grant execute on function claim_myrent_one_shot_attempt(uuid, text, integer, text) to service_role;
