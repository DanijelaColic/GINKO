-- Ginko Sobe – initial schema
-- Adapted from VV/src/modules/booking-admin/schema.sql
-- Changes: apartment_slug → room_slug, added rooms/room_translations/room_media tables,
--          added blocked_dates + seasonal_rates for availability/pricing.
-- Run in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- ─────────────────────────────────────────────────────────────────
-- ROOMS
-- ─────────────────────────────────────────────────────────────────

create table if not exists rooms (
  id             uuid    default gen_random_uuid() primary key,
  slug           text    not null unique,
  capacity       integer not null default 2,
  size_m2        integer,
  beds           text,
  floor          integer,
  price_off_season  numeric(10, 2) not null default 0,
  price_high_season numeric(10, 2) not null default 0,
  min_nights     integer not null default 2,
  amenities      text[]  not null default '{}',
  sort_order     integer not null default 0,
  active         boolean not null default true,
  created_at     timestamptz default now()
);

create unique index if not exists rooms_slug_idx on rooms (slug);
create index if not exists rooms_sort_idx on rooms (sort_order asc);

-- ─────────────────────────────────────────────────────────────────
-- ROOM TRANSLATIONS  (hr / en / de)
-- ─────────────────────────────────────────────────────────────────

create table if not exists room_translations (
  id          uuid default gen_random_uuid() primary key,
  room_id     uuid not null references rooms (id) on delete cascade,
  locale      text not null check (locale in ('hr', 'en', 'de')),
  name        text not null,
  tagline     text,
  description text,
  unique (room_id, locale)
);

create index if not exists room_translations_room_id_idx on room_translations (room_id);

-- ─────────────────────────────────────────────────────────────────
-- ROOM MEDIA
-- ─────────────────────────────────────────────────────────────────

create table if not exists room_media (
  id           uuid    default gen_random_uuid() primary key,
  room_id      uuid    not null references rooms (id) on delete cascade,
  src          text    not null,
  alt_text     text,
  sort_order   integer not null default 0,
  is_cover     boolean not null default false,
  created_at   timestamptz default now()
);

create index if not exists room_media_room_id_idx on room_media (room_id, sort_order asc);

-- ─────────────────────────────────────────────────────────────────
-- BOOKINGS
-- ─────────────────────────────────────────────────────────────────

create table if not exists bookings (
  id              uuid      default gen_random_uuid() primary key,
  room_slug       text      not null,
  check_in        date      not null,
  check_out       date      not null,
  nights          integer   not null,
  guest_name      text      not null,
  guest_email     text      not null,
  guest_phone     text,
  adults          integer   not null default 1,
  children        integer   not null default 0,
  price_per_night numeric(10, 2) not null,
  total_price     numeric(10, 2) not null,
  deposit         numeric(10, 2) not null,
  status          text      not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  locale          text      not null default 'hr',
  deposit_paid    boolean   not null default false,
  notes           text,
  created_at      timestamptz default now(),

  -- Prevent check_out <= check_in at DB level
  constraint bookings_dates_valid check (check_out > check_in)
);

-- Composite index for fast overlap queries per room
create index if not exists bookings_room_status_idx
  on bookings (room_slug, status);

create index if not exists bookings_dates_idx
  on bookings (check_in, check_out);

-- ─────────────────────────────────────────────────────────────────
-- BLOCKED DATES  (owner manual blocks, maintenance, etc.)
-- ─────────────────────────────────────────────────────────────────

create table if not exists blocked_dates (
  id         uuid default gen_random_uuid() primary key,
  room_slug  text not null,
  check_in   date not null,
  check_out  date not null,
  reason     text,
  created_at timestamptz default now(),

  constraint blocked_dates_valid check (check_out > check_in)
);

create index if not exists blocked_dates_room_idx on blocked_dates (room_slug);

-- ─────────────────────────────────────────────────────────────────
-- SEASONAL RATES  (optional price overrides per date range)
-- ─────────────────────────────────────────────────────────────────

create table if not exists seasonal_rates (
  id             uuid default gen_random_uuid() primary key,
  room_slug      text         not null,
  valid_from     date         not null,
  valid_to       date         not null,
  price_per_night numeric(10, 2) not null,
  label          text,
  created_at     timestamptz  default now(),

  constraint seasonal_rates_valid check (valid_to > valid_from)
);

create index if not exists seasonal_rates_room_idx on seasonal_rates (room_slug, valid_from, valid_to);

-- ─────────────────────────────────────────────────────────────────
-- GALLERY ITEMS  (adapted 1:1 from VV schema)
-- ─────────────────────────────────────────────────────────────────

create table if not exists gallery_items (
  id           uuid    default gen_random_uuid() primary key,
  src          text    not null unique,
  category_key text    not null default 'exterior',
  media_type   text    not null check (media_type in ('image', 'video')),
  alt_text     text,
  title        text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

alter table gallery_items
  add constraint if not exists gallery_items_category_key_check
  check (
    category_key in (
      'exterior',
      'rooms',
      'common-areas',
      'surroundings'
    )
  );

create index if not exists gallery_items_sort_idx
  on gallery_items (sort_order asc, created_at asc);

-- ─────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────

alter table rooms            enable row level security;
alter table room_translations enable row level security;
alter table room_media        enable row level security;
alter table bookings          enable row level security;
alter table blocked_dates     enable row level security;
alter table seasonal_rates    enable row level security;
alter table gallery_items     enable row level security;

-- Public read for rooms (frontend listing)
create policy "Public read rooms"
  on rooms for select using (active = true);

create policy "Public read room_translations"
  on room_translations for select using (true);

create policy "Public read room_media"
  on room_media for select using (true);

-- Public read for gallery
create policy "Public read gallery_items"
  on gallery_items for select using (true);

-- Bookings: only service role can read/write (guest creates via API, never direct)
create policy "Service role full access bookings"
  on bookings using (true) with check (true);

create policy "Service role full access blocked_dates"
  on blocked_dates using (true) with check (true);

create policy "Service role full access seasonal_rates"
  on seasonal_rates using (true) with check (true);

create policy "Service role full access rooms"
  on rooms using (true) with check (true);

create policy "Service role full access room_translations"
  on room_translations using (true) with check (true);

create policy "Service role full access room_media"
  on room_media using (true) with check (true);

create policy "Service role full access gallery_items"
  on gallery_items using (true) with check (true);

-- ─────────────────────────────────────────────────────────────────
-- STORAGE BUCKET (gallery media — public read)
-- ─────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('gallery-media', 'gallery-media', true)
on conflict (id) do nothing;

create policy "Public can read gallery media"
  on storage.objects for select
  using (bucket_id = 'gallery-media');

create policy "Service role can write gallery media"
  on storage.objects for all
  using (bucket_id = 'gallery-media')
  with check (bucket_id = 'gallery-media');
