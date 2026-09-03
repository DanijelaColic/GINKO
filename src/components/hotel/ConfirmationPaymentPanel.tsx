'use client';

import { useTranslations } from 'next-intl';
import PayDepositButton from './PayDepositButton';
import {
  PROPERTY_ADDRESS,
  PROPERTY_MAP_URL,
} from '@/modules/property/property-details.config';

type Props = {
  bookingId: string;
  token: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  paid: boolean;
  depositEur: number;
  remainingEur: number;
  guestFirstName?: string;
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
  paid,
  depositEur,
  remainingEur,
  guestFirstName,
  paymentBanner,
}: Props) {
  const t = useTranslations('bookingConfirmation');
  const bookingCancelled = status === 'cancelled';
  const showPayButton = !paid && !bookingCancelled;
  const showPaidState = paid && !bookingCancelled;

  return (
    <div className="space-y-5">
      {guestFirstName && (
        <p className="font-serif text-xl font-semibold text-text">
          {t('pageGreeting', { name: guestFirstName })}
        </p>
      )}

      {paymentBanner && !paid && (
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

      {bookingCancelled && (
        <div className="rounded-2xl border border-stone/20 bg-white shadow-sm px-6 py-6 text-center space-y-2">
          <p className="text-text/60 text-sm">{t('bookingCancelled')}</p>
          <p className="text-text/50 text-xs">{t('bookingCancelledHint')}</p>
        </div>
      )}

      {showPayButton && (
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

      {showPaidState && (
        <div className="rounded-2xl border border-green-200 bg-green-50/60 px-6 py-5 space-y-3">
          <p className="font-semibold text-green-800">{t('confirmedTitle')}</p>
          <p className="text-sm text-green-800/80">
            {t('confirmedBody', { remaining: remainingEur })}
          </p>
          <p className="text-sm">
            <a
              href={PROPERTY_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {PROPERTY_ADDRESS}
            </a>
          </p>
        </div>
      )}

      {!bookingCancelled && (
        <p className="text-xs text-text/40 text-center leading-relaxed px-2">
          {t('terms')}
        </p>
      )}
    </div>
  );
}
