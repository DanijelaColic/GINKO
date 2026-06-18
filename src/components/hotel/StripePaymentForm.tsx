'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

// Initialised once at module level — safe to call multiple times per loadStripe docs.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
);

// ── Inner form (must live inside <Elements>) ──────────────────────

type InnerFormProps = {
  depositEur: number;
  returnUrl: string;
};

function InnerForm({ depositEur, returnUrl }: InnerFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;

      setSubmitting(true);
      setErrorMsg(null);

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
      });

      // confirmPayment redirects on success — we only get here on error.
      if (error) {
        setErrorMsg(
          error.message ?? 'Plaćanje nije uspjelo. Molimo pokušajte ponovo.',
        );
        setSubmitting(false);
      }
    },
    [stripe, elements, returnUrl],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Stripe PaymentElement — renders card fields + Apple/Google Pay if available */}
      <PaymentElement
        options={{
          layout: 'tabs',
          fields: {
            billingDetails: {
              name: 'auto',
              email: 'never',
            },
          },
        }}
      />

      {errorMsg && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 px-6 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Obrada plaćanja...
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            Rezerviraj i plati {depositEur} €
          </>
        )}
      </button>

      {/* Trust line */}
      <p className="text-center text-[11px] text-text/40 flex items-center justify-center gap-1.5">
        <ShieldCheck size={11} className="text-emerald-500" />
        Sigurno plaćanje · Stripe · Podaci kartice se ne pohranjuju
      </p>
    </form>
  );
}

// ── Wrapper: fetches clientSecret, then mounts Elements ──────────

type StripePaymentFormProps = {
  bookingId: string;
  token: string;
  depositEur: number;
  confirmationUrl: string;
};

type FormState =
  | { phase: 'loading' }
  | { phase: 'ready'; clientSecret: string }
  | { phase: 'error'; message: string }
  | { phase: 'already_paid' };

export default function StripePaymentForm({
  bookingId,
  token,
  depositEur,
  confirmationUrl,
}: StripePaymentFormProps) {
  const [state, setState] = useState<FormState>({ phase: 'loading' });

  const initPayment = useCallback(async () => {
    setState({ phase: 'loading' });

    try {
      const res = await fetch('/api/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, token, paymentType: 'deposit' }),
      });

      const data = (await res.json()) as { clientSecret?: string; error?: string };

      if (!res.ok || !data.clientSecret) {
        if (res.status === 409) {
          setState({ phase: 'already_paid' });
          return;
        }
        setState({ phase: 'error', message: data.error ?? 'Greška pri inicijalizaciji plaćanja' });
        return;
      }

      setState({ phase: 'ready', clientSecret: data.clientSecret });
    } catch {
      setState({ phase: 'error', message: 'Mrežna greška — pokušajte ponovo' });
    }
  }, [bookingId, token]);

  // Auto-initialise on mount — no button click required.
  useEffect(() => {
    initPayment();
  }, [initPayment]);

  const returnUrl = `${confirmationUrl}&payment=success`;

  if (state.phase === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-text/50 text-sm">
        <Loader2 size={18} className="animate-spin" />
        Učitavanje forme za plaćanje...
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {state.message}
        </div>
        <button
          onClick={initPayment}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 px-6 rounded-2xl hover:opacity-90 transition-opacity"
        >
          Pokušaj ponovo
        </button>
      </div>
    );
  }

  if (state.phase === 'already_paid') {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
        <ShieldCheck size={16} className="shrink-0" />
        Plaćanje je već pokrenuto — provjeri e-mail za status potvrde.
      </div>
    );
  }

  // phase === 'ready' — mount Stripe Elements
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: state.clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2d6a4f',
            colorBackground: '#ffffff',
            colorText: '#1a1a1a',
            colorDanger: '#dc2626',
            fontFamily: 'inherit',
            spacingUnit: '4px',
            borderRadius: '12px',
          },
        },
        locale: 'hr',
      }}
    >
      <InnerForm depositEur={depositEur} returnUrl={returnUrl} />
    </Elements>
  );
}
