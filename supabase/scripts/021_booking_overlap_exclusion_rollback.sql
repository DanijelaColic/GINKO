-- Rollback migracije 021. Ne briše rezervacije i ne gasi btree_gist.
-- Nakon ovoga dva gosta opet mogu upisati preklapajući pending.
-- Pokreni ručno. Nije u supabase/migrations pa se ne primjenjuje sam.

alter table public.bookings
  drop constraint if exists bookings_no_active_overlap;

alter table public.bookings
  drop column if exists occupancy_unit;
