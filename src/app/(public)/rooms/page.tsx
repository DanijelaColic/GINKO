// Adapted from Villa-Jurina/src/app/(public)/apartmani/page.tsx
// Layout: header section (copy) + RoomGrid client component (card grid + filters)
// Color classes: secondary→accent, sand→stone, sand-light→stone-light

import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

// Rooms data is mock-static; revalidate once per hour when real backend is connected.
export const revalidate = 3600;
import { getRooms } from '@/modules/rooms/room.repository';
import { getValidLocale } from '@/i18n/messages';
import { getPageMetadata } from '@/i18n/metadata';
import RoomGrid from '@/components/hotel/RoomGrid';
import type { RoomLocale } from '@/modules/rooms/room.types';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  return getPageMetadata({ locale, pathname: '/rooms', namespace: 'roomsPage' });
}

export default async function RoomsPage() {
  const locale = getValidLocale(await getLocale());
  const t = await getTranslations('roomsPage');
  const rooms = await getRooms(locale as RoomLocale);

  const cardLabels = {
    itemLabel: t('itemLabel'),
    fullyBooked: t('badges.fullyBooked'),
    duplex: t('stats.duplex'),
    seaView: t('stats.seaView'),
    balcony: t('stats.balcony'),
    priceTitle: t('price.title'),
    offSeason: t('price.offSeason'),
    highSeason: t('price.highSeason'),
    unavailable: t('price.unavailable'),
    details: t('actions.details'),
    book: t('actions.book'),
  };

  const filterLabels = {
    guestsLabel: t('filters.guestsLabel'),
    maxPriceLabel: t('filters.maxPriceLabel'),
    any: t('filters.any'),
    noResults: t('filters.noResults'),
  };

  return (
    <div>
      {/* Header — copied from Jurina apartmani/page.tsx header section */}
      <section className="py-16 lg:py-20 bg-stone-light text-center">
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

      {/* Grid + filters */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <RoomGrid rooms={rooms} cardLabels={cardLabels} filterLabels={filterLabels} />
        </div>
      </section>
    </div>
  );
}
