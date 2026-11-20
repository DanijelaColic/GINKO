-- MyRent aktivacija: prvi put kad je rent viđen kao active=Y.
-- Ne mijenja bookings. Ne dira postojeće retke (nema UPDATE / backfill).
-- live_ok NIJE dokaz da je kalendar zatvoren — seen_active_at ostaje NULL
-- dok neki read (rent_get / rent_list) stvarno vidi active=Y.
-- Primjena: ručno u Supabase SQL editoru, tek nakon odobrenja.
-- Dok stupac ne postoji, inbound-cancel ne otkazuje (fail-closed).

alter table myrent_booking_sync
  add column if not exists seen_active_at timestamptz;

alter table myrent_booking_sync
  add column if not exists calendar_blocked boolean;

alter table myrent_booking_sync
  add column if not exists activation_checked_at timestamptz;

alter table myrent_booking_sync
  add column if not exists activation_issue text;

comment on column myrent_booking_sync.seen_active_at is
  'Prvi trenutak kad je MyRent rent pročitan kao active=Y. NULL = nikad potvrđeno aktivna. Ne popunjavati iz live_ok.';

comment on column myrent_booking_sync.calendar_blocked is
  'true samo ako su sve noći [check_in, check_out) zauzete u get_calendar. NULL = nije provjereno. false = provjereno i otvoreno.';

comment on column myrent_booking_sync.activation_issue is
  'not_yet_active | calendar_open | check_failed. NULL = nema otvorenog upozorenja.';

-- Stari live_ok redovi ostaju s NULL seen_active_at dok ih read ne potvrdi.
-- Nema backfilla za rent 2521332 niti bilo koji drugi red.
