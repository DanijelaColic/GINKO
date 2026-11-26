-- Jedna aktivna rezervacija po smještajnoj jedinici i preklapajućem terminu.
-- Primjenjuje se prije Saferpay Initializea: drugi INSERT/UPDATE pada odmah.
--
-- pending i confirmed zauzimaju termin, uključujući pending kojem je
-- payment_hold_until već prošao i pending s plaćenim depozitom.
-- cancelled ne zauzima. Cron i dalje jedini prelazi pending → cancelled.
-- [check_in, check_out): dan odlaska ostaje slobodan za sljedeći dolazak.
-- ginko-spa-1 i ginko-spa-2 dijele unit:7460 (MyRent object_id).
-- Ostali room_slug su zasebne jedinice, pa nepoznati slug ne spoji tuđe sobe.
--
-- Ne dira Saferpay, MyRent ni payment hold. Ako aktivni parovi već postoje,
-- migracija se prekida i ništa se ne zapiše (cijeli file je jedna transakcija).

create schema if not exists extensions;

create extension if not exists btree_gist with schema extensions;

set local search_path = public, extensions;

do $guard$
declare
  overlap_count int;
  sample text;
begin
  if exists (
    select 1
    from public.bookings
    where status not in ('pending', 'confirmed', 'cancelled')
  ) then
    raise exception
      'bookings.status ima vrijednost izvan pending, confirmed, cancelled. Constraint nije dodan.';
  end if;

  select count(*) into overlap_count
  from public.bookings a
  join public.bookings b
    on a.id < b.id
   and a.status in ('pending', 'confirmed')
   and b.status in ('pending', 'confirmed')
   and (
     case
       when a.room_slug in ('ginko-spa-1', 'ginko-spa-2') then 'unit:7460'
       else 'room:' || a.room_slug
     end
   ) = (
     case
       when b.room_slug in ('ginko-spa-1', 'ginko-spa-2') then 'unit:7460'
       else 'room:' || b.room_slug
     end
   )
   and daterange(a.check_in, a.check_out, '[)')
       && daterange(b.check_in, b.check_out, '[)');

  if overlap_count > 0 then
    select string_agg(line, E'\n') into sample
    from (
      select format(
        'REZ-%s %s %s %s→%s  |  REZ-%s %s %s %s→%s',
        upper(left(a.id::text, 8)),
        a.room_slug,
        a.status,
        a.check_in,
        a.check_out,
        upper(left(b.id::text, 8)),
        b.room_slug,
        b.status,
        b.check_in,
        b.check_out
      ) as line
      from public.bookings a
      join public.bookings b
        on a.id < b.id
       and a.status in ('pending', 'confirmed')
       and b.status in ('pending', 'confirmed')
       and (
         case
           when a.room_slug in ('ginko-spa-1', 'ginko-spa-2') then 'unit:7460'
           else 'room:' || a.room_slug
         end
       ) = (
         case
           when b.room_slug in ('ginko-spa-1', 'ginko-spa-2') then 'unit:7460'
           else 'room:' || b.room_slug
         end
       )
       and daterange(a.check_in, a.check_out, '[)')
           && daterange(b.check_in, b.check_out, '[)')
      limit 10
    ) found;

    raise exception
      'Aktivnih preklapanja: %. Constraint nije dodan. Prvo otkaži jedan red iz para.%',
      overlap_count,
      E'\n' || coalesce(sample, '');
  end if;
end
$guard$;

alter table public.bookings
  add column if not exists occupancy_unit text
  generated always as (
    case
      when room_slug in ('ginko-spa-1', 'ginko-spa-2') then 'unit:7460'
      else 'room:' || room_slug
    end
  ) stored;

alter table public.bookings
  drop constraint if exists bookings_no_active_overlap;

alter table public.bookings
  add constraint bookings_no_active_overlap
  exclude using gist (
    occupancy_unit with =,
    daterange(check_in, check_out, '[)') with &&
  )
  where (status in ('pending', 'confirmed'));

comment on column public.bookings.occupancy_unit is
  'Fizička jedinica za zabranu preklapanja. SPA 1 i SPA 2 su unit:7460.';

comment on constraint bookings_no_active_overlap on public.bookings is
  'pending i confirmed ne smiju dijeliti jedinicu i [check_in, check_out). cancelled smije.';
