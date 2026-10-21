-- =============================================================================
-- 011_room_media_webp.sql
-- =============================================================================
-- Sync room_media with optimised WebP galleries from rooms.config.ts
-- (8 listings, 51 image references).
--
-- PREREQUISITE (manual, before this file):
--   Run supabase/scripts/011_room_media_webp_backup.sql and verify
--   room_media_backup_20261020 has the expected rows (currently 8).
--
-- This migration:
--   - Refuses to proceed if the dated backup table is missing or empty
--   - Deletes room_media ONLY for the 8 known Ginko room slugs
--   - Inserts the full WebP set (51 rows)
--   - Asserts counts + spa-1 / spa-2 wellness rules, then commits
--
-- Does NOT touch gallery_items, rooms, or filesystem images.
-- Does NOT run automatically against production without your approval.
-- =============================================================================

begin;

-- ── 0) Guard: backup must exist ─────────────────────────────────────────────
do $$
declare
  backup_count integer;
begin
  if to_regclass('public.room_media_backup_20261020') is null then
    raise exception
      'Abort: room_media_backup_20261020 does not exist. Run supabase/scripts/011_room_media_webp_backup.sql first.';
  end if;

  select count(*) into backup_count from room_media_backup_20261020;
  if backup_count < 1 then
    raise exception
      'Abort: room_media_backup_20261020 is empty (count=%). Refusing to replace room_media.',
      backup_count;
  end if;

  raise notice 'Backup OK: room_media_backup_20261020 has % row(s)', backup_count;
end $$;

-- ── 1) Target room set (explicit allow-list) ────────────────────────────────
create temporary table _webp_target_rooms (
  slug text primary key,
  room_id uuid not null
) on commit drop;

insert into _webp_target_rooms (slug, room_id)
select r.slug, r.id
from rooms r
where r.slug in (
  'ginko-1',
  'ginko-2',
  'ginko-3',
  'ginko-4',
  'ginko-5',
  'ginko-6',
  'ginko-spa-1',
  'ginko-spa-2'
);

do $$
declare
  n integer;
begin
  select count(*) into n from _webp_target_rooms;
  if n <> 8 then
    raise exception
      'Abort: expected 8 target rooms, found %. Check rooms.slug values.',
      n;
  end if;
end $$;

-- ── 2) Desired media (51 rows) — source of truth = rooms.config.ts ──────────
create temporary table _webp_desired (
  slug text not null,
  src text not null,
  alt_text text,
  sort_order integer not null,
  is_cover boolean not null default false,
  primary key (slug, sort_order)
) on commit drop;

