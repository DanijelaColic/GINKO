import Image from 'next/image';
import { InternalLinks } from '@/components/seo/InternalLinks';
import { Link } from '@/i18n/navigation';
import { getBreadcrumbStructuredData } from '@/i18n/metadata';
import type { AppLocale } from '@/i18n/routing';
import { SITE_NAME, AVAILABILITY_SECTION_HREF } from '@/modules/booking/booking.config';
import { getGuides } from '@/modules/seo/guides/get-guides';
import { getLandingPageContent, type LandingPageKey } from './content';
import {
  LANDING_GUIDES_LINK_LABEL,
  LANDING_RESERVATION_HEADING,
  LANDING_ROOMS_LINK_LABEL,
} from './landing-template-ui';

type LandingPageTemplateProps = {
  pageKey: LandingPageKey;
  locale: AppLocale;
};

/** Port of Villa-Velebita LandingPageTemplate — Ginko layout/tokens, no extra Navbar/Footer. */
export async function LandingPageTemplate({ pageKey, locale }: LandingPageTemplateProps) {
  const content = getLandingPageContent(pageKey, locale);
  const pathname = `/${pageKey}`;
  const relatedGuides = getGuides(locale).slice(0, 3);
  const breadcrumbJsonLd = getBreadcrumbStructuredData(locale, [
    { name: SITE_NAME, pathname: '/' },
    { name: content.breadcrumbLabel, pathname },
  ]);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text/50">
        {content.eyebrow}
      </p>
      <h1 className="mb-4 font-serif text-3xl font-semibold text-text sm:text-4xl">
        {content.h1}
      </h1>
      <p className="mb-8 leading-relaxed text-text/70">{content.intro}</p>

      <div className="relative mb-10 aspect-[21/9] w-full overflow-hidden rounded-xl border border-stone/20 bg-stone/10">
        <Image
          src={content.heroImage.src}
          alt={content.heroImage.alt}
          fill
          className="object-cover"
          sizes="(max-width: 896px) 100vw, 896px"
          priority
        />
      </div>

      <ul className="mb-10 grid gap-3 sm:grid-cols-3">
        {content.highlights.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-stone/20 bg-white px-4 py-3 text-sm font-medium text-text shadow-sm"
          >
            {item}
          </li>
        ))}
      </ul>

      <div className="space-y-10">
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-text">
              {section.heading}
            </h2>
            <div className="space-y-3 leading-relaxed text-text/70">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="mb-4 font-serif text-2xl font-semibold text-text">
          {content.activitiesSectionTitle}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {content.activities.map((card) => (
            <div
              key={card.title}
              className="overflow-hidden rounded-xl border border-stone/20 bg-white shadow-sm"
            >
              <div className="relative aspect-[16/10] w-full bg-stone/10">
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 432px"
                />
              </div>
              <div className="p-4">
                <h3 className="mb-2 font-serif text-lg font-semibold text-text">{card.title}</h3>
                <p className="text-sm leading-relaxed text-text/70">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-accent/25 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-3 font-serif text-2xl font-semibold text-text">{content.midCtaTitle}</h2>
        <p className="mb-5 leading-relaxed text-text/70">{content.midCtaBody}</p>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href={AVAILABILITY_SECTION_HREF}
            className="inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
          >
            {content.midCtaPrimaryLabel}
          </Link>
          <Link
            href="/gallery"
            className="inline-flex rounded-full border border-stone/20 px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-accent hover:text-accent"
          >
            {content.midCtaGalleryLabel}
          </Link>
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-stone/20 bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-serif text-xl font-semibold text-text">
          {LANDING_RESERVATION_HEADING[locale]}
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-text/70">{content.reservationIntro}</p>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href={AVAILABILITY_SECTION_HREF}
            className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
          >
            {content.ctaLabel}
          </Link>
          <Link
            href="/rooms"
            className="inline-flex rounded-full border border-stone/20 px-4 py-2 text-sm font-semibold text-text transition-colors hover:border-accent hover:text-accent"
          >
            {LANDING_ROOMS_LINK_LABEL[locale]}
          </Link>
          <Link
            href="/gallery"
            className="inline-flex rounded-full border border-stone/20 px-4 py-2 text-sm font-semibold text-text transition-colors hover:border-accent hover:text-accent"
          >
            {content.midCtaGalleryLabel}
          </Link>
          <Link
            href="/guides"
            className="inline-flex rounded-full border border-stone/20 px-4 py-2 text-sm font-semibold text-text transition-colors hover:border-accent hover:text-accent"
          >
            {LANDING_GUIDES_LINK_LABEL[locale]}
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 font-serif text-2xl font-semibold text-text">
          {content.faqSectionTitle}
        </h2>
        <div className="space-y-2">
          {content.faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-stone/20 bg-white px-4 py-3 shadow-sm open:border-accent/30"
            >
              <summary className="cursor-pointer list-none pr-6 font-semibold text-text marker:content-none [&::-webkit-details-marker]:hidden">
                {item.question}
              </summary>
              <p className="mt-3 border-t border-stone/15 pt-3 text-sm leading-relaxed text-text/70">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-stone/20 bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-serif text-xl font-semibold text-text">
          {content.guidesBlockTitle}
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-text/70">{content.guidesBlockIntro}</p>
        <ul className="space-y-2">
          {relatedGuides.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guides/${guide.slug}`}
                className="text-sm font-semibold text-accent transition-colors hover:text-accent/80"
              >
                {guide.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <InternalLinks currentPath={pathname} />
    </article>
  );
}
