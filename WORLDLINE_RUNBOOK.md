# Saferpay Runbook — Ginko Sobe

## Environment

```dotenv
SAFERPAY_CUSTOMER_ID=
SAFERPAY_TERMINAL_ID=
SAFERPAY_API_USERNAME=
SAFERPAY_API_PASSWORD=
SAFERPAY_BASE_URL=https://test.saferpay.com/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Produkcija: `SAFERPAY_BASE_URL=https://www.saferpay.com/api` + live kredencijali.

Dokumentacija: https://saferpay.github.io/jsonapi/  
Payment Page guide: https://docs.saferpay.com/home/integration-guide/licences-and-interfaces/payment-page  
Test signup: https://test.saferpay.com/BO/SignUp?lang=en

---

## 1. Notify (server-to-server)

Notify URL se šalje u `PaymentPage/Initialize` (Notification.SuccessNotifyUrl / FailNotifyUrl):

`https://your-domain/api/webhooks/saferpay?oid=<orderId>&result=success|fail`

Saferpay zove **GET** bez Tokena — identifikacija je naš `oid`.  
Handler radi `PaymentPage/Assert` → po potrebi `Transaction/Capture` → potvrda rezervacije.

Odgovor mora biti **200** (Saferpay inače retrya).

---

## 2. Guest flow

```
Guest na /booking/confirmation/[id]
  → „Plati depozit”
  → POST /api/payments/checkout
  → PaymentPage/Initialize → RedirectUrl
  → gost plati na Saferpay
  → ReturnUrl: …&payment=return&oid=…
  → syncSaferpayPayment(oid) = Assert + Capture
  → (paralelno) SuccessNotifyUrl → isti sync
  → booking: confirmed + deposit_paid
```

---

## 3. Refund

Admin: `/admin/bookings` → rezervacija → Povrat  
API: `POST /api/admin/payments/refund` s `{ "paymentIntentId": "<uuid>" }`

Treba `saferpay_capture_id` u metadata (postavlja se nakon Assert/Capture).

---

## 4. Reconciliation

Admin `/admin/payments` → **Uskladi**  
ili `POST /api/admin/payments/reconcile`

Za ambiguous zapise ponovno zove Assert (ne koristiti kao polling u produkciji — samo recovery).

---

## 5. Production checklist

- [ ] Live JSON API kredencijali
- [ ] `SAFERPAY_BASE_URL=https://www.saferpay.com/api`
- [ ] Visa/Mastercard EUR na live terminalu
- [ ] Test checkout + refund
- [ ] Notify URL dostupan javno (HTTPS)
