export const PROPERTY_MAP_URL =
  'https://maps.google.com/?q=Tomaša+Garika+Masaryka+1,+43500+Daruvar,+Hrvatska';

export type SurroundingItem = {
  label: string;
  distance: string;
};

export const SURROUNDINGS = {
  restaurants: [
    { label: 'Restoran · Domino Food', distance: '150 m' },
    { label: 'Kafić · Caffe bar Masaryk', distance: '200 m' },
    { label: 'Restoran · Stari grad', distance: '400 m' },
    { label: 'Kafić · Central', distance: '500 m' },
  ],
  transport: [
    { label: 'Vlak · Daruvar', distance: '800 m' },
    { label: 'Autobusna stanica · Daruvar', distance: '1,1 km' },
    { label: 'Autobus · Centar grada', distance: '450 m' },
  ],
  airports: [
    { label: 'Zračna luka Zagreb', distance: '120 km' },
    { label: 'Zračna luka Osijek', distance: '85 km' },
    { label: 'Zračna luka Ljubljana', distance: '210 km' },
  ],
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
      'Wellness zona (sauna, jacuzzi)',
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
      'Besplatna toaletna papir',
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
      'Hladnjak',
      'Ploča za kuhanje',
      'Pribor za jelo',
      'Čajna kuhinja',
      'Kuhinjski pribor',
    ],
  },
  {
    id: 'pets',
    title: 'Kućni ljubimci',
    column: 2,
    type: 'text',
    text: 'Kućni ljubimci nisu dozvoljeni.',
  },
  {
    id: 'media',
    title: 'Mediji i tehnologija',
    column: 2,
    type: 'list',
    items: ['LCD televizor', 'Satelitski kanali', 'Klima-uređaj'],
  },
  {
    id: 'internet',
    title: 'Internet',
    column: 2,
    type: 'text',
    text: 'Besplatan Wi-Fi dostupan je u cijelom objektu.',
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
      'Wellness zona',
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
      'Lift',
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
  showMap: 'Prikaži kartu',
  showAvailability: 'Prikaži raspoloživost',
  categories: {
    restaurants: 'Restorani i kafići',
    transport: 'Javni prijevoz',
    airports: 'Najbliže zračne luke',
  },
  disclaimer:
    'Udaljenosti su prikazane u zraku. Stvarna udaljenost hodanja ili vožnje može varirati.',
} as const;

export const FACILITIES_COPY = {
  title: 'Sadržaji u smještajnom objektu Ginko Rooms',
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
  subtitle:
    'Objekt Ginko Rooms prima posebne zahtjeve — dodajte zahtjev u sljedećem koraku!',
  showAvailability: 'Prikaži raspoloživost',
} as const;

