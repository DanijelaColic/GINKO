import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getValidLocale } from '@/i18n/messages';
import { getPageMetadata } from '@/i18n/metadata';

function codeTag(chunks: ReactNode) {
  return <code className="text-xs bg-stone/20 px-1 rounded">{chunks}</code>;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  return getPageMetadata({
    locale,
    pathname: '/cookies',
    namespace: 'cookiesPage',
    robots: { index: true },
  });
}

export default async function CookiesPage() {
  const t = await getTranslations('cookiesPage');

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
          {t('eyebrow')}
        </p>
        <h1 className="text-4xl font-bold text-text mb-2">{t('title')}</h1>
        <p className="text-sm text-text/50">{t('lastUpdated')}</p>
      </div>

      <div className="space-y-10 text-text/70 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-text mb-3">{t('whatTitle')}</h2>
          <p>{t('whatBody')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">{t('weUseTitle')}</h2>
          <div className="space-y-3">
            <div className="rounded-xl border border-stone/20 bg-stone/5 p-4">
              <p className="font-medium text-text mb-1">{t('necessaryTitle')}</p>
              <p className="text-sm">{t.rich('necessaryBody', { code: codeTag })}</p>
            </div>
            <div className="rounded-xl border border-stone/20 bg-stone/5 p-4">
              <p className="font-medium text-text mb-1">{t('analyticsTitle')}</p>
              <p className="text-sm">{t('analyticsBody')}</p>
            </div>
            <div className="rounded-xl border border-stone/20 bg-stone/5 p-4">
              <p className="font-medium text-text mb-1">{t('consentTitle')}</p>
              <p className="text-sm">{t.rich('consentBody', { code: codeTag })}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">{t('manageTitle')}</h2>
          <p>{t('manageBody')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">{t('thirdTitle')}</h2>
          <p>{t.rich('thirdBody', { code: codeTag })}</p>
        </section>

        <div className="flex gap-4 border-t border-stone/20 pt-6">
          <Link href="/privacy" className="text-sm font-medium text-accent hover:underline">
            {t('privacyLink')}
          </Link>
          <Link href="/" className="text-sm font-medium text-accent hover:underline">
            {t('homeLink')}
          </Link>
        </div>
      </div>
    </div>
  );
}
