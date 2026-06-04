import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Car, Wifi, Wind, TreePine, Heart, Clock, Star, MapPin, ChevronRight } from 'lucide-react';
import { getValidLocale } from '@/i18n/messages';
import { getRootMetadata } from '@/i18n/metadata';
import { getRooms } from '@/modules/rooms/room.repository';
import type { RoomLocale } from '@/modules/rooms/room.types';
import RoomCard from '@/components/hotel/RoomCard';
import HeroSearchBar from '@/components/hotel/HeroSearchBar';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  // Root metadata is already localized and includes OpenGraph/Twitter fields.
  return getRootMetadata(locale);
}

// --------------------------------------------------------------------------
// Gallery images — Unsplash; replace with real photos before launch
// --------------------------------------------------------------------------
const GALLERY_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    alt: 'Udobna soba',
  },
  {
    src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    alt: 'Bazen i vrt',
  },
  {
    src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    alt: 'Vanjski prostor',
  },
  {
    src: 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&q=80',
    alt: 'Istra — priroda',
  },
  {
    src: 'https://images.unsplash.com/photo-1602002418153-a3fd02b1a1d7?w=800&q=80',
    alt: 'Doručak u prirodi',
  },
];

const FEATURE_ICONS = [Car, Wifi, Wind, TreePine, Heart, Clock];

export default async function HomePage() {
  const locale = getValidLocale(await getLocale());
  const t = await getTranslations('homePage');
  const tRooms = await getTranslations('roomsPage');
  const rooms = await getRooms(locale as RoomLocale);

  const cardLabels = {
    itemLabel: tRooms('itemLabel'),
    fullyBooked: tRooms('badges.fullyBooked'),
    duplex: tRooms('stats.duplex'),
    seaView: tRooms('stats.seaView'),
    balcony: tRooms('stats.balcony'),
    priceTitle: tRooms('price.title'),
    offSeason: tRooms('price.offSeason'),
    highSeason: tRooms('price.highSeason'),
    perNight: tRooms('price.perNight'),
    unavailable: tRooms('price.unavailable'),
    details: tRooms('actions.details'),
    book: tRooms('actions.book'),
  };

  const features = [1, 2, 3, 4, 5, 6].map((n) => ({
    title: t(`feature${n}Title` as Parameters<typeof t>[0]),
    desc: t(`feature${n}Desc` as Parameters<typeof t>[0]),
    Icon: FEATURE_ICONS[n - 1],
  }));

  const reviews = [1, 2, 3].map((n) => ({
    text: t(`review${n}Text` as Parameters<typeof t>[0]),
    author: t(`review${n}Author` as Parameters<typeof t>[0]),
    origin: t(`review${n}Origin` as Parameters<typeof t>[0]),
  }));

  return (
    <div className="flex flex-col">
      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center px-4 py-24 overflow-hidden">
        {/* Background image */}
        <Image
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"
          alt="Ginko Sobe — Istra"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Gradient overlay — bottom-heavy for search bar readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/65" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl">
          <span className="text-white/80 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            Daruvar, Hrvatska
          </span>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-tight mb-5 drop-shadow-md">
            {t('heroTitle')}
          </h1>
          <p className="text-white/85 text-lg sm:text-xl max-w-xl leading-relaxed mb-10 drop-shadow">
            {t('heroSubtitle')}
          </p>

          {/* Search bar */}
          <HeroSearchBar />

          {/* Quick scroll hint */}
          <div className="mt-12 flex items-center gap-2 text-white/60 text-sm">
            <Link
              href="/rooms"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              {t('heroCta')}
              <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* ROOMS                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 px-4 bg-stone-light">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-accent font-semibold tracking-widest text-xs uppercase mb-3">
              {t('roomsEyebrow')}
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-text mb-4">
              {t('roomsTitle')}
            </h2>
            <p className="text-muted text-base max-w-xl mx-auto leading-relaxed">
              {t('roomsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {rooms.map((room) => (
              <RoomCard key={room.slug} room={room} labels={cardLabels} />
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/rooms"
              className="inline-flex items-center gap-2 border border-primary text-primary hover:bg-primary hover:text-white font-medium px-7 py-3 rounded-full transition-colors text-sm"
            >
              {t('roomsViewAll')}
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FEATURES                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-accent font-semibold tracking-widest text-xs uppercase mb-3">
              {t('featuresEyebrow')}
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-text">
              {t('featuresTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ title, desc, Icon }) => (
              <div key={title} className="flex gap-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-text text-base mb-1">{title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* GALLERY STRIP                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 px-4 bg-stone-light overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-accent font-semibold tracking-widest text-xs uppercase mb-3">
              {t('galleryEyebrow')}
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-text mb-3">
              {t('galleryTitle')}
            </h2>
            <p className="text-muted text-base">{t('gallerySubtitle')}</p>
          </div>

          {/* Scrollable row */}
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {GALLERY_IMAGES.map((img, i) => (
              <div
                key={i}
                className="relative shrink-0 w-72 sm:w-80 h-52 sm:h-60 rounded-2xl overflow-hidden snap-start"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  sizes="320px"
                />
              </div>
            ))}
            {/* View gallery CTA tile */}
            <Link
              href="/gallery"
              className="shrink-0 w-52 h-52 sm:h-60 rounded-2xl bg-primary flex flex-col items-center justify-center gap-2 text-white snap-start hover:bg-primary-dark transition-colors"
            >
              <span className="font-serif text-xl font-semibold text-center leading-tight px-4">
                Sva fotografija →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* LOCATION                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <p className="text-accent font-semibold tracking-widest text-xs uppercase mb-4">
              {t('locationEyebrow')}
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-text mb-6 leading-tight">
              {t('locationTitle')}
            </h2>
            <p className="text-muted text-base leading-relaxed mb-8">{t('locationDesc')}</p>
            <a
              href="https://maps.google.com/?q=Trg+Presvetog+Trojstva+3,+43500+Daruvar,+Hrvatska"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium px-7 py-3 rounded-full transition-colors text-sm"
            >
              <MapPin size={16} />
              {t('locationCta')}
            </a>
          </div>

          {/* Map placeholder — replace with embedded Google Map */}
          <div className="relative h-72 lg:h-80 rounded-2xl overflow-hidden bg-stone">
            <Image
              src="https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&q=80"
              alt="Daruvar — lokacija"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-primary/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-lg px-5 py-3 flex items-center gap-2">
                <MapPin size={18} className="text-primary" />
                <span className="font-semibold text-text text-sm">Ginko Sobe · Daruvar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* REVIEWS                                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 px-4 bg-stone-light">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-accent font-semibold tracking-widest text-xs uppercase mb-3">
              {t('reviewsEyebrow')}
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-text">
              {t('reviewsTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map(({ text, author, origin }) => (
              <div key={author} className="bg-white rounded-2xl p-7 shadow-sm flex flex-col gap-4">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} className="fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-text text-sm leading-relaxed flex-1 italic">&ldquo;{text}&rdquo;</p>
                <div className="border-t border-stone pt-4">
                  <p className="font-semibold text-text text-sm">{author}</p>
                  <p className="text-muted text-xs">{origin}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* BOTTOM CTA BANNER                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative py-24 px-4 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80"
          alt="Rezerviraj odmor"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-primary/75" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-white mb-5 leading-tight">
            {t('ctaTitle')}
          </h2>
          <p className="text-white/80 text-base leading-relaxed mb-8">{t('ctaSubtitle')}</p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 bg-white text-primary hover:bg-stone-light font-semibold px-9 py-4 rounded-full transition-colors text-base shadow-lg"
          >
            {t('ctaButton')}
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
