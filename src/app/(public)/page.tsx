import type { Metadata } from 'next';
import { Suspense } from 'react';
import Image from 'next/image';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Car, Wifi, Wind, TreePine, Star, ChevronRight, Waves, Phone, Mail } from 'lucide-react';
import ShareButton from '@/components/hotel/ShareButton';
import { PropertyHeaderLocation } from '@/components/hotel/PropertyLocationMap';
import { getValidLocale } from '@/i18n/messages';
import { getRootMetadata } from '@/i18n/metadata';
import { getRooms } from '@/modules/rooms/room.repository';
import type { RoomLocale } from '@/modules/rooms/room.types';
import HeroSearchBar from '@/components/hotel/HeroSearchBar';
import PropertyGallery from '@/components/hotel/PropertyGallery';
import type { GalleryImage } from '@/components/hotel/PropertyGallery';
import AvailabilitySection from '@/components/hotel/AvailabilitySection';
import PropertyReviewsSection from '@/components/hotel/PropertyReviewsSection';
import TravelerQuestionsSection from '@/components/hotel/TravelerQuestionsSection';
import PropertySurroundingsSection from '@/components/hotel/PropertySurroundingsSection';
import PropertyFacilitiesSection from '@/components/hotel/PropertyFacilitiesSection';
import { getGoogleReviews } from '@/modules/reviews/google-reviews.service';
import { CONTACT_EMAIL, AVAILABILITY_SECTION_HREF, OVERVIEW_SECTION_ID, CONTACT_PHONE_TEL, CONTACT_PHONE_DISPLAY } from '@/modules/booking/booking.config';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  return getRootMetadata(locale);
}

// Sve property fotografije — pojavljuju se u kolažu i lightboxu
const PROPERTY_IMAGES: GalleryImage[] = [
  { src: '/images/property/20240504_154454.jpg', alt: 'Ginko Boutique Rooms & Wellness — objekt, Daruvar' },
  { src: '/images/property/20240906_085556.jpg', alt: 'Ginko Boutique Rooms & Wellness — pogled na objekt' },
  { src: '/images/property/20240906_091154.jpg', alt: 'Ginko Boutique Rooms & Wellness — zajednički prostori' },
  { src: '/images/property/20240906_091257.jpg', alt: 'Ginko Boutique Rooms & Wellness — terasa' },
  { src: '/images/property/20240906_091321.jpg', alt: 'Ginko Boutique Rooms & Wellness — detalji' },
  { src: '/images/property/20240906_091344.jpg', alt: 'Ginko Boutique Rooms & Wellness — prostori' },
  { src: '/images/property/20240929_072608.jpg', alt: 'Ginko Boutique Rooms & Wellness — okolica Daruvara' },
  { src: '/images/property/20241101_080530.jpg', alt: 'Ginko Boutique Rooms & Wellness — doručak' },
  { src: '/images/property/20241101_080707.jpg', alt: 'Ginko Boutique Rooms & Wellness — jutarnji obrok' },
  { src: '/images/property/20250405_085232.jpg', alt: 'Ginko Boutique Rooms & Wellness — proljeće' },
  { src: '/images/property/20250420_083046.jpg', alt: 'Ginko Boutique Rooms & Wellness — travanj' },
  { src: '/images/property/20250501_174531.jpg', alt: 'Ginko Boutique Rooms & Wellness — veljača' },
  { src: '/images/property/20251202_144635.jpg', alt: 'Ginko Boutique Rooms & Wellness — eksterijer' },
  { src: '/images/property/20251202_144813.jpg', alt: 'Ginko Boutique Rooms & Wellness — fasada' },
  { src: '/images/property/20251202_150520.jpg', alt: 'Ginko Boutique Rooms & Wellness — objekt zimi' },
  { src: '/images/property/20251228_151836.jpg', alt: 'Ginko Boutique Rooms & Wellness — Daruvar' },
];

const FEATURE_ICONS = [Car, Wifi, Wind, Waves, TreePine, Star];

