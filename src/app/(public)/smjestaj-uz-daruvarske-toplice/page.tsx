import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getValidLocale } from '@/i18n/messages';
import { LandingPageTemplate } from '@/modules/seo/landing-pages/LandingPageTemplate';
import { getLandingPageMetadata } from '@/modules/seo/landing-pages/content';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  return getLandingPageMetadata('smjestaj-uz-daruvarske-toplice', locale);
}

export default async function SmjestajUzToplicePage() {
  const locale = getValidLocale(await getLocale());
  return (
    <LandingPageTemplate pageKey="smjestaj-uz-daruvarske-toplice" locale={locale} />
  );
}
