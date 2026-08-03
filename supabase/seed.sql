-- Ginko Sobe – local/dev seed
-- Prefer migration 010_seed_ginko_rooms.sql for catalog (already applied on prod).
-- This file only inserts sample bookings if rooms already exist.

-- Sample bookings (safe to re-run; uses future dates)
insert into bookings (
  room_slug, check_in, check_out, nights,
  guest_name, guest_email, adults, children,
  price_per_night, total_price, deposit, status, locale
)
select * from (values
  ('ginko-1', (current_date + 30)::date, (current_date + 34)::date, 4,
   'Test Gost', 'test1@example.com', 2, 0, 60::numeric, 240::numeric, 72::numeric, 'confirmed', 'hr'),
  ('ginko-2', (current_date + 40)::date, (current_date + 45)::date, 5,
   'Test Family', 'test2@example.com', 2, 1, 60::numeric, 300::numeric, 90::numeric, 'pending', 'en'),
  ('ginko-spa-1', (current_date + 50)::date, (current_date + 55)::date, 5,
   'Test Gast', 'test3@example.com', 2, 0, 90::numeric, 450::numeric, 135::numeric, 'confirmed', 'de')
) as v(
  room_slug, check_in, check_out, nights,
  guest_name, guest_email, adults, children,
  price_per_night, total_price, deposit, status, locale
)
where exists (select 1 from rooms r where r.slug = v.room_slug)
  and not exists (
    select 1 from bookings b
    where b.guest_email = v.guest_email
      and b.check_in = v.check_in
      and b.room_slug = v.room_slug
  );
