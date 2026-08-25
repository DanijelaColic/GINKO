// Adapted from VJ pattern: reads persisted booking record via public API endpoint.
// Token-gated: confirmation URL is only valid for the booking's guest email.
// Step 3 of reservation flow — two-column layout mirroring Step 2 ("Vaši podaci").
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { getBookingConfirmationData } from '@/modules/booking/booking.confirmation';
import { parseLocalDate } from '@/modules/booking/dates';
import BookingStepsBar from '@/components/hotel/BookingStepsBar';
import BookingSummaryCard from '@/components/hotel/BookingSummaryCard';
import ConfirmationPaymentPanel from '@/components/hotel/ConfirmationPaymentPanel';
import { getGoogleReviews } from '@/modules/reviews/google-reviews.service';
import { syncSaferpayPayment } from '@/modules/payments/payment.service';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    token?: string;
    payment?: string;
    oid?: string;
    /** @deprecated Worldline Direct return param */
    hostedCheckoutId?: string;
  }>;
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function BookingConfirmationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { token = '', payment, oid, hostedCheckoutId } = await searchParams;

  // Sync Saferpay status when guest returns from Payment Page (Assert + Capture)
  const orderId = oid ?? hostedCheckoutId;
  let syncedStatus: string | null = null;
  if (orderId) {
    try {
      syncedStatus = await syncSaferpayPayment(orderId);
    } catch (err) {
      console.error('[confirmation] syncSaferpayPayment:', err);
    }
  }

  if (!id || !token) notFound();

  const locale = await getLocale();
  const t = await getTranslations('bookingConfirmation');
  const [data, googleReviews] = await Promise.all([
    getBookingConfirmationData(id, token, locale),
    getGoogleReviews(),
  ]);

  if (!data) notFound();

  const showSuccessBanner =
    payment === 'success' ||
    (payment === 'return' && syncedStatus === 'succeeded') ||
    (payment === 'return' && syncedStatus === 'processing');
  const showCancelledBanner =
    payment === 'cancelled' ||
    (payment === 'return' && syncedStatus === 'cancelled');

  const paymentBanner = showSuccessBanner
      ? {
          kind: 'success' as const,
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: '✓',
          title: t('paySuccessTitle'),
          body: t('paySuccessBody'),
        }
      : showCancelledBanner
        ? {
            kind: 'cancelled' as const,
            bg: 'bg-amber-50 border-amber-200',
            text: 'text-amber-800',
            icon: '↩',
            title: t('payCancelledTitle'),
            body: t('payCancelledBody'),
          }
        : null;

  const reviewSummary = googleReviews
    ? { rating: googleReviews.rating, reviewCount: googleReviews.reviewCount }
    : null;

  const checkInDate = parseLocalDate(data.checkInIso);
  const checkOutDate = parseLocalDate(data.checkOutIso);

  return (
    <main className="min-h-screen bg-stone/5 py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Stepper — korak 3 aktivan */}
        <BookingStepsBar currentStep={3} />

        {/* Two-column layout — isti pattern kao korak 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">

          {/* ── Lijevo: sažetak rezervacije (sticky) ── */}
          <div className="lg:sticky lg:top-24">
            <BookingSummaryCard
              room={data.room}
              checkIn={checkInDate}
              checkOut={checkOutDate}
              priceData={data.priceBreakdown}
              adults={String(data.adults)}
              childrenCount={String(data.children)}
              locale={locale}
              readOnly
              reviewSummary={reviewSummary}
            />
          </div>

          {/* ── Desno: plaćanje ── */}
          <div>
            <div className="mb-6">
              <h2 className="font-serif text-2xl font-semibold text-text">
                {t('title')}
              </h2>
              <p className="text-sm text-text/50 mt-1">
                {t('reference')}:{' '}
                <span className="font-mono font-medium text-text/70">{data.reference}</span>
                {' · '}
                <span className={
                  data.status === 'confirmed'
                    ? 'text-green-600'
                    : data.status === 'cancelled'
                      ? 'text-red-500'
                      : 'text-amber-600'
                }>
                  {data.status === 'confirmed'
                    ? t('statusConfirmed')
                    : data.status === 'cancelled'
                      ? t('statusCancelled')
                      : t('statusPending')}
                </span>
              </p>
            </div>

            <ConfirmationPaymentPanel
              bookingId={id}
              token={token}
              status={data.status}
              depositEur={data.deposit}
              paymentBanner={paymentBanner}
            />

            {/* Back link */}
            <div className="mt-8 text-center">
              <Link
                href="/"
                className="inline-block rounded-full border border-primary px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
              >
                {t('backHome')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