insert into _webp_desired (slug, src, alt_text, sort_order, is_cover) values
  -- ginko-1 (2)
  ('ginko-1', '/images/rooms/ginko-1/01-cover.webp', 'Ginko 1', 1, true),
  ('ginko-1', '/images/shared/bathroom-wood-shower-01.webp', 'Ginko 1 — kupaonica', 2, false),

  -- ginko-2 (6)
  ('ginko-2', '/images/rooms/ginko-2/01-cover.webp', 'Ginko 2', 1, true),
  ('ginko-2', '/images/rooms/ginko-2/02-bedroom-angle.webp', 'Ginko 2 — spavaća soba', 2, false),
  ('ginko-2', '/images/rooms/ginko-2/03-bedroom-leds.webp', 'Ginko 2 — spavaća soba', 3, false),
  ('ginko-2', '/images/rooms/ginko-2/04-entry.webp', 'Ginko 2 — ulaz', 4, false),
  ('ginko-2', '/images/shared/bathroom-sink-detail-01.webp', 'Ginko 2 — kupaonica detalj', 5, false),
  ('ginko-2', '/images/shared/bathroom-wood-shower-01.webp', 'Ginko 2 — kupaonica', 6, false),

  -- ginko-3 (7)
  ('ginko-3', '/images/rooms/ginko-3/01-cover.webp', 'Ginko 3', 1, true),
  ('ginko-3', '/images/rooms/ginko-3/02-bedroom-sofa.webp', 'Ginko 3 — spavaća soba', 2, false),
  ('ginko-3', '/images/rooms/ginko-3/03-bedroom-closet.webp', 'Ginko 3 — ormar', 3, false),
  ('ginko-3', '/images/rooms/ginko-3/04-desk-tv.webp', 'Ginko 3 — radni stol', 4, false),
  ('ginko-3', '/images/rooms/ginko-1/01-cover.webp', 'Ginko 3 — spavaća soba (široki kadar)', 5, false),
  ('ginko-3', '/images/shared/bathroom-sink-detail-01.webp', 'Ginko 3 — kupaonica detalj', 6, false),
  ('ginko-3', '/images/shared/amenity-kettle-01.webp', 'Ginko 3 — čaj i kava', 7, false),

  -- ginko-4 (6)
  ('ginko-4', '/images/rooms/ginko-4/01-cover.webp', 'Ginko 4', 1, true),
  ('ginko-4', '/images/rooms/ginko-4/02-bedroom-desk.webp', 'Ginko 4 — spavaća soba', 2, false),
  ('ginko-4', '/images/rooms/ginko-4/03-bedroom-angle.webp', 'Ginko 4 — spavaća soba', 3, false),
  ('ginko-4', '/images/rooms/ginko-4/04-bedroom-wardrobe.webp', 'Ginko 4 — ormar', 4, false),
  ('ginko-4', '/images/shared/bathroom-marble-01.webp', 'Ginko 4 — kupaonica', 5, false),
  ('ginko-4', '/images/shared/amenity-kettle-01.webp', 'Ginko 4 — čaj i kava', 6, false),

  -- ginko-5 (7)
  ('ginko-5', '/images/rooms/ginko-5/01-cover.webp', 'Ginko 5', 1, true),
  ('ginko-5', '/images/rooms/ginko-5/02-bedroom.webp', 'Ginko 5 — spavaća soba', 2, false),
  ('ginko-5', '/images/rooms/ginko-5/03-desk-amenities.webp', 'Ginko 5 — radni stol', 3, false),
  ('ginko-5', '/images/rooms/ginko-5/04-entry-fridge.webp', 'Ginko 5 — ulaz', 4, false),
  ('ginko-5', '/images/rooms/ginko-5/05-closet-hall.webp', 'Ginko 5 — ormar', 5, false),
  ('ginko-5', '/images/shared/bathroom-marble-01.webp', 'Ginko 5 — kupaonica', 6, false),
  ('ginko-5', '/images/shared/amenity-kettle-01.webp', 'Ginko 5 — čaj i kava', 7, false),

  -- ginko-6 (6)
  ('ginko-6', '/images/rooms/ginko-6/01-cover.webp', 'Ginko 6', 1, true),
  ('ginko-6', '/images/rooms/ginko-6/02-desk-storage.webp', 'Ginko 6 — radni stol', 2, false),
  ('ginko-6', '/images/rooms/ginko-6/03-layout-bathroom.webp', 'Ginko 6 — raspored', 3, false),
  ('ginko-6', '/images/rooms/ginko-6/04-bathroom.webp', 'Ginko 6 — kupaonica', 4, false),
  ('ginko-6', '/images/rooms/ginko-6/05-detail.webp', 'Ginko 6 — detalj', 5, false),
  ('ginko-6', '/images/rooms/ginko-6/06-terrace.webp', 'Ginko 6 — terasa', 6, false),

  -- ginko-spa-2 Wellness (10) — jacuzzi cover FIRST
  ('ginko-spa-2', '/images/rooms/apartment/wellness-01-jacuzzi-cover.webp', 'Wellness Apartman — jacuzzi', 1, true),
  ('ginko-spa-2', '/images/rooms/apartment/wellness-02-sauna-jacuzzi.webp', 'Wellness Apartman — sauna i jacuzzi', 2, false),
  ('ginko-spa-2', '/images/rooms/apartment/wellness-03-jacuzzi-night.webp', 'Wellness Apartman — jacuzzi', 3, false),
  ('ginko-spa-2', '/images/rooms/apartment/01-living.webp', 'Wellness Apartman — dnevni boravak', 4, false),
  ('ginko-spa-2', '/images/rooms/apartment/02-bedroom.webp', 'Wellness Apartman — spavaća soba', 5, false),
  ('ginko-spa-2', '/images/rooms/apartment/03-bedroom-detail.webp', 'Wellness Apartman — spavaća soba detalj', 6, false),
  ('ginko-spa-2', '/images/rooms/apartment/04-kitchen.webp', 'Wellness Apartman — kuhinja', 7, false),
  ('ginko-spa-2', '/images/rooms/apartment/05-detail-shelf.webp', 'Wellness Apartman — detalj', 8, false),
  ('ginko-spa-2', '/images/rooms/apartment/06-terrace-romance.webp', 'Wellness Apartman — terasa', 9, false),
  ('ginko-spa-2', '/images/rooms/apartment/07-welcome-cart.webp', 'Wellness Apartman — welcome', 10, false),

  -- ginko-spa-1 standard (7) — NO wellness-* paths
  ('ginko-spa-1', '/images/rooms/apartment/01-living.webp', 'Apartman — dnevni boravak', 1, true),
  ('ginko-spa-1', '/images/rooms/apartment/02-bedroom.webp', 'Apartman — spavaća soba', 2, false),
  ('ginko-spa-1', '/images/rooms/apartment/03-bedroom-detail.webp', 'Apartman — spavaća soba detalj', 3, false),
  ('ginko-spa-1', '/images/rooms/apartment/04-kitchen.webp', 'Apartman — kuhinja', 4, false),
  ('ginko-spa-1', '/images/rooms/apartment/05-detail-shelf.webp', 'Apartman — detalj', 5, false),
  ('ginko-spa-1', '/images/rooms/apartment/06-terrace-romance.webp', 'Apartman — terasa', 6, false),
  ('ginko-spa-1', '/images/rooms/apartment/07-welcome-cart.webp', 'Apartman — welcome', 7, false);

do $$
declare
  desired_count integer;
begin
  select count(*) into desired_count from _webp_desired;
  if desired_count <> 51 then
    raise exception 'Abort: desired media set must have 51 rows, found %.', desired_count;
  end if;
