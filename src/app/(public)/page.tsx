import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'siteMetadata' });
  return { title: t('title') };
}

export default async function HomePage() {
  const t = await getTranslations('homePage');

  return (
    <div className="flex flex-col">
      {/* Hero placeholder */}
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-[--color-stone] px-4 text-center">
        <h1 className="text-4xl font-bold text-[--color-primary] sm:text-5xl">
          {t('heroTitle')}
        </h1>
        <p className="max-w-xl text-lg text-[--color-muted]">
          {t('heroSubtitle')}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/rooms"
            className="rounded-lg border border-[--color-primary] px-6 py-3 font-medium text-[--color-primary] hover:bg-[--color-primary] hover:text-white transition-colors"
          >
            {t('heroCta')}
          </Link>
          <Link
            href="/booking"
            className="rounded-lg bg-[--color-primary] px-6 py-3 font-medium text-white hover:bg-[--color-primary-dark] transition-colors"
          >
            {t('bookCta')}
          </Link>
        </div>
      </section>
    </div>
  );
}
