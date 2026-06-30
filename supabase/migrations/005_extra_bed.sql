-- 005_extra_bed.sql
-- Adds needs_extra_bed column to bookings table.
-- An extra bed (pomoćni ležaj) costs 20 €/night and is available
-- in rooms Ginko 2, 3, 4, 5 and the wellness apartment.

alter table bookings
  add column if not exists needs_extra_bed boolean not null default false;

comment on column bookings.needs_extra_bed is 'Guest requested an extra bed (+20 €/night, subject to availability)';
