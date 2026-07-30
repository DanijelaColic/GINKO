// Real room data — Ginko Sobe, Ulica Tomaša Garika Masaryka 1, 43500 Daruvar
// Images: Unsplash placeholders — replace with real photos before launch
// EN/DE translations mirror HR until proper translation is done (marked TODO)

import type { AccommodationType, Room, RoomLocale } from './room.types';

export const APARTMENT_SLUGS = ['ginko-spa-1', 'ginko-spa-2'] as const;

export function getAccommodationType(slug: string): AccommodationType {
  return (APARTMENT_SLUGS as readonly string[]).includes(slug) ? 'apartman' : 'soba';
}

export const rooms: Room[] = [
  {
    slug: 'ginko-1',
    accommodationType: 'soba',
    name: 'Ginko 1',
    tagline: 'Šarmantna i intimna soba u srcu Daruvara.',
    description:
      'Dobrodošli u Ginko 1, šarmantnu i intimnu sobu skrivenu u prekrasnom gradu Daruvaru. Smještena na Ulici Tomaša Garika Masaryka 1, ova soba je savršeno dizajnirana za osobu koja traži mir i udobnost — ali udobno smješta i dvoje. Prostrana spavaća soba s bračnim krevetom, moderna kupaonica i topla atmosfera osiguravaju sve što vam treba za opuštajući boravak. Kućni ljubimci su dobrodošli na upit.',
    capacity: 2,
    capacityNote: '2 osobe',
    size: 15,
    beds: '1 bračni krevet',
    view: false,
    balcony: false,
    floors: 1,
    price: 60,
    fullyBooked: false,
    extraBedAvailable: false,
    amenities: ['WiFi', 'LCD TV', 'Klima', 'Parking', 'Grijanje', 'Ručnici', 'Posteljina', 'Kućni ljubimci na upit'],
    images: [
      '/images/rooms/ginko-1/01-cover.jpg',
    ],
  },
  {
    slug: 'ginko-2',
    accommodationType: 'soba',
    name: 'Ginko 2',
    tagline: 'Prostrana soba s terasom za ugodne večeri.',
    description:
      'Otkrijte očaravajući boravak u Ginko 2, šarmantnoj sobi smještenoj u srcu slikovitog Daruvara. Smještena na Ulici Tomaša Garika Masaryka 1, nećete biti daleko od bogate povijesti i ljepote ovog grada. Soba udobno prima do dvoje gostiju, a po potrebi može ugostiti i treću osobu. Terasa i satelitski TV čine ovu sobu jednim od omiljenih izbora naših gostiju. Kućni ljubimci su dobrodošli na upit.',
    capacity: 3,
    capacityNote: '2+1',
    size: 20,
    beds: '1 bračni krevet\n1 krevet za 1 osobu (pomoćni ležaj)',
    view: false,
    balcony: true,
    floors: 1,
    price: 60,
    fullyBooked: false,
    extraBedAvailable: true,
    amenities: ['WiFi', 'LCD TV', 'Satelitski TV', 'Klima', 'Terasa', 'Parking', 'Grijanje', 'Ručnici', 'Posteljina', 'Kućni ljubimci na upit'],
    images: [
      '/images/rooms/ginko-2/01-cover.jpg',
    ],
  },
  {
    slug: 'ginko-3',
    accommodationType: 'soba',
    name: 'Ginko 3',
    tagline: 'Privatno utočište s modernim sadržajima i terasom.',
    description:
      'Dobrodošli u Ginko 3, vaše privatno utočište smješteno u srcu Daruvara. Naš šarmantni apartman nalazi se na Ulici Tomaša Garika Masaryka 1, nudeći vam autentično hrvatsko iskustvo u samom srcu živopisne kulture i bogate povijesti. Soba je potpuno opremljena modernim sadržajima i udobno prima 2 gosta, a po potrebi i do 3. Terasa i potpuna privatnost čine ovaj boravak posebnim. Kućni ljubimci su dobrodošli na upit.',
    capacity: 3,
    capacityNote: '2+1',
    size: 18,
    beds: '1 bračni krevet\n1 krevet za 1 osobu (pomoćni ležaj)',
    view: false,
    balcony: true,
    floors: 1,
    price: 60,
    fullyBooked: false,
    extraBedAvailable: true,
    amenities: ['WiFi', 'LCD TV', 'Satelitski TV', 'Klima', 'Terasa', 'Parking', 'Grijanje', 'Ručnici', 'Posteljina', 'Kućni ljubimci na upit'],
    images: [
      '/images/rooms/ginko-3/01-cover.jpg',
    ],
  },
  {
    slug: 'ginko-4',
    accommodationType: 'soba',
    name: 'Ginko 4',
    tagline: 'Moderna soba s terasom i luksuznim sadržajima.',
    description:
      'Dobrodošli u Ginko 4 — udobnu sobu s pažljivo odabranim sadržajima za savršen odmor. Smještena u srcu Daruvara na Ulici Tomaša Garika Masaryka 1, ova soba nudi vrhunsku lokaciju u blizini gradskih atrakcija. Naše ljubazno osoblje posvećeno je tome da vaš boravak bude nezaboravan. Terasa i privatno parkiranje dostupni su svim gostima. Kućni ljubimci su dobrodošli na upit.',
    capacity: 3,
    capacityNote: '2+1',
    size: 20,
    beds: '1 bračni krevet\n1 krevet za 1 osobu (pomoćni ležaj)',
    view: false,
    balcony: true,
    floors: 1,
    price: 60,
    fullyBooked: false,
    extraBedAvailable: true,
    amenities: ['WiFi', 'LCD TV', 'Satelitski TV', 'Klima', 'Terasa', 'Parking', 'Grijanje', 'Ručnici', 'Posteljina', 'Kućni ljubimci na upit'],
    images: [
      '/images/rooms/ginko-4/01-cover.jpg',
    ],
  },
  {
    slug: 'ginko-5',
    accommodationType: 'soba',
    name: 'Ginko 5',
    tagline: 'Elegantna soba za savršen odmor u centru grada.',
    description:
      'Dobrodošli u Ginko 5, vaš savršeni boravak u kulturnom srcu Hrvatske. Smještena na Ulici Tomaša Garika Masaryka 1 u Daruvaru, ova elegantna soba nudi ugodan i autentičan okus hrvatskog načina života. Privatni, potpuno namješteni prostor pažljivo je dizajniran za udoban smještaj do dvoje gostiju. Terasa i potpuna privatnost dostupni su svim gostima. Kućni ljubimci su dobrodošli na upit.',
    capacity: 2,
    capacityNote: '2 osobe',
    size: 20,
    beds: '1 bračni krevet',
    view: false,
    balcony: true,
    floors: 1,
    price: 60,
    fullyBooked: false,
    extraBedAvailable: false,
    amenities: ['WiFi', 'LCD TV', 'Satelitski TV', 'Klima', 'Terasa', 'Parking', 'Grijanje', 'Ručnici', 'Posteljina'],
    images: [
      '/images/rooms/ginko-5/01-cover.jpg',
    ],
  },
  {
    slug: 'ginko-6',
    accommodationType: 'soba',
    name: 'Ginko 6',
    tagline: 'Idealna za solo putnike — miran i intiman boravak.',
    description:
      'Dobrodošli u Ginko 6, ugodnu i privlačnu sobu smještenu u srcu Daruvara na Ulici Tomaša Garika Masaryka 1. Ova soba je posebno osmišljena za solo putnike ili poslovne goste koji traže miran odmor. Udobna spavaća soba s jednokrevetnim krevetom, moderna kupaonica i terasa osiguravaju sve što vam treba za mirno i opuštajuće noćenje. Kućni ljubimci su dobrodošli na upit.',
    capacity: 1,
    capacityNote: '1 osoba',
    size: 14,
    beds: '1 jednokrevetni krevet',
    view: false,
    balcony: true,
    floors: 1,
    price: 42,
    fullyBooked: false,
    extraBedAvailable: false,
    amenities: ['WiFi', 'LCD TV', 'Satelitski TV', 'Klima', 'Terasa', 'Parking', 'Grijanje', 'Ručnici', 'Posteljina', 'Kućni ljubimci na upit'],
    images: [
      '/images/rooms/ginko-6/01-cover.jpg',
    ],
  },
  {
    // Wellness Apartman — s privatnom saunom/jacuzzijem (234 €/noć)
    slug: 'ginko-spa-2',
    accommodationType: 'apartman',
    name: 'Wellness Apartman',
    tagline: 'Privatna sauna i jacuzzi — luksuzno wellness iskustvo.',
    description:
      'Dobrodošli u Wellness Apartman — vašu oazu luksuza i wellness iskustva u Daruvaru. Prostrani smještaj od 50 m² smješten na drugom katu nudi potpuno drugačije iskustvo od standardnih soba: privatna sauna, jacuzzi, terasa s pogledom, odvojena kuhinja i besprijekoran dizajn čine ovaj smještaj idealnim za parove ili manje grupe koje žele nešto više. Svaki detalj pažljivo je dizajniran za miran, opuštajući i nezaboravan odmor. Kućni ljubimci nisu dozvoljeni.',
    capacity: 4,
    capacityNote: '2+2',
    size: 50,
    beds: 'Spavaća soba 1: 1 bračni krevet\nDnevni boravak: 1 kauč na rasklapanje\nDodatno: 1 krevet za 1 osobu (pomoćni ležaj)',
    view: true,
    balcony: true,
    floors: 1,
    price: 234,
    fullyBooked: false,
    extraBedAvailable: true,
    linkedSlugs: ['ginko-spa-1'],
    amenities: ['WiFi', 'LCD TV', 'Satelitski TV', 'Klima', 'Privatna sauna', 'Jacuzzi', 'Terasa', 'Posebna kuhinja', 'Parking', 'Grijanje', 'Ručnici', 'Posteljina'],
    images: [
      '/images/rooms/ginko-spa-2/01-cover.png',
    ],
  },
  {
    // Apartman — isti fizički prostor bez korištenja privatne wellness zone (90 €/noć)
    slug: 'ginko-spa-1',
    accommodationType: 'apartman',
    name: 'Apartman',
    tagline: 'Prostrani apartman s terasom i odvojenom kuhinjom.',
    description:
      'Dobrodošli u Apartman — prostrani smještaj od 50 m² smješten na drugom katu u srcu Daruvara. Terasa s pogledom, odvojena kuhinja i moderno uređen prostor čine ovaj apartman savršenim za opuštajući odmor. Ovaj smještaj ne uključuje pristup privatnoj wellness zoni (sauna i jacuzzi). Kućni ljubimci nisu dozvoljeni.',
    capacity: 4,
    capacityNote: '2+2',
    size: 50,
    beds: 'Spavaća soba 1: 1 bračni krevet\nDnevni boravak: 1 kauč na rasklapanje\nDodatno: 1 krevet za 1 osobu (pomoćni ležaj)',
    view: true,
    balcony: true,
    floors: 1,
    price: 90,
    fullyBooked: false,
    extraBedAvailable: true,
    linkedSlugs: ['ginko-spa-2'],
    amenities: ['WiFi', 'LCD TV', 'Satelitski TV', 'Klima', 'Terasa', 'Posebna kuhinja', 'Parking', 'Grijanje', 'Ručnici', 'Posteljina'],
    images: [
      '/images/rooms/ginko-spa-2/01-cover.png',
    ],
  },
];

