import type { AppLocale } from '@/i18n/routing';
import {
  FACILITIES_COPY,
  FACILITY_GROUPS,
  HOUSE_RULES,
  HOUSE_RULES_COPY,
  POPULAR_FACILITIES,
  PROPERTY_CITY,
  PROPERTY_STREET,
  REVIEW_TOPICS,
  REVIEWS_COPY,
  SURROUNDINGS,
  SURROUNDINGS_COPY,
  type FacilityGroup,
  type HouseRuleItem,
  type SurroundingItem,
} from './property-details.config';

export function getValidPropertyLocale(locale: string | null | undefined): AppLocale {
  return locale === 'en' || locale === 'cs' ? locale : 'hr';
}

export function getPropertyCityLine(locale: string | null | undefined): string {
  switch (getValidPropertyLocale(locale)) {
    case 'en':
      return '43500 Daruvar, Croatia';
    case 'cs':
      return '43500 Daruvar, Chorvatsko';
    default:
      return PROPERTY_CITY;
  }
}

export function getPropertyAddressDisplay(locale: string | null | undefined): string {
  return `${PROPERTY_STREET}, ${getPropertyCityLine(locale)}`;
}

const SURROUNDING_LABELS: Record<
  AppLocale,
  Record<keyof typeof SURROUNDINGS, readonly string[]>
> = {
  hr: {
    attractions: SURROUNDINGS.attractions.map((item) => item.label),
    restaurants: SURROUNDINGS.restaurants.map((item) => item.label),
    transport: SURROUNDINGS.transport.map((item) => item.label),
    airports: SURROUNDINGS.airports.map((item) => item.label),
  },
  en: {
    attractions: [
      'Town centre',
      'Ginkgo tree and Count Janković’s castle',
      'Daruvar Spa',
      'Aquae Ballisae aqua park',
    ],
    restaurants: [
      'Fast food · Black & White',
      'Café · Špica',
      'Café · Queen',
      'Restaurant · Terasa',
    ],
    transport: ['Train · Daruvar', 'Bus station · Daruvar'],
    airports: ['Zagreb Airport'],
  },
  cs: {
    attractions: [
      'Centrum města',
      'Strom ginkgo a zámek hraběte Jankoviće',
      'Daruvarské lázně',
      'Aquapark Aquae Ballisae',
    ],
    restaurants: [
      'Fast food · Black & White',
      'Kavárna · Špica',
      'Kavárna · Queen',
      'Restaurace · Terasa',
    ],
    transport: ['Vlak · Daruvar', 'Autobusové nádraží · Daruvar'],
    airports: ['Letiště Záhřeb'],
  },
};

type SurroundingsUi = {
  title: string;
  showMap: string;
  mapTitle: string;
  openInGoogleMaps: string;
  showAvailability: string;
  closeMap: string;
  categories: {
    attractions: string;
    restaurants: string;
    transport: string;
    airports: string;
  };
  disclaimer: string;
};

const SURROUNDINGS_UI: Record<AppLocale, SurroundingsUi> = {
  hr: SURROUNDINGS_COPY,
  en: {
    title: 'The area around the property',
    showMap: 'Show on map',
    mapTitle: 'Property location',
    openInGoogleMaps: 'Open in Google Maps',
    showAvailability: 'Show availability',
    closeMap: 'Close map',
    categories: {
      attractions: 'Nearby attractions',
      restaurants: 'Restaurants and cafés',
      transport: 'Public transport',
      airports: 'Nearest airports',
    },
    disclaimer:
      'Distances are shown as the crow flies. Actual walking or driving distance may vary.',
  },
  cs: {
    title: 'Okolí objektu',
    showMap: 'Zobrazit na mapě',
    mapTitle: 'Poloha objektu',
    openInGoogleMaps: 'Otevřít v Google Maps',
    showAvailability: 'Zobrazit dostupnost',
    closeMap: 'Zavřít mapu',
    categories: {
      attractions: 'Zajímavosti v okolí',
      restaurants: 'Restaurace a kavárny',
      transport: 'Veřejná doprava',
      airports: 'Nejbližší letiště',
    },
    disclaimer:
      'Vzdálenosti jsou vzdušnou čarou. Skutečná vzdálenost pěšky nebo autem se může lišit.',
  },
};

type FacilityCopy = { title: string; items?: readonly string[]; text?: string };

