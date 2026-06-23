// Adapted from Villa-Jurina/src/app/(public)/rezervacija/page.tsx
// Header + info strip copied; FAQ removed (Phase 4); searchParam apartman→room
// Color: secondary→accent, sand→stone, sand-light→stone-light

import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { getValidLocale } from '@/i18n/messages';
import { getPageMetadata } from '@/i18n/metadata';
import { buildAvailabilityHref } from '@/modules/booking/booking.config';
import BookingWidget from '@/components/hotel/BookingWidget';
import { getGoogleReviews } from '@/modules/reviews/google-reviews.service';
import { redirect } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  return getPageMetadata({ locale, pathname: '/booking', namespace: 'bookingPage' });
}

type Props = {
  searchParams: Promise<{ room?: string; checkIn?: string; checkOut?: string; adults?: string; children?: string }>;
};

export default async function BookingPage({ searchParams }: Props) {
  const locale = getValidLocale(await getLocale());
  const t = await getTranslations('bookingPage');
  const { room, checkIn, checkOut, adults, children } = await searchParams;
  const googleReviews = await getGoogleReviews();
  const reviewSummary = googleReviews
    ? { rating: googleReviews.rating, reviewCount: googleReviews.reviewCount }
    : null;

  if (!checkIn || !checkOut) {
    redirect({ href: buildAvailabilityHref(room ? { room } : undefined), locale });
  }

  return (
    <div>
      {/* BookingWidget — header se prikazuje samo na koraku 1 (unutar widgeta) */}
      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <BookingWidget
            initialSlug={room}
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            initialAdults={adults}
            initialChildren={children}
            reviewSummary={reviewSummary}
          />
        </div>
      </section>

      {/* Info strip — copied from VJ rezervacija/page.tsx */}
      <section className="bg-stone-light py-10 border-t border-stone">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-sm">
          {[
            { label: t('strip.checkInLabel'), value: t('strip.checkInValue') },
            { label: t('strip.checkOutLabel'), value: t('strip.checkOutValue') },
            { label: t('strip.minStayLabel'), value: t('strip.minStayValue') },
            { label: t('strip.depositLabel'), value: t('strip.depositValue') },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted uppercase tracking-widest font-medium mb-1">
                {label}
              </p>
              <p className="text-text font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