// TODO: Translate EN and DE when content is finalised
export const roomTranslations: Record<
  RoomLocale,
  Record<string, Pick<Room, 'tagline' | 'description' | 'capacityNote' | 'beds' | 'amenities'>>
> = {
  hr: {
    'ginko-1': {
      tagline: 'Šarmantna i intimna soba u srcu Daruvara.',
      description: rooms[0].description,
      capacityNote: '2 osobe',
      beds: '1 bračni krevet',
      amenities: rooms[0].amenities,
    },
    'ginko-2': {
      tagline: 'Prostrana soba s terasom za ugodne večeri.',
      description: rooms[1].description,
      capacityNote: '2+1',
      beds: '1 bračni krevet\n1 krevet za 1 osobu (pomoćni ležaj)',
      amenities: rooms[1].amenities,
    },
    'ginko-3': {
      tagline: 'Privatno utočište s modernim sadržajima i terasom.',
      description: rooms[2].description,
      capacityNote: '2+1',
      beds: '1 bračni krevet\n1 krevet za 1 osobu (pomoćni ležaj)',
      amenities: rooms[2].amenities,
    },
    'ginko-4': {
      tagline: 'Moderna soba s terasom i luksuznim sadržajima.',
      description: rooms[3].description,
      capacityNote: '2+1',
      beds: '1 bračni krevet\n1 krevet za 1 osobu (pomoćni ležaj)',
      amenities: rooms[3].amenities,
    },
    'ginko-5': {
      tagline: 'Elegantna soba za savršen odmor u centru grada.',
      description: rooms[4].description,
      capacityNote: '2 osobe',
      beds: '1 bračni krevet',
      amenities: rooms[4].amenities,
    },
    'ginko-6': {
      tagline: 'Idealna za solo putnike — miran i intiman boravak.',
      description: rooms[5].description,
      capacityNote: '1 osoba',
      beds: '1 jednokrevetni krevet',
      amenities: rooms[5].amenities,
    },
    'ginko-spa-2': {
      tagline: 'Privatna sauna i jacuzzi — luksuzno wellness iskustvo.',
      description: rooms[6].description,
      capacityNote: '2+2',
      beds: 'Spavaća soba 1: 1 bračni krevet\nDnevni boravak: 1 kauč na rasklapanje\nDodatno: 1 krevet za 1 osobu (pomoćni ležaj)',
      amenities: rooms[6].amenities,
    },
    'ginko-spa-1': {
      tagline: 'Prostrani apartman s terasom i odvojenom kuhinjom.',
      description: rooms[7].description,
      capacityNote: '2+2',
      beds: 'Spavaća soba 1: 1 bračni krevet\nDnevni boravak: 1 kauč na rasklapanje\nDodatno: 1 krevet za 1 osobu (pomoćni ležaj)',
      amenities: rooms[7].amenities,
    },
  },
  // TODO: Replace with proper EN translations
  en: {
    'ginko-1': {
      tagline: 'Charming and intimate room in the heart of Daruvar.',
      description: rooms[0].description,
      capacityNote: '2 guests',
      beds: '1 double bed',
      amenities: ['WiFi', 'LCD TV', 'Air conditioning', 'Parking', 'Heating', 'Towels', 'Linen', 'Pets on request'],
    },
    'ginko-2': {
      tagline: 'Spacious room with terrace for pleasant evenings.',
      description: rooms[1].description,
      capacityNote: '2+1',
      beds: '1 double bed\n1 single bed (extra bed)',
      amenities: ['WiFi', 'LCD TV', 'SAT TV', 'Air conditioning', 'Terrace', 'Parking', 'Heating', 'Towels', 'Linen', 'Pets on request'],
    },
    'ginko-3': {
      tagline: 'Private retreat with modern amenities and terrace.',
      description: rooms[2].description,
      capacityNote: '2+1',
      beds: '1 double bed\n1 single bed (extra bed)',
      amenities: ['WiFi', 'LCD TV', 'SAT TV', 'Air conditioning', 'Terrace', 'Parking', 'Heating', 'Towels', 'Linen', 'Pets on request'],
    },
    'ginko-4': {
      tagline: 'Modern room with terrace and luxury amenities.',
      description: rooms[3].description,
      capacityNote: '2+1',
      beds: '1 double bed\n1 single bed (extra bed)',
      amenities: ['WiFi', 'LCD TV', 'SAT TV', 'Air conditioning', 'Terrace', 'Parking', 'Heating', 'Towels', 'Linen', 'Pets on request'],
    },
    'ginko-5': {
      tagline: 'Elegant room for a perfect city-centre stay.',
      description: rooms[4].description,
      capacityNote: '2 guests',
      beds: '1 double bed',
      amenities: ['WiFi', 'LCD TV', 'SAT TV', 'Air conditioning', 'Terrace', 'Parking', 'Heating', 'Towels', 'Linen'],
    },
    'ginko-6': {
      tagline: 'Perfect for solo travellers — quiet and intimate.',
      description: rooms[5].description,
      capacityNote: '1 guest',
      beds: '1 single bed',
      amenities: ['WiFi', 'LCD TV', 'SAT TV', 'Air conditioning', 'Terrace', 'Parking', 'Heating', 'Towels', 'Linen', 'Pets on request'],
    },
    'ginko-spa-2': {
      tagline: 'Wellness suite with private sauna and separate kitchen.',
      description: rooms[6].description,
      capacityNote: '2+2',
      beds: 'Bedroom 1: 1 double bed\nLiving room: 1 sofa bed\nExtra: 1 single bed (extra bed)',
      amenities: ['WiFi', 'LCD TV', 'SAT TV', 'Air conditioning', 'Sauna', 'Terrace', 'Separate kitchen', 'Parking', 'Heating', 'Towels', 'Linen'],
    },
    'ginko-spa-1': {
      tagline: 'Spacious apartment with terrace and separate kitchen.',
      description: rooms[7].description,
      capacityNote: '2+2',
      beds: 'Bedroom 1: 1 double bed\nLiving room: 1 sofa bed\nExtra: 1 single bed (extra bed)',
      amenities: ['WiFi', 'LCD TV', 'SAT TV', 'Air conditioning', 'Terrace', 'Separate kitchen', 'Parking', 'Heating', 'Towels', 'Linen'],
    },
  },
  // TODO: Replace with proper DE translations
  de: {
    'ginko-1': {
      tagline: 'Charmantes und intimes Zimmer im Herzen von Daruvar.',
      description: rooms[0].description,
      capacityNote: '2 Gäste',
      beds: '1 Doppelbett',
      amenities: ['WLAN', 'LCD TV', 'Klimaanlage', 'Parkplatz', 'Heizung', 'Handtücher', 'Bettwäsche', 'Haustiere auf Anfrage'],
    },
    'ginko-2': {
      tagline: 'Geräumiges Zimmer mit Terrasse für angenehme Abende.',
      description: rooms[1].description,
      capacityNote: '2+1',
      beds: '1 Doppelbett\n1 Einzelbett (Zustellbett)',
      amenities: ['WLAN', 'LCD TV', 'SAT TV', 'Klimaanlage', 'Terrasse', 'Parkplatz', 'Heizung', 'Handtücher', 'Bettwäsche', 'Haustiere auf Anfrage'],
    },
    'ginko-3': {
      tagline: 'Privates Rückzugsort mit moderner Ausstattung und Terrasse.',
      description: rooms[2].description,
      capacityNote: '2+1',
      beds: '1 Doppelbett\n1 Einzelbett (Zustellbett)',
      amenities: ['WLAN', 'LCD TV', 'SAT TV', 'Klimaanlage', 'Terrasse', 'Parkplatz', 'Heizung', 'Handtücher', 'Bettwäsche', 'Haustiere auf Anfrage'],
    },
    'ginko-4': {
      tagline: 'Modernes Zimmer mit Terrasse und Luxusausstattung.',
      description: rooms[3].description,
      capacityNote: '2+1',
      beds: '1 Doppelbett\n1 Einzelbett (Zustellbett)',
      amenities: ['WLAN', 'LCD TV', 'SAT TV', 'Klimaanlage', 'Terrasse', 'Parkplatz', 'Heizung', 'Handtücher', 'Bettwäsche', 'Haustiere auf Anfrage'],
    },
    'ginko-5': {
      tagline: 'Elegantes Zimmer für einen perfekten Stadtaufenthalt.',
      description: rooms[4].description,
      capacityNote: '2 Gäste',
      beds: '1 Doppelbett',
      amenities: ['WLAN', 'LCD TV', 'SAT TV', 'Klimaanlage', 'Terrasse', 'Parkplatz', 'Heizung', 'Handtücher', 'Bettwäsche'],
    },
    'ginko-6': {
      tagline: 'Ideal für Alleinreisende — ruhig und intim.',
      description: rooms[5].description,
      capacityNote: '1 Gast',
      beds: '1 Einzelbett',
      amenities: ['WLAN', 'LCD TV', 'SAT TV', 'Klimaanlage', 'Terrasse', 'Parkplatz', 'Heizung', 'Handtücher', 'Bettwäsche', 'Haustiere auf Anfrage'],
    },
    'ginko-spa-2': {
      tagline: 'Wellness-Suite mit privater Sauna und separater Küche.',
      description: rooms[6].description,
      capacityNote: '2+2',
      beds: 'Schlafzimmer 1: 1 Doppelbett\nWohnzimmer: 1 Schlafsofa\nZusätzlich: 1 Einzelbett (Zustellbett)',
      amenities: ['WLAN', 'LCD TV', 'SAT TV', 'Klimaanlage', 'Sauna', 'Terrasse', 'Separate Küche', 'Parkplatz', 'Heizung', 'Handtücher', 'Bettwäsche'],
    },
    'ginko-spa-1': {
      tagline: 'Geräumiges Apartment mit Terrasse und separater Küche.',
      description: rooms[7].description,
      capacityNote: '2+2',
      beds: 'Schlafzimmer 1: 1 Doppelbett\nWohnzimmer: 1 Schlafsofa\nZusätzlich: 1 Einzelbett (Zustellbett)',
      amenities: ['WLAN', 'LCD TV', 'SAT TV', 'Klimaanlage', 'Terrasse', 'Separate Küche', 'Parkplatz', 'Heizung', 'Handtücher', 'Bettwäsche'],
    },
  },
};
