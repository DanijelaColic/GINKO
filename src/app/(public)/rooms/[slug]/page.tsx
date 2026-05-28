// Adapted from Villa-Jurina/src/app/(public)/apartmani/[slug]/page.tsx
// Removed: JsonLd (SEO phase later), Jurina-specific room refs
// Color classes: secondary→accent, sand→stone, sand-light→stone-light
// Routes: /apartmani→/rooms, /rezervacija→/booking

import { notFound } from 'next/navigation';
import { Users, Maximize2, Check } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { rooms } from '@/modules/rooms/rooms.config';
import { getRoom } from '@/modules/rooms/room.repository';
import { getSiteUrl } from '@/lib/siteUrl';
import ImageGallery from '@/components/hotel/ImageGallery';
import { Link } from '@/i18n/navigation';
import type { RoomLocale } from '@/modules/rooms/room.types';

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return rooms.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'roomDetailPage' });
  const room = getRoom(slug, locale as RoomLocale);
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
  const locale = await getLocale();
  const t = await getTranslations('roomDetailPage');
  const { slug } = await params;
  const room = getRoom(slug, locale as RoomLocale);

  if (!room) notFound();

  return (
    <div>
      {/* Gallery — placeholder div if no images */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {room.images.length > 0 ? (
          <ImageGallery images={room.images} alt={`${t('eyebrow')} ${room.name}`} />
        ) : (
          <div className="aspect-[16/6] bg-stone rounded-2xl flex items-center justify-center text-muted italic text-sm">
            — fotografije dolaze uskoro —
          </div>
        )}
        {room.fullyBooked && (
          <div className="mt-3 inline-block bg-text/80 text-white text-sm font-medium px-4 py-1.5 rounded-full">
            {t('unavailable.title')}
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb — copied from Jurina [slug]/page.tsx */}
        <nav className="text-xs text-muted mb-6 flex items-center gap-2">
          <Link href="/rooms" className="hover:text-primary transition-colors">
            {t('breadcrumb.rooms')}
          </Link>
          <span>/</span>
          <span className="text-text">{room.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: details */}
          <div className="lg:col-span-2">
            <p className="text-accent font-medium tracking-widest text-xs uppercase mb-2">
              {t('eyebrow')}
            </p>
            <h1 className="font-serif text-4xl font-semibold text-text mb-2">{room.name}</h1>
            <p className="text-muted text-base mb-8">{room.tagline}</p>

            <p className="text-text leading-relaxed mb-8">{room.description}</p>

            {/* Stats — copied from Jurina */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-muted bg-stone px-4 py-2 rounded-full">
                <Users size={15} className="text-accent" />
                <span>{room.capacityNote}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted bg-stone px-4 py-2 rounded-full">
                <Maximize2 size={15} className="text-accent" />
                <span>{room.size} m²</span>
              </div>
              {room.floors > 1 && (
                <span className="text-sm bg-stone text-text px-4 py-2 rounded-full">
                  {t('stats.duplex')}
                </span>
              )}
              {room.view && (
                <span className="text-sm bg-stone text-text px-4 py-2 rounded-full">
                  {t('stats.seaView')}
                </span>
              )}
              {room.balcony && (
                <span className="text-sm bg-stone text-text px-4 py-2 rounded-full">
                  {t('stats.balcony')}
                </span>
              )}
            </div>

            {/* Beds — copied from Jurina */}
            <div className="mb-8">
              <h3 className="font-serif text-lg font-semibold text-text mb-3">
                {t('beds.title')}
              </h3>
              <p className="text-muted text-sm">{room.beds}</p>
            </div>

            {/* Amenities — copied from Jurina */}
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

            {/* Rules — copied from Jurina */}
            <div className="mt-8 p-4 bg-stone-light rounded-xl text-sm text-muted space-y-1">
              <p>
                <strong className="text-text">{t('rules.checkInLabel')}</strong> 14:00 – 23:00
              </p>
              <p>
                <strong className="text-text">{t('rules.checkOutLabel')}</strong> 09:00 – 11:00
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
                <strong className="text-text">{t('rules.depositLabel')}</strong> 30%{' '}
                {t('rules.depositValue')}
              </p>
            </div>
          </div>

          {/* Right: sticky price + CTA — copied from Jurina */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-stone shadow-sm p-6">
              {!room.fullyBooked ? (
                <>
                  <p className="text-xs text-muted uppercase tracking-widest font-medium mb-4">
                    {t('price.title')}
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">{t('price.offSeason')}</span>
                      <span className="text-primary font-semibold">{room.priceOffSeason}€</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted">{t('price.highSeason')}</span>
                      <span className="text-primary font-semibold">{room.priceHighSeason}€</span>
                    </div>
                  </div>
                  <Link
                    href={`/booking?room=${room.slug}`}
                    className="block w-full text-center bg-accent hover:bg-accent-light text-white font-medium px-6 py-3 rounded-full transition-colors text-sm"
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
                    className="block w-full text-center border border-primary text-primary hover:bg-primary hover:text-white font-medium px-6 py-3 rounded-full transition-colors text-sm"
                  >
                    {t('unavailable.cta')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