const FACILITY_COPY: Record<AppLocale, Record<string, FacilityCopy>> = {
  hr: Object.fromEntries(
    FACILITY_GROUPS.map((group) => [
      group.id,
      group.type === 'list'
        ? { title: group.title, items: group.items }
        : { title: group.title, text: group.text },
    ]),
  ),
  en: {
    greatForStay: {
      title: 'Great for your stay',
      items: [
        'Private parking',
        'Free Wi-Fi',
        'Wellness area (jacuzzi)',
        'Breakfast restaurant available',
        'Non-smoking rooms',
        'Family rooms',
        'Janković Castle park nearby',
        'Daruvar Spa nearby',
      ],
    },
    bathroom: {
      title: 'Bathroom',
      items: ['Shower', 'Free toiletries', 'Towels', 'Hairdryer', 'Toilet'],
    },
    bedroom: {
      title: 'Bedroom',
      items: ['Linen', 'Wardrobe or closet', 'Alarm clock', 'Yard or town view'],
    },
    kitchen: {
      title: 'Kitchen',
      items: [
        'The apartment has a fully equipped kitchen.',
        'Breakfast is served in the breakfast buffet room.',
      ],
    },
    pets: {
      title: 'Pets',
      text: 'Pets allowed on request. Cleaning fee: €15 / day.',
    },
    media: {
      title: 'Media and technology',
      items: [
        'LCD television',
        'Satellite channels',
        'Air conditioning',
        'Free Wi-Fi throughout the property',
      ],
    },
    parking: {
      title: 'On-site parking',
      text: 'Free private parking is available on site, with no need to reserve a space.',
    },
    services: {
      title: 'Services',
      items: [
        'Daily housekeeping',
        'Reception (limited hours)',
        'Help with trip planning',
      ],
    },
    general: {
      title: 'General',
      items: ['Non-smoking rooms', 'Heating', 'Terrace', 'Shared lounge'],
    },
    languages: {
      title: 'Languages spoken',
      items: ['Croatian', 'English', 'German'],
    },
  },
  cs: {
    greatForStay: {
      title: 'Skvělé pro váš pobyt',
      items: [
        'Soukromé parkování',
        'Wi-Fi zdarma',
        'Wellness zóna (vířivka)',
        'Restaurace se snídaní',
        'Nekuřácké pokoje',
        'Rodinné pokoje',
        'Park zámku Jankovićů v blízkosti',
        'Daruvarské lázně v blízkosti',
      ],
    },
    bathroom: {
      title: 'Koupelna',
      items: ['Sprcha', 'Toaletní potřeby zdarma', 'Ručníky', 'Vysoušeč vlasů', 'Toaleta'],
    },
    bedroom: {
      title: 'Ložnice',
      items: ['Povlečení', 'Šatna nebo skříň', 'Budík', 'Výhled na dvůr nebo město'],
    },
    kitchen: {
      title: 'Kuchyň',
      items: [
        'Apartmán má plně vybavenou kuchyň.',
        'Snídaně se podává v místnosti s bufetem.',
      ],
    },
    pets: {
      title: 'Domácí mazlíčci',
      text: 'Domácí mazlíčci povoleni na vyžádání. Úklid: 15 € / den.',
    },
    media: {
      title: 'Média a technika',
      items: [
        'LCD televize',
        'Satelitní kanály',
        'Klimatizace',
        'Wi-Fi zdarma v celém objektu',
      ],
    },
    parking: {
      title: 'Parkování v objektu',
      text: 'Soukromé parkování u objektu je zdarma, místo není potřeba rezervovat.',
    },
    services: {
      title: 'Služby',
      items: [
        'Denní úklid',
        'Recepce (omezená otevírací doba)',
        'Pomoc s plánováním výletů',
      ],
    },
    general: {
      title: 'Obecné',
      items: ['Nekuřácké pokoje', 'Topení', 'Terasa', 'Společenská místnost'],
    },
    languages: {
      title: 'Obsluha k dispozici v jazycích',
      items: ['Chorvatština', 'Angličtina', 'Němčina'],
    },
  },
};

const POPULAR_LABELS: Record<AppLocale, Record<string, string>> = {
  hr: Object.fromEntries(POPULAR_FACILITIES.map((item) => [item.id, item.label])),
  en: {
    parking: 'Free parking',
    nonSmoking: 'Non-smoking rooms',
    wifi: 'Free Wi-Fi',
  },
  cs: {
    parking: 'Parkování zdarma',
    nonSmoking: 'Nekuřácké pokoje',
    wifi: 'Wi-Fi zdarma',
  },
};

