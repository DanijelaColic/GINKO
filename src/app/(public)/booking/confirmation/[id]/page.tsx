// Adapted from VJ pattern: reads persisted booking record via public API endpoint.
// Token-gated: confirmation URL is only valid for the booking's guest email.
// Stripe 2: added PayDepositButton + payment=success|cancelled state banner.
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBookingConfirmationData } from '@/modules/booking/booking.confirmation';
import { getPaymentStatus } from '@/modules/payments/payment.service';
import PayDepositButton from '@/components/hotel/PayDepositButton';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; payment?: string; session_id?: string }>;
};

export default async function BookingConfirmationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { token = '', payment } = await searchParams;

  if (!id || !token) notFound();

  const [data, paymentStatus] = await Promise.all([
    getBookingConfirmationData(id, token),
    getPaymentStatus(id).catch(() => null),
  ]);

  if (!data) notFound();

  const statusLabel =
    data.status === 'confirmed'
      ? 'Potvrđena'
      : data.status === 'cancelled'
        ? 'Otkazana'
        : 'Na čekanju';

  const statusColor =
    data.status === 'confirmed'
      ? 'text-green-700 bg-green-50'
      : data.status === 'cancelled'
        ? 'text-red-700 bg-red-50'
        : 'text-amber-700 bg-amber-50';

  // Payment redirect state (non-final — webhook is the source of truth)
  const paymentBanner =
    payment === 'success'
      ? {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: '✓',
          title: 'Plaćanje zaprimljeno',
          body: 'Vaše plaćanje se obrađuje. Rezervacija će biti potvrđena čim sredstva budu evidentirana. Potvrdu ćemo poslati na vašu e-mail adresu.',
        }
      : payment === 'cancelled'
        ? {
            bg: 'bg-amber-50 border-amber-200',
            text: 'text-amber-800',
            icon: '↩',
            title: 'Plaćanje prekinuto',
            body: 'Niste dovršili plaćanje. Rezervacija je i dalje aktivna — možete platiti ispod ili odabrati plaćanje bankovnim prijenosom.',
          }
        : null;

  const paymentAlreadyInitiated =
    !!paymentStatus && paymentStatus.intent_status !== 'requires_payment_method';

  return (
    <main className="min-h-screen bg-stone/5 py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Payment return banner (success / cancelled) */}
        {paymentBanner && (
          <div className={`rounded-2xl border px-5 py-4 ${paymentBanner.bg}`}>
            <div className="flex items-start gap-3">
              <span className={`text-xl font-bold ${paymentBanner.text}`}>{paymentBanner.icon}</span>
              <div>
                <p className={`font-semibold ${paymentBanner.text}`}>{paymentBanner.title}</p>
                <p className={`text-sm mt-0.5 ${paymentBanner.text} opacity-80`}>{paymentBanner.body}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-2">
            <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text">Rezervacija zaprimljena</h1>
          <p className="text-text/60 text-sm">
            Referenca: <span className="font-mono font-semibold text-text">{data.reference}</span>
          </p>
        </div>

        {/* Status badge */}
        <div className="flex justify-center">
          <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Details card */}
        <div className="rounded-2xl border border-stone/20 bg-white divide-y divide-stone/10 shadow-sm">
          <div className="px-6 py-5">
            <h2 className="text-sm font-semibold text-text/50 uppercase tracking-wide mb-4">Detalji rezervacije</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-text/50">Gost</dt>
                <dd className="font-medium text-text mt-0.5">{data.guestName}</dd>
              </div>
              <div>
                <dt className="text-text/50">Soba</dt>
                <dd className="font-medium text-text mt-0.5">{data.roomName}</dd>
              </div>
              <div>
                <dt className="text-text/50">Dolazak</dt>
                <dd className="font-medium text-text mt-0.5">{data.checkIn}</dd>
              </div>
              <div>
                <dt className="text-text/50">Odlazak</dt>
                <dd className="font-medium text-text mt-0.5">{data.checkOut}</dd>
              </div>
              <div>
                <dt className="text-text/50">Broj noći</dt>
                <dd className="font-medium text-text mt-0.5">{data.nights}</dd>
              </div>
              <div>
                <dt className="text-text/50">Cijena po noći</dt>
                <dd className="font-medium text-text mt-0.5">{data.pricePerNight} €</dd>
              </div>
            </dl>
          </div>

          {/* Price summary */}
          <div className="px-6 py-5 space-y-2 text-sm">
            <h2 className="text-sm font-semibold text-text/50 uppercase tracking-wide mb-4">Pregled troškova</h2>
            <div className="flex justify-between">
              <span className="text-text/70">Ukupno</span>
              <span className="font-semibold text-text">{data.totalPrice} €</span>
            </div>
            <div className="flex justify-between text-accent font-medium">
              <span>Depozit (plati odmah)</span>
              <span>{data.deposit} €</span>
            </div>
            <div className="flex justify-between text-text/60">
              <span>Ostatak (platiti pri dolasku)</span>
              <span>{data.totalPrice - data.deposit} €</span>
            </div>
          </div>

          {/* Stripe pay button — only show if booking is not cancelled */}
          {data.status !== 'cancelled' && (
            <div className="px-6 py-5">
              <h2 className="text-sm font-semibold text-text/50 uppercase tracking-wide mb-4">
                Plati depozit karticom
              </h2>
              <PayDepositButton
                bookingId={id}
                token={token}
                depositEur={data.deposit}
                alreadyInitiated={paymentAlreadyInitiated}
              />
              <p className="text-xs text-text/40 mt-3 text-center">
                Sigurno plaćanje putem Stripe · Podaci kartice se ne pohranjuju na našim serverima
              </p>
            </div>
          )}

          {/* Bank transfer fallback */}
          {data.payment.iban && data.status !== 'cancelled' && (
            <div className="px-6 py-5 text-sm">
              <h2 className="text-sm font-semibold text-text/50 uppercase tracking-wide mb-4">
                Ili plati bankovnim prijenosom
              </h2>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-text/50">Primatelj</dt>
                  <dd className="font-medium text-text">{data.payment.recipient}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text/50">IBAN</dt>
                  <dd className="font-mono font-medium text-text text-xs tracking-wider">{data.payment.iban}</dd>
                </div>
                {data.payment.bic && (
                  <div className="flex justify-between">
                    <dt className="text-text/50">BIC/SWIFT</dt>
                    <dd className="font-mono font-medium text-text">{data.payment.bic}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-text/50">Opis plaćanja</dt>
                  <dd className="font-medium text-text">{data.payment.description} – {data.reference}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Info note */}
        <div className="rounded-xl bg-accent/5 border border-accent/20 px-5 py-4 text-sm text-text/70">
          <p>
            {payment === 'success'
              ? 'Potvrdu plaćanja i rezervacije poslat ćemo na vašu e-mail adresu. Ostatak se plaća pri dolasku.'
              : 'Potvrdu rezervacije smo poslali na vašu e-mail adresu. Molimo uplatite depozit u roku od 48 sati kako bismo potvrdili vašu rezervaciju.'}
          </p>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block rounded-full border border-primary px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Povratak na početnu
          </Link>
        </div>
      </div>
    </main>
  );
}
