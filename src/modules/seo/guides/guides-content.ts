import type { AppLocale } from '@/i18n/routing';
import type { GuideArticle } from './guide-types';

export const GUIDE_HUB_BY_LOCALE: Record<
  AppLocale,
  { title: string; description: string }
> = {
  hr: {
    title: 'Vodič – Zadar i okolica',
    description:
      'Praktični savjeti za planiranje boravka, izlete i aktivnosti uz direktnu rezervaciju soba.',
  },
  en: {
    title: 'Guide – Zadar & surroundings',
    description:
      'Practical tips for planning your stay, day trips, and activities with direct room booking.',
  },
  de: {
    title: 'Reiseführer – Zadar & Umgebung',
    description:
      'Praktische Tipps zur Planung des Aufenthalts, Tagesausflügen und Aktivitäten mit direkter Zimmerbuchung.',
  },
} as const;

export const GUIDES: GuideArticle[] = [
  {
    slug: 'sto-posjetiti-u-zadru',
    locale: 'hr',
    title: 'Što posjetiti u Zadru',
    description:
      'Praktični vodič kroz najzanimljivije lokacije, plaže i aktivnosti u Zadru – idealno za planiranje prvog posjeta.',
    publishedAt: '2026-05-01',
    readingTime: '6 min',
    keywords: [
      'što posjetiti u Zadru',
      'Zadar atrakcije',
      'Zadar plaže',
      'izleti Zadar',
      'Hrvatska odmor',
    ],
    coverImage: {
      src: 'https://images.unsplash.com/photo-1555093183-3be7c0f24d89?w=1200&q=80',
      alt: 'Zadar stari grad pogled na more',
    },
    sections: [
      {
        heading: 'Stari grad i rimska baština',
        paragraphs: [
          'Zadar ima jednu od najpotpunijih sačuvanih rimskih urbanih mreža u Dalmaciji. Forum, Crkva sv. Donata i okolne ulice nude šetnju kroz dvije tisuće godina povijesti.',
          'Večernji obilazak starog grada pruža mirnije iskustvo od jutarnjeg – lokali su otvoreni, a gužva je manja.',
        ],
      },
      {
        heading: 'Morske orgulje i Pozdrav Suncu',
        paragraphs: [
          'Dvije najfotografiranije instalacije u gradu smještene su na rivi. Morske orgulje stvaraju glazbu pomoću valova, a Pozdrav Suncu puni se solarnom energijom danju i sjaji noću.',
          'Zalazak sunca gledati s rive jedna je od preporučenih aktivnosti za svaki posjet Zadru.',
        ],
      },
      {
        heading: 'Plaže i blizina prirode',
        paragraphs: [
          'Gradske plaže dostupne su pješice, a za veće plaže s borovima preporuča se kratka vožnja autom ili biciklom prema Bokanjcu ili Zrću na Pagu.',
          'NP Paklenica, jezera Vransko i poluotok Pelješac dostupni su na manje od sat vožnje, što čini Zadar odličnom bazom za dnevne izlete.',
        ],
      },
    ],
  },
  {
    slug: 'kako-planirati-odmor-u-zadru',
    locale: 'hr',
    title: 'Kako planirati odmor u Zadru',
    description:
      'Savjeti za odabir termina, prijevoza i smještaja u Zadru – s posebnim naglaskom na obiteljski i parovima prilagođen boravak.',
    publishedAt: '2026-05-10',
    readingTime: '5 min',
    keywords: [
      'planiranje odmora Zadar',
      'kada posjetiti Zadar',
      'smještaj Zadar',
      'privatne sobe Zadar',
      'Zadar sezona',
    ],
    coverImage: {
      src: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=80',
      alt: 'Zadar luka i jedrilice pogled',
    },
    sections: [
      {
        heading: 'Kada je najljepše doći',
        paragraphs: [
          'Lipanj i rujan nude idealan kompromis: more je toplo, gužva manja nego u kolovozu, a cijene smještaja niže. Za kulturne sadržaje i šetnje, travanj i svibanj su izvrsni.',
          'Srpanj i kolovoz su vrhunac sezone – toplo je i živo, ali i najskuplje i najgužvije. Preporuča se rezervirati smještaj što ranije.',
        ],
      },
      {
        heading: 'Prijevoz i dolazak',
        paragraphs: [
          'Zadar ima međunarodnu zračnu luku s direktnim letovima iz cijele Europe. Autobusne veze s Dubrovnikom, Splitom i Zagrebom su česte i povoljne.',
          'Za izlete po okolici preporučamo vlastiti automobil ili rent-a-car – javni prijevoz prema NP Paklenici i manjim plažama je ograničen.',
        ],
      },
      {
        heading: 'Smještaj: sobe vs. apartman',
        paragraphs: [
          'Za kraće boravke do 3-4 noći, privatne sobe s doručkom pružaju lagodnost bez brige oko opremljene kuhinje i domaćinstva.',
          'Ginko Sobe smještene su blizu centra, a domaćin može savjetovati o skrivenim lokalnim mjestima i izletima koji nisu u turistički vodiču.',
        ],
      },
    ],
  },
];
