import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { CONTACT_EMAIL, CONTACT_PHONE_TEL, SITE_NAME } from '@/modules/booking/booking.config';
import { PROPERTY_STREET } from '@/modules/property/property-details.config';
import { routing } from './routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ginko-sobe.com';
const HERO_OG_IMAGE_PATH = '/images/hero/exterior-01.webp';

const OPEN_GRAPH_LOCALES: Record<string, string> = {
  hr: 'hr_HR',
  en: 'en_US',
  de: 'de_DE',
};

const KEYWORDS_BY_LOCALE: Record<string, string[]> = {
  hr: [
    'sobe Daruvar',
    'boutique sobe Daruvar',
    'ginko sobe',
    'smještaj Daruvar',
    'wellness Daruvar',
    'sobe Slavonija',
    'privatni smještaj Daruvar',
  ],
  en: [
    'rooms Daruvar',
    'boutique rooms Daruvar Croatia',
    'ginko rooms',
    'accommodation Daruvar',
    'wellness Daruvar',
    'hotel Daruvar',
    'Croatia boutique accommodation',
  ],
  de: [
    'Zimmer Daruvar',
    'Boutique-Zimmer Daruvar Kroatien',
    'Ginko Zimmer',
    'Unterkunft Daruvar',
    'Wellness Daruvar',
    'Hotel Daruvar',
    'Kroatien Boutique-Unterkunft',
  ],
};

function getLocalizedPath(locale: Locale, pathname: string) {
  const normalizedPath = pathname === '/' ? '' : pathname;

  if (locale === routing.defaultLocale) {
    return normalizedPath || '/';
  }

  return `/${locale}${normalizedPath}`;
}

function getLanguageAlternates(pathname: string) {
  return {
    ...Object.fromEntries(
      routing.locales.map((locale) => [locale, getLocalizedPath(locale, pathname)]),
    ),
    'x-default': getLocalizedPath(routing.defaultLocale, pathname),
  };
}

function getOpenGraphLocale(locale: Locale) {
  return OPEN_GRAPH_LOCALES[locale] ?? OPEN_GRAPH_LOCALES[routing.defaultLocale];
}

function getKeywords(locale: Locale) {
  return KEYWORDS_BY_LOCALE[locale] ?? KEYWORDS_BY_LOCALE[routing.defaultLocale];
}

function getSharedImageMetadata(locale: Locale, alt: string) {
  return {
    images: [
      {
        url: HERO_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt,
      },
    ],
    locale: getOpenGraphLocale(locale),
  };
}

export async function getRootMetadata(locale: Locale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'metadata.layout' });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t('title.default'),
      template: t('title.template'),
    },
    description: t('description'),
    keywords: getKeywords(locale),
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    alternates: {
      canonical: getLocalizedPath(locale, '/'),
      languages: getLanguageAlternates('/'),
    },
    openGraph: {
      type: 'website',
      url: getLocalizedPath(locale, '/'),
      siteName: SITE_NAME,
      title: t('openGraph.title'),
      description: t('openGraph.description'),
      ...getSharedImageMetadata(locale, t('openGraph.imageAlt')),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('twitter.title'),
      description: t('twitter.description'),
      images: [HERO_OG_IMAGE_PATH],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

type PageMetadataOptions = {
  locale: Locale;
  pathname: string;
  namespace: string;
  robots?: Metadata['robots'];
};

type BreadcrumbItem = {
  name: string;
  pathname: string;
};

export async function getPageMetadata({
  locale,
  pathname,
  namespace,
  robots,
}: PageMetadataOptions): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace });
  const localizedPath = getLocalizedPath(locale, pathname);

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath,
      languages: getLanguageAlternates(pathname),
    },
    openGraph: {
      url: localizedPath,
      title: t('openGraph.title'),
      description: t('openGraph.description'),
      ...getSharedImageMetadata(locale, t('openGraph.imageAlt')),
    },
    ...(robots ? { robots } : {}),
  };
}

export function getBreadcrumbStructuredData(locale: Locale, items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${getLocalizedPath(locale, item.pathname)}`,
    })),
  };
}

export async function getStructuredData(locale: Locale) {
  const t = await getTranslations({ locale, namespace: 'metadata.structuredData' });

  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: SITE_NAME,
    description: t('description'),
    url: SITE_URL,
    telephone: CONTACT_PHONE_TEL,
    email: CONTACT_EMAIL,
    address: {
      '@type': 'PostalAddress',
      streetAddress: PROPERTY_STREET,
      addressLocality: 'Daruvar',
      postalCode: '43500',
      addressCountry: 'HR',
    },
    image: `${SITE_URL}${HERO_OG_IMAGE_PATH}`,
    priceRange: '€€',
    currenciesAccepted: 'EUR',
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: t('amenities.wifi'), value: true },
      { '@type': 'LocationFeatureSpecification', name: t('amenities.airConditioning'), value: true },
      { '@type': 'LocationFeatureSpecification', name: t('amenities.parking'), value: true },
    ],
    checkinTime: '14:00',
    checkoutTime: '10:00',
  };
}
