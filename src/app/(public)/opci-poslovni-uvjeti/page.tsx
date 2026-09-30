import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { getValidLocale } from '@/i18n/messages';
import { Link } from '@/i18n/navigation';
import { getBreadcrumbStructuredData, getPageMetadata } from '@/i18n/metadata';
import {
  COMPANY_OIB,
  CONTACT_EMAIL,
  DEPOSIT_PERCENT,
  FREE_CANCELLATION_DAYS,
  LEGAL_NAME,
  SITE_NAME,
  TERMS_PATH,
  houseRulesSectionHref,
} from '@/modules/booking/booking.config';
import { PROPERTY_ADDRESS } from '@/modules/property/property-details.config';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  return getPageMetadata({
    locale,
    pathname: TERMS_PATH,
    namespace: 'termsPage',
    robots: { index: true },
  });
}

export default async function TermsPage() {
  const locale = getValidLocale(await getLocale());
  const t = await getTranslations('termsPage');
  const depositPct = Math.round(DEPOSIT_PERCENT * 100);
  const balancePct = 100 - depositPct;

  const breadcrumbJsonLd = getBreadcrumbStructuredData(locale, [
    { name: SITE_NAME, pathname: '/' },
    { name: t('title'), pathname: TERMS_PATH },
  ]);

  const emailLink = (_chunks: ReactNode) => (
    <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
      {CONTACT_EMAIL}
    </a>
  );

  const sections = [
    { title: t('providerTitle'), body: t.rich('providerBody', {
      legalName: LEGAL_NAME,
      oib: COMPANY_OIB,
      address: PROPERTY_ADDRESS,
      email: emailLink,
    }) },
    { title: t('subjectTitle'), body: t('subjectBody') },
    { title: t('bookingTitle'), body: t('bookingBody') },
    { title: t('pricesTitle'), body: t.rich('pricesBody', {
      depositPercent: depositPct,
      balancePercent: balancePct,
    }) },
    { title: t('paymentTitle'), body: t('paymentBody') },
    { title: t('cancellationTitle'), body: t.rich('cancellationBody', {
      days: FREE_CANCELLATION_DAYS,
    }) },
    { title: t('checkInTitle'), body: t('checkInBody') },
    { title: t('houseRulesTitle'), body: t.rich('houseRulesBody', {
      houseRules: (chunks) => (
        <Link href={houseRulesSectionHref()} className="text-accent hover:underline">
          {chunks}
        </Link>
      ),
    }) },
    { title: t('invoicesTitle'), body: t('invoicesBody') },
    { title: t('complaintsTitle'), body: t.rich('complaintsBody', { email: emailLink }) },
    { title: t('privacyTitle'), body: t.rich('privacyBody', {
      privacy: (chunks) => (
        <Link href="/privacy" className="text-accent hover:underline">
          {chunks}
        </Link>
      ),
    }) },
    { title: t('lawTitle'), body: t('lawBody') },
    { title: t('changesTitle'), body: t('changesBody') },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
          {t('eyebrow')}
        </p>
        <h1 className="text-4xl font-bold text-text mb-2">{t('title')}</h1>
        <p className="text-sm text-text/50">{t('lastUpdated')}</p>
        <p className="mt-4 text-text/70 leading-relaxed">{t('intro')}</p>
      </div>

      <div className="space-y-10 text-text/70 leading-relaxed">
        {sections.map(({ title, body }) => (
          <section key={title}>
            <h2 className="text-xl font-semibold text-text mb-3">{title}</h2>
            <div className="space-y-3 text-sm sm:text-base">{body}</div>
          </section>
        ))}

        <div className="border-t border-stone/20 pt-6">
          <Link href="/" className="text-sm font-medium text-accent hover:underline">
            {t('backHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
