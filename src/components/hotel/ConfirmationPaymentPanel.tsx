'use client';

import { useState } from 'react';
import { CreditCard, Building2, ChevronDown } from 'lucide-react';
import StripePaymentForm from './StripePaymentForm';

type PaymentInfo = {
  recipient: string;
  iban: string;
  bic: string;
  bankName: string;
  description: string;
};

type Props = {
  bookingId: string;
  token: string;
  reference: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  depositEur: number;
  payment: PaymentInfo;
  confirmationUrl: string;
  paymentBanner?: {
    bg: string;
    text: string;
    icon: string;
    title: string;
    body: string;
  } | null;
};

type Tab = 'card' | 'bank';

export default function ConfirmationPaymentPanel({
  bookingId,
  token,
  reference,
  status,
  depositEur,
  payment,
  confirmationUrl,
  paymentBanner,
}: Props) {
  const [tab, setTab] = useState<Tab>('card');
  const [bankOpen, setBankOpen] = useState(false);

  // After successful payment show confirmation state instead of form
  const paymentSucceeded = paymentBanner?.title === 'Plaćanje zaprimljeno';
  const paymentCancelled = status === 'cancelled';

  return (
    <div className="space-y-5">

      {/* ── Payment return banner (success / cancelled redirect) ── */}
      {paymentBanner && (
        <div className={`rounded-2xl border px-5 py-4 ${paymentBanner.bg}`}>
          <div className="flex items-start gap-3">
            <span className={`text-xl font-bold leading-none mt-0.5 ${paymentBanner.text}`}>
              {paymentBanner.icon}
            </span>
            <div>
              <p className={`font-semibold ${paymentBanner.text}`}>{paymentBanner.title}</p>
              <p className={`text-sm mt-0.5 ${paymentBanner.text} opacity-80`}>{paymentBanner.body}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancelled state ── */}
      {paymentCancelled && (
        <div className="rounded-2xl border border-stone/20 bg-white shadow-sm px-6 py-6 text-center space-y-2">
          <p className="text-text/60 text-sm">Ova rezervacija je otkazana.</p>
          <p className="text-text/50 text-xs">Za novo rezerviranje posjetite stranicu dostupnosti.</p>
        </div>
      )}

      {/* ── Payment panel (hidden after success or when cancelled) ── */}
      {!paymentSucceeded && !paymentCancelled && (
        <div className="rounded-2xl border border-stone/20 bg-white shadow-sm overflow-hidden">

          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <h3 className="text-base font-semibold text-text">Kako želite platiti?</h3>
            <p className="text-xs text-text/50 mt-0.5">
              Plaća se samo depozit od{' '}
              <span className="font-semibold text-accent">{depositEur} €</span>
              {' '}— ostatak se plaća pri dolasku
            </p>
          </div>

          {/* Tabs */}
          <div className="px-6 pb-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab('card')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  tab === 'card'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-text/60 border-stone hover:border-primary/40 hover:text-text'
                }`}
              >
                <CreditCard size={15} />
                Kartica
              </button>
              {payment.iban && (
                <button
                  type="button"
                  onClick={() => setTab('bank')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    tab === 'bank'
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-text/60 border-stone hover:border-primary/40 hover:text-text'
                  }`}
                >
                  <Building2 size={15} />
                  Bankovni prijenos
                </button>
              )}
            </div>
          </div>

          <div className="px-6 pb-6">
            {/* ── Tab: Kartica ── */}
            {tab === 'card' && (
              <StripePaymentForm
                bookingId={bookingId}
                token={token}
                depositEur={depositEur}
                confirmationUrl={confirmationUrl}
              />
            )}

            {/* ── Tab: Bankovni prijenos ── */}
            {tab === 'bank' && payment.iban && (
              <div className="space-y-4">
                <p className="text-sm text-text/60 leading-relaxed">
                  Uplatite depozit na račun u roku od{' '}
                  <span className="font-medium text-text">48 sati</span>{' '}
                  kako bismo potvrdili vašu rezervaciju.
                </p>

                <dl className="space-y-3 text-sm bg-stone/5 rounded-xl p-4">
                  <div className="flex justify-between gap-4">
                    <dt className="text-text/50 shrink-0">Primatelj</dt>
                    <dd className="font-medium text-text text-right">{payment.recipient}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-text/50 shrink-0">IBAN</dt>
                    <dd className="font-mono font-medium text-text text-xs tracking-wider text-right">
                      {payment.iban}
                    </dd>
                  </div>
                  {payment.bic && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-text/50 shrink-0">BIC/SWIFT</dt>
                      <dd className="font-mono font-medium text-text text-right">{payment.bic}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-text/50 shrink-0">Iznos</dt>
                    <dd className="font-bold text-accent text-right">{depositEur} €</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-stone pt-3">
                    <dt className="text-text/50 shrink-0">Opis plaćanja</dt>
                    <dd className="font-medium text-text text-right">
                      {payment.description} – {reference}
                    </dd>
                  </div>
                </dl>

                <p className="text-[11px] text-text/40">
                  Navedite točno referencu rezervacije u opisu plaćanja. Uplata se obrađuje u roku 1–2 radna dana.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Post-success info ── */}
      {paymentSucceeded && (
        <div className="rounded-2xl border border-stone/20 bg-white shadow-sm px-6 py-5">
          <button
            type="button"
            onClick={() => setBankOpen((v) => !v)}
            className="w-full flex items-center justify-between text-sm text-text/60 hover:text-text transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <Building2 size={14} className="text-text/40 shrink-0" />
              Podaci za bankovni prijenos ostatka
            </span>
            <ChevronDown
              size={15}
              className={`shrink-0 transition-transform duration-200 ${bankOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {bankOpen && payment.iban && (
            <dl className="mt-4 space-y-2.5 text-sm border-t border-stone/10 pt-4">
              <div className="flex justify-between gap-4">
                <dt className="text-text/50 shrink-0">IBAN</dt>
                <dd className="font-mono font-medium text-text text-xs tracking-wider text-right">
                  {payment.iban}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text/50 shrink-0">Opis plaćanja</dt>
                <dd className="font-medium text-text text-right">
                  {payment.description} – {reference}
                </dd>
              </div>
            </dl>
          )}
        </div>
      )}

      {/* ── Fine print ── */}
      {!paymentCancelled && (
        <p className="text-xs text-text/40 text-center leading-relaxed px-2">
          Rezervacijom prihvaćate uvjete otkazivanja. Besplatno otkazivanje do 5 dana prije dolaska.
        </p>
      )}

    </div>
  );
}
