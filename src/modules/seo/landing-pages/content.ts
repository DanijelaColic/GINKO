import type { Metadata } from 'next';
import type { AppLocale } from '@/i18n/routing';
import { getLanguageAlternates } from '@/i18n/metadata';
import { localizePath } from '@/i18n/pathnames';
import { SITE_NAME } from '@/modules/booking/booking.config';
import { getIndexingRobots } from '@/modules/seo/indexing';
import { LANDING_ENRICHED } from './landing-enriched-data';
import type {
  LandingMergedContent,
  LandingPageBase,
  LandingPageKey,
} from './landing-enriched-types';

export type { LandingMergedContent, LandingPageKey } from './landing-enriched-types';

type LandingPageContent = LandingPageBase;

const LANDING_PAGE_CONTENT: Record<LandingPageKey, Record<AppLocale, LandingPageContent>> = {
  'sobe-daruvar': {
    hr: {
      seoTitle: 'Sobe Daruvar',
      metaDescription:
        'Sobe u Daruvaru: Ginko 1–6, apartman i Wellness apartman. Usporedite tipove, kapacitete i rezervirajte direktno.',
      h1: 'Sobe u Daruvaru — od boutique sobe do wellness apartmana',
      intro:
        'Tražite sobe u Daruvaru? U Ginku birate između šest boutique soba, apartmana s kuhinjom i Wellness apartmana s privatnom saunom i jacuzzijem — sve na istoj adresi u centru.',
      ctaLabel: 'Provjeri dostupnost',
      breadcrumbLabel: 'Sobe Daruvar',
    },
    en: {
      seoTitle: 'Rooms in Daruvar',
      metaDescription:
        'Rooms in Daruvar: Ginko 1–6, an apartment and a Wellness apartment. Compare types and capacities, then book direct.',
      h1: 'Rooms in Daruvar — from boutique rooms to a wellness apartment',
      intro:
        'Looking for rooms in Daruvar? At Ginko you choose between six boutique rooms, an apartment with a kitchen, and a Wellness apartment with a private sauna and jacuzzi — all at the same central address.',
      ctaLabel: 'Check availability',
      breadcrumbLabel: 'Rooms Daruvar',
    },
    cs: {
      seoTitle: 'Pokoje Daruvar',
      metaDescription:
        'Pokoje v Daruvaru: Ginko 1–6, apartmán a Wellness apartmán. Porovnejte typy a kapacity a rezervujte přímo.',
      h1: 'Pokoje v Daruvaru — od boutique pokoje po wellness apartmán',
      intro:
        'Hledáte pokoje v Daruvaru? V Ginku volíte mezi šesti boutique pokoji, apartmánem s kuchyní a Wellness apartmánem se soukromou saunou a vířivkou — vše na stejné adrese v centru.',
      ctaLabel: 'Zkontrolovat dostupnost',
      breadcrumbLabel: 'Pokoje Daruvar',
    },
  },
  'privatni-smjestaj-daruvar': {
    hr: {
      seoTitle: 'Privatni smještaj Daruvar',
      metaDescription:
        'Privatni smještaj u Daruvaru s direktnom rezervacijom. Sobe i wellness apartmani, parking, WiFi — bez Booking provizije.',
      h1: 'Privatni smještaj u Daruvaru uz direktnu rezervaciju',
      intro:
        'Ako tražite privatni smještaj u Daruvaru umjesto velikog hotela, Ginko nudi boutique sobe i wellness apartmane u centru grada, uz jasne uvjete i depozit od 50 %.',
      ctaLabel: 'Rezerviraj direktno',
      breadcrumbLabel: 'Privatni smještaj Daruvar',
    },
    en: {
      seoTitle: 'Private Accommodation Daruvar',
      metaDescription:
        'Private accommodation in Daruvar with direct booking. Rooms and wellness apartments, parking, WiFi — no OTA commission.',
      h1: 'Private accommodation in Daruvar with direct booking',
      intro:
        'Looking for private accommodation in Daruvar instead of a large hotel? Ginko offers boutique rooms and wellness apartments in the town centre, with clear terms and a 50% deposit.',
      ctaLabel: 'Book directly',
      breadcrumbLabel: 'Private accommodation Daruvar',
    },
    cs: {
      seoTitle: 'Soukromé ubytování Daruvar',
      metaDescription:
        'Soukromé ubytování v Daruvaru s přímou rezervací. Pokoje a wellness apartmány, parkování, WiFi — bez provize platforem.',
      h1: 'Soukromé ubytování v Daruvaru s přímou rezervací',
      intro:
        'Hledáte soukromé ubytování v Daruvaru místo velkého hotelu? Ginko nabízí boutique pokoje a wellness apartmány v centru města, s jasnými podmínkami a zálohou 50 %.',
      ctaLabel: 'Rezervovat přímo',
      breadcrumbLabel: 'Soukromé ubytování Daruvar',
    },
  },
  'wellness-daruvar': {
    hr: {
      seoTitle: 'Wellness Daruvar — sauna i jacuzzi',
      metaDescription:
        'Wellness u Daruvaru: privatna sauna i jacuzzi u apartmanu, uz toplice u blizini. Rezervirajte Wellness apartman direktno.',
      h1: 'Wellness u Daruvaru — privatna sauna i jacuzzi',
      intro:
        'Spojite Daruvarske toplice s privatnim wellnessom u objektu. Ginko Wellness apartman nudi saunu i jacuzzi za oporavak nakon termalnog dana.',
      ctaLabel: 'Rezerviraj wellness',
      breadcrumbLabel: 'Wellness Daruvar',
    },
    en: {
      seoTitle: 'Wellness Daruvar — private sauna & jacuzzi',
      metaDescription:
        'Wellness in Daruvar: private sauna and jacuzzi in your apartment, near the spa. Book the Wellness apartment direct.',
      h1: 'Wellness in Daruvar — private sauna and jacuzzi',
      intro:
        'Combine Daruvar Spa with private on-site wellness. The Ginko Wellness apartment offers a sauna and jacuzzi for recovery after a thermal day.',
      ctaLabel: 'Book wellness',
      breadcrumbLabel: 'Wellness Daruvar',
    },
    cs: {
      seoTitle: 'Wellness Daruvar — sauna a vířivka',
      metaDescription:
        'Wellness v Daruvaru: soukromá sauna a vířivka v apartmánu, lázně v blízkosti. Rezervujte Wellness apartmán přímo.',
      h1: 'Wellness v Daruvaru — soukromá sauna a vířivka',
      intro:
        'Spojte lázně Daruvar se soukromým wellness v objektu. Ginko Wellness apartmán nabízí saunu a vířivku pro regeneraci po termálním dni.',
      ctaLabel: 'Rezervovat wellness',
      breadcrumbLabel: 'Wellness Daruvar',
    },
  },
  'smjestaj-uz-daruvarske-toplice': {
    hr: {
      seoTitle: 'Smještaj uz Daruvarske toplice',
      metaDescription:
        'Smještaj uz Daruvarske toplice — boutique sobe ~400 m od toplica i aqua parka. Parking, WiFi, direktna rezervacija.',
      h1: 'Smještaj uz Daruvarske toplice bez dugih transfera',
      intro:
        'Ako vam je prioritet blizina toplica, Ginko je baza u centru Daruvara: oko 400 m do Daruvarskih toplica i aqua parka Aquae Ballisae.',
      ctaLabel: 'Provjeri dostupnost',
      breadcrumbLabel: 'Smještaj uz toplice',
    },
    en: {
      seoTitle: 'Accommodation Near Daruvar Spa',
      metaDescription:
        'Stay near Daruvar Spa — boutique rooms ~400 m from the baths and aqua park. Parking, WiFi, direct booking.',
      h1: 'Accommodation near Daruvar Spa without long transfers',
      intro:
        'If proximity to the spa matters most, Ginko is a base in central Daruvar: about 400 m to Daruvar Spa and Aquae Ballisae aqua park.',
      ctaLabel: 'Check availability',
      breadcrumbLabel: 'Stay near the spa',
    },
    cs: {
      seoTitle: 'Ubytování u lázní Daruvar',
      metaDescription:
        'Ubytování u lázní Daruvar — boutique pokoje ~400 m od lázní a aquaparku. Parkování, WiFi, přímá rezervace.',
      h1: 'Ubytování u lázní Daruvar bez dlouhých transferů',
      intro:
        'Pokud je priorita blízkost lázní, Ginko je základna v centru Daruvaru: asi 400 m k lázním a aquaparku Aquae Ballisae.',
      ctaLabel: 'Zkontrolovat dostupnost',
      breadcrumbLabel: 'Ubytování u lázní',
    },
  },
};

export function getLandingPageContent(
  key: LandingPageKey,
  locale: AppLocale,
): LandingMergedContent {
  return {
    ...LANDING_PAGE_CONTENT[key][locale],
    ...LANDING_ENRICHED[key][locale],
  };
}

export function getLandingPageMetadata(
  key: LandingPageKey,
  locale: AppLocale,
): Metadata {
  const pathname = `/${key}`;
  const localizedPath = localizePath(pathname, locale);
  const content = getLandingPageContent(key, locale);

  // seoTitle = kratki segment; layout template doda „| Ginko Boutique Rooms“.
  // OG/Twitter koriste puni social title bez oslanjanja na document template.
  const socialTitle = `${content.seoTitle} | ${SITE_NAME}`;

  return {
    title: content.seoTitle,
    description: content.metaDescription,
    alternates: {
      canonical: localizedPath,
      languages: getLanguageAlternates(pathname),
    },
    openGraph: {
      type: 'article',
      url: localizedPath,
      title: socialTitle,
      description: content.metaDescription,
      images: [content.heroImage.src],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: content.metaDescription,
      images: [content.heroImage.src],
    },
    robots: getIndexingRobots(),
  };
}