export const HOUSE_RULES: HouseRuleItem[] = [
  {
    id: 'checkin',
    title: 'Prijava',
    paragraphs: [
      'Od 14:00 do 22:00',
      'Molimo da unaprijed obavijestite objekt o vremenu dolaska.',
    ],
  },
  {
    id: 'checkout',
    title: 'Odjava',
    paragraphs: ['Od 05:00 do 10:00'],
  },
  {
    id: 'cancellation',
    title: 'Otkazivanje/ plaćanje unaprijed',
    paragraphs: [
      'Pravila otkazivanja i plaćanja unaprijed razlikuju se ovisno o vrsti rezervacije. Provjerite',
    ],
    link: { href: '/booking', label: 'uvjete rezervacije' },
  },
  {
    id: 'children',
    title: 'Djeca i kreveti',
    subsections: [
      {
        title: 'Pravila za boravak djece',
        paragraphs: [
          'Djeca svih dobi su dobrodošla.',
          'Djeca starija od 13 godina smatraju se odraslima i naplaćuje se puna cijena.',
          'Djeca od 3 do 12 godina naplaćuju se po sniženoj cijeni — po dogovoru pri rezervaciji.',
          'Djeca do 2 godine borave besplatno (bez dodatnog kreveta).',
        ],
      },
      {
        title: 'Pravila o dječjim krevetima i pomoćnim ležajevima',
        paragraphs: [
          'Dječji kreveti i pomoćni ležajevi dostupni su na upit i ovisno o raspoloživosti.',
        ],
        highlight: {
          ageRange: '0 – 2 godine',
          label: 'Dječji krevet na zahtjev',
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
      'U većini soba kućni ljubimci su dobrodošli na upit. Moguća je dodatna naknada.',
      'U sobi Ginko SPA 2 kućni ljubimci nisu dozvoljeni.',
    ],
  },
  {
    id: 'payment',
    title: 'Plaćanje pri rezervaciji',
    paragraphs: [
      'Rezervacija se potvrđuje uplatom depozita od 30% pri slanju upita.',
      'Ostatak iznosa plaća se najkasnije 14 dana prije dolaska.',
    ],
  },
  {
    id: 'smoking',
    title: 'Za pušače',
    paragraphs: ['Pušenje nije dozvoljeno'],
  },
  {
    id: 'parties',
    title: 'Zabave',
    paragraphs: ['Zabave nisu dozvoljene'],
  },
];

// ── Recenzije gostiju (izvor: ginko-sobe.com) ────────────────────────────────

export type ReviewTopicId = 'domacin' | 'lokacija' | 'sobe' | 'cisto' | 'osoblje';

export type GuestReview = {
  id: string;
  author: string;
  country: string;
  property: string;
  date: string;
  text: string;
  rating: number;
  topics: readonly ReviewTopicId[];
};

export const REVIEWS_COPY = {
  title: 'Recenzije gostiju',
  showAvailability: 'Prikaži raspoloživost',
  showAll: 'Prikaži sve recenzije',
  hideAll: 'Sakrij recenzije',
  featuredTitle: 'Što kažu naši gosti',
  topicsHint: 'Odaberite teme da biste pročitali recenzije:',
  reviewCountLabel: '{count} recenzija gostiju',
  overallScore: 5.0,
  overallLabel: 'Izvrsno',
  highlights: 'Gosti najčešće hvale čistoću, lokaciju i domaćine.',
  readMore: 'Pročitaj više',
  readLess: 'Sakrij',
  noResults: 'Nema recenzija za odabrane teme. Pokušajte s drugim filterom.',
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

export const GUEST_REVIEWS: GuestReview[] = [
  {
    id: 'danijel',
    author: 'Danijel',
    country: 'Hrvatska',
    property: 'Ginko 6',
    date: '2026-06-14',
    text: 'Ljep i čisti prostor. Ljubazno osoblje. Svaka pohvala!',
    rating: 5.0,
    topics: ['cisto', 'osoblje'],
  },
  {
    id: 'turek',
    author: 'Turek',
    country: 'Hrvatska',
    property: 'Ginko 2',
    date: '2026-06-14',
    text:
      'Domaćin ljubazan, uslužan, dobro organiziran. Lokacija odlična! Soba uredna, kompletno opremljena, WC u sklopu. Sve identično kao i na fotografiji na bookingu.',
    rating: 5.0,
    topics: ['domacin', 'lokacija', 'sobe'],
  },
  {
    id: 'filip',
    author: 'Filip Simunović',
    country: 'Hrvatska',
    property: 'Ginko 4',
    date: '2026-06-06',
    text:
      'Smještaj se nalazi par minuta od centra grada u tihoj ulici. Tijekom boravka komunikacija s domaćinim je bila brza te upute oko pronalaska sobe su jasne. Soba je klimatizirana te prostrana. Jedina zamjerka su klizna vrata na kupaonici koja se teže otvaraju i zatvaraju, ali sve u svemu nismo imali drugih zamjerki. Dočekali su nas uredni ručnici te kreveti. Velik plus je ogroman ormar tako da sve kofere možete staviti unutra tijekom boravka. Preporuke!',
    rating: 5.0,
    topics: ['lokacija', 'sobe', 'cisto', 'domacin'],
  },
  {
    id: 'taiwo',
    author: 'Taiwo Elizabeth',
    country: 'Hrvatska',
    property: 'Ginko 8',
    date: '2026-05-28',
    text:
      'Great new apartments. Apartments look modern, room is decorated in mahagony wood finish with adjustable LED lights, front doors and apartment doors are opened with a pin so no need to carry keys or cards. Bed is soft and comfortable. Only two minutes walk to the city center but area is really quiet, next to a park.',
    rating: 5.0,
    topics: ['sobe', 'lokacija'],
  },
  {
    id: 'mato',
    author: 'Mato',
    country: 'Hrvatska',
    property: 'Ginko 7',
    date: '2026-05-25',
    text: 'Smještaj i lokacija odlični. Osoblje prijatno i profesionalno.',
    rating: 5.0,
    topics: ['lokacija', 'osoblje'],
  },
  {
    id: 'nikolina',
    author: 'Nikolina',
    country: 'Hrvatska',
    property: 'Ginko 8',
    date: '2026-05-24',
    text:
      'Ljubaznost domaćina, urednost i čistoća apartmana, blizina centra grada, parkova.',
    rating: 5.0,
    topics: ['domacin', 'cisto', 'lokacija'],
  },
];
