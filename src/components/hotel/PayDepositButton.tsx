'use client';

// Client-side "Pay deposit" button.
// Calls /api/payments/checkout, then redirects to Saferpay Payment Page.
// Receives bookingId + token as props — both already present in the
// confirmation page URL, so no extra auth surface is added.

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { guestErrorMessage } from '@/lib/guest-api-error';

type Props = {
  bookingId: string;
  token: string;
  depositEur: number;
  /** If true the payment already exists — show a disabled "paid / pending" state */
  alreadyInitiated?: boolean;
};

export default function PayDepositButton({
  bookingId,
  token,
  depositEur,
  alreadyInitiated = false,
}: Props) {
  const t = useTranslations('bookingConfirmation');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, token, paymentType: 'deposit' }),
      });

      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setError(
          guestErrorMessage(
            data.error,
            (key) => t.has(key),
            (key) => t(key),
            'checkoutErrors',
            'errorCreate',
          ),
        );
        setLoading(false);
        return;
      }

      // Redirect to Saferpay Payment Page
      window.location.href = data.url;
    } catch {
      setError(t('errorNetwork'));
      setLoading(false);
    }
  };

  if (alreadyInitiated) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
        <CreditCard size={16} className="shrink-0" />
        {t('alreadyStarted')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 px-6 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {t('redirecting')}
          </>
        ) : (
          <>
            <CreditCard size={18} />
            {t('payButton', { amount: depositEur })}
          </>
        )}
      </button>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
