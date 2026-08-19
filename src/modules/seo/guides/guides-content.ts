import type { AppLocale } from '@/i18n/routing';
import type { GuideArticle } from './guide-types';

export const GUIDE_HUB_BY_LOCALE: Record<
  AppLocale,
  { title: string; description: string }
> = {
  hr: {
    title: 'Vodič – Daruvar i okolica',
    description:
      'Praktični savjeti za planiranje boravka u Daruvaru: toplice, atrakcije, sezona i direktna rezervacija soba.',
  },
  en: {
    title: 'Guide – Daruvar & surroundings',
    description:
      'Practical tips for planning your stay in Daruvar: thermal baths, attractions, season and direct room booking.',
  },
  de: {
    title: 'Reiseführer – Daruvar & Umgebung',
    description:
      'Praktische Tipps für Ihren Aufenthalt in Daruvar: Thermen, Sehenswürdigkeiten, Saison und direkte Zimmerbuchung.',
  },
} as const;

export const GUIDES: GuideArticle[] = [
  {
    slug: 'sto-posjetiti-u-daruvaru',
    locale: 'hr',
    title: 'Što posjetiti u Daruvaru',
    description:
      'Praktični vodič kroz Daruvarske toplice, dvorac Janković, stablo ginka i okolne atrakcije – idealno uz boravak u Ginko Boutique Rooms.',
    publishedAt: '2026-08-01',
    readingTime: '6 min',
    keywords: [
      'što posjetiti u Daruvaru',
      'Daruvar atrakcije',
      'Daruvarske toplice',
      'dvorac Janković',
      'smještaj Daruvar',
    ],
    coverImage: {
      src: '/images/property/20240504_154454.jpg',
      alt: 'Ginko Boutique Rooms & Wellness – objekt u Daruvaru',
    },
    sections: [
      {
        heading: 'Daruvarske toplice i wellness',
        paragraphs: [
          'Daruvar je poznat po termalnim izvorima. Daruvarske toplice i aqua park Aquae Ballisae nalaze se na nekoliko minuta hoda od centra – idealno za oporavak, obiteljski dan ili kombinaciju s privatnim wellnessom u smještaju.',
          'Ako boravite u Ginko Boutique Rooms & Wellness, toplice su doslovno u susjedstvu: možete planirati jutarnji trening ili večernje kupanje bez duge vožnje.',
        ],
      },
      {
        heading: 'Dvorac Janković i stablo ginka',
        paragraphs: [
          'Park dvorca grofa Jankovića i legendarni ginkgo biloba u samom su srcu grada. Šetnja perivojem i fotografiranje stabla koje je nadahnulo ime našeg objekta ugodan su uvod u boravak.',
          'Crkva Sv. Trojstva i povijesna jezgra grada udaljene su svega nekoliko minuta pješice od Ulica Tomaša Garika Masaryka 1.',
        ],
      },
      {
        heading: 'Okusi i dnevni ritam',
        paragraphs: [
          'Daruvar nudi miran ritam: kafići i restorani u centru, lokalna pivovara i kraće izlete prema Papuku ili okolnim selima. Za duže izlete Zagreb je oko sat i pol vožnje.',
          'Večeri su mirne – što odgovara gostima koji dolaze na wellness, poslovni put ili oporavak. Kućni red u objektu podržava tišinu nakon 23:00.',
        ],
      },
    ],
  },
  {
    slug: 'kako-planirati-odmor-u-daruvaru',
    locale: 'hr',
    title: 'Kako planirati odmor u Daruvaru',
    description:
      'Savjeti za odabir termina, dolaska i smještaja u Daruvaru – sobe, apartman ili wellness apartman uz direktnu rezervaciju.',
    publishedAt: '2026-08-01',
    readingTime: '5 min',
    keywords: [
      'planiranje odmora Daruvar',
      'kada posjetiti Daruvar',
      'smještaj Daruvar',
      'boutique sobe Daruvar',
      'wellness Daruvar',
    ],
    coverImage: {
      src: '/images/hero/exterior-01.webp',
      alt: 'Ginko Boutique Rooms & Wellness – fasada objekta u Daruvaru',
    },
    sections: [
      {
        heading: 'Kada doći',
        paragraphs: [
          'Proljeće i jesen pogodni su za šetnje, toplice i manje gužve. Ljeto donosi aqua park i duže dane na otvorenom. Zima može biti privlačna zbog termalnog odmora i mirnijeg grada.',
          'Vikendi u sezoni toplica brzo se pune – preporučujemo rezervirati sobu unaprijed, osobito wellness apartman.',
        ],
      },
      {
        heading: 'Kako stići',
        paragraphs: [
          'Najbliža veća zračna luka je Zagreb (oko 120 km). Do Daruvara se stiže automobilom ili autobusom / vlakom do željezničke i autobusne stanice u gradu (oko 500 m od objekta).',
          'Besplatno privatno parkiralište dostupno je uz objekt, bez potrebe za rezervacijom mjesta.',
        ],
      },
      {
        heading: 'Soba, apartman ili wellness',
        paragraphs: [
          'Za kraći boravak dovoljna je soba (Ginko 1–6). Za više prostora ili kuhanje birajte apartman; za privatnu saunu i jacuzzi – Wellness apartman.',
          'Direktna rezervacija na ginko-sobe.com znači bez provizije platforme, jasan depozit od 50 % i ostatak na dolasku. Doručak i pomoćni ležaj mogu se dogovoriti pri rezervaciji.',
        ],
      },
    ],
  },
];
