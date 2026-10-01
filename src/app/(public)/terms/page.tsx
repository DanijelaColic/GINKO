import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';
import { getValidLocale } from '@/i18n/messages';
import { TERMS_PATH } from '@/modules/booking/booking.config';

/** Alias → OPU stranica (/opci-poslovni-uvjeti); eng. bookmarki. */
export default async function TermsAliasPage() {
  const locale = getValidLocale(await getLocale());
  redirect({ href: TERMS_PATH, locale });
}