export default async function HomePage() {
  const locale = getValidLocale(await getLocale());
  const t = await getTranslations('homePage');
  const [rooms, googleReviews] = await Promise.all([
    getRooms(locale as RoomLocale),
    getGoogleReviews(),
  ]);

  const features = [1, 2, 3, 4, 5, 6].map((n) => ({
    title: t(`feature${n}Title` as Parameters<typeof t>[0]),
    desc: t(`feature${n}Desc` as Parameters<typeof t>[0]),
    Icon: FEATURE_ICONS[n - 1],
  }));

  const availabilityLabels = {
    selectDates: t('availabilitySelectDates'),
    selectGuests: t('availabilitySelectGuests'),
    unavailableDates: t('availabilityUnavailableDates'),
    searching: t('availabilitySearching'),
    search: t('heroSearch'),
    typeFilter: t('availabilityTypeFilter'),
    typeAll: t('availabilityTypeAll'),
    typeRoom: t('availabilityTypeRoom'),
    typeApartment: t('availabilityTypeApartment'),
    unitRoom: t('availabilityUnitRoom'),
    unitApartment: t('availabilityUnitApartment'),
    catalogRoom: t('availabilityCatalogRoom'),
    catalogApartment: t('availabilityCatalogApartment'),
    noResultsAll: t('availabilityNoResultsAll'),
    noResultsRooms: t('availabilityNoResultsRooms'),
    noResultsApartment: t('availabilityNoResultsApartment'),
    noResultsHint: t('availabilityNoResultsHint'),
    contactUs: t('availabilityContactUs'),
    reserve: t('availabilityReserve'),
    perNight: t('availabilityPerNight'),
    nightOne: t('availabilityNightOne'),
    nightMany: t('availabilityNightMany'),
    planAccommodationOnly: t('availabilityPlanAccommodationOnly'),
    planWithBreakfast: t('availabilityPlanWithBreakfast'),
    planBreakfastPerPerson: t('availabilityPlanBreakfastPerPerson'),
    selectChildAges: t('availabilitySelectChildAges'),
    capacityLabel: t('availabilityCapacityLabel'),
  };

  return (
    <div className="flex flex-col">
      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center px-4 py-24">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/images/hero/exterior-01.webp"
            alt="Ginko Boutique Rooms & Wellness — Daruvar"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/65" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full">
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
              <PropertyHeaderLocation />

              <a
                href={`tel:${CONTACT_PHONE_TEL}`}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Phone size={13} className="text-primary shrink-0" />
                {CONTACT_PHONE_DISPLAY}
              </a>

              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Mail size={13} className="text-primary shrink-0" />
                {CONTACT_EMAIL}
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
      <div id={OVERVIEW_SECTION_ID} className="scroll-mt-28">
        <PropertyGallery images={PROPERTY_IMAGES} />

      {/* ------------------------------------------------------------------ */}
      {/* OPIS OBJEKTA + KLJUČNI SADRŽAJI                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Lijevo: opis objekta */}
          <div className="space-y-4">
            <p className="text-text text-base leading-relaxed">
              Smješten u samom srcu Daruvara, u ulici T. G. Masaryka 1, GINKO Boutique Rooms &amp; Wellness nudi jedinstven spoj elegancije, udobnosti i opuštanja. Inspiraciju za naziv pronašli smo u najstarijem i najpoznatijem stablu Ginkgo biloba u Europi koje od 18. stoljeća krasi perivoj dvorca Janković.
            </p>
            <p className="text-text text-base leading-relaxed">
              Naše moderno uređene sobe i wellness apartmani nalaze se unutar zaštićene povijesne jezgre grada, na svega nekoliko minuta hoda od Daruvarskih toplica i aqua parka Aquae Balissae. Zahvaljujući izvrsnoj lokaciji, GINKO je idealan izbor za wellness odmor, obiteljski vikend, poslovna putovanja ili oporavak nakon medicinskih i estetskih zahvata.
            </p>
            <p className="text-text text-base leading-relaxed">
              Bilo da želite uživati u privatnom wellnessu, istražiti ljepote Daruvara ili pronaći mirno mjesto za odmor, GINKO Boutique Rooms &amp; Wellness pružit će vam vrhunsku uslugu i osjećaj doma u gradu zelenila i piva.
            </p>
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
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RASPOLOŽIVOST                                                        */}
      {/* ------------------------------------------------------------------ */}
      <Suspense fallback={null}>
        <AvailabilitySection
          rooms={rooms}
          labels={availabilityLabels}
          reviewSummary={googleReviews
            ? { rating: googleReviews.rating, reviewCount: googleReviews.reviewCount }
            : null}
        />
      </Suspense>

      {/* ------------------------------------------------------------------ */}
      {/* RECENZIJE GOSTIJU                                                    */}
      {/* ------------------------------------------------------------------ */}
      <PropertyReviewsSection data={googleReviews} />

      {/* ------------------------------------------------------------------ */}
      {/* OKOLICA OBJEKTA                                                     */}
      {/* ------------------------------------------------------------------ */}
      <PropertySurroundingsSection />

      {/* ------------------------------------------------------------------ */}
      {/* SADRŽAJI OBJEKTA                                                    */}
      {/* ------------------------------------------------------------------ */}
      <PropertyFacilitiesSection />

      {/* ------------------------------------------------------------------ */}
      {/* PITANJA PUTNIKA                                                      */}
      {/* ------------------------------------------------------------------ */}
      <TravelerQuestionsSection />

      {/* ------------------------------------------------------------------ */}
      {/* CTA BANNER                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative py-24 px-4 overflow-hidden">
        <Image
          src="/images/hero/hero-01.webp"
          alt="Rezerviraj odmor u Ginko Boutique Rooms & Wellness"
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
            href={AVAILABILITY_SECTION_HREF}
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
