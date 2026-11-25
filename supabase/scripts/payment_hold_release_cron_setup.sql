-- =============================================================================
-- Payment hold release: Supabase Cron priprema (pg_cron + pg_net + Vault)
-- =============================================================================
-- NE POKRETATI dok:
--   1) migracija 020_payment_hold.sql nije primijenjena
--   2) app s /api/cron/payment-hold-release nije deployan
--   3) Vault ginko_app_url + ginko_cron_secret već postoje (isti kao MyRent cron)
--   4) Vercel CRON_SECRET je ista vrijednost
--
-- Ovaj skript NE zakazuje posao (nema cron.schedule).
-- Aktivacija: supabase/scripts/payment_hold_release_cron_activate.sql
-- Ne mijenja rezervacije izravno. Ne radi Saferpay Capture.
-- =============================================================================

create or replace function public.invoke_payment_hold_release()
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

  app_url := rtrim(app_url, '/');

  select net.http_post(
    url := app_url || '/api/cron/payment-hold-release',
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

comment on function public.invoke_payment_hold_release() is
  'Oslobađa neplaćene holdove nakon Asserta. Bearer CRON_SECRET. Bez MyRent upisa.';

revoke all on function public.invoke_payment_hold_release() from public;
revoke all on function public.invoke_payment_hold_release() from anon, authenticated;
grant execute on function public.invoke_payment_hold_release() to postgres;
