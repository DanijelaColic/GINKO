import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

// Gallery data is mock-static; revalidate once per hour when CDN/DB is connected.
export const revalidate = 3600;
import { getValidLocale } from '@/i18n/messages';
import { getBreadcrumbStructuredData } from '@/i18n/metadata';
import { SITE_NAME } from '@/modules/booking/booking.config';
import { getGallerySections } from '@/modules/gallery/gallery.service';
import { GalleryGrid } from '@/components/hotel/GalleryGrid';
import { InternalLinks } from '@/components/seo/InternalLinks';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  const localizedPath = locale === 'hr' ? '/gallery' : `/${locale}/gallery`;

  const titles = { hr: 'Galerija', en: 'Gallery', de: 'Galerie' };
  const descs = {
    hr: 'Fotografije soba, zajedničkih prostora i okolice Daruvara.',
    en: 'Photos of rooms, common areas and the surroundings of Daruvar.',
    de: 'Fotos der Zimmer, Gemeinschaftsbereiche und der Umgebung von Daruvar.',
  };

  return {
    title: titles[locale],
    description: descs[locale],
    alternates: {
      canonical: localizedPath,
      languages: {
        hr: '/gallery',
        en: '/en/gallery',
        de: '/de/gallery',
        'x-default': '/gallery',
      },
    },
  };
}

export default async function GalleryPage() {
  const locale = getValidLocale(await getLocale());
  const sections = await getGallerySections();

  const headings = { hr: 'Galerija', en: 'Gallery', de: 'Galerie' };
  const subtitles = {
    hr: 'Fotografije smještaja i okolice Daruvara.',
    en: 'Photos of our accommodation and surroundings.',
    de: 'Fotos unserer Unterkunft und Umgebung.',
  };

  const breadcrumbJsonLd = getBreadcrumbStructuredData(locale, [
    { name: SITE_NAME, pathname: '/' },
    { name: headings[locale], pathname: '/gallery' },
  ]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <h1 className="text-3xl font-bold text-text mb-2 sm:text-4xl">{headings[locale]}</h1>
      <p className="text-text/70 leading-relaxed mb-10">{subtitles[locale]}</p>

      <GalleryGrid sections={sections} />

      <InternalLinks currentPath="/gallery" />
    </section>
  );
}
