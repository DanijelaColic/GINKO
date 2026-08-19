import type { AppLocale } from '@/i18n/routing';
import type { GalleryCategoryKey } from './gallery.categories';
import type { GalleryItem } from './gallery.types';

export function getValidGalleryLocale(locale: string | null | undefined): AppLocale {
  return locale === 'en' || locale === 'cs' ? locale : 'hr';
}

const CATEGORY_LABELS: Record<AppLocale, Record<GalleryCategoryKey | 'other', string>> = {
  hr: {
    exterior: 'Eksterijer',
    rooms: 'Sobe',
    'common-areas': 'Zajednički prostori',
    breakfast: 'Doručak',
    surroundings: 'Okolica Daruvara',
    other: 'Ostalo',
  },
  en: {
    exterior: 'Exterior',
    rooms: 'Rooms',
    'common-areas': 'Common areas',
    breakfast: 'Breakfast',
    surroundings: 'Daruvar surroundings',
    other: 'Other',
  },
  cs: {
    exterior: 'Exteriér',
    rooms: 'Pokoje',
    'common-areas': 'Společné prostory',
    breakfast: 'Snídaně',
    surroundings: 'Okolí Daruvaru',
    other: 'Ostatní',
  },
};

type ItemCopy = { title: string; alt: string };

/** EN/CS overlay for mock (and DB rows with the same id). HR stays in repository. */
const ITEM_COPY: Record<Exclude<AppLocale, 'hr'>, Record<string, ItemCopy>> = {
  en: {
    'ext-1': {
      title: 'Property',
      alt: 'Ginko Boutique Rooms — property, Daruvar',
    },
    'ext-2': {
      title: 'View of the property',
      alt: 'Ginko Boutique Rooms — view of the property',
    },
    'ext-3': {
      title: 'Exterior',
      alt: 'Ginko Boutique Rooms — exterior',
    },
    'ext-4': {
      title: 'Façade',
      alt: 'Ginko Boutique Rooms — façade',
    },
    'room-1': {
      title: 'Ginko 1',
      alt: 'Ginko 1 — room',
    },
    'room-2': {
      title: 'Ginko 2',
      alt: 'Ginko 2 — room with terrace',
    },
    'room-3': {
      title: 'Ginko SPA 2',
      alt: 'Ginko SPA 2 — wellness suite',
    },
    'common-1': {
      title: 'Common areas',
      alt: 'Ginko Boutique Rooms — common areas',
    },
    'common-2': {
      title: 'Terrace',
      alt: 'Ginko Boutique Rooms — terrace',
    },
    'common-3': {
      title: 'Details',
      alt: 'Ginko Boutique Rooms — details',
    },
    'common-4': {
      title: 'Spaces',
      alt: 'Ginko Boutique Rooms — interiors',
    },
    'brkfst-1': {
      title: 'Breakfast',
      alt: 'Ginko Boutique Rooms — breakfast',
    },
    'brkfst-2': {
      title: 'Morning meal',
      alt: 'Ginko Boutique Rooms — morning meal',
    },
    'surr-1': {
      title: 'Daruvar surroundings',
      alt: 'Daruvar surroundings',
    },
    'surr-2': {
      title: 'Daruvar area',
      alt: 'Daruvar — nature and surroundings',
    },
    'surr-3': {
      title: 'Daruvar',
      alt: 'Daruvar — town',
    },
  },
  cs: {
    'ext-1': {
      title: 'Objekt',
      alt: 'Ginko Boutique Rooms — objekt, Daruvar',
    },
    'ext-2': {
      title: 'Pohled na objekt',
      alt: 'Ginko Boutique Rooms — pohled na objekt',
    },
    'ext-3': {
      title: 'Exteriér',
      alt: 'Ginko Boutique Rooms — exteriér',
    },
    'ext-4': {
      title: 'Fasáda',
      alt: 'Ginko Boutique Rooms — fasáda',
    },
    'room-1': {
      title: 'Ginko 1',
      alt: 'Ginko 1 — pokoj',
    },
    'room-2': {
      title: 'Ginko 2',
      alt: 'Ginko 2 — pokoj s terasou',
    },
    'room-3': {
      title: 'Ginko SPA 2',
      alt: 'Ginko SPA 2 — wellness apartmá',
    },
    'common-1': {
      title: 'Společné prostory',
      alt: 'Ginko Boutique Rooms — společné prostory',
    },
    'common-2': {
      title: 'Terasa',
      alt: 'Ginko Boutique Rooms — terasa',
    },
    'common-3': {
      title: 'Detaily',
      alt: 'Ginko Boutique Rooms — detaily',
    },
    'common-4': {
      title: 'Prostory',
      alt: 'Ginko Boutique Rooms — interiéry',
    },
    'brkfst-1': {
      title: 'Snídaně',
      alt: 'Ginko Boutique Rooms — snídaně',
    },
    'brkfst-2': {
      title: 'Ranní jídlo',
      alt: 'Ginko Boutique Rooms — ranní jídlo',
    },
    'surr-1': {
      title: 'Okolí Daruvaru',
      alt: 'Okolí Daruvaru',
    },
    'surr-2': {
      title: 'Okolí Daruvaru',
      alt: 'Daruvar — příroda a okolí',
    },
    'surr-3': {
      title: 'Daruvar',
      alt: 'Daruvar — město',
    },
  },
};

export function getGalleryCategoryLabel(
  key: string,
  locale: string | null | undefined = 'hr',
): string {
  const labels = CATEGORY_LABELS[getValidGalleryLocale(locale)];
  if (key in labels) return labels[key as GalleryCategoryKey];
  return labels.other;
}

export function localizeGalleryItem(
  item: GalleryItem,
  locale: string | null | undefined,
): GalleryItem {
  const valid = getValidGalleryLocale(locale);
  if (valid === 'hr') return item;
  const copy = ITEM_COPY[valid][item.id];
  if (!copy) return item;
  return { ...item, title: copy.title, alt_text: copy.alt };
}

export function localizeGalleryItems(
  items: GalleryItem[],
  locale: string | null | undefined,
): GalleryItem[] {
  return items.map((item) => localizeGalleryItem(item, locale));
}