type FacilitiesUi = {
  title: string;
  popularTitle: string;
  showAvailability: string;
};

const FACILITIES_UI: Record<AppLocale, FacilitiesUi> = {
  hr: FACILITIES_COPY,
  en: {
    title: 'Facilities at Ginko Boutique Rooms & Wellness',
    popularTitle: 'Most popular facilities',
    showAvailability: 'Show availability',
  },
  cs: {
    title: 'Vybavení Ginko Boutique Rooms & Wellness',
    popularTitle: 'Nejoblíbenější vybavení',
    showAvailability: 'Zobrazit dostupnost',
  },
};

type HouseRulesUi = {
  title: string;
  showAvailability: string;
};

const HOUSE_RULES_UI: Record<AppLocale, HouseRulesUi> = {
  hr: HOUSE_RULES_COPY,
  en: {
    title: 'House rules',
    showAvailability: 'Show availability',
  },
  cs: {
    title: 'Domovní řád',
    showAvailability: 'Zobrazit dostupnost',
  },
};

const HOUSE_RULES_BY_LOCALE: Record<AppLocale, HouseRuleItem[]> = {
  hr: HOUSE_RULES,
  en: [
    {
      id: 'checkin',
      title: 'Check-in',
      paragraphs: [
        'From 14:00 to 22:00.',
        'Flexible or self check-in is possible with clear instructions from the host.',
      ],
    },
    {
      id: 'checkout',
      title: 'Check-out',
      paragraphs: ['By 10:00.'],
    },
    {
      id: 'cancellation',
      title: 'Cancellation / prepayment',
      paragraphs: [
        'Free cancellation and deposit refund up to 14 days before arrival.',
        'For cancellations within 14 days of arrival the deposit is non-refundable.',
      ],
    },
    {
      id: 'children',
      title: 'Children and beds',
      subsections: [
        {
          title: 'Child policy',
          paragraphs: [
            'Children of all ages are welcome.',
            'Children aged 13 and over are treated as adults for breakfast (full price €15).',
            'Children aged 3 to 12: breakfast €7.50 / person / night.',
            'Children under 2: breakfast free; they stay free if they sleep with their parents (no extra bed).',
          ],
        },
        {
          title: 'Cots and extra beds',
          paragraphs: [
            'Baby crib (on request, subject to availability): €20 / night.',
            'Extra bed (available in Ginko 2, 3, 4 and the apartments): €20 / night — charged automatically when an extra bed is needed (3rd guest in rooms; 4th guest in apartments in addition to the sofa). Children under 2 sleeping with parents are not counted.',
            'Breakfast: ages 0–2 free · ages 3–12 €7.50 / person / night · 13+ and adults €15 / person / night.',
            'A child under 2 sleeping with parents in a double bed is not charged.',
          ],
          highlight: {
            ageRange: '0 – 2 years',
            label: 'Child in a double bed with parents',
            price: 'Free',
          },
        },
      ],
    },
    {
      id: 'age',
      title: 'No age restriction',
      paragraphs: ['There is no minimum age for check-in'],
    },
    {
      id: 'pets',
      title: 'Pets',
      paragraphs: [
        'Pets are allowed if announced in advance when booking.',
        'Pet cleaning fee: €15 / day.',
      ],
    },
    {
      id: 'payment',
      title: 'Payment at booking',
      paragraphs: [
        'The booking is confirmed by paying a 50% deposit when you send the request.',
        'The remaining balance is paid at the property on arrival.',
      ],
    },
    {
      id: 'smoking',
      title: 'Smoking',
      paragraphs: [
        'Smoking is not allowed inside rooms and apartments.',
        'It is allowed only on outdoor terraces and in the yard.',
      ],
    },
    {
      id: 'quiet',
      title: 'Quiet hours',
      paragraphs: ['Guests must not make noise between 23:00 and 07:00.'],
    },
    {
      id: 'parties',
      title: 'Parties',
      paragraphs: ['Parties are not allowed'],
    },
  ],
  cs: [
    {
      id: 'checkin',
      title: 'Příjezd',
      paragraphs: [
        'Od 14:00 do 22:00.',
        'Možný je flexibilní nebo samostatný check-in s jasnými pokyny od hostitele.',
      ],
    },
    {
      id: 'checkout',
      title: 'Odjezd',
      paragraphs: ['Do 10:00.'],
    },
    {
      id: 'cancellation',
      title: 'Storno / platba předem',
      paragraphs: [
        'Bezplatné storno a vrácení zálohy do 14 dnů před příjezdem.',
        'Při stornech do 14 dnů před příjezdem se záloha nevrací.',
      ],
    },
    {
      id: 'children',
      title: 'Děti a lůžka',
      subsections: [
        {
          title: 'Pravidla pro pobyt dětí',
          paragraphs: [
            'Děti všech věkových kategorií jsou vítány.',
            'Děti od 13 let se pro snídani počítají jako dospělí (plná cena 15 €).',
            'Děti 3–12 let: snídaně 7,50 € / osoba / noc.',
            'Děti do 2 let: snídaně zdarma; pobyt zdarma, pokud spí s rodiči (bez přistýlky).',
          ],
        },
        {
          title: 'Dětské postýlky a přistýlky',
          paragraphs: [
            'Dětská postýlka (na vyžádání, dle dostupnosti): 20 € / noc.',
            'Přistýlka (k dispozici v pokojích Ginko 2, 3, 4 a v apartmánech): 20 € / noc — účtuje se automaticky, když je potřeba další lůžko (v pokojích 3. osoba; v apartmánech 4. osoba vedle pohovky). Děti do 2 let spící s rodiči se nepočítají.',
            'Snídaně: 0–2 roky zdarma · 3–12 let 7,50 € / osoba / noc · 13+ a dospělí 15 € / osoba / noc.',
            'Dítě do 2 let, které spí s rodiči v manželské posteli, se neúčtuje.',
          ],
          highlight: {
            ageRange: '0 – 2 roky',
            label: 'Dítě v manželské posteli s rodiči',
            price: 'Zdarma',
          },
        },
      ],
    },
    {
      id: 'age',
      title: 'Bez věkového limitu',
      paragraphs: ['Pro check-in není stanoven věkový limit'],
    },
    {
      id: 'pets',
      title: 'Domácí mazlíčci',
      paragraphs: [
        'Pobyt domácích mazlíčků je povolen po předchozím nahlášení při rezervaci.',
        'Poplatek za úklid: 15 € / den.',
      ],
    },
    {
      id: 'payment',
      title: 'Platba při rezervaci',
      paragraphs: [
        'Rezervace se potvrzuje zaplacením zálohy 50 % při odeslání poptávky.',
        'Zbytek částky se platí v objektu při příjezdu.',
      ],
    },
    {
      id: 'smoking',
      title: 'Kouření',
      paragraphs: [
        'Kouření není povoleno v pokojích a apartmánech.',
        'Je povoleno pouze na venkovních terasách a na dvoře.',
      ],
    },
    {
      id: 'quiet',
      title: 'Noční klid',
      paragraphs: ['Hosté nesmí dělat hluk mezi 23:00 a 07:00.'],
    },
    {
      id: 'parties',
      title: 'Oslavy',
      paragraphs: ['Oslavy nejsou povoleny'],
    },
  ],
};

