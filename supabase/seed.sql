-- Ginko Sobe – seed data
-- Run AFTER 001_initial.sql migration.
-- Provides 3 rooms (matching rooms.config.ts slugs), translations, and sample bookings.

-- ─────────────────────────────────────────────────────────────────
-- ROOMS
-- ─────────────────────────────────────────────────────────────────

insert into rooms (slug, capacity, size_m2, beds, floor, price_off_season, price_high_season, min_nights, amenities, sort_order)
values
  ('zelena', 2, 22, '1 bračni krevet', 1, 70, 90, 2, '{"WiFi","Klima","TV","Hladnjak","Kuhalo za vodu","Parking"}', 1),
  ('orah',   4, 35, '1 bračni krevet + 2 pomoćna ležaja', 1, 100, 130, 2, '{"WiFi","Klima","TV","Hladnjak","Kuhalo za vodu","Parking","Terasa"}', 2),
  ('bijela', 2, 18, '1 bračni krevet', 1, 60, 80, 2, '{"WiFi","Klima","TV","Kuhalo za vodu","Parking"}', 3)
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────────
-- ROOM TRANSLATIONS
-- ─────────────────────────────────────────────────────────────────

insert into room_translations (room_id, locale, name, tagline, description)
select r.id, 'hr', 'Zelena', 'Tišina, zelenilo i jutarnji mir.',
  'ZELENA je prostrana i svjetla soba okružena prirodom. Dizajnirana za dvoje koji traže odmor daleko od vreve — s pogledom na vrt, prirodnim materijalima i tihim jutarnjim buđenjem uz ptičji pjev.'
from rooms r where r.slug = 'zelena'
on conflict (room_id, locale) do nothing;

insert into room_translations (room_id, locale, name, tagline, description)
select r.id, 'en', 'Green', 'Quiet, green, and a peaceful morning.',
  'ZELENA is a spacious, bright room surrounded by nature. Designed for two who seek rest far from the hustle — with a garden view, natural materials, and a calm morning wake-up to birdsong.'
from rooms r where r.slug = 'zelena'
on conflict (room_id, locale) do nothing;

insert into room_translations (room_id, locale, name, tagline, description)
select r.id, 'de', 'Grün', 'Stille, Grün und ruhige Morgen.',
  'ZELENA ist ein geräumiges, helles Zimmer umgeben von Natur. Für zwei konzipiert, die Erholung abseits des Trubels suchen — mit Gartenblick und ruhigem Morgenerwachen.'
from rooms r where r.slug = 'zelena'
on conflict (room_id, locale) do nothing;

insert into room_translations (room_id, locale, name, tagline, description)
select r.id, 'hr', 'Orah', 'Prostranstvo i toplina za cijelu obitelj.',
  'ORAH je obiteljska soba s karakterom. Dva kreveta, prostrana kupaoonica i terasa s pogledom na okolno zelenilo. Savršena za obitelji koje žele udoban i miran smještaj.'
from rooms r where r.slug = 'orah'
on conflict (room_id, locale) do nothing;

insert into room_translations (room_id, locale, name, tagline, description)
select r.id, 'en', 'Walnut', 'Space and warmth for the whole family.',
  'ORAH is a family room with character. Two beds, a spacious bathroom and a terrace overlooking the surrounding greenery. Perfect for families wanting comfortable, peaceful accommodation.'
from rooms r where r.slug = 'orah'
on conflict (room_id, locale) do nothing;

insert into room_translations (room_id, locale, name, tagline, description)
select r.id, 'de', 'Nuss', 'Großzügigkeit und Wärme für die ganze Familie.',
  'ORAH ist ein Familienzimmer mit Charakter. Zwei Betten, ein geräumiges Bad und eine Terrasse mit Blick ins Grüne. Ideal für Familien mit komfortablem und ruhigem Aufenthalt.'
from rooms r where r.slug = 'orah'
on conflict (room_id, locale) do nothing;

insert into room_translations (room_id, locale, name, tagline, description)
select r.id, 'hr', 'Bijela', 'Minimalizam i elegancija za savršen bijeg.',
  'BIJELA je minimalistički uređena soba u bijelom — čista linija, puno prirodnog svjetla i savršen mir. Idealna za samce ili parove koji cijene jednostavnost i eleganciju iznad svega.'
from rooms r where r.slug = 'bijela'
on conflict (room_id, locale) do nothing;

insert into room_translations (room_id, locale, name, tagline, description)
select r.id, 'en', 'White', 'Minimalism and elegance for a perfect escape.',
  'BIJELA is a minimalist room in white — clean lines, plenty of natural light and perfect calm. Ideal for solo guests or couples who value simplicity above all.'
from rooms r where r.slug = 'bijela'
on conflict (room_id, locale) do nothing;

insert into room_translations (room_id, locale, name, tagline, description)
select r.id, 'de', 'Weiß', 'Minimalismus und Eleganz für eine perfekte Auszeit.',
  'BIJELA ist ein minimalistisch eingerichtetes weißes Zimmer — klare Linien, viel natürliches Licht und perfekte Ruhe. Ideal für Alleinreisende oder Paare, die Einfachheit schätzen.'
from rooms r where r.slug = 'bijela'
on conflict (room_id, locale) do nothing;

-- ─────────────────────────────────────────────────────────────────
-- ROOM MEDIA  (Unsplash placeholder images — replace with real assets)
-- ─────────────────────────────────────────────────────────────────

insert into room_media (room_id, src, alt_text, sort_order, is_cover)
select r.id, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
  'Soba Zelena – krevet', 1, true from rooms r where r.slug = 'zelena'
on conflict do nothing;

insert into room_media (room_id, src, alt_text, sort_order, is_cover)
select r.id, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80',
  'Soba Zelena – pogled', 2, false from rooms r where r.slug = 'zelena'
on conflict do nothing;

insert into room_media (room_id, src, alt_text, sort_order, is_cover)
select r.id, 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200&q=80',
  'Soba Orah – krevet', 1, true from rooms r where r.slug = 'orah'
on conflict do nothing;

insert into room_media (room_id, src, alt_text, sort_order, is_cover)
select r.id, 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&q=80',
  'Soba Orah – terasa', 2, false from rooms r where r.slug = 'orah'
on conflict do nothing;

insert into room_media (room_id, src, alt_text, sort_order, is_cover)
select r.id, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
  'Soba Bijela – krevet', 1, true from rooms r where r.slug = 'bijela'
on conflict do nothing;

insert into room_media (room_id, src, alt_text, sort_order, is_cover)
select r.id, 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=1200&q=80',
  'Soba Bijela – detalj', 2, false from rooms r where r.slug = 'bijela'
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────────
-- SAMPLE BOOKINGS  (for overlap/availability testing)
-- ─────────────────────────────────────────────────────────────────

insert into bookings
  (room_slug, check_in, check_out, nights, guest_name, guest_email, adults, price_per_night, total_price, deposit, status, locale)
values
  ('zelena', current_date + 10, current_date + 14, 4, 'Test Gost', 'test1@example.com', 2, 90, 360, 108, 'confirmed', 'hr'),
  ('orah',   current_date + 5,  current_date + 10, 5, 'Test Family', 'test2@example.com', 3, 130, 650, 195, 'pending', 'en'),
  ('bijela', current_date + 20, current_date + 25, 5, 'Test Gast',  'test3@example.com', 2, 80, 400, 120, 'confirmed', 'de')
on conflict do nothing;
