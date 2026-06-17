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
