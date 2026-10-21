-- =============================================================================
-- ROLLBACK — restore room_media from room_media_backup_20261020
-- =============================================================================
-- Use ONLY if 011_room_media_webp.sql was applied and you need the previous
-- 8-row cover set back.
--
-- Restores original UUIDs (id) and all columns from the dated backup table.
-- Scoped delete: only the 8 Ginko listing rooms (same allow-list as migration).
-- =============================================================================

begin;

do $$
begin
  if to_regclass('public.room_media_backup_20261020') is null then
    raise exception
      'Abort: room_media_backup_20261020 missing — cannot rollback.';
  end if;
end $$;

-- Remove current media for the 8 known listings only
delete from room_media m
using rooms r
where m.room_id = r.id
  and r.slug in (
    'ginko-1',
    'ginko-2',
    'ginko-3',
    'ginko-4',
    'ginko-5',
    'ginko-6',
    'ginko-spa-1',
    'ginko-spa-2'
  );

-- Restore exact previous rows (including original ids)
insert into room_media (id, room_id, src, alt_text, sort_order, is_cover, created_at)
select
  b.id,
  b.room_id,
  b.src,
  b.alt_text,
  b.sort_order,
  b.is_cover,
  b.created_at
from room_media_backup_20261020 b
join rooms r on r.id = b.room_id
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
  spa1_bad integer;
begin
  select count(*) into n
  from room_media m
  join rooms r on r.id = m.room_id
  where r.slug in (
    'ginko-1','ginko-2','ginko-3','ginko-4',
    'ginko-5','ginko-6','ginko-spa-1','ginko-spa-2'
  );

  -- Pre-migration production state was 8 cover rows
  if n <> (select count(*) from room_media_backup_20261020) then
    raise exception
      'Abort rollback: restored count (%) != backup count (%).',
      n, (select count(*) from room_media_backup_20261020);
  end if;

  raise notice 'Rollback OK: restored % room_media row(s) from backup.', n;
end $$;

commit;

-- Optional: drop backup after you are sure you no longer need it
-- drop table if exists room_media_backup_20261020;
