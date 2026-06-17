// Adapted from Villa-Jurina/src/app/(public)/rezervacija/page.tsx
// Header + info strip copied; FAQ removed (Phase 4); searchParam apartman→room
// Color: secondary→accent, sand→stone, sand-light→stone-light

import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { getValidLocale } from '@/i18n/messages';
import { getPageMetadata } from '@/i18n/metadata';
import BookingWidget from '@/components/hotel/BookingWidget';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  return getPageMetadata({ locale, pathname: '/booking', namespace: 'bookingPage' });
}

type Props = {
  searchParams: Promise<{ room?: string }>;
};

export default async function BookingPage({ searchParams }: Props) {
  const t = await getTranslations('bookingPage');
  const { room } = await searchParams;

  return (
    <div>
      {/* Header — copied from VJ rezervacija/page.tsx */}
      <section className="py-14 lg:py-18 bg-stone-light text-center">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-accent font-medium tracking-widest text-xs uppercase mb-3">
            {t('eyebrow')}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-text mb-4">
            {t('title')}
          </h1>
          <p className="text-muted text-base leading-relaxed">{t('description')}</p>
        </div>
      </section>

      {/* BookingWidget — max-w je interno po koraku (3xl na k.1, 5xl na k.2) */}
      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <BookingWidget initialSlug={room} />
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
