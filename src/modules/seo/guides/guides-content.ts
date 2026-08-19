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
  cs: {
    title: 'Průvodce – Daruvar a okolí',
    description:
      'Praktické tipy pro plánování pobytu v Daruvaru: lázně, atrakce, sezóna a přímá rezervace pokojů.',
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
  {
    slug: 'sto-posjetiti-u-daruvaru',
    locale: 'en',
    title: 'What to visit in Daruvar',
    description:
      'A practical guide to Daruvar Spa, Janković Castle, the ginkgo tree and nearby attractions — ideal alongside a stay at Ginko Boutique Rooms.',
    publishedAt: '2026-08-01',
    readingTime: '6 min read',
    keywords: [
      'what to visit in Daruvar',
      'Daruvar attractions',
      'Daruvar Spa',
      'Janković Castle',
      'accommodation Daruvar',
    ],
    coverImage: {
      src: '/images/property/20240504_154454.jpg',
      alt: 'Ginko Boutique Rooms & Wellness – property in Daruvar',
    },
    sections: [
      {
        heading: 'Daruvar Spa and wellness',
        paragraphs: [
          'Daruvar is known for its thermal springs. Daruvar Spa and the Aquae Ballisae aqua park are a few minutes’ walk from the centre — ideal for recovery, a family day, or combining with the private wellness at your accommodation.',
          'If you stay at Ginko Boutique Rooms & Wellness, the spa is literally next door: you can plan a morning session or an evening swim without a long drive.',
        ],
      },
      {
        heading: 'Janković Castle and the ginkgo tree',
        paragraphs: [
          'The park of Count Janković’s castle and the legendary ginkgo biloba sit in the heart of town. A walk through the grounds and a photo of the tree that inspired our name is a pleasant start to your stay.',
          'The Church of the Holy Trinity and the historic town centre are only a few minutes on foot from Ulica Tomaša Garika Masaryka 1.',
        ],
      },
      {
        heading: 'Food and the daily rhythm',
        paragraphs: [
          'Daruvar has a quiet pace: cafés and restaurants in the centre, a local brewery, and short trips towards Papuk or nearby villages. For a longer outing, Zagreb is about an hour and a half by car.',
          'Evenings are calm — which suits guests here for wellness, business or recovery. House rules support quiet hours after 23:00.',
        ],
      },
    ],
  },
  {
    slug: 'kako-planirati-odmor-u-daruvaru',
    locale: 'en',
    title: 'How to plan a stay in Daruvar',
    description:
      'Tips on when to come, how to arrive and where to stay in Daruvar — rooms, apartment or wellness apartment with direct booking.',
    publishedAt: '2026-08-01',
    readingTime: '5 min read',
    keywords: [
      'planning a trip to Daruvar',
      'when to visit Daruvar',
      'accommodation Daruvar',
      'boutique rooms Daruvar',
      'wellness Daruvar',
    ],
    coverImage: {
      src: '/images/hero/exterior-01.webp',
      alt: 'Ginko Boutique Rooms & Wellness – façade in Daruvar',
    },
    sections: [
      {
        heading: 'When to come',
        paragraphs: [
          'Spring and autumn are good for walks, the spa and fewer crowds. Summer brings the aqua park and longer days outdoors. Winter can be appealing for a thermal break and a quieter town.',
          'Weekends in spa season fill up quickly — we recommend booking a room in advance, especially the wellness apartment.',
        ],
      },
      {
        heading: 'How to get here',
        paragraphs: [
          'The nearest major airport is Zagreb (about 120 km). You can reach Daruvar by car, or by bus / train to the town’s railway and bus station (about 500 m from the property).',
          'Free private parking is available at the property, with no need to reserve a space.',
        ],
      },
      {
        heading: 'Room, apartment or wellness',
        paragraphs: [
          'For a shorter stay a room is enough (Ginko 1–6). For more space or cooking, choose the apartment; for a private sauna and jacuzzi — the Wellness Apartment.',
          'Booking direct at ginko-sobe.com means no platform commission, a clear 50% deposit and the balance on arrival. Breakfast and an extra bed can be arranged when you book.',
        ],
      },
    ],
  },
  {
    slug: 'sto-posjetiti-u-daruvaru',
    locale: 'cs',
    title: 'Co navštívit v Daruvaru',
    description:
      'Praktický průvodce Daruvarskými lázněmi, zámkem Jankovićů, stromem ginkgo a okolními atrakcemi — ideální k pobytu v Ginko Boutique Rooms.',
    publishedAt: '2026-08-01',
    readingTime: '6 min',
    keywords: [
      'co navštívit v Daruvaru',
      'Daruvar atrakce',
      'Daruvarské lázně',
      'zámek Jankovićů',
      'ubytování Daruvar',
    ],
    coverImage: {
      src: '/images/property/20240504_154454.jpg',
      alt: 'Ginko Boutique Rooms & Wellness – objekt v Daruvaru',
    },
    sections: [
      {
        heading: 'Daruvarské lázně a wellness',
        paragraphs: [
          'Daruvar je známý termálními prameny. Daruvarské lázně a aquapark Aquae Ballisae jsou pár minut pěšky od centra — ideální na regeneraci, rodinný den nebo v kombinaci se soukromým wellness v ubytování.',
          'Pokud bydlíte v Ginko Boutique Rooms & Wellness, lázně máte doslova vedle: ranní trénink nebo večerní koupání zvládnete bez dlouhé cesty.',
        ],
      },
      {
        heading: 'Zámek Jankovićů a strom ginkgo',
        paragraphs: [
          'Park zámku hraběte Jankoviće a legendární ginkgo biloba leží v samém srdci města. Procházka parkem a fotka stromu, který inspiroval název našeho objektu, je příjemný začátek pobytu.',
          'Kostel Nejsvětější Trojice a historické centrum jsou jen pár minut pěšky od Ulici Tomaša Garika Masaryka 1.',
        ],
      },
      {
        heading: 'Chutě a denní rytmus',
        paragraphs: [
          'Daruvar má klidné tempo: kavárny a restaurace v centru, místní pivovar a kratší výlety směrem na Papuk nebo do okolních vesnic. Na delší výlet je Záhřeb zhruba hodinu a půl autem.',
          'Večery jsou tiché — což vyhovuje hostům na wellness, služební cestu nebo regeneraci. Domovní řád v objektu podporuje noční klid po 23:00.',
        ],
      },
    ],
  },
  {
    slug: 'kako-planirati-odmor-u-daruvaru',
    locale: 'cs',
    title: 'Jak naplánovat pobyt v Daruvaru',
    description:
      'Tipy na termín, příjezd a ubytování v Daruvaru — pokoje, apartmán nebo wellness apartmán s přímou rezervací.',
    publishedAt: '2026-08-01',
    readingTime: '5 min',
    keywords: [
      'plánování pobytu Daruvar',
      'kdy navštívit Daruvar',
      'ubytování Daruvar',
      'boutique pokoje Daruvar',
      'wellness Daruvar',
    ],
    coverImage: {
      src: '/images/hero/exterior-01.webp',
      alt: 'Ginko Boutique Rooms & Wellness – fasáda objektu v Daruvaru',
    },
    sections: [
      {
        heading: 'Kdy přijet',
        paragraphs: [
          'Jaro a podzim se hodí na procházky, lázně a menší provoz. Léto přináší aquapark a delší dny venku. Zima může být lákavá kvůli termálnímu odpočinku a klidnějšímu městu.',
          'Víkendy v lázeňské sezóně se rychle plní — pokoj doporučujeme rezervovat předem, zvlášť wellness apartmán.',
        ],
      },
      {
        heading: 'Jak se sem dostat',
        paragraphs: [
          'Nejbližší větší letiště je Záhřeb (asi 120 km). Do Daruvaru se dostanete autem, nebo autobusem / vlakem na městské nádraží (asi 500 m od objektu).',
          'Soukromé parkování u objektu je zdarma, místo není potřeba rezervovat.',
        ],
      },
      {
        heading: 'Pokoj, apartmán nebo wellness',
        paragraphs: [
          'Na kratší pobyt stačí pokoj (Ginko 1–6). Pro více prostoru nebo vaření zvolte apartmán; pro soukromou saunu a vířivku — Wellness apartmán.',
          'Přímá rezervace na ginko-sobe.com znamená bez provize platformy, jasnou zálohu 50 % a zbytek při příjezdu. Snídani a přistýlku lze domluvit při rezervaci.',
        ],
      },
    ],
  },
];
