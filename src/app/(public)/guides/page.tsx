import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'guidesPage' });
  return { title: t('title') };
}

export default async function GuidesPage() {
  const t = await getTranslations('guidesPage');

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold text-[--color-primary]">{t('title')}</h1>
      <p className="mt-3 text-[--color-muted]">{t('subtitle')}</p>

      {/* Guide cards — populated from modules/seo/guides in a later phase */}
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* guide card placeholders */}
      </div>
    </section>
  );
}