export type ReviewsUiCopy = {
  title: string;
  showAvailability: string;
  showAll: string;
  hideAll: string;
  featuredTitle: string;
  topicsHint: string;
  reviewCountLabel: string;
  highlights: string;
  readMore: string;
  readLess: string;
  noResults: string;
  googleSource: string;
  viewAllOnGoogle: string;
  unavailable: string;
  prevAria: string;
  nextAria: string;
};

const REVIEWS_UI: Record<AppLocale, ReviewsUiCopy> = {
  hr: {
    ...REVIEWS_COPY,
    prevAria: 'Prethodne recenzije',
    nextAria: 'Sljedeće recenzije',
  },
  en: {
    title: 'Guest reviews',
    showAvailability: 'Show availability',
    showAll: 'Show all reviews',
    hideAll: 'Hide reviews',
    featuredTitle: 'What our guests say',
    topicsHint: 'Select topics to highlight keywords in the reviews:',
    reviewCountLabel: '{count} Google reviews',
    highlights: 'Guests most often praise cleanliness, location and the hosts.',
    readMore: 'Read more',
    readLess: 'Show less',
    noResults: 'No reviews for the selected topics. Try a different filter.',
    googleSource: 'Reviews from Google',
    viewAllOnGoogle: 'See all reviews on Google',
    unavailable: 'Google reviews are currently unavailable.',
    prevAria: 'Previous reviews',
    nextAria: 'Next reviews',
  },
  cs: {
    title: 'Recenze hostů',
    showAvailability: 'Zobrazit dostupnost',
    showAll: 'Zobrazit všechny recenze',
    hideAll: 'Skrýt recenze',
    featuredTitle: 'Co říkají naši hosté',
    topicsHint: 'Vyberte témata pro zvýraznění klíčových slov v recenzích:',
    reviewCountLabel: '{count} recenzí na Google',
    highlights: 'Hosté nejčastěji chválí čistotu, polohu a hostitele.',
    readMore: 'Číst více',
    readLess: 'Skrýt',
    noResults: 'Pro vybraná témata nejsou recenze. Zkuste jiný filtr.',
    googleSource: 'Recenze z Google',
    viewAllOnGoogle: 'Zobrazit všechny recenze na Google',
    unavailable: 'Recenze z Google momentálně nejsou k dispozici.',
    prevAria: 'Předchozí recenze',
    nextAria: 'Další recenze',
  },
};

