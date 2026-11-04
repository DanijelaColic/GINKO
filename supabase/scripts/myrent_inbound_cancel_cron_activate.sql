-- =============================================================================
-- AKTIVACIJA: MyRent inbound cancel Cron (svakih 10 minuta)
-- =============================================================================
-- NE POKRETATI dok nisu ispunjeni uvjeti:
--   1) Migracija 017 primijenjena
--   2) myrent_inbound_cancel_cron_setup.sql pokrenut
--   3) Vault secrets ginko_app_url + ginko_cron_secret postavljeni
--   4) Vercel env CRON_SECRET = ista vrijednost kao Vault ginko_cron_secret
--   5) App deployan s /api/cron/myrent-cancel-sync
--   6) Ručni smoke test: select public.invoke_myrent_inbound_cancel_sync();
--   7) Eksplicitno odobrenje za aktivaciju rasporeda
--
-- Ovaj skript SAMO zakazuje posao. Ne mijenja rezervacije izravno.
-- =============================================================================

-- Idempotent: makni stari job istog imena ako postoji
select cron.unschedule(jobid)
from cron.job
where jobname = 'myrent-inbound-cancel-sync';

select cron.schedule(
  'myrent-inbound-cancel-sync',
  '*/10 * * * *',
  $$select public.invoke_myrent_inbound_cancel_sync();$$
);

-- Provjera
-- select jobid, jobname, schedule, active from cron.job
-- where jobname = 'myrent-inbound-cancel-sync';

-- Deaktivacija (po potrebi):
-- select cron.unschedule(jobid) from cron.job where jobname = 'myrent-inbound-cancel-sync';
