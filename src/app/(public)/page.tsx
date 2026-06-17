import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Car, Wifi, Wind, TreePine, Star, MapPin, ChevronRight, Waves, Phone, Mail } from 'lucide-react';
import ShareButton from '@/components/hotel/ShareButton';
import { getValidLocale } from '@/i18n/messages';
import { getRootMetadata } from '@/i18n/metadata';
import { getRooms } from '@/modules/rooms/room.repository';
import type { RoomLocale } from '@/modules/rooms/room.types';
import HeroSearchBar from '@/components/hotel/HeroSearchBar';
import PropertyGallery from '@/components/hotel/PropertyGallery';
import type { GalleryImage } from '@/components/hotel/PropertyGallery';
import AvailabilitySection from '@/components/hotel/AvailabilitySection';
import TravelerQuestionsSection from '@/components/hotel/TravelerQuestionsSection';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  return getRootMetadata(locale);
}

// Sve property fotografije — pojavljuju se u kolažu i lightboxu
const PROPERTY_IMAGES: GalleryImage[] = [
  { src: '/images/property/20240504_154454.jpg', alt: 'Ginko Sobe — objekt, Daruvar' },
  { src: '/images/property/20240906_085556.jpg', alt: 'Ginko Sobe — pogled na objekt' },
  { src: '/images/property/20240906_091154.jpg', alt: 'Ginko Sobe — zajednički prostori' },
  { src: '/images/property/20240906_091257.jpg', alt: 'Ginko Sobe — terasa' },
  { src: '/images/property/20240906_091321.jpg', alt: 'Ginko Sobe — detalji' },
  { src: '/images/property/20240906_091344.jpg', alt: 'Ginko Sobe — prostori' },
  { src: '/images/property/20240929_072608.jpg', alt: 'Ginko Sobe — okolica Daruvara' },
  { src: '/images/property/20241101_080530.jpg', alt: 'Ginko Sobe — doručak' },
  { src: '/images/property/20241101_080707.jpg', alt: 'Ginko Sobe — jutarnji obrok' },
  { src: '/images/property/20250405_085232.jpg', alt: 'Ginko Sobe — proljeće' },
  { src: '/images/property/20250420_083046.jpg', alt: 'Ginko Sobe — travanj' },
  { src: '/images/property/20250501_174531.jpg', alt: 'Ginko Sobe — veljača' },
  { src: '/images/property/20251202_144635.jpg', alt: 'Ginko Sobe — eksterijer' },
  { src: '/images/property/20251202_144813.jpg', alt: 'Ginko Sobe — fasada' },
  { src: '/images/property/20251202_150520.jpg', alt: 'Ginko Sobe — objekt zimi' },
  { src: '/images/property/20251228_151836.jpg', alt: 'Ginko Sobe — Daruvar' },
];

const FEATURE_ICONS = [Car, Wifi, Wind, Waves, TreePine, Star];

export default async function HomePage() {
  const locale = getValidLocale(await getLocale());
  const t = await getTranslations('homePage');
  const rooms = await getRooms(locale as RoomLocale);

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
        <Image
          src="/images/hero/exterior-01.webp"
          alt="Ginko Sobe — Daruvar"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/65" />

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
          <HeroSearchBar />
          <div className="mt-12 flex items-center gap-2 text-white/60 text-sm">
            <a
              href="#raspolozivost"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              {t('heroCta')}
              <ChevronRight size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* PROPERTY HEADER                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white border-b border-stone px-4 py-5">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
          {/* Lijevo: zvjezdice, naziv, adresa, kontakt */}
          <div>
            {/* Tri zvjezdice */}
            <div className="flex gap-0.5 mb-2">
              {[...Array(3)].map((_, i) => (
                <Star key={i} size={14} className="fill-accent text-accent" />
              ))}
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-text mb-2 leading-tight">
              Ginko Boutique Rooms &amp; Wellness Daruvar
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <a
                href="https://maps.google.com/?q=Tomaša+Garika+Masaryka+1,+43500+Daruvar,+Hrvatska"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <MapPin size={13} className="text-primary shrink-0" />
                Tomaša Garika Masaryka 1, 43500 Daruvar, Hrvatska
              </a>

              <a
                href="tel:+385959000799"
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Phone size={13} className="text-primary shrink-0" />
                095 9000 799
              </a>

              <a
                href="mailto:info@ginko-sobe.com"
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Mail size={13} className="text-primary shrink-0" />
                info@ginko-sobe.com
              </a>
            </div>
          </div>

          {/* Desno: share gumb */}
          <ShareButton />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* PROPERTY GALERIJA — full width                                      */}
      {/* ------------------------------------------------------------------ */}
      <PropertyGallery images={PROPERTY_IMAGES} />

      {/* ------------------------------------------------------------------ */}
      {/* OPIS OBJEKTA + KLJUČNI SADRŽAJI                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Lijevo: opis objekta */}
          <div>
            <p className="text-text text-base leading-relaxed mb-6">
              Ginko Boutique Rooms &amp; Wellness Daruvar smješten je u samom srcu Daruvara, uz park dvorca Janković i u neposrednoj blizini Daruvarskih toplica. Moderne i elegantno uređene sobe nude besplatan Wi-Fi, privatno parkiralište i vrhunsku udobnost, dok wellness zona sa saunom i jacuzzijem pruža savršeno mjesto za opuštanje nakon dana provedenog u istraživanju grada. Idealno za parove, poslovne goste i sve koji traže miran odmor u kontinentalnoj Hrvatskoj.
            </p>
            <a
              href="https://maps.google.com/?q=Tomaša+Garika+Masaryka+1,+43500+Daruvar,+Hrvatska"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
            >
              <MapPin size={15} className="text-primary shrink-0" />
              Tomaša Garika Masaryka 1, 43500 Daruvar, Hrvatska
            </a>
          </div>

          {/* Desno: 6 ključnih sadržaja */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map(({ title, desc, Icon }) => (
              <div key={title} className="flex gap-3">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-text text-sm mb-0.5">{title}</h3>
                  <p className="text-muted text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* RASPOLOŽIVOST                                                        */}
      {/* ------------------------------------------------------------------ */}
      <AvailabilitySection rooms={rooms} />

      {/* ------------------------------------------------------------------ */}
      {/* PITANJA PUTNIKA                                                      */}
      {/* ------------------------------------------------------------------ */}
      <TravelerQuestionsSection />

      {/* ------------------------------------------------------------------ */}
      {/* LOKACIJA                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
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
          <div className="relative h-72 lg:h-80 rounded-2xl overflow-hidden bg-stone">
            <Image
              src="/images/property/20251228_151836.jpg"
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
      {/* RECENZIJE                                                           */}
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
      {/* CTA BANNER                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative py-24 px-4 overflow-hidden">
        <Image
          src="/images/hero/hero-01.webp"
          alt="Rezerviraj odmor u Ginko Sobe"
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
