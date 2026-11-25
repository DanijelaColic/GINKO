-- =============================================================================
-- AKTIVACIJA: payment hold release, svakih 5 minuta
-- =============================================================================
-- NE POKRETATI dok nisu ispunjeni uvjeti:
--   1) Migracija 020 primijenjena
--   2) payment_hold_release_cron_setup.sql pokrenut
--   3) Vault ginko_app_url + ginko_cron_secret postavljeni
--   4) Vercel CRON_SECRET = ista vrijednost
--   5) App deployan s /api/cron/payment-hold-release
--   6) Ručni smoke: select public.invoke_payment_hold_release();
--
-- Posao zove aplikaciju. Aplikacija radi Assert i otkazuje samo sigurno neplaćene.
-- =============================================================================

select cron.unschedule(jobid)
from cron.job
where jobname = 'payment-hold-release';

select cron.schedule(
  'payment-hold-release',
  '*/5 * * * *',
  $$select public.invoke_payment_hold_release();$$
);

-- select jobid, jobname, schedule, active from cron.job
-- where jobname = 'payment-hold-release';

-- Deaktivacija:
-- select cron.unschedule(jobid) from cron.job where jobname = 'payment-hold-release';
