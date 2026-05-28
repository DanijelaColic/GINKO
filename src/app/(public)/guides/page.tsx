import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getValidLocale } from '@/i18n/messages';
import { getBreadcrumbStructuredData } from '@/i18n/metadata';
import { GUIDE_HUB_BY_LOCALE } from '@/modules/seo/guides/guides-content';
import { getGuides } from '@/modules/seo/guides/get-guides';
import { InternalLinks } from '@/components/seo/InternalLinks';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  const content = GUIDE_HUB_BY_LOCALE[locale];
  const localizedPath = locale === 'hr' ? '/guides' : `/${locale}/guides`;

  return {
    title: `${content.title} | Ginko Sobe`,
    description: content.description,
    alternates: {
      canonical: localizedPath,
    },
    openGraph: {
      title: `${content.title} | Ginko Sobe`,
      description: content.description,
      url: localizedPath,
    },
  };
}

export default async function GuidesPage() {
  const locale = getValidLocale(await getLocale());
  const content = GUIDE_HUB_BY_LOCALE[locale];
  const guides = getGuides(locale);

  const breadcrumbJsonLd = getBreadcrumbStructuredData(locale, [
    { name: 'Ginko Sobe', pathname: '/' },
    { name: content.title, pathname: '/guides' },
  ]);

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <h1 className="text-3xl font-bold text-primary sm:text-4xl">{content.title}</h1>
      <p className="mt-3 text-text/70 leading-relaxed">{content.description}</p>

      <div className="mt-10 grid gap-5">
        {guides.map((guide) => (
          <article
            key={guide.slug}
            className="overflow-hidden rounded-xl border border-stone/20 bg-white shadow-sm"
          >
            <Link href={`/guides/${guide.slug}`} className="group block sm:flex">
              <div className="relative aspect-[21/9] w-full shrink-0 bg-stone/10 sm:aspect-auto sm:w-64">
                <Image
                  src={guide.coverImage.src}
                  alt={guide.coverImage.alt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 640px) 100vw, 256px"
                />
              </div>
              <div className="p-5">
                <h2 className="font-semibold text-xl text-text mb-2 group-hover:text-accent transition-colors">
                  {guide.title}
                </h2>
                <p className="text-sm text-text/70 mb-3 line-clamp-2">{guide.description}</p>
                <p className="text-xs text-text/50">
                  {guide.publishedAt} · {guide.readingTime}
                </p>
              </div>
            </Link>
          </article>
        ))}
      </div>

      <InternalLinks currentPath="/guides" />
    </section>
  );
}
