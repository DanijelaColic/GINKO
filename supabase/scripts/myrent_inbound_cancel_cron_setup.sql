-- =============================================================================
-- MyRent → Ginko inbound cancel: Supabase Cron priprema (pg_cron + pg_net + Vault)
-- =============================================================================
-- Pokreni RUČNO u Supabase SQL Editoru NAKON migracije 017.
-- Ovaj skript NE aktivira raspored (nema cron.schedule).
--
-- Aktivacija: supabase/scripts/myrent_inbound_cancel_cron_activate.sql
--             (samo nakon odobrenja + Vault tajni + Vercel CRON_SECRET)
--
-- Ne mijenja rezervacije. Ne radi Saferpay refund. Ne piše u MyRent.
-- =============================================================================

-- 1) Extensions
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- 2) Vault: placeholdere — ZAMIJENI vrijednosti prije activate skripta
--    Ako secret već postoji, update preko Dashboard → Project Settings → Vault
--    ili vault.update_secret(...)
--
-- Primjer (pokreni odvojeno s pravim vrijednostima):
--   select vault.create_secret(
--     'https://ginko-tau.vercel.app',
--     'ginko_app_url',
--     'Production app origin for MyRent cancel cron'
--   );
--   select vault.create_secret(
--     'PASTE_SAME_VALUE_AS_VERCEL_CRON_SECRET',
--     'ginko_cron_secret',
--     'Bearer token for /api/cron/myrent-cancel-sync (must match Vercel CRON_SECRET)'
--   );

-- 3) Helper: HTTP POST na Ginko cron endpoint (čita URL + secret iz Vaulta)
create or replace function public.invoke_myrent_inbound_cancel_sync()
returns bigint
language plpgsql
security definer
set search_path = public, net, vault
as $$
declare
  app_url text;
  cron_secret text;
  request_id bigint;
begin
  select decrypted_secret into app_url
  from vault.decrypted_secrets
  where name = 'ginko_app_url'
  limit 1;

  select decrypted_secret into cron_secret
  from vault.decrypted_secrets
  where name = 'ginko_cron_secret'
  limit 1;

  if app_url is null or btrim(app_url) = '' then
    raise exception 'vault secret ginko_app_url missing';
  end if;

  if cron_secret is null or btrim(cron_secret) = '' then
    raise exception 'vault secret ginko_cron_secret missing';
  end if;

  -- Trim trailing slash; endpoint zahtijeva Bearer CRON_SECRET
  app_url := rtrim(app_url, '/');

  select net.http_post(
    url := app_url || '/api/cron/myrent-cancel-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  )
  into request_id;

  return request_id;
end;
$$;

comment on function public.invoke_myrent_inbound_cancel_sync() is
  'MyRent→Ginko cancel sync trigger via pg_net. Requires Vault ginko_app_url + ginko_cron_secret. No refund.';

-- Samo service/postgres role treba zvati ovo; revoke od API rolama
revoke all on function public.invoke_myrent_inbound_cancel_sync() from public;
revoke all on function public.invoke_myrent_inbound_cancel_sync() from anon, authenticated;
grant execute on function public.invoke_myrent_inbound_cancel_sync() to postgres;

-- Ručni smoke test (NE pokreće se ovim skriptom):
--   select public.invoke_myrent_inbound_cancel_sync();
--   select id, status_code, error_msg, created
--   from net._http_response
--   order by created desc
--   limit 5;
