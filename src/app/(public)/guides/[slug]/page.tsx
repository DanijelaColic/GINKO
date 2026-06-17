import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getValidLocale } from '@/i18n/messages';
import { getBreadcrumbStructuredData } from '@/i18n/metadata';
import { SITE_NAME } from '@/modules/booking/booking.config';
import { getGuideBySlug } from '@/modules/seo/guides/get-guide-by-slug';
import { getGuides } from '@/modules/seo/guides/get-guides';
import { GUIDE_HUB_BY_LOCALE } from '@/modules/seo/guides/guides-content';
import { InternalLinks } from '@/components/seo/InternalLinks';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  const { slug } = await params;
  const guide = getGuideBySlug(locale, slug);

  if (!guide) return {};

  const localizedPath = locale === 'hr' ? `/guides/${slug}` : `/${locale}/guides/${slug}`;

  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    alternates: {
      canonical: localizedPath,
      languages: {
        hr: `/guides/${slug}`,
        en: `/en/guides/${slug}`,
        de: `/de/guides/${slug}`,
        'x-default': `/guides/${slug}`,
      },
    },
    openGraph: {
      url: localizedPath,
      title: guide.title,
      description: guide.description,
      type: 'article',
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt ?? guide.publishedAt,
      images: [{ url: guide.coverImage.src, alt: guide.coverImage.alt }],
    },
  };
}

export default async function GuideArticlePage({ params }: Props) {
  const locale = getValidLocale(await getLocale());
  const { slug } = await params;
  const guide = getGuideBySlug(locale, slug);

  if (!guide) notFound();

  const hub = GUIDE_HUB_BY_LOCALE[locale];
  const relatedGuides = getGuides(locale)
    .filter((item) => item.slug !== guide.slug)
    .slice(0, 4);

  const breadcrumbJsonLd = getBreadcrumbStructuredData(locale, [
    { name: SITE_NAME, pathname: '/' },
    { name: hub.title, pathname: '/guides' },
    { name: guide.title, pathname: `/guides/${guide.slug}` },
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ginko-sobe.com';
  const basePath = locale === 'hr' ? '' : `/${locale}`;
  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt ?? guide.publishedAt,
    inLanguage: locale,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: `${siteUrl}${basePath}/guides/${guide.slug}`,
    image: guide.coverImage.src,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
      />

      <Link
        href="/guides"
        className="mb-6 inline-flex text-sm text-text/60 hover:text-accent transition-colors"
      >
        ← {hub.title}
      </Link>

      <h1 className="text-3xl font-bold text-text sm:text-4xl mb-3">{guide.title}</h1>
      <p className="text-text/70 leading-relaxed mb-2">{guide.description}</p>
      <p className="text-xs text-text/50 mb-8">
        {guide.publishedAt} · {guide.readingTime}
      </p>

      <div className="mb-10 overflow-hidden rounded-xl border border-stone/20 bg-white shadow-sm">
        <div className="relative aspect-[21/9] w-full bg-stone/10">
          <Image
            src={guide.coverImage.src}
            alt={guide.coverImage.alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      </div>

      <div className="space-y-8">
        {guide.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-2xl font-semibold text-text mb-3">{section.heading}</h2>
            <div className="space-y-3 text-text/80 leading-relaxed">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-accent/25 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-text mb-3">Rezervirajte smještaj u Daruvaru</h2>
        <p className="text-text/70 leading-relaxed mb-5">
          {SITE_NAME} nudi udoban boutique smještaj u srcu Daruvara.
        </p>
        <Link
          href="/booking"
          className="inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          Provjeri dostupnost
        </Link>
      </div>

      {relatedGuides.length > 0 && (
        <div className="mt-10 rounded-xl border border-stone/20 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-text mb-2">Više vodiča</h2>
          <ul className="flex flex-wrap gap-2.5 mt-3">
            {relatedGuides.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/guides/${item.slug}`}
                  className="inline-flex rounded-full border border-stone/20 px-3 py-1.5 text-sm text-text transition-colors hover:border-accent hover:text-accent"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <InternalLinks currentPath={`/guides/${guide.slug}`} />
    </article>
  );
}
