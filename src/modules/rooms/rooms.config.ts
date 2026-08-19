// Real room data — Ginko Sobe, Ulica Tomaša Garika Masaryka 1, 43500 Daruvar
// Images: local /public/images/rooms/...
// HR = source of truth. EN descriptions are translated. CS opisi: Faza 6 (privremeno EN).

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
  en: {
    'ginko-1': {
      tagline: 'Charming and intimate room in the heart of Daruvar.',
      description:
        'Welcome to Ginko 1, a charming and intimate room in the heart of Daruvar. Located at Ulica Tomaša Garika Masaryka 1, it is designed for anyone looking for peace and comfort — and sleeps two comfortably. A spacious bedroom with a double bed, a modern bathroom and a warm atmosphere give you everything you need for a relaxing stay. Pets are welcome on request.',
      capacityNote: '2 guests',
      beds: '1 double bed',
      amenities: ['WiFi', 'LCD TV', 'Air conditioning', 'Parking', 'Heating', 'Towels', 'Linen', 'Pets on request'],
    },
    'ginko-2': {
      tagline: 'Spacious room with a terrace for pleasant evenings.',
      description:
        'Discover Ginko 2, a charming room in the heart of picturesque Daruvar. At Ulica Tomaša Garika Masaryka 1 you are close to the town’s history and character. The room sleeps two comfortably, with space for a third guest when needed. A terrace and satellite TV make this one of our guests’ favourites. Pets are welcome on request.',
      capacityNote: '2+1',
      beds: '1 double bed\n1 single bed (extra bed)',
      amenities: ['WiFi', 'LCD TV', 'Satellite TV', 'Air conditioning', 'Terrace', 'Parking', 'Heating', 'Towels', 'Linen', 'Pets on request'],
    },
    'ginko-3': {
      tagline: 'A private retreat with modern amenities and a terrace.',
      description:
        'Welcome to Ginko 3, your private retreat in the heart of Daruvar. Our charming room at Ulica Tomaša Garika Masaryka 1 offers an authentic Croatian stay in a lively, historic town centre. It is fully equipped with modern amenities and sleeps 2 guests, or up to 3 when needed. The terrace and complete privacy make the stay special. Pets are welcome on request.',
      capacityNote: '2+1',
      beds: '1 double bed\n1 single bed (extra bed)',
      amenities: ['WiFi', 'LCD TV', 'Satellite TV', 'Air conditioning', 'Terrace', 'Parking', 'Heating', 'Towels', 'Linen', 'Pets on request'],
    },
    'ginko-4': {
      tagline: 'Modern room with a terrace and thoughtful amenities.',
      description:
        'Welcome to Ginko 4 — a comfortable room with carefully chosen amenities for a proper rest. In the heart of Daruvar at Ulica Tomaša Garika Masaryka 1, it puts you close to the town’s attractions. Our hosts are dedicated to making your stay memorable. A terrace and private parking are available to all guests. Pets are welcome on request.',
      capacityNote: '2+1',
      beds: '1 double bed\n1 single bed (extra bed)',
      amenities: ['WiFi', 'LCD TV', 'Satellite TV', 'Air conditioning', 'Terrace', 'Parking', 'Heating', 'Towels', 'Linen', 'Pets on request'],
    },
    'ginko-5': {
      tagline: 'Elegant room for a perfect stay in the town centre.',
      description:
        'Welcome to Ginko 5, your stay in the cultural heart of continental Croatia. At Ulica Tomaša Garika Masaryka 1 in Daruvar, this elegant room offers a comfortable, authentic taste of Croatian life. The private, fully furnished space is designed for up to two guests. A terrace and complete privacy are available to all guests. Pets are welcome on request.',
      capacityNote: '2 guests',
      beds: '1 double bed',
      amenities: ['WiFi', 'LCD TV', 'Satellite TV', 'Air conditioning', 'Terrace', 'Parking', 'Heating', 'Towels', 'Linen'],
    },
    'ginko-6': {
      tagline: 'Ideal for solo travellers — a quiet, intimate stay.',
      description:
        'Welcome to Ginko 6, a cosy room in the heart of Daruvar at Ulica Tomaša Garika Masaryka 1. It is designed for solo travellers or business guests looking for a quiet stay. A comfortable bedroom with a single bed, a modern bathroom and a terrace give you everything you need for a peaceful night. Pets are welcome on request.',
      capacityNote: '1 guest',
      beds: '1 single bed',
      amenities: ['WiFi', 'LCD TV', 'Satellite TV', 'Air conditioning', 'Terrace', 'Parking', 'Heating', 'Towels', 'Linen', 'Pets on request'],
    },
    'ginko-spa-2': {
      tagline: 'Private sauna and jacuzzi — a luxury wellness stay.',
      description:
        'Welcome to the Wellness Apartment — your luxury wellness retreat in Daruvar. This 50 m² apartment on the second floor is a different experience from the standard rooms: a private sauna, jacuzzi, terrace with a view, a separate kitchen and a carefully finished interior make it ideal for couples or small groups who want something extra. Every detail is designed for a calm, relaxing stay. Pets are not allowed.',
      capacityNote: '2+2',
      beds: 'Bedroom 1: 1 double bed\nLiving room: 1 sofa bed\nExtra: 1 single bed (extra bed)',
      amenities: ['WiFi', 'LCD TV', 'Satellite TV', 'Air conditioning', 'Private sauna', 'Jacuzzi', 'Terrace', 'Separate kitchen', 'Parking', 'Heating', 'Towels', 'Linen'],
    },
    'ginko-spa-1': {
      tagline: 'Spacious apartment with a terrace and a separate kitchen.',
      description:
        'Welcome to the Apartment — a spacious 50 m² stay on the second floor in the heart of Daruvar. A terrace with a view, a separate kitchen and a modern interior make it perfect for a relaxing break. This listing does not include access to the private wellness area (sauna and jacuzzi). Pets are not allowed.',
      capacityNote: '2+2',
      beds: 'Bedroom 1: 1 double bed\nLiving room: 1 sofa bed\nExtra: 1 single bed (extra bed)',
      amenities: ['WiFi', 'LCD TV', 'Satellite TV', 'Air conditioning', 'Terrace', 'Separate kitchen', 'Parking', 'Heating', 'Towels', 'Linen'],
    },
  },
  // TODO Faza 6: pravi CS opisi (privremeno EN)
  cs: {
    'ginko-1': {
      tagline: 'Charming and intimate room in the heart of Daruvar.',
      description:
        'Welcome to Ginko 1, a charming and intimate room in the heart of Daruvar. Located at Ulica Tomaša Garika Masaryka 1, it is designed for anyone looking for peace and comfort — and sleeps two comfortably. A spacious bedroom with a double bed, a modern bathroom and a warm atmosphere give you everything you need for a relaxing stay. Pets are welcome on request.',
      capacityNote: '2 guests',
      beds: '1 double bed',
      amenities: ['WiFi', 'LCD TV', 'Air conditioning', 'Parking', 'Heating', 'Towels', 'Linen', 'Pets on request'],
    },
    'ginko-2': {
      tagline: 'Spacious room with a terrace for pleasant evenings.',
      description:
        'Discover Ginko 2, a charming room in the heart of picturesque Daruvar. At Ulica Tomaša Garika Masaryka 1 you are close to the town’s history and character. The room sleeps two comfortably, with space for a third guest when needed. A terrace and satellite TV make this one of our guests’ favourites. Pets are welcome on request.',
      capacityNote: '2+1',
      beds: '1 double bed\n1 single bed (extra bed)',
      amenities: ['WiFi', 'LCD TV', 'Satellite TV', 'Air conditioning', 'Terrace', 'Parking', 'Heating', 'Towels', 'Linen', 'Pets on request'],
    },
    'ginko-3': {
      tagline: 'A private retreat with modern amenities and a terrace.',
      description:
        'Welcome to Ginko 3, your private retreat in the heart of Daruvar. Our charming room at Ulica Tomaša Garika Masaryka 1 offers an authentic Croatian stay in a lively, historic town centre. It is fully equipped with modern amenities and sleeps 2 guests, or up to 3 when needed. The terrace and complete privacy make the stay special. Pets are welcome on request.',
      capacityNote: '2+1',
      beds: '1 double bed\n1 single bed (extra bed)',
      amenities: ['WiFi', 'LCD TV', 'Satellite TV', 'Air conditioning', 'Terrace', 'Parking', 'Heating', 'Towels', 'Linen', 'Pets on request'],
    },
    'ginko-4': {
      tagline: 'Modern room with a terrace and thoughtful amenities.',
      description:
        'Welcome to Ginko 4 — a comfortable room with carefully chosen amenities for a proper rest. In the heart of Daruvar at Ulica Tomaša Garika Masaryka 1, it puts you close to the town’s attractions. Our hosts are dedicated to making your stay memorable. A terrace and private parking are available to all guests. Pets are welcome on request.',
      capacityNote: '2+1',
      beds: '1 double bed\n1 single bed (extra bed)',
      amenities: ['WiFi', 'LCD TV', 'Satellite TV', 'Air conditioning', 'Terrace', 'Parking', 'Heating', 'Towels', 'Linen', 'Pets on request'],
    },
    'ginko-5': {
      tagline: 'Elegant room for a perfect stay in the town centre.',
      description:
        'Welcome to Ginko 5, your stay in the cultural heart of continental Croatia. At Ulica Tomaša Garika Masaryka 1 in Daruvar, this elegant room offers a comfortable, authentic taste of Croatian life. The private, fully furnished space is designed for up to two guests. A terrace and complete privacy are available to all guests. Pets are welcome on request.',
      capacityNote: '2 guests',
      beds: '1 double bed',
      amenities: ['WiFi', 'LCD TV', 'Satellite TV', 'Air conditioning', 'Terrace', 'Parking', 'Heating', 'Towels', 'Linen'],
    },
    'ginko-6': {
      tagline: 'Ideal for solo travellers — a quiet, intimate stay.',
      description:
        'Welcome to Ginko 6, a cosy room in the heart of Daruvar at Ulica Tomaša Garika Masaryka 1. It is designed for solo travellers or business guests looking for a quiet stay. A comfortable bedroom with a single bed, a modern bathroom and a terrace give you everything you need for a peaceful night. Pets are welcome on request.',
      capacityNote: '1 guest',
      beds: '1 single bed',
      amenities: ['WiFi', 'LCD TV', 'Satellite TV', 'Air conditioning', 'Terrace', 'Parking', 'Heating', 'Towels', 'Linen', 'Pets on request'],
    },
    'ginko-spa-2': {
      tagline: 'Private sauna and jacuzzi — a luxury wellness stay.',
      description:
        'Welcome to the Wellness Apartment — your luxury wellness retreat in Daruvar. This 50 m² apartment on the second floor is a different experience from the standard rooms: a private sauna, jacuzzi, terrace with a view, a separate kitchen and a carefully finished interior make it ideal for couples or small groups who want something extra. Every detail is designed for a calm, relaxing stay. Pets are not allowed.',
      capacityNote: '2+2',
      beds: 'Bedroom 1: 1 double bed\nLiving room: 1 sofa bed\nExtra: 1 single bed (extra bed)',
      amenities: ['WiFi', 'LCD TV', 'Satellite TV', 'Air conditioning', 'Private sauna', 'Jacuzzi', 'Terrace', 'Separate kitchen', 'Parking', 'Heating', 'Towels', 'Linen'],
    },
    'ginko-spa-1': {
      tagline: 'Spacious apartment with a terrace and a separate kitchen.',
      description:
        'Welcome to the Apartment — a spacious 50 m² stay on the second floor in the heart of Daruvar. A terrace with a view, a separate kitchen and a modern interior make it perfect for a relaxing break. This listing does not include access to the private wellness area (sauna and jacuzzi). Pets are not allowed.',
      capacityNote: '2+2',
      beds: 'Bedroom 1: 1 double bed\nLiving room: 1 sofa bed\nExtra: 1 single bed (extra bed)',
      amenities: ['WiFi', 'LCD TV', 'Satellite TV', 'Air conditioning', 'Terrace', 'Separate kitchen', 'Parking', 'Heating', 'Towels', 'Linen'],
    },
  },
};
