'use client';

import PayDepositButton from './PayDepositButton';

type Props = {
  bookingId: string;
  token: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  depositEur: number;
  paymentBanner?: {
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
  const paymentSucceeded = paymentBanner?.title === 'Plaćanje zaprimljeno';
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
          <p className="text-text/60 text-sm">Ova rezervacija je otkazana.</p>
          <p className="text-text/50 text-xs">
            Za novo rezerviranje posjetite stranicu dostupnosti.
          </p>
        </div>
      )}

      {/* Retry card pay after cancelled/interrupted Saferpay — or if checkout failed */}
      {!paymentSucceeded && !paymentCancelled && (
        <div className="rounded-2xl border border-stone/20 bg-white shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h3 className="text-base font-semibold text-text">Plaćanje depozita karticom</h3>
            <p className="text-xs text-text/50 mt-0.5">
              Plaća se samo depozit od{' '}
              <span className="font-semibold text-accent">{depositEur} €</span>
              {' '}— ostatak se plaća pri dolasku
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
          Ostatak iznosa plaća se pri dolasku. Potvrdu rezervacije šaljemo na e-mail.
        </div>
      )}

      {!paymentCancelled && (
        <p className="text-xs text-text/40 text-center leading-relaxed px-2">
          Rezervacijom prihvaćate uvjete otkazivanja. Besplatno otkazivanje i povrat depozita
          do 14 dana prije dolaska.
        </p>
      )}
    </div>
  );
}
