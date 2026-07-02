# Worldline Runbook — Ginko Sobe

## Environment setup

```dotenv
# .env.local
WORLDLINE_MERCHANT_ID=your-pspid
WORLDLINE_API_KEY_ID=...
WORLDLINE_API_SECRET=...
WORLDLINE_API_HOST=payment.preprod.direct.worldline-solutions.com   # test
WORLDLINE_WEBHOOK_KEY_ID=...
WORLDLINE_WEBHOOK_SECRET=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Za produkciju zamijeni `WORLDLINE_API_HOST` s `payment.direct.worldline-solutions.com` i koristi live API ključeve.

---

## 1. Webhook setup

### Merchant Portal

1. Configuration → Webhooks → Generate webhooks keys (spremi secret odmah — vidljiv 60 s)
2. Add endpoint: `https://your-domain/api/webhooks/worldline`
3. Odaberi evente: `payment.*`, `refund.*`

### Endpoint verification (GET)

Worldline šalje GET s headerom `X-GCS-Webhooks-Endpoint-Verification`. Endpoint vraća istu vrijednost kao plain text.

### Test webhook

Merchant Portal → Webhooks → Actions → Test

---

## 2. Guest payment flow

```
Guest na /booking/confirmation/[id]
  → klik "Plati depozit"
  → POST /api/payments/checkout
  → redirect na Worldline Hosted Checkout (hr-HR)
  → guest plati karticom
  → redirect na returnUrl (&payment=success&hostedCheckoutId=...)
  → server: syncHostedCheckoutStatus(hostedCheckoutId)
  → webhook (fallback): payment.captured / payment.paid
  → booking: confirmed + deposit_paid
```

---

## 3. Refund Runbook

### Admin UI

1. `/admin/bookings` → otvori rezervaciju → "Worldline plaćanje"
2. Klik **Povrat** (samo kad `status = succeeded`)
3. Ostavi prazno za puni povrat ili unesi djelomični iznos u EUR
4. **Potvrdi** — čeka Worldline API odgovor

### API (curl)

```bash
curl -X POST http://localhost:3000/api/admin/payments/refund \
  -H "Content-Type: application/json" \
  -H "Cookie: ginko_admin=<ADMIN_TOKEN>" \
  -d '{"paymentIntentId": "<payment_intents.id UUID>"}'
```

Napomena: refund zahtijeva `worldline_payment_id` u metadata — automatski se postavlja nakon uspješnog plaćanja (sync ili webhook).

---

## 4. Reconciliation

Pokreće `syncHostedCheckoutStatus` za sve ambiguous zapise starije od 15 min.

- Admin: `/admin/payments` → **Uskladi**
- API: `POST /api/admin/payments/reconcile` s `{ "olderThanMinutes": 15 }`

Pokreni nakon webhook outagea ili ako gost javi "platio sam ali rezervacija je pending".

---

## 5. Production checklist

- [ ] Live API Key + Secret u Merchant Portalu
- [ ] `WORLDLINE_API_HOST=payment.direct.worldline-solutions.com`
- [ ] Live webhook endpoint registriran (HTTPS obavezno)
- [ ] Migracija `004_worldline_provider_columns.sql` primijenjena u Supabase
- [ ] Test checkout s testnom karticom, zatim refund
- [ ] Reconciliation cron svakih 30 min
