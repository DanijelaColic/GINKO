// Adapted from Villa-Jurina/src/lib/apartments.ts → renamed fields, Ginko domain
// Mock data — replace with real room data before launch

import type { Room, RoomLocale } from './room.types';

export const rooms: Room[] = [
  {
    slug: 'zelena',
    name: 'Zelena',
    tagline: 'Tišina, zelenilo i jutarnji mir.',
    description:
      'ZELENA je prostrana i svjetla soba okružena prirodom. Dizajnirana za dvoje koji traže odmor daleko od vreve — s pogledom na vrt, prirodnim materijalima i tihim jutarnjim buđenjem uz ptičji pjev.',
    capacity: 2,
    capacityNote: '2 osobe',
    size: 22,
    beds: '1 bračni krevet',
    view: true,
    balcony: false,
    floors: 1,
    priceOffSeason: 70,
    priceHighSeason: 90,
    fullyBooked: false,
    amenities: ['WiFi', 'Klima', 'TV', 'Hladnjak', 'Kuhalo za vodu', 'Parking'],
    images: [],
  },
  {
    slug: 'orah',
    name: 'Orah',
    tagline: 'Prostranstvo i toplina za cijelu obitelj.',
    description:
      'ORAH je obiteljska soba s karakterom. Dva kreveta, prostrana kupaoonica i terasa s pogledom na okolno zelenilo. Savršena za parove s djetetom ili manje obitelji koje žele udoban i miran smještaj.',
    capacity: 4,
    capacityNote: '4 osobe (2+2)',
    size: 35,
    beds: '1 bračni krevet + 2 pomoćna ležaja',
    view: true,
    balcony: true,
    floors: 1,
    priceOffSeason: 100,
    priceHighSeason: 130,
    fullyBooked: false,
    amenities: ['WiFi', 'Klima', 'TV', 'Hladnjak', 'Kuhalo za vodu', 'Parking', 'Terasa'],
    images: [],
  },
  {
    slug: 'bijela',
    name: 'Bijela',
    tagline: 'Minimalizam i elegancija za savršen bijeg.',
    description:
      'BIJELA je minimalistički uređena soba u bijelom — čista linija, puno prirodnog svjetla i savršen mir. Idealna za samce ili parove koji cijene jednostavnost i eleganciju iznad svega.',
    capacity: 2,
    capacityNote: '2 osobe',
    size: 18,
    beds: '1 bračni krevet',
    view: false,
    balcony: false,
    floors: 1,
    priceOffSeason: 60,
    priceHighSeason: 80,
    fullyBooked: false,
    amenities: ['WiFi', 'Klima', 'TV', 'Kuhalo za vodu', 'Parking'],
    images: [],
  },
];

// Localized overlays — same pattern as Villa-Jurina apartmentTranslations
export const roomTranslations: Record<
  RoomLocale,
  Record<string, Pick<Room, 'tagline' | 'description' | 'capacityNote' | 'beds' | 'amenities'>>
> = {
  hr: {
    zelena: {
      tagline: 'Tišina, zelenilo i jutarnji mir.',
      description:
        'ZELENA je prostrana i svjetla soba okružena prirodom. Dizajnirana za dvoje koji traže odmor daleko od vreve — s pogledom na vrt, prirodnim materijalima i tihim jutarnjim buđenjem.',
      capacityNote: '2 osobe',
      beds: '1 bračni krevet',
      amenities: ['WiFi', 'Klima', 'TV', 'Hladnjak', 'Kuhalo za vodu', 'Parking'],
    },
    orah: {
      tagline: 'Prostranstvo i toplina za cijelu obitelj.',
      description:
        'ORAH je obiteljska soba s karakterom. Dva kreveta, prostrana kupaoonica i terasa s pogledom na okolno zelenilo. Savršena za obitelji koje žele udoban i miran smještaj.',
      capacityNote: '4 osobe (2+2)',
      beds: '1 bračni krevet + 2 pomoćna ležaja',
      amenities: ['WiFi', 'Klima', 'TV', 'Hladnjak', 'Kuhalo za vodu', 'Parking', 'Terasa'],
    },
    bijela: {
      tagline: 'Minimalizam i elegancija za savršen bijeg.',
      description:
        'BIJELA je minimalistički uređena soba u bijelom — čista linija, puno prirodnog svjetla i savršen mir.',
      capacityNote: '2 osobe',
      beds: '1 bračni krevet',
      amenities: ['WiFi', 'Klima', 'TV', 'Kuhalo za vodu', 'Parking'],
    },
  },
  en: {
    zelena: {
      tagline: 'Quiet, green, and a peaceful morning.',
      description:
        'ZELENA is a spacious, bright room surrounded by nature. Designed for two who seek rest far from the hustle — with a garden view, natural materials, and a calm morning wake-up.',
      capacityNote: '2 guests',
      beds: '1 double bed',
      amenities: ['WiFi', 'Air conditioning', 'TV', 'Fridge', 'Kettle', 'Parking'],
    },
    orah: {
      tagline: 'Space and warmth for the whole family.',
      description:
        'ORAH is a family room with character. Two beds, a spacious bathroom and a terrace overlooking the surrounding greenery. Perfect for families wanting comfortable, peaceful accommodation.',
      capacityNote: '4 guests (2+2)',
      beds: '1 double bed + 2 sofa beds',
      amenities: ['WiFi', 'Air conditioning', 'TV', 'Fridge', 'Kettle', 'Parking', 'Terrace'],
    },
    bijela: {
      tagline: 'Minimalism and elegance for a perfect escape.',
      description:
        'BIJELA is a minimalist room in white — clean lines, plenty of natural light and perfect calm. Ideal for solo guests or couples who value simplicity above all.',
      capacityNote: '2 guests',
      beds: '1 double bed',
      amenities: ['WiFi', 'Air conditioning', 'TV', 'Kettle', 'Parking'],
    },
  },
  de: {
    zelena: {
      tagline: 'Stille, Grün und ruhige Morgen.',
      description:
        'ZELENA ist ein geräumiges, helles Zimmer umgeben von Natur. Für zwei konzipiert, die Erholung abseits des Trubels suchen — mit Gartenblick, natürlichen Materialien und ruhigem Morgenerwachen.',
      capacityNote: '2 Gäste',
      beds: '1 Doppelbett',
      amenities: ['WLAN', 'Klimaanlage', 'TV', 'Kühlschrank', 'Wasserkocher', 'Parkplatz'],
    },
    orah: {
      tagline: 'Großzügigkeit und Wärme für die ganze Familie.',
      description:
        'ORAH ist ein Familienzimmer mit Charakter. Zwei Betten, ein geräumiges Bad und eine Terrasse mit Blick ins Grüne. Ideal für Familien mit komfortablem und ruhigem Aufenthalt.',
      capacityNote: '4 Gäste (2+2)',
      beds: '1 Doppelbett + 2 Schlafsofa',
      amenities: ['WLAN', 'Klimaanlage', 'TV', 'Kühlschrank', 'Wasserkocher', 'Parkplatz', 'Terrasse'],
    },
    bijela: {
      tagline: 'Minimalismus und Eleganz für eine perfekte Auszeit.',
      description:
        'BIJELA ist ein minimalistisch eingerichtetes weißes Zimmer — klare Linien, viel natürliches Licht und perfekte Ruhe. Ideal für Alleinreisende oder Paare, die Einfachheit schätzen.',
      capacityNote: '2 Gäste',
      beds: '1 Doppelbett',
      amenities: ['WLAN', 'Klimaanlage', 'TV', 'Wasserkocher', 'Parkplatz'],
    },
  },
};
