-- Seed all Ginko rooms into public.rooms (was empty; app fell back to static config).
-- Idempotent: on conflict do nothing / upsert translations lightly.

insert into rooms (slug, capacity, size_m2, beds, floor, price_off_season, price_high_season, min_nights, amenities, sort_order, active)
values
  ('ginko-1', 2, 15, '1 bračni krevet', 1, 60, 60, 1,
   array['WiFi','LCD TV','Klima','Parking','Grijanje','Ručnici','Posteljina','Kućni ljubimci na upit'], 1, true),
  ('ginko-2', 3, 20, E'1 bračni krevet\n1 krevet za 1 osobu (pomoćni ležaj)', 1, 60, 60, 1,
   array['WiFi','LCD TV','Satelitski TV','Klima','Terasa','Parking','Grijanje','Ručnici','Posteljina','Kućni ljubimci na upit'], 2, true),
  ('ginko-3', 3, 18, E'1 bračni krevet\n1 krevet za 1 osobu (pomoćni ležaj)', 1, 60, 60, 1,
   array['WiFi','LCD TV','Satelitski TV','Klima','Terasa','Parking','Grijanje','Ručnici','Posteljina','Kućni ljubimci na upit'], 3, true),
  ('ginko-4', 3, 20, E'1 bračni krevet\n1 krevet za 1 osobu (pomoćni ležaj)', 1, 60, 60, 1,
   array['WiFi','LCD TV','Satelitski TV','Klima','Terasa','Parking','Grijanje','Ručnici','Posteljina','Kućni ljubimci na upit'], 4, true),
  ('ginko-5', 2, 20, '1 bračni krevet', 1, 60, 60, 1,
   array['WiFi','LCD TV','Satelitski TV','Klima','Terasa','Parking','Grijanje','Ručnici','Posteljina'], 5, true),
  ('ginko-6', 1, 14, '1 jednokrevetni krevet', 1, 42, 42, 1,
   array['WiFi','LCD TV','Satelitski TV','Klima','Terasa','Parking','Grijanje','Ručnici','Posteljina','Kućni ljubimci na upit'], 6, true),
  ('ginko-spa-2', 4, 50, E'Spavaća soba 1: 1 bračni krevet\nDnevni boravak: 1 kauč na rasklapanje\nDodatno: 1 krevet za 1 osobu (pomoćni ležaj)', 2, 234, 234, 1,
   array['WiFi','LCD TV','Satelitski TV','Klima','Privatna sauna','Jacuzzi','Terasa','Posebna kuhinja','Parking','Grijanje','Ručnici','Posteljina'], 7, true),
  ('ginko-spa-1', 4, 50, E'Spavaća soba 1: 1 bračni krevet\nDnevni boravak: 1 kauč na rasklapanje\nDodatno: 1 krevet za 1 osobu (pomoćni ležaj)', 2, 90, 90, 1,
   array['WiFi','LCD TV','Satelitski TV','Klima','Terasa','Posebna kuhinja','Parking','Grijanje','Ručnici','Posteljina'], 8, true)
on conflict (slug) do update set
  capacity = excluded.capacity,
  size_m2 = excluded.size_m2,
  beds = excluded.beds,
  floor = excluded.floor,
  price_off_season = excluded.price_off_season,
  price_high_season = excluded.price_high_season,
  min_nights = excluded.min_nights,
  amenities = excluded.amenities,
  sort_order = excluded.sort_order,
  active = excluded.active;

-- HR translations (names match rooms.config)
insert into room_translations (room_id, locale, name, tagline, description)
select r.id, v.locale, v.name, v.tagline, v.description
from rooms r
join (
  values
    ('ginko-1', 'hr', 'Ginko 1', 'Šarmantna i intimna soba u srcu Daruvara.',
     'Dobrodošli u Ginko 1, šarmantnu i intimnu sobu skrivenu u prekrasnom gradu Daruvaru.'),
    ('ginko-2', 'hr', 'Ginko 2', 'Prostrana soba s terasom za ugodne večeri.',
     'Otkrijte očaravajući boravak u Ginko 2, šarmantnoj sobi smještenoj u srcu slikovitog Daruvara.'),
    ('ginko-3', 'hr', 'Ginko 3', 'Privatno utočište s modernim sadržajima i terasom.',
     'Dobrodošli u Ginko 3, vaše privatno utočište smješteno u srcu Daruvara.'),
    ('ginko-4', 'hr', 'Ginko 4', 'Moderna soba s terasom i luksuznim sadržajima.',
     'Dobrodošli u Ginko 4 — udobnu sobu s pažljivo odabranim sadržajima za savršen odmor.'),
    ('ginko-5', 'hr', 'Ginko 5', 'Elegantna soba za savršen odmor u centru grada.',
     'Dobrodošli u Ginko 5, vaš savršeni boravak u kulturnom srcu Hrvatske.'),
    ('ginko-6', 'hr', 'Ginko 6', 'Idealna za solo putnike — miran i intiman boravak.',
     'Dobrodošli u Ginko 6, ugodnu i privlačnu sobu smještenu u srcu Daruvara.'),
    ('ginko-spa-2', 'hr', 'Wellness Apartman', 'Privatna sauna i jacuzzi — luksuzno wellness iskustvo.',
     'Dobrodošli u Wellness Apartman — vašu oazu luksuza i wellness iskustva u Daruvaru.'),
    ('ginko-spa-1', 'hr', 'Apartman', 'Prostrani apartman s terasom i odvojenom kuhinjom.',
     'Dobrodošli u Apartman — prostrani smještaj od 50 m² smješten na drugom katu u srcu Daruvara.')
) as v(slug, locale, name, tagline, description) on r.slug = v.slug
on conflict (room_id, locale) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  description = excluded.description;

-- Cover media
insert into room_media (room_id, src, alt_text, sort_order, is_cover)
select r.id, v.src, v.alt_text, 1, true
from rooms r
join (
  values
    ('ginko-1', '/images/rooms/ginko-1/01-cover.jpg', 'Ginko 1'),
    ('ginko-2', '/images/rooms/ginko-2/01-cover.jpg', 'Ginko 2'),
    ('ginko-3', '/images/rooms/ginko-3/01-cover.jpg', 'Ginko 3'),
    ('ginko-4', '/images/rooms/ginko-4/01-cover.jpg', 'Ginko 4'),
    ('ginko-5', '/images/rooms/ginko-5/01-cover.jpg', 'Ginko 5'),
    ('ginko-6', '/images/rooms/ginko-6/01-cover.jpg', 'Ginko 6'),
    ('ginko-spa-2', '/images/rooms/ginko-spa-2/01-cover.png', 'Wellness Apartman'),
    ('ginko-spa-1', '/images/rooms/ginko-spa-2/01-cover.png', 'Apartman')
) as v(slug, src, alt_text) on r.slug = v.slug
where not exists (
  select 1 from room_media m where m.room_id = r.id and m.is_cover = true
);
