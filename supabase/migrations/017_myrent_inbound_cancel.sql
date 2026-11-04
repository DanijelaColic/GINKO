-- MyRent → Ginko inbound cancel sync (schema + audit)
-- Pokreni RUČNO u Supabase SQL Editoru prije uključivanja Crona.
-- Zatim: supabase/scripts/myrent_inbound_cancel_cron_setup.sql
-- Aktivacija rasporeda (odvojeno odobrenje):
--   supabase/scripts/myrent_inbound_cancel_cron_activate.sql

-- GUID za pouzdan rent_get (numerički id često 404 na /user/rent_get/{id})
alter table myrent_booking_sync
  add column if not exists myrent_rent_guid text;

comment on column myrent_booking_sync.myrent_rent_guid is
  'MyRent rent GUID za GET /user/rent_get/{guid}; nullable za starije sync redove';

create index if not exists myrent_booking_sync_live_rent_idx
  on myrent_booking_sync (status, confirmed_live_sync)
  where status = 'live_ok'
    and confirmed_live_sync = true
    and myrent_rent_id is not null;

-- Audit: nikad ne pokreće refund; samo bilježi status change
create table if not exists myrent_inbound_cancel_audit (
  id               uuid primary key default gen_random_uuid(),
  booking_id       uuid not null references bookings(id) on delete cascade,
  myrent_rent_id   text not null,
  myrent_rent_guid text,
  previous_status  text not null,
  new_status       text not null default 'cancelled',
  reason           text not null,
  detected_at      timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create index if not exists myrent_inbound_cancel_audit_booking_idx
  on myrent_inbound_cancel_audit (booking_id, detected_at desc);

comment on table myrent_inbound_cancel_audit is
  'Audit MyRent→Ginko otkazivanja (active=N). Bez automatskog Saferpay refunda.';

alter table myrent_inbound_cancel_audit enable row level security;
