-- Dodaje kolone za doručak i wellness rezervaciju
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS breakfast_guests integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS include_wellness boolean NOT NULL DEFAULT false;
