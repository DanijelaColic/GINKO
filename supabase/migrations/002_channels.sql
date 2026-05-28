-- Phase 9: iCal channel sync tables
-- Run in Supabase SQL Editor after 001_initial.sql

-- ─────────────────────────────────────────────────────────────────
-- ROOM CHANNEL MAPPINGS
-- One record per room; holds import URL + export token + sync state.
-- ─────────────────────────────────────────────────────────────────

create table if not exists room_channel_mappings (
  id               uuid    default gen_random_uuid() primary key,
  room_slug        text    not null unique,
  import_ical_url  text,                         -- external .ics URL to import from
  export_token     text    not null               -- used to build /api/ical/[token]
                           default gen_random_uuid()::text,
  sync_enabled     boolean not null default true,
  last_synced_at   timestamptz,
  last_sync_status text    check (last_sync_status in ('ok', 'error')),
  last_sync_message text,
  created_at       timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────
-- EXTERNAL CALENDAR EVENTS
-- Imported VEVENT records from external iCal feeds.
-- ends_on is exclusive (same semantics as check_out / blocked_dates.check_out).
-- ─────────────────────────────────────────────────────────────────

create table if not exists external_calendar_events (
  id           uuid    default gen_random_uuid() primary key,
  room_slug    text    not null,
  external_uid text    not null,
  starts_on    date    not null,
  ends_on      date    not null,
  source       text    not null default 'ical',  -- 'ical', 'airbnb', 'booking.com', ...
  summary      text,
  raw_payload  text,                             -- first 2000 chars of raw VEVENT block
  synced_at    timestamptz default now(),

  constraint ext_cal_dates_valid check (ends_on > starts_on),
  unique (room_slug, external_uid)
);

create index if not exists ext_cal_room_idx on external_calendar_events (room_slug, starts_on, ends_on);

-- ─────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────

alter table room_channel_mappings    enable row level security;
alter table external_calendar_events enable row level security;

-- Service role full access (all admin operations use service key)
create policy "Service role full access room_channel_mappings"
  on room_channel_mappings using (true) with check (true);

create policy "Service role full access external_calendar_events"
  on external_calendar_events using (true) with check (true);

-- Public read of external events (needed so availability API can query via service key)
-- Note: service key bypasses RLS anyway, but explicit policy documents intent.
create policy "Public read external_calendar_events"
  on external_calendar_events for select using (true);
