-- =============================================================================
-- BACKUP ONLY — room_media → room_media_backup_20261020
-- =============================================================================
-- Purpose: Snapshot all current room_media rows (including id + all columns)
--          BEFORE applying 011_room_media_webp.sql
--
-- DO NOT run the migration until this backup has succeeded and been verified.
--
-- Idempotency: if room_media_backup_20261020 already exists, this script
-- ABORTS and does not overwrite it. To intentionally replace a backup, drop
-- the table manually first (only if you are sure).
-- =============================================================================

begin;

do $$
declare
  existing_count integer;
begin
  if to_regclass('public.room_media_backup_20261020') is not null then
    select count(*) into existing_count from room_media_backup_20261020;
    raise exception
      'Abort: room_media_backup_20261020 already exists (% row(s)). Refusing to overwrite. Drop it manually only if you intentionally want a new backup.',
      existing_count;
  end if;
end $$;

create table room_media_backup_20261020 as
select
  id,
  room_id,
  src,
  alt_text,
  sort_order,
  is_cover,
  created_at
from room_media
order by room_id, sort_order, id;

do $$
declare
  n integer;
begin
  select count(*) into n from room_media_backup_20261020;
  raise notice 'room_media_backup_20261020 row count = %', n;
  if n = 0 then
    raise exception
      'Abort: backup captured 0 rows from room_media. Unexpected for production; refusing to continue.';
  end if;
  -- Current known production seed size
  if n <> 8 then
    raise warning
      'Backup has % rows (expected 8 for current production seed). Review before running migration.',
      n;
  end if;
end $$;

commit;

-- Verification queries (run after commit):
--   select count(*) from room_media_backup_20261020;  -- expect 8
--   select r.slug, b.id, b.src, b.sort_order, b.is_cover, b.created_at
--   from room_media_backup_20261020 b
--   join rooms r on r.id = b.room_id
--   order by r.sort_order, b.sort_order;
