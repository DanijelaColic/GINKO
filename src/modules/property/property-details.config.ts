export const PROPERTY_STREET = 'Ulica Tomaša Garika Masaryka 1';
export const PROPERTY_CITY = '43500 Daruvar, Hrvatska';
export const PROPERTY_ADDRESS = `${PROPERTY_STREET}, ${PROPERTY_CITY}`;

/** WGS84 — Ulica Tomaša Garika Masaryka 1, Daruvar (local SEO / LodgingBusiness) */
export const PROPERTY_LATITUDE = 45.594636;
export const PROPERTY_LONGITUDE = 17.222586;

export const PROPERTY_MAP_URL = `https://maps.google.com/?q=${encodeURIComponent(PROPERTY_ADDRESS)}`;

export const PROPERTY_MAP_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(PROPERTY_ADDRESS)}&z=16&output=embed`;

export type SurroundingItem = {
  label: string;
  distance: string;
};

export const SURROUNDINGS = {
  attractions: [
    { label: 'Centar grada', distance: '50 m' },
    { label: 'Stablo Ginka i dvorac grofa Jankovića', distance: '50 m' },
    { label: 'Daruvarske toplice', distance: '400 m' },
    { label: 'Aqua park Aquae Ballisae', distance: '400 m' },
  ],
  restaurants: [
    { label: 'Fast food · Black & White', distance: '100 m' },
    { label: 'Kafić · Špica', distance: '100 m' },
    { label: 'Kavana · Queen', distance: '200 m' },
    { label: 'Restoran · Terasa', distance: '350 m' },
  ],
  transport: [
    { label: 'Vlak · Daruvar', distance: '500 m' },
    { label: 'Autobusna stanica · Daruvar', distance: '500 m' },
  ],
  airports: [{ label: 'Zračna luka Zagreb', distance: '120 km' }],
} as const satisfies Record<string, readonly SurroundingItem[]>;

export const POPULAR_FACILITIES = [
  { id: 'parking', label: 'Besplatno parkiralište' },
  { id: 'nonSmoking', label: 'Sobe za nepušače' },
  { id: 'wifi', label: 'Besplatni WiFi' },
] as const;

export type FacilityGroup =
  | {
      id: string;
      title: string;
      column: 1 | 2 | 3;
      type: 'list';
      items: readonly string[];
    }
  | {
      id: string;
      title: string;
      column: 1 | 2 | 3;
      type: 'text';
      text: string;
    };

export const FACILITY_GROUPS: FacilityGroup[] = [
  {
    id: 'greatForStay',
    title: 'Odlično za vaš boravak',
    column: 1,
    type: 'list',
    items: [
      'Privatno parkiralište',
      'Besplatan Wi-Fi',
      'Wellness zona (jacuzzi)',
      'Dostupan restoran za doručak',
      'Sobe za nepušače',
      'Obiteljske sobe',
      'Park dvorca Janković u blizini',
      'Daruvarske toplice u blizini',
    ],
  },
  {
    id: 'bathroom',
    title: 'Kupaonica',
    column: 1,
    type: 'list',
    items: [
      'Tuš',
      'Besplatni toaletni pribor',
      'Ručnici',
      'Sušilo za kosu',
      'Toalet',
    ],
  },
  {
    id: 'bedroom',
    title: 'Spavaća soba',
    column: 2,
    type: 'list',
    items: [
      'Posteljina',
      'Garderoba ili ormar',
      'Budilica',
      'Pogled na dvorište ili grad',
    ],
  },
  {
    id: 'kitchen',
    title: 'Kuhinja',
    column: 2,
    type: 'list',
    items: [
      'Apartman ima potpuno opremljenu kuhinju.',
      'Doručak se poslužuje u prostoriji za buffet doručak.',
    ],
  },
  {
    id: 'pets',
    title: 'Kućni ljubimci',
    column: 2,
    type: 'text',
    text: 'Kućni ljubimci dozvoljeni na upit u svim sobama i apartmanima. Cijena čišćenja: 15 € / dan.',
  },
  {
    id: 'media',
    title: 'Mediji i tehnologija',
    column: 2,
    type: 'list',
    items: [
      'LCD televizor',
      'Satelitski kanali',
      'Klima-uređaj',
      'Besplatan Wi-Fi u cijelom objektu',
    ],
  },
  {
    id: 'parking',
    title: 'Parkiralište u okviru objekta',
    column: 3,
    type: 'text',
    text: 'Besplatno privatno parkiralište dostupno je na licu mjesta, bez potrebe za rezervacijom.',
  },
  {
    id: 'services',
    title: 'Usluge',
    column: 3,
    type: 'list',
    items: [
      'Dnevno čišćenje',
      'Recepcija (ograničeno radno vrijeme)',
      'Pomoć pri planiranju izleta',
    ],
  },
  {
    id: 'general',
    title: 'Općenito',
    column: 3,
    type: 'list',
    items: [
      'Sobe za nepušače',
      'Grijanje',
      'Terasa',
      'Zajednički lounge',
    ],
  },
  {
    id: 'languages',
    title: 'Usluga dostupna na',
    column: 3,
    type: 'list',
    items: ['Hrvatski', 'Engleski', 'Njemački'],
  },
];

export const SURROUNDINGS_COPY = {
  title: 'Okolica objekta',
  showMap: 'Prikaži na karti',
  mapTitle: 'Lokacija objekta',
  openInGoogleMaps: 'Otvori u Google Maps',
  showAvailability: 'Prikaži raspoloživost',
  closeMap: 'Zatvori kartu',
  categories: {
    attractions: 'Znamenitosti u blizini',
    restaurants: 'Restorani i kafići',
    transport: 'Javni prijevoz',
    airports: 'Najbliže zračne luke',
  },
  disclaimer:
    'Udaljenosti su prikazane u zraku. Stvarna udaljenost hodanja ili vožnje može varirati.',
} as const;

export const FACILITIES_COPY = {
  title: 'Sadržaji u smještajnom objektu Ginko Boutique Rooms & Wellness',
  popularTitle: 'Najpopularniji sadržaji',
  showAvailability: 'Prikaži raspoloživost',
} as const;

export type HouseRuleHighlight = {
  ageRange: string;
  label: string;
  price: string;
};

export type HouseRuleSubsection = {
  title: string;
  paragraphs: readonly string[];
  highlight?: HouseRuleHighlight;
};

export type HouseRuleItem = {
  id: string;
  title: string;
  paragraphs?: readonly string[];
  subsections?: readonly HouseRuleSubsection[];
  link?: { href: string; label: string };
};

export const HOUSE_RULES_COPY = {
  title: 'Kućni red',
  showAvailability: 'Prikaži raspoloživost',
} as const;

export const HOUSE_RULES: HouseRuleItem[] = [
  {
    id: 'checkin',
    title: 'Prijava',
    paragraphs: [
      'Od 14:00 do 22:00 sata.',
      'Moguća je fleksibilna ili samostalna prijava uz jasne upute domaćina.',
    ],
  },
  {
    id: 'checkout',
    title: 'Odjava',
    paragraphs: ['Do 10:00 sati.'],
  },
  {
    id: 'cancellation',
    title: 'Otkazivanje/ plaćanje unaprijed',
    paragraphs: [
      'Besplatno otkazivanje i povrat depozita do 14 dana prije dolaska.',
      'Za otkazivanja unutar 14 dana prije dolaska depozit se ne vraća.',
    ],
  },
  {
    id: 'children',
    title: 'Djeca i kreveti',
    subsections: [
      {
        title: 'Pravila za boravak djece',
        paragraphs: [
          'Djeca svih dobi su dobrodošla.',
          'Djeca starija od 13 godina smatraju se odraslima za doručak (puna cijena 15 €).',
          'Djeca od 3 do 12 godina: doručak 7,50 €/osoba/noć.',
          'Djeca do 2 godine: doručak gratis; borave besplatno ako spavaju s roditeljima (bez dodatnog kreveta).',
        ],
      },
      {
        title: 'Pravila o dječjim krevetima i pomoćnim ležajevima',
        paragraphs: [
          'Dječji krevetić (na upit, ovisno o raspoloživosti): 20 €/noć.',
          'Pomoćni ležaj (dostupan u sobama Ginko 2, 3, 4 i apartmanima): 20 €/noć — automatski se naplaćuje kad treba dodatni ležaj (u sobama za 3. osobu; u apartmanima za 4. osobu uz kauč). Djeca do 2 godine koja spavaju s roditeljima ne broje se.',
          'Doručak: 0–2 godine gratis · 3–12 godina 7,50 €/osoba/noć · 13+ i odrasli 15 €/osoba/noć.',
          'Dijete do 2 godine koje spava s roditeljima u bračnom krevetu ne naplaćuje se.',
        ],
        highlight: {
          ageRange: '0 – 2 godine',
          label: 'Dijete u bračnom krevetu s roditeljima',
          price: 'Besplatno',
        },
      },
    ],
  },
  {
    id: 'age',
    title: 'Bez dobne granice',
    paragraphs: ['Za prijavu nema dobne granice'],
  },
  {
    id: 'pets',
    title: 'Kućni ljubimci',
    paragraphs: [
      'Kućni ljubimci su dozvoljeni na upit u svim sobama i apartmanima.',
      'Cijena čišćenja za kućne ljubimce: 15 € / dan.',
    ],
  },
  {
    id: 'payment',
    title: 'Plaćanje pri rezervaciji',
    paragraphs: [
      'Rezervacija se potvrđuje uplatom depozita od 50% pri slanju upita.',
      'Ostatak iznosa plaća se u smještajnom objektu pri dolasku.',
    ],
  },
  {
    id: 'invoice',
    title: 'R1 račun za tvrtke',
    paragraphs: [
      'R1 izdajemo na podatke iz rezervacije (naziv tvrtke i PDV broj).',
      'Račun šaljemo e-poštom nakon boravka.',
    ],
  },
  {
    id: 'smoking',
    title: 'Pušenje',
    paragraphs: [
      'Pušenje nije dopušteno unutar soba i apartmana.',
      'Dopušteno je isključivo na otvorenim terasama i u dvorištu.',
    ],
  },
  {
    id: 'quiet',
    title: 'Kućni red i mir',
    paragraphs: ['Gosti ne smiju stvarati buku između 23:00 i 07:00 sata.'],
  },
  {
    id: 'parties',
    title: 'Zabave',
    paragraphs: ['Zabave nisu dozvoljene'],
  },
];

// ── Recenzije gostiju (izvor: ginko-sobe.com) ────────────────────────────────

export type ReviewTopicId = 'domacin' | 'lokacija' | 'sobe' | 'cisto' | 'osoblje';

export const REVIEWS_COPY = {
  title: 'Recenzije gostiju',
  showAvailability: 'Prikaži raspoloživost',
  showAll: 'Prikaži sve recenzije',
  hideAll: 'Sakrij recenzije',
  featuredTitle: 'Što kažu naši gosti',
  topicsHint: 'Odaberite teme da biste istaknuli ključne riječi u recenzijama:',
  reviewCountLabel: '{count} recenzija na Googleu',
  highlights: 'Gosti najčešće hvale čistoću, lokaciju i domaćine.',
  readMore: 'Pročitaj više',
  readLess: 'Sakrij',
  noResults: 'Nema recenzija za odabrane teme. Pokušajte s drugim filterom.',
  googleSource: 'Recenzije s Googlea',
  viewAllOnGoogle: 'Pogledajte sve recenzije na Googleu',
  unavailable: 'Recenzije s Googlea trenutno nisu dostupne.',
} as const;

export const REVIEW_TOPIC_KEYWORDS: Record<ReviewTopicId, readonly string[]> = {
  domacin: ['domaćin', 'domaćini', 'domaćina', 'domaćinima', 'domaćinu'],
  lokacija: ['lokacija', 'lokaciji', 'centar', 'centra', 'grada', 'city center', 'park'],
  sobe: ['soba', 'sobe', 'sobu', 'apartman', 'apartmana', 'smještaj', 'room', 'apartments', 'apartment'],
  cisto: ['čist', 'čisti', 'čisto', 'čistoća', 'uredn', 'uredni', 'urednost'],
  osoblje: ['osoblje', 'ljubazn', 'ljubazno', 'profesionaln', 'profesionalno'],
};

export const REVIEW_TOPICS: { id: ReviewTopicId; label: string }[] = [
  { id: 'domacin', label: 'Domaćini' },
  { id: 'lokacija', label: 'Lokacija' },
  { id: 'sobe', label: 'Sobe' },
  { id: 'cisto', label: 'Čistoća' },
  { id: 'osoblje', label: 'Osoblje' },
];

