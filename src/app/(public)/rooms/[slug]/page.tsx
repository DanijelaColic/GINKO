// Adapted from Villa-Jurina/src/app/(public)/apartmani/[slug]/page.tsx
// Removed: JsonLd (SEO phase later), Jurina-specific room refs
// Color classes: secondary→accent, sand→stone, sand-light→stone-light
// Routes: /apartmani→/rooms, /rezervacija→/booking

import { notFound } from 'next/navigation';
import { Users, Maximize2, Check } from 'lucide-react';
import BedTypeIcons from '@/components/hotel/BedTypeIcons';
import { getLocale, getTranslations } from 'next-intl/server';
import { rooms } from '@/modules/rooms/rooms.config';
import { getRoom } from '@/modules/rooms/room.repository';
import { getSiteUrl } from '@/lib/siteUrl';
import { getValidLocale } from '@/i18n/messages';
import { getBreadcrumbStructuredData } from '@/i18n/metadata';
import { SITE_NAME, buildAvailabilityHref, DEPOSIT_PERCENT } from '@/modules/booking/booking.config';
import ImageGallery from '@/components/hotel/ImageGallery';
import { Link } from '@/i18n/navigation';
import { InternalLinks } from '@/components/seo/InternalLinks';
import type { RoomLocale } from '@/modules/rooms/room.types';

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return rooms.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const locale = getValidLocale(await getLocale());
  const t = await getTranslations({ locale, namespace: 'roomDetailPage' });
  const room = await getRoom(slug, locale as RoomLocale);
  if (!room) return {};
  const prefix = t('metadata.titlePrefix');
  const suffix = t('metadata.descriptionSuffix');
  const title = `${prefix} ${room.name}`;
  const description = `${room.tagline} ${prefix} ${room.capacityNote}, ${room.size} m², ${suffix}`;
  const BASE_URL = getSiteUrl();
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/rooms/${slug}`,
      images: room.images[0]
        ? [{ url: room.images[0], width: 1200, height: 630, alt: title }]
        : [],
    },
    alternates: { canonical: `${BASE_URL}/rooms/${slug}` },
  };
}

export default async function RoomDetailPage({ params }: Props) {
  const locale = getValidLocale(await getLocale());
  const t = await getTranslations('roomDetailPage');
  const { slug } = await params;
  const room = await getRoom(slug, locale as RoomLocale);

  if (!room) notFound();

  const breadcrumbJsonLd = getBreadcrumbStructuredData(locale, [
    { name: SITE_NAME, pathname: '/' },
    { name: t('breadcrumb.rooms'), pathname: '/rooms' },
    { name: room.name, pathname: `/rooms/${room.slug}` },
  ]);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Galerija — full width, bez paddinga */}
      {room.images.length > 0 ? (
        <ImageGallery images={room.images} alt={`${t('eyebrow')} ${room.name}`} />
      ) : (
        <div className="h-[260px] sm:h-[380px] lg:h-[460px] bg-stone flex items-center justify-center text-muted italic text-sm">
          {t('photosComingSoon')}
        </div>
      )}

      {/* Sadržaj — ispod galerije */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb + naslov — ispod galerije */}
        <div className="pt-6 pb-4 border-b border-stone mb-8">
          <nav className="text-xs text-muted mb-3 flex items-center gap-2">
            <Link href="/rooms" className="hover:text-primary transition-colors">
              {t('breadcrumb.rooms')}
            </Link>
            <span>/</span>
            <span className="text-text">{room.name}</span>
          </nav>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-accent font-medium tracking-widest text-xs uppercase mb-1">
                {t('eyebrow')}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-text leading-tight">
                {room.name}
              </h1>
              <p className="text-muted text-base mt-1">{room.tagline}</p>
            </div>
            {room.fullyBooked && (
              <span className="bg-text/80 text-white text-xs font-medium px-3 py-1.5 rounded-full self-start mt-1">
                {t('unavailable.title')}
              </span>
            )}
          </div>
          {/* Quick stats odmah ispod naslova */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Users size={14} className="text-accent" />
              {room.capacityNote}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Maximize2 size={14} className="text-accent" />
              {room.size} m²
            </div>
            {room.floors > 1 && (
              <span className="text-xs bg-stone text-text px-3 py-1 rounded-full">
                {t('stats.duplex')}
              </span>
            )}
            {room.view && (
              <span className="text-xs bg-stone text-text px-3 py-1 rounded-full">
                {t('stats.seaView')}
              </span>
            )}
            {room.balcony && (
              <span className="text-xs bg-stone text-text px-3 py-1 rounded-full">
                {t('stats.balcony')}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-12">
          {/* Lijevo: opis, kreveti, sadržaji, pravila */}
          <div className="lg:col-span-2">
            <p className="text-text leading-relaxed mb-8">{room.description}</p>

            <div className="mb-8">
              <h3 className="font-serif text-lg font-semibold text-text mb-3">
                {t('beds.title')}
              </h3>
              <BedTypeIcons beds={room.beds} iconSize={28} />
            </div>

            <div>
              <h3 className="font-serif text-lg font-semibold text-text mb-4">
                {t('amenities.title')}
              </h3>
              <ul className="grid grid-cols-2 gap-2">
                {room.amenities.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted">
                    <Check size={15} className="text-accent shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 p-4 bg-stone-light rounded-xl text-sm text-muted space-y-1">
              <p>
                <strong className="text-text">{t('rules.checkInLabel')}</strong>{' '}
                {t('rules.checkInValue')}
              </p>
              <p>
                <strong className="text-text">{t('rules.checkOutLabel')}</strong>{' '}
                {t('rules.checkOutValue')}
              </p>
              <p>
                <strong className="text-text">{t('rules.petsLabel')}</strong>{' '}
                {t('rules.petsValue')}
              </p>
              <p>
                <strong className="text-text">{t('rules.smokingLabel')}</strong>{' '}
                {t('rules.smokingValue')}
              </p>
              <p>
                <strong className="text-text">{t('rules.minStayLabel')}</strong>{' '}
                {t('rules.minStayValue')}
              </p>
              <p>
                <strong className="text-text">{t('rules.depositLabel')}</strong>{' '}
                {Math.round(DEPOSIT_PERCENT * 100)}% {t('rules.depositValue')}
              </p>
            </div>
          </div>

          {/* Desno: sticky cijena + CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-xl border border-stone shadow-sm p-6">
              {!room.fullyBooked ? (
                <>
                  <p className="text-xs text-muted uppercase tracking-widest font-medium mb-4">
                    {t('price.title')}
                  </p>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-sm text-muted">{t('price.perNight')}</span>
                    <span className="text-2xl text-primary font-bold">{room.price}€</span>
                  </div>
                  <Link
                    href={buildAvailabilityHref({ room: room.slug })}
                    className="block w-full text-center bg-primary hover:bg-primary-dark text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm"
                  >
                    {t('actions.bookThis')}
                  </Link>
                  <p className="text-xs text-muted text-center mt-3">{t('rules.minStay')}</p>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-text font-medium mb-2">{t('unavailable.title')}</p>
                  <p className="text-sm text-muted mb-6">{t('unavailable.description')}</p>
                  <Link
                    href="/rooms"
                    className="block w-full text-center border border-primary text-primary hover:bg-primary hover:text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm"
                  >
                    {t('unavailable.cta')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <InternalLinks currentPath={`/rooms/${slug}`} />
      </div>
    </div>
  );
}
