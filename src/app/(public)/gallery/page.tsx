import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

// Gallery data is mock-static; revalidate once per hour when CDN/DB is connected.
export const revalidate = 3600;
import { getValidLocale } from '@/i18n/messages';
import { getBreadcrumbStructuredData, getPageMetadata } from '@/i18n/metadata';
import { SITE_NAME } from '@/modules/booking/booking.config';
import { getGallerySections } from '@/modules/gallery/gallery.service';
import { GalleryGrid } from '@/components/hotel/GalleryGrid';
import { InternalLinks } from '@/components/seo/InternalLinks';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  return getPageMetadata({ locale, pathname: '/gallery', namespace: 'galleryPage' });
}

export default async function GalleryPage() {
  const locale = getValidLocale(await getLocale());
  const t = await getTranslations('galleryPage');
  const sections = await getGallerySections();

  const breadcrumbJsonLd = getBreadcrumbStructuredData(locale, [
    { name: SITE_NAME, pathname: '/' },
    { name: t('heading'), pathname: '/gallery' },
  ]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <h1 className="text-3xl font-bold text-text mb-2 sm:text-4xl">{t('heading')}</h1>
      <p className="text-text/70 leading-relaxed mb-10">{t('subtitle')}</p>

      <GalleryGrid sections={sections} />

      <InternalLinks currentPath="/gallery" />
    </section>
  );
}