end $$;

-- Pre-flight: spa rules on desired set
do $$
declare
  spa1_wellness integer;
  spa2_cover text;
begin
  select count(*) into spa1_wellness
  from _webp_desired
  where slug = 'ginko-spa-1' and src like '%/wellness-%';

  if spa1_wellness <> 0 then
    raise exception 'Abort: ginko-spa-1 desired set contains % wellness path(s).', spa1_wellness;
  end if;

  select src into spa2_cover
  from _webp_desired
  where slug = 'ginko-spa-2' and is_cover = true;

  if spa2_cover is distinct from '/images/rooms/apartment/wellness-01-jacuzzi-cover.webp' then
    raise exception 'Abort: ginko-spa-2 cover must be wellness-01-jacuzzi-cover.webp, got %.', spa2_cover;
  end if;
end $$;

-- ── 3) Scoped delete (only the 8 allow-listed rooms) ────────────────────────
delete from room_media m
using _webp_target_rooms t
where m.room_id = t.room_id;

-- ── 4) Insert new set ───────────────────────────────────────────────────────
insert into room_media (room_id, src, alt_text, sort_order, is_cover)
select
  t.room_id,
  d.src,
  d.alt_text,
  d.sort_order,
  d.is_cover
from _webp_desired d
join _webp_target_rooms t on t.slug = d.slug
order by t.slug, d.sort_order;

-- ── 5) Post-flight assertions (rollback entire transaction on failure) ──────
do $$
declare
  total_count integer;
  cover_count integer;
  spa1_wellness integer;
  spa2_cover text;
  spa1_cover text;
  per_slug record;
  expected jsonb := '{
    "ginko-1": 2,
    "ginko-2": 6,
    "ginko-3": 7,
    "ginko-4": 6,
    "ginko-5": 7,
    "ginko-6": 6,
    "ginko-spa-1": 7,
    "ginko-spa-2": 10
  }'::jsonb;
  expected_n integer;
  actual_n integer;
begin
  select count(*) into total_count
  from room_media m
  join rooms r on r.id = m.room_id
  where r.slug in (
    'ginko-1','ginko-2','ginko-3','ginko-4',
    'ginko-5','ginko-6','ginko-spa-1','ginko-spa-2'
  );

  if total_count <> 51 then
    raise exception 'Abort: expected 51 room_media rows for Ginko listings, found %.', total_count;
  end if;

  -- Exactly one cover per target room
  for per_slug in
    select r.slug, count(*) filter (where m.is_cover) as covers
    from rooms r
    join room_media m on m.room_id = r.id
    where r.slug in (
      'ginko-1','ginko-2','ginko-3','ginko-4',
      'ginko-5','ginko-6','ginko-spa-1','ginko-spa-2'
    )
    group by r.slug
  loop
    if per_slug.covers <> 1 then
      raise exception 'Abort: % must have exactly 1 cover, found %.',
        per_slug.slug, per_slug.covers;
    end if;

    expected_n := (expected ->> per_slug.slug)::integer;
    select count(*) into actual_n
    from room_media m
    join rooms r on r.id = m.room_id
    where r.slug = per_slug.slug;

    if actual_n <> expected_n then
      raise exception 'Abort: % must have % media rows, found %.',
        per_slug.slug, expected_n, actual_n;
    end if;
  end loop;

  select count(*) into spa1_wellness
  from room_media m
  join rooms r on r.id = m.room_id
  where r.slug = 'ginko-spa-1'
    and (m.src like '%/wellness-%' or m.src like '%ginko-spa-2/01-cover%');

  if spa1_wellness <> 0 then
    raise exception 'Abort: ginko-spa-1 has % forbidden wellness/old-cover path(s).', spa1_wellness;
  end if;

  select m.src into spa1_cover
  from room_media m
  join rooms r on r.id = m.room_id
  where r.slug = 'ginko-spa-1' and m.is_cover = true;

  if spa1_cover is distinct from '/images/rooms/apartment/01-living.webp' then
    raise exception 'Abort: ginko-spa-1 cover must be 01-living.webp, got %.', spa1_cover;
  end if;

  select m.src into spa2_cover
  from room_media m
  join rooms r on r.id = m.room_id
  where r.slug = 'ginko-spa-2' and m.is_cover = true;

  if spa2_cover is distinct from '/images/rooms/apartment/wellness-01-jacuzzi-cover.webp' then
    raise exception 'Abort: ginko-spa-2 cover must be wellness-01-jacuzzi-cover.webp, got %.', spa2_cover;
  end if;

  select count(*) into cover_count
  from room_media m
  join rooms r on r.id = m.room_id
  where r.slug in (
    'ginko-1','ginko-2','ginko-3','ginko-4',
    'ginko-5','ginko-6','ginko-spa-1','ginko-spa-2'
  )
    and m.is_cover = true;

  if cover_count <> 8 then
    raise exception 'Abort: expected 8 cover rows, found %.', cover_count;
  end if;

  raise notice '011_room_media_webp: OK — 51 rows, spa rules satisfied.';
end $$;

commit;
