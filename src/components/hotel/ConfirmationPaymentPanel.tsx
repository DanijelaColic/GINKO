'use client';

import { useTranslations } from 'next-intl';
import PayDepositButton from './PayDepositButton';

type Props = {
  bookingId: string;
  token: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  depositEur: number;
  paymentBanner?: {
    kind: 'success' | 'cancelled';
    bg: string;
    text: string;
    icon: string;
    title: string;
    body: string;
  } | null;
};

export default function ConfirmationPaymentPanel({
  bookingId,
  token,
  status,
  depositEur,
  paymentBanner,
}: Props) {
  const t = useTranslations('bookingConfirmation');
  const paymentSucceeded = paymentBanner?.kind === 'success';
  const paymentCancelled = status === 'cancelled';

  return (
    <div className="space-y-5">
      {paymentBanner && (
        <div className={`rounded-2xl border px-5 py-4 ${paymentBanner.bg}`}>
          <div className="flex items-start gap-3">
            <span className={`text-xl font-bold leading-none mt-0.5 ${paymentBanner.text}`}>
              {paymentBanner.icon}
            </span>
            <div>
              <p className={`font-semibold ${paymentBanner.text}`}>{paymentBanner.title}</p>
              <p className={`text-sm mt-0.5 ${paymentBanner.text} opacity-80`}>
                {paymentBanner.body}
              </p>
            </div>
          </div>
        </div>
      )}

      {paymentCancelled && (
        <div className="rounded-2xl border border-stone/20 bg-white shadow-sm px-6 py-6 text-center space-y-2">
          <p className="text-text/60 text-sm">{t('bookingCancelled')}</p>
          <p className="text-text/50 text-xs">{t('bookingCancelledHint')}</p>
        </div>
      )}

      {!paymentSucceeded && !paymentCancelled && (
        <div className="rounded-2xl border border-stone/20 bg-white shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h3 className="text-base font-semibold text-text">{t('cardPayTitle')}</h3>
            <p className="text-xs text-text/50 mt-0.5">
              {t('cardPayNote', { amount: depositEur })}
            </p>
          </div>
          <div className="px-6 pb-6">
            <PayDepositButton
              bookingId={bookingId}
              token={token}
              depositEur={depositEur}
            />
          </div>
        </div>
      )}

      {paymentSucceeded && (
        <div className="rounded-2xl border border-stone/20 bg-white shadow-sm px-6 py-5 text-sm text-text/60">
          {t('balanceOnArrival')}
        </div>
      )}

      {!paymentCancelled && (
        <p className="text-xs text-text/40 text-center leading-relaxed px-2">
          {t('terms')}
        </p>
      )}
    </div>
  );
}
