# Worldline — interni checklist (Ginko)

Koristi ovaj dokument dok čekaš podatke od klijenta i nakon što stignu.

---

## Faza A — Prije podataka od klijenta

- [ ] Primijenjena migracija `supabase/migrations/004_worldline_provider_columns.sql` u Supabase
- [ ] Kod deployan na produkciju (bez Worldline env — booking + bankovni prijenos rade)
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://ginko-sobe.com` (bez trailing slash)
- [ ] HTTPS radi na produkciji
- [ ] Endpoint dostupan (ne smije biti 404): `https://ginko-sobe.com/api/webhooks/worldline`
- [ ] Testiran booking flow bez kartice:
  - [ ] Rezervacija → confirmation stranica
  - [ ] Tab „Bankovni prijenos” (IBAN, referenca, iznos)
  - [ ] Admin: pregled rezervacije, statusi
- [ ] U Vercel/hostingu pripremljene prazne env varijable (vidi dolje)
- [ ] Klijentu poslan follow-up mail (`WORLDLINE_KLIJENT_MAIL.md`)

---

## Faza B — Kad stignu TEST podaci

Upis u `.env.local` / Vercel:

```dotenv
WORLDLINE_MERCHANT_ID=
WORLDLINE_API_KEY_ID=
WORLDLINE_API_SECRET=
WORLDLINE_API_HOST=payment.preprod.direct.worldline-solutions.com
WORLDLINE_WEBHOOK_KEY_ID=
WORLDLINE_WEBHOOK_SECRET=
```

### Merchant Portal (klijent ili ti s pristupom)

- [ ] Aktivirane kartice: Visa, Mastercard (min.)
- [ ] Valuta: EUR
- [ ] Webhook endpoint: `https://ginko-sobe.com/api/webhooks/worldline`
- [ ] Webhook eventi: `payment.*`, `refund.*`
- [ ] Webhook test iz portala → 200 OK

### End-to-end test (preprod)

| # | Korak | OK? | Napomena |
|---|-------|-----|----------|
| 1 | Nova test rezervacija → „Plati depozit” | | Redirect na Worldline (hr-HR) |
| 2 | Plaćanje test karticom | | |
| 3 | Povratak na confirmation | | Banner „Plaćanje zaprimljeno” |
| 4 | `bookings.status` = confirmed | | |
| 5 | `bookings.deposit_paid` = true | | |
| 6 | Email potvrde gostu | | |
| 7 | Admin → Povrat (refund) | | |
| 8 | Prekid plaćanja (zatvori Worldline) | | Booking ostaje pending |
| 9 | Admin → Uskladi (`/admin/payments`) | | |

### Ako nešto ne radi

| Simptom | Provjeri |
|---------|----------|
| 503 „Worldline nije konfiguriran” | Env varijable + redeploy |
| Redirect ne radi | API Key / Secret / PSPID par (test s testom) |
| Plaćeno, booking pending | Webhook + ručno Uskladi; `hostedCheckoutId` u URL-u |
| Refund ne radi | `worldline_payment_id` u `payment_intents.metadata` |

---

## Faza C — Go-live (produkcija)

- [ ] Ugovor s Worldlineom potpisan, KYC gotov
- [ ] Live API Key + Secret izdan
- [ ] Live webhook ključevi
- [ ] `WORLDLINE_API_HOST=payment.direct.worldline-solutions.com`
- [ ] Live webhook endpoint registriran
- [ ] Jedna mala stvarna transakcija + odmah refund
- [ ] (Preporuka) Cron usklađivanja svakih 30 min: `POST /api/admin/payments/reconcile`

---

## Env varijable — brza referenca

| Varijabla | Što je |
|-----------|--------|
| `WORLDLINE_MERCHANT_ID` | PSPID (merchant ID) |
| `WORLDLINE_API_KEY_ID` | API Key ID (REST pozivi) |
| `WORLDLINE_API_SECRET` | API Secret |
| `WORLDLINE_API_HOST` | Test ili live host |
| `WORLDLINE_WEBHOOK_KEY_ID` | Key ID za potpis webhooka |
| `WORLDLINE_WEBHOOK_SECRET` | Secret za webhook (spremi odmah!) |

Detaljniji runbook: `WORLDLINE_RUNBOOK.md`