const REVIEW_TOPIC_LABELS: Record<AppLocale, Record<string, string>> = {
  hr: Object.fromEntries(REVIEW_TOPICS.map((topic) => [topic.id, topic.label])),
  en: {
    domacin: 'Hosts',
    lokacija: 'Location',
    sobe: 'Rooms',
    cisto: 'Cleanliness',
    osoblje: 'Staff',
  },
  cs: {
    domacin: 'Hostitelé',
    lokacija: 'Poloha',
    sobe: 'Pokoje',
    cisto: 'Čistota',
    osoblje: 'Personál',
  },
};

function overlaySurroundings(
  locale: AppLocale,
  key: keyof typeof SURROUNDINGS,
): readonly SurroundingItem[] {
  const labels = SURROUNDING_LABELS[locale][key];
  return SURROUNDINGS[key].map((item, index) => ({
    label: labels[index] ?? item.label,
    distance: item.distance,
  }));
}

export function getSurroundingsCopy(locale: string) {
  const loc = getValidPropertyLocale(locale);
  return {
    ui: SURROUNDINGS_UI[loc],
    items: {
      attractions: overlaySurroundings(loc, 'attractions'),
      restaurants: overlaySurroundings(loc, 'restaurants'),
      transport: overlaySurroundings(loc, 'transport'),
      airports: overlaySurroundings(loc, 'airports'),
    },
  };
}

export function getFacilityGroupsLocalized(locale: string): FacilityGroup[] {
  const loc = getValidPropertyLocale(locale);
  const copy = FACILITY_COPY[loc];
  return FACILITY_GROUPS.map((group) => {
    const localized = copy[group.id];
    if (!localized) return group;
    if (group.type === 'list') {
      return {
        ...group,
        title: localized.title,
        items: localized.items ? [...localized.items] : group.items,
      };
    }
    return {
      ...group,
      title: localized.title,
      text: localized.text ?? group.text,
    };
  });
}

export function getPopularFacilities(locale: string) {
  const loc = getValidPropertyLocale(locale);
  const labels = POPULAR_LABELS[loc];
  return POPULAR_FACILITIES.map((item) => ({
    ...item,
    label: labels[item.id] ?? item.label,
  }));
}

export function getFacilitiesUi(locale: string) {
  return FACILITIES_UI[getValidPropertyLocale(locale)];
}

export function getHouseRules(locale: string): HouseRuleItem[] {
  return HOUSE_RULES_BY_LOCALE[getValidPropertyLocale(locale)];
}

export function getHouseRulesUi(locale: string) {
  return HOUSE_RULES_UI[getValidPropertyLocale(locale)];
}

export function getReviewsUi(locale: string): ReviewsUiCopy {
  return REVIEWS_UI[getValidPropertyLocale(locale)];
}

export function getReviewTopics(locale: string) {
  const loc = getValidPropertyLocale(locale);
  const labels = REVIEW_TOPIC_LABELS[loc];
  return REVIEW_TOPICS.map((topic) => ({
    ...topic,
    label: labels[topic.id] ?? topic.label,
  }));
}
