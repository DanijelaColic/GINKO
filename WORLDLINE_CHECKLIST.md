# Saferpay — interni checklist (Ginko)

Koristi dok čekaš podatke od klijenta i nakon što stignu.

> PG: **Saferpay** (Worldline Hrvatska), ne Worldline Online Payments / Direct.

---

## Faza A — Prije podataka od klijenta

- [ ] Migracija `003_payments.sql` (+ `004` ako treba rename kolona) u Supabase
- [ ] Kod deployan (bez Saferpay env — booking + bankovni prijenos rade)
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://ginko-sobe.com` (bez trailing slash)
- [ ] HTTPS radi
- [ ] Notify endpoint dostupan: `https://ginko-sobe.com/api/webhooks/saferpay`
- [ ] Testiran booking flow bez kartice (IBAN, admin)
- [ ] Klijentu poslan mail (`WORLDLINE_KLIJENT_MAIL.md` — Saferpay verzija)

---

## Faza B — Kad stignu TEST podaci

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
| 6 | Email potvrde gostu | | |
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

Runbook: `WORLDLINE_RUNBOOK.md`
