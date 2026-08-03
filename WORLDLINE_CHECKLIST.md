# Saferpay — interni checklist (Ginko)

Koristi dok čekaš podatke od klijenta i nakon što stignu.

> PG: **Saferpay** (Worldline Hrvatska), ne Worldline Online Payments / Direct.

_Status update: 2026-07-31 (Faza 2 audit)_

---

## Faza A — Prije podataka od klijenta

- [x] Migracija `003_payments.sql` (+ provider rename via schema catchup) u Supabase
- [x] Payment tablice: `payment_intents`, `payment_transactions`, `webhook_events` (provider-* kolone)
- [x] Kod Saferpay (checkout, webhook, refund, reconcile) u repo
- [ ] `NEXT_PUBLIC_SITE_URL` / `SITE_URL` = produkcijski domen (`https://ginko-sobe.com`) — **trenutno lokalno: Vercel preview URL**
- [ ] HTTPS + custom domen na produkciji
- [ ] Notify endpoint dostupan na **produkcijskom** URL-u: `https://ginko-sobe.com/api/webhooks/saferpay`
- [x] IBAN / bankovni podaci postavljeni u env (HUB3 / confirmation)
- [ ] Testiran booking flow bez kartice (IBAN, admin) na stagingu
- [ ] Klijentu poslan mail (`WORLDLINE_KLIJENT_MAIL.md`) — ako već ima TEST kredencijale, preskoči

---

## Faza B — Kad stignu TEST podaci

> Lokalni `.env.local` već ima TEST Saferpay kredencijale + `SAFERPAY_BASE_URL=https://test.saferpay.com/api`.
> Provjeri da **isti** set postoji i na Vercel Preview/Production.

Upis u `.env.local` / Vercel:

```dotenv
SAFERPAY_CUSTOMER_ID=
SAFERPAY_TERMINAL_ID=
SAFERPAY_API_USERNAME=
SAFERPAY_API_PASSWORD=
SAFERPAY_BASE_URL=https://test.saferpay.com/api
```

### Saferpay Backoffice (test)

- [ ] CustomerId + TerminalId (eCommerce) poznati
- [ ] JSON API Basic Authentication kreiran
- [ ] Kartice: Visa, Mastercard (min.), valuta EUR
- [ ] Test kartice iz Saferpay docs za sandbox

### End-to-end test

| # | Korak | OK? | Napomena |
|---|-------|-----|----------|
| 1 | Nova rezervacija → „Plati depozit” | | Redirect na Saferpay Payment Page |
| 2 | Plaćanje test karticom | | |
| 3 | Povratak na confirmation (`?oid=…`) | | Banner + Assert/Capture |
| 4 | `bookings.status` = confirmed | | |
| 5 | `bookings.deposit_paid` = true | | |
| 6 | Email potvrde gostu | | treba `RESEND_FROM` na verificiranom domenu |
| 7 | Admin → Povrat (refund) | | |
| 8 | Prekid plaćanja | | Booking ostaje pending |
| 9 | Admin → Uskladi | | |

### Ako nešto ne radi

| Simptom | Provjeri |
|---------|----------|
| 503 „Saferpay nije konfiguriran” | Env + redeploy |
| AUTHENTICATION_FAILED | CustomerId + API user/pass isti račun |
| Assert greška | Token / oid u URL-u; ne otvaraj RedirectUrl dvaput |
| Refund ne radi | `saferpay_capture_id` u metadata — pokreni Uskladi |

---

## Faza C — Go-live

- [ ] Live Backoffice + ugovor / KYC
- [ ] Live CustomerId, TerminalId, JSON API login
- [ ] `SAFERPAY_BASE_URL=https://www.saferpay.com/api`
- [ ] `SITE_URL` / `NEXT_PUBLIC_SITE_URL` = `https://ginko-sobe.com`
- [ ] Resend: verificiran domen + `RESEND_FROM` (ne `onboarding@resend.dev`)
- [ ] Jedna mala stvarna transakcija + refund
- [ ] (Preporuka) Cron usklađivanja: `POST /api/admin/payments/reconcile`

---

## Env — brza referenca

| Varijabla | Što je |
|-----------|--------|
| `SAFERPAY_CUSTOMER_ID` | CustomerId iz Backofficea |
| `SAFERPAY_TERMINAL_ID` | eCommerce TerminalId |
| `SAFERPAY_API_USERNAME` | JSON API Basic Auth username |
| `SAFERPAY_API_PASSWORD` | JSON API Basic Auth password |
| `SAFERPAY_BASE_URL` | `https://test.saferpay.com/api` ili `https://www.saferpay.com/api` |
| `RESEND_API_KEY` / `RESEND_FROM` | Email potvrde gostu / vlasniku |
| `RECIPIENT_*` | IBAN za bankovni prijenos |

Runbook: `WORLDLINE_RUNBOOK.md`
