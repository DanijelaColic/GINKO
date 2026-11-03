-- Wellness nadoplata po noćenju za ginko-spa-2 (MyRent object_id 7460 dijeli
-- kalendar s ginko-spa-1). Iznos uređuje admin u Ginko panelu; NULL = nije
-- postavljeno → MyRent pricing ne smije izmišljati cijenu ni dozvoliti rezervaciju
-- wellness varijante dok se vrijednost ne unese.
--
-- Ne seedati konkretan iznos — klijent unosi naknadno.

create table if not exists site_settings (
  key text primary key,
  value_numeric numeric(10, 2),
  updated_at timestamptz not null default now(),
  constraint site_settings_numeric_non_negative
    check (value_numeric is null or value_numeric >= 0)
);

alter table site_settings enable row level security;

create policy "Service role full access site_settings"
  on site_settings using (true) with check (true);

insert into site_settings (key, value_numeric)
values ('spa_wellness_surcharge_per_night', null)
on conflict (key) do nothing;

comment on table site_settings is
  'Ključ-vrijednost postavke (npr. SPA wellness nadoplata €/noć).';
comment on column site_settings.value_numeric is
  'NULL = postavka nije unesena; inače >= 0.';
