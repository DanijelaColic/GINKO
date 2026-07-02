-- Ensures Ginko 6 exists in rooms catalog (solo room, capacity 1)

insert into rooms (slug, capacity, size_m2, beds, floor, price_off_season, price_high_season, min_nights, amenities, sort_order)
values
  ('ginko-6', 1, 14, '1 jednokrevetni krevet', 1, 42, 42, 1,
   '{"WiFi","LCD TV","Satelitski TV","Klima","Sauna","Terasa","Parking","Grijanje","Ručnici","Posteljina","Kućni ljubimci na upit"}',
   6)
on conflict (slug) do nothing;

insert into room_translations (room_id, locale, name, tagline, description)
select r.id, 'hr', 'Ginko 6', 'Idealna za solo putnike — miran i intiman boravak.',
  'Dobrodošli u Ginko 6, ugodnu i privlačnu sobu smještenu u srcu Daruvara. Ova soba je posebno osmišljena za solo putnike ili poslovne goste koji traže miran odmor.'
from rooms r where r.slug = 'ginko-6'
on conflict (room_id, locale) do nothing;

insert into room_translations (room_id, locale, name, tagline, description)
select r.id, 'en', 'Ginko 6', 'Perfect for solo travellers — quiet and intimate.',
  'Welcome to Ginko 6, a comfortable room in the heart of Daruvar, designed for solo travellers and business guests seeking a peaceful stay.'
from rooms r where r.slug = 'ginko-6'
on conflict (room_id, locale) do nothing;

insert into room_translations (room_id, locale, name, tagline, description)
select r.id, 'de', 'Ginko 6', 'Ideal für Alleinreisende — ruhig und intim.',
  'Willkommen in Ginko 6, einem gemütlichen Zimmer im Herzen von Daruvar, ideal für Alleinreisende und Geschäftsgäste.'
from rooms r where r.slug = 'ginko-6'
on conflict (room_id, locale) do nothing;

insert into room_media (room_id, src, alt_text, sort_order, is_cover)
select r.id, '/images/rooms/ginko-6/01-cover.jpg', 'Ginko 6 — soba', 1, true
from rooms r where r.slug = 'ginko-6'
on conflict do nothing;
