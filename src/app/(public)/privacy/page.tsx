// Contact: CONTACT_EMAIL + PROPERTY_ADDRESS from config.

import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { getValidLocale } from '@/i18n/messages';
import { Link } from '@/i18n/navigation';
import { getBreadcrumbStructuredData, getPageMetadata } from '@/i18n/metadata';
import {
  COMPANY_OIB,
  CONTACT_EMAIL,
  LEGAL_NAME,
  SITE_NAME,
} from '@/modules/booking/booking.config';
import { PROPERTY_ADDRESS } from '@/modules/property/property-details.config';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  return getPageMetadata({
    locale,
    pathname: '/privacy',
    namespace: 'privacyPage',
    robots: { index: true },
  });
}

export default async function PrivacyPage() {
  const locale = getValidLocale(await getLocale());
  const t = await getTranslations('privacyPage');

  const breadcrumbJsonLd = getBreadcrumbStructuredData(locale, [
    { name: SITE_NAME, pathname: '/' },
    { name: t('title'), pathname: '/privacy' },
  ]);

  const emailLink = (_chunks: ReactNode) => (
    <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
      {CONTACT_EMAIL}
    </a>
  );

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
      </div>

      <div className="space-y-10 text-text/70 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-text mb-3">{t('controllerTitle')}</h2>
          <p>
            {t.rich('controllerBody', {
              legalName: LEGAL_NAME,
              oib: COMPANY_OIB,
              address: PROPERTY_ADDRESS,
              email: emailLink,
            })}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">{t('dataTitle')}</h2>
          <p>{t('dataIntro')}</p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-sm">
            <li>
              <strong className="text-text">{t('dataBookingLabel')}</strong>
              {' — '}
              {t('dataBookingText')}
            </li>
            <li>
              <strong className="text-text">{t('dataCommsLabel')}</strong>
              {' — '}
              {t('dataCommsText')}
            </li>
            <li>
              <strong className="text-text">{t('dataTechLabel')}</strong>
              {' — '}
              {t('dataTechText')}
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">{t('purposeTitle')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-stone/20">
                  <th className="py-2 pr-4 text-left font-medium text-text">{t('purposeCol')}</th>
                  <th className="py-2 text-left font-medium text-text">{t('basisCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/10">
                {[
                  ['purposeBooking', 'basisBooking'],
                  ['purposeSupport', 'basisSupport'],
                  ['purposeAnalytics', 'basisAnalytics'],
                ].map(([purposeKey, basisKey]) => (
                  <tr key={purposeKey}>
                    <td className="py-2 pr-4">{t(purposeKey)}</td>
                    <td className="py-2">{t(basisKey)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">{t('retentionTitle')}</h2>
          <p>{t('retentionBody')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">{t('rightsTitle')}</h2>
          <p>{t('rightsIntro')}</p>
          <ul className="mt-3 space-y-1 list-disc list-inside text-sm">
            {[
              'rightAccess',
              'rightRectify',
              'rightErase',
              'rightRestrict',
              'rightPortability',
              'rightObject',
              'rightWithdraw',
            ].map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            {t.rich('rightsRequest', {
              email: emailLink,
              azop: (chunks) => (
                <a
                  href="https://azop.hr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">{t('cookiesTitle')}</h2>
          <p>
            {t.rich('cookiesBody', {
              cookies: (chunks) => (
                <Link href="/cookies" className="text-accent hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">{t('changesTitle')}</h2>
          <p>{t('changesBody')}</p>
        </section>

        <div className="border-t border-stone/20 pt-6">
          <Link href="/" className="text-sm font-medium text-accent hover:underline">
            {t('backHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
