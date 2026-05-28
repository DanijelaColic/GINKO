# Stripe Runbook — Ginko Sobe

## Environment setup

```dotenv
# .env.local
STRIPE_SECRET_KEY=sk_test_...        # Stripe Dashboard → API keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...      # Stripe Dashboard → Webhooks → endpoint secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 1. Webhook testing with Stripe CLI

### Install

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux / WSL
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe
```

### Login

```bash
stripe login
```

### Forward webhooks to local dev

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the printed whsec_... and set it as STRIPE_WEBHOOK_SECRET in .env.local
```

### Trigger test events

```bash
# Happy path — payment succeeds
stripe trigger checkout.session.completed

# Payment fails
stripe trigger payment_intent.payment_failed

# Session expires (guest abandons checkout)
stripe trigger checkout.session.expired

# Refund issued
stripe trigger charge.refunded

# Payment intent succeeded (fired alongside checkout.session.completed)
stripe trigger payment_intent.succeeded
```

### Verify idempotency

Stripe retries webhooks on non-2xx responses. To simulate a retry:
```bash
# Get event id from CLI output, then:
stripe events resend evt_xxx
```
The second delivery should return `{ received: true, note: "duplicate" }` — confirm the
booking is NOT double-confirmed.

---

## 2. Refund Runbook

### When to refund

| Scenario | Action |
|---|---|
| Guest cancels ≥ 48 h before arrival | Full refund of deposit |
| Owner cancels booking | Full refund |
| Partial adjustment agreed | Partial refund |

### Admin UI refund

1. Go to `/admin/bookings` → open the booking → scroll to "Stripe plaćanje" section
2. Click **Povrat** (only visible when `status = succeeded`)
3. Leave amount blank for full refund, or enter partial amount in EUR
4. Click **Potvrdi** — wait for Stripe API response
5. Success message shows Stripe Refund ID (`re_xxx`)
6. `payment_transactions` gets a `type=refund / status=succeeded` row
7. For full refund: `bookings.deposit_paid` is set to `false` automatically

### API refund (curl)

```bash
# Full refund
curl -X POST http://localhost:3000/api/admin/payments/refund \
  -H "Content-Type: application/json" \
  -H "Cookie: ginko_admin=<ADMIN_TOKEN>" \
  -d '{"paymentIntentId": "<payment_intents.id UUID>"}'

# Partial refund — €30.00
curl -X POST http://localhost:3000/api/admin/payments/refund \
  -H "Content-Type: application/json" \
  -H "Cookie: ginko_admin=<ADMIN_TOKEN>" \
  -d '{"paymentIntentId": "<UUID>", "amountCents": 3000, "reason": "requested_by_customer"}'
```

### Idempotency guard

- Stripe receives idempotency key `{pi_id}-refund-{amountCents}` → deduplicates within 24 h
- DB guard: total existing refunds checked before calling Stripe; rejects over-refund
- `stripe_charge_id UNIQUE` in `payment_transactions` prevents double DB insert on replay

### Stripe Dashboard verification

After refund: Stripe Dashboard → Payments → find the PaymentIntent → Refunds tab should list the refund.

---

## 3. Reconciliation Runbook

### What it does

Reconciliation re-checks local `payment_intents` rows that have an ambiguous status
(`requires_payment_method`, `requires_confirmation`, `requires_action`, `processing`)
AND are older than a configurable threshold (default: 15 minutes).

For each: calls the live Stripe API and repairs local drift:
- Stripe says `succeeded` → confirms booking + sets `deposit_paid = true`
- Stripe says `canceled`  → updates local status to `cancelled`

Records with `cs_` IDs are skipped (rely on webhook delivery).

### When to run

- After a Stripe webhook outage (check Stripe Dashboard → Webhooks → failed deliveries)
- If a guest reports "I paid but booking is still pending"
- As a scheduled job (cron) — safe to run every 30 min

### Admin UI

`/admin/payments` → click **Uskladi** button → toast shows `X popravaka od Y zapisa`

### API reconcile (curl)

```bash
# Default (>15 min old)
curl -X POST http://localhost:3000/api/admin/payments/reconcile \
  -H "Content-Type: application/json" \
  -H "Cookie: ginko_admin=<ADMIN_TOKEN>" \
  -d '{}'

# Check records older than 5 minutes (for testing)
curl -X POST http://localhost:3000/api/admin/payments/reconcile \
  -H "Content-Type: application/json" \
  -H "Cookie: ginko_admin=<ADMIN_TOKEN>" \
  -d '{"olderThanMinutes": 5}'
```

Response:
```json
{
  "checked": 3,
  "repaired": 1,
  "skipped": 2,
  "details": [
    {
      "paymentIntentId": "uuid...",
      "localStatus": "requires_payment_method",
      "stripeStatus": "succeeded",
      "action": "repaired"
    }
  ]
}
```

### Scheduled cron (production)

Add to Vercel Cron or your scheduler:
```
POST /api/admin/payments/reconcile
Header: Cookie: ginko_admin=<ADMIN_TOKEN>
Body: {}
Schedule: every 30 minutes
```

Or use Supabase pg_cron extension to call a DB function that invokes this endpoint.

---

## 4. State machine reference

```
Guest submits booking
  → booking.status = 'pending'

Guest clicks "Pay deposit"
  → payment_intents.status = 'requires_payment_method'
  → Stripe Checkout Session created

Guest completes checkout (Stripe)
  → webhook: checkout.session.completed
  → payment_intents.status = 'succeeded'
  → booking.status = 'confirmed'
  → booking.deposit_paid = true

Guest abandons checkout
  → webhook: checkout.session.expired
  → payment_intents.status = 'cancelled'
  → booking.status stays 'pending'

Guest fails card
  → webhook: payment_intent.payment_failed
  → payment_intents.status = 'requires_payment_method'
  → booking.status stays 'pending'

Admin issues refund
  → Stripe refund created
  → payment_transactions INSERT (type=refund)
  → booking.deposit_paid = false (full refund only)
  → booking.status unchanged (admin cancels manually if needed)

Reconcile detects drift
  → re-checks Stripe live status
  → repairs payment_intents + booking if succeeded
```

---

## 5. Production TODO

Before going live:

- [ ] Replace `sk_test_` / `pk_test_` / `whsec_test_` with live keys
- [ ] Register live webhook endpoint in Stripe Dashboard (copy whsec to env)
- [ ] Subscribe only to needed events: `checkout.session.completed`, `payment_intent.succeeded`,
      `payment_intent.payment_failed`, `checkout.session.expired`, `charge.refunded`
- [ ] Enable HTTPS (required by Stripe for live webhook delivery)
- [ ] Add `NEXT_PUBLIC_SITE_URL` (production domain, no trailing slash)
- [ ] Test live checkout with a real card (small amount, then refund immediately)
- [ ] Set up reconciliation cron (Vercel Cron or Supabase pg_cron)
- [ ] Monitor Stripe Dashboard → Webhooks for failed deliveries weekly
- [ ] Enable Stripe Radar rules for fraud prevention
- [ ] Add email confirmation on `checkout.session.completed` (Stripe 6 / email phase)
