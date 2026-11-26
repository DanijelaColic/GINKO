-- Read-only provjera prije migracije 021_booking_overlap_exclusion.sql.
-- Ne mijenja podatke, ne dodaje constraint i ne zaključava retke za pisanje.
-- Pokreni cijeli upit u Supabase SQL Editoru i vrati sve retke.
--
-- occupancy_unit je isto pravilo kao u migraciji:
--   ginko-spa-1 i ginko-spa-2 → unit:7460
--   svaki drugi room_slug → room:<slug>
-- Aktivno = pending ili confirmed. cancelled se ne broji.
-- Raspon je [check_in, check_out): dan odlaska ne blokira sljedeći dolazak.

with labeled as (
  select
    id,
    room_slug,
    status,
    deposit_paid,
    payment_hold_until,
    check_in,
    check_out,
    case
      when room_slug in ('ginko-spa-1', 'ginko-spa-2') then 'unit:7460'
      else 'room:' || room_slug
    end as occupancy_unit
  from public.bookings
),
pairs as (
  select
    a.id as a_id,
    b.id as b_id,
    a.occupancy_unit,
    a.room_slug as a_slug,
    b.room_slug as b_slug,
    a.status as a_status,
    b.status as b_status,
    a.deposit_paid as a_deposit_paid,
    b.deposit_paid as b_deposit_paid,
    a.payment_hold_until as a_hold_until,
    b.payment_hold_until as b_hold_until,
    a.check_in as a_check_in,
    a.check_out as a_check_out,
    b.check_in as b_check_in,
    b.check_out as b_check_out
  from labeled a
  join labeled b
    on a.id < b.id
   and a.occupancy_unit = b.occupancy_unit
   and a.status in ('pending', 'confirmed')
   and b.status in ('pending', 'confirmed')
   and daterange(a.check_in, a.check_out, '[)')
       && daterange(b.check_in, b.check_out, '[)')
)
select *
from (
  select
    'status' as kind,
    status as key,
    null::text as detail,
    count(*)::text as n,
    null::text as extra
  from labeled
  group by status

  union all

  select
    'room_slug',
    room_slug,
    occupancy_unit,
    count(*)::text,
    null
  from labeled
  group by room_slug, occupancy_unit

  union all

  select
    'unknown_room_slug',
    room_slug,
    occupancy_unit,
    count(*)::text,
    'slug nije u rooms.config'
  from labeled
  where room_slug not in (
    'ginko-1',
    'ginko-2',
    'ginko-3',
    'ginko-4',
    'ginko-5',
    'ginko-6',
    'ginko-spa-1',
    'ginko-spa-2'
  )
  group by room_slug, occupancy_unit

  union all

  select
    'unknown_status',
    status,
    null,
    count(*)::text,
    'status nije pending, confirmed ni cancelled'
  from labeled
  where status not in ('pending', 'confirmed', 'cancelled')
  group by status

  union all

  select
    'overlap',
    'REZ-' || upper(left(a_id::text, 8)),
    'REZ-' || upper(left(b_id::text, 8)),
    occupancy_unit,
    format(
      '%s %s paid=%s hold=%s %s→%s  ||  %s %s paid=%s hold=%s %s→%s',
      a_slug,
      a_status,
      a_deposit_paid,
      coalesce(a_hold_until::text, 'null'),
      a_check_in,
      a_check_out,
      b_slug,
      b_status,
      b_deposit_paid,
      coalesce(b_hold_until::text, 'null'),
      b_check_in,
      b_check_out
    )
  from pairs

  union all

  select
    'overlap_count',
    'active_pairs',
    null,
    count(*)::text,
    case
      when count(*) = 0 then 'constraint se smije dodati'
      else 'migraciju nemoj pokretati dok se parovi ne raščiste'
    end
  from pairs
) report
order by kind, key;
