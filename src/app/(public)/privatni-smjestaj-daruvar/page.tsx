import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getValidLocale } from '@/i18n/messages';
import { LandingPageTemplate } from '@/modules/seo/landing-pages/LandingPageTemplate';
import { getLandingPageMetadata } from '@/modules/seo/landing-pages/content';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getValidLocale(await getLocale());
  return getLandingPageMetadata('privatni-smjestaj-daruvar', locale);
}

export default async function PrivatniSmjestajDaruvarPage() {
  const locale = getValidLocale(await getLocale());
  return <LandingPageTemplate pageKey="privatni-smjestaj-daruvar" locale={locale} />;
}
