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

  // ── New guides (2026-08 SEO sprint) ─────────────────────────────
  {
    slug: 'daruvarske-toplice-vodic',
    locale: 'hr',
    title: 'Daruvarske toplice — praktični vodič',
    description:
      'Što očekivati od Daruvarskih toplica i aqua parka, koliko su daleko od centra i kako složiti dan uz smještaj u Ginko Boutique Rooms.',
    publishedAt: '2026-08-25',
    readingTime: '5 min',
    keywords: [
      'Daruvarske toplice',
      'Aquae Ballisae',
      'toplice Daruvar',
      'smještaj uz toplice',
      'aqua park Daruvar',
    ],
    coverImage: {
      src: '/images/property/20241101_080530.jpg',
      alt: 'Okolica Daruvara blizu Daruvarskih toplica',
    },
    sections: [
      {
        heading: 'Toplice u srcu grada',
        paragraphs: [
          'Daruvarske toplice i aqua park Aquae Ballisae dio su identiteta grada. Termalna voda, bazeni i programi za oporavak privlače goste tijekom cijele godine — ne samo ljeti.',
          'Od Ginko Boutique Rooms (Ulica Tomaša Garika Masaryka 1) do toplica je oko 400 m: većina gostiju ide pješice, bez traženja parkinga.',
        ],
      },
      {
        heading: 'Kako složiti dan',
        paragraphs: [
          'Jutarnji ili prijepodnevni dolazak ostavlja popodne za odmor u sobi ili šetnju perivojem dvorca Janković. Obitelji često kombiniraju aqua park s kraćom pauzom u smještaju.',
          'Ako želite privatni spa navečer, rezervirajte Wellness apartman s saunom i jacuzzijem — logičan nastavak termalnog dana.',
        ],
      },
      {
        heading: 'Smještaj uz toplice',
        paragraphs: [
          'Blizina toplica štedi energiju: možete ići više puta dnevno. Direktna rezervacija na ginko-sobe.com daje jasan depozit i dogovor detalja s objektom.',
          'Više o lokaciji i sobama: vodič „Što posjetiti u Daruvaru“ i landing stranice za smještaj uz toplice.',
        ],
      },
    ],
  },
  {
    slug: 'wellness-vikend-u-daruvaru',
    locale: 'hr',
    title: 'Wellness vikend u Daruvaru',
    description:
      'Ideja za 2–3 noćenja: toplice danju, privatna sauna i jacuzzi navečer, miran centar Daruvara bez gužve obale.',
    publishedAt: '2026-08-25',
    readingTime: '5 min',
    keywords: [
      'wellness vikend Daruvar',
      'sauna Daruvar',
      'jacuzzi smještaj',
      'vikend u Slavoniji',
      'wellness apartman',
    ],
    coverImage: {
      src: '/images/property/20240906_091154.jpg',
      alt: 'Wellness i opuštanje u Ginko smještaju Daruvar',
    },
    sections: [
      {
        heading: 'Zašto Daruvar za wellness vikend',
        paragraphs: [
          'Slavonija nudi sporiji ritam od obale: kraći transferi, manje gužve i fokus na oporavak. Daruvar spaja termalne izvore s kompaktnim centrom grada.',
          'Ginko je baza na nekoliko minuta od toplica — idealno za goste koji žele manje logistike, više odmora.',
        ],
      },
      {
        heading: 'Predloženi ritam (2–3 noći)',
        paragraphs: [
          'Petak: dolazak, kratka šetnja do ginka i dvorca, rani odlazak u krevet. Subota: toplice ili aqua park, popodne odmor, navečer sauna/jacuzzi u Wellness apartmanu. Nedjelja: lagani jutarnji ritam i polazak.',
          'Parovi često biraju Wellness apartman; solo ili poslovni gosti sobu Ginko 1–6 uz dnevni odlazak u toplice.',
        ],
      },
      {
        heading: 'Rezervacija',
        paragraphs: [
          'Vikendi u sezoni toplica brzo se pune. Rezervirajte unaprijed, osobito Wellness apartman. Depozit 50 %, ostatak na dolasku.',
          'Provjerite dostupnost na stranici rezervacije ili landing stranici Wellness Daruvar.',
        ],
      },
    ],
  },
  {
    slug: 'kako-stici-u-daruvar',
    locale: 'hr',
    title: 'Kako stići u Daruvar',
    description:
      'Auto, autobus, vlak ili zračna luka Zagreb — praktični putevi do Daruvara i parking uz Ginko Boutique Rooms.',
    publishedAt: '2026-08-25',
    readingTime: '4 min',
    keywords: [
      'kako stići u Daruvar',
      'Daruvar parking',
      'autobus Daruvar',
      'vlak Daruvar',
      'zračna luka Zagreb Daruvar',
    ],
    coverImage: {
      src: '/images/hero/exterior-01.webp',
      alt: 'Ginko Boutique Rooms & Wellness – dolazak u Daruvar',
    },
    sections: [
      {
        heading: 'Automobilom',
        paragraphs: [
          'Daruvar je dobro povezan cestama iz Zagreba (~120 km) i drugih kontinentalnih gradova. Ulica Tomaša Garika Masaryka 1 nalazi se u centru — navigacija vodi do samog objekta.',
          'Gostima je dostupno besplatno privatno parkiralište uz objekt, bez rezervacije mjesta.',
        ],
      },
      {
        heading: 'Autobus i vlak',
        paragraphs: [
          'Autobusna i željeznička stanica udaljene su oko 500 m — pogodno za goste bez auta. Od stanice do Ginka je kratka šetnja kroz centar.',
          'Provjerite aktualne vozne redove prije putovanja; vikendom i blagdanima frekvencija može biti rjeđa.',
        ],
      },
      {
        heading: 'Zračna luka',
        paragraphs: [
          'Najbliža veća zračna luka je Zagreb (ZAG). Od tamo unajmljeni auto ili transfer do Daruvara traje otprilike sat i pol, ovisno o prometu.',
          'Nakon dolaska možete odmah planirati toplice — smještaj je u istom krugu grada.',
        ],
      },
    ],
  },

  // EN
  {
    slug: 'daruvarske-toplice-vodic',
    locale: 'en',
    title: 'Daruvar Spa — a practical guide',
    description:
      'What to expect from Daruvar Spa and the aqua park, how far they are from the centre, and how to plan a day with a stay at Ginko Boutique Rooms.',
    publishedAt: '2026-08-25',
    readingTime: '5 min read',
    keywords: [
      'Daruvar Spa',
      'Aquae Ballisae',
      'thermal baths Daruvar',
      'accommodation near spa',
      'aqua park Daruvar',
    ],
    coverImage: {
      src: '/images/property/20241101_080530.jpg',
      alt: 'Daruvar surroundings near Daruvar Spa',
    },
    sections: [
      {
        heading: 'A spa in the heart of town',
        paragraphs: [
          'Daruvar Spa and Aquae Ballisae aqua park are part of the town’s identity. Thermal water, pools and recovery programmes draw guests year-round — not only in summer.',
          'From Ginko Boutique Rooms (Ulica Tomaša Garika Masaryka 1) to the spa is about 400 m: most guests walk, with no need to hunt for parking.',
        ],
      },
      {
        heading: 'How to structure the day',
        paragraphs: [
          'A morning or late-morning visit leaves the afternoon for rest in your room or a walk through Janković Castle park. Families often combine the aqua park with a short break at the accommodation.',
          'If you want a private spa in the evening, book the Wellness apartment with sauna and jacuzzi — a natural follow-up to a thermal day.',
        ],
      },
      {
        heading: 'Staying near the spa',
        paragraphs: [
          'Proximity saves energy: you can go more than once a day. Direct booking on ginko-sobe.com gives a clear deposit and arrangements with the property.',
          'More on location and rooms: the “What to visit in Daruvar” guide and the spa-side accommodation landing page.',
        ],
      },
    ],
  },
  {
    slug: 'wellness-vikend-u-daruvaru',
    locale: 'en',
    title: 'A wellness weekend in Daruvar',
    description:
      'A 2–3 night idea: spa by day, private sauna and jacuzzi by night, and a calm Daruvar centre without coastal crowds.',
    publishedAt: '2026-08-25',
    readingTime: '5 min read',
    keywords: [
      'wellness weekend Daruvar',
      'sauna Daruvar',
      'jacuzzi accommodation',
      'weekend in Slavonia',
      'wellness apartment',
    ],
    coverImage: {
      src: '/images/property/20240906_091154.jpg',
      alt: 'Wellness and relaxation at Ginko Daruvar',
    },
    sections: [
      {
        heading: 'Why Daruvar for a wellness weekend',
        paragraphs: [
          'Slavonia offers a slower pace than the coast: shorter transfers, fewer crowds and a focus on recovery. Daruvar combines thermal springs with a compact town centre.',
          'Ginko is a base a few minutes from the spa — ideal for guests who want less logistics and more rest.',
        ],
      },
      {
        heading: 'Suggested rhythm (2–3 nights)',
        paragraphs: [
          'Friday: arrival, a short walk to the ginkgo and castle, early night. Saturday: spa or aqua park, afternoon rest, evening sauna/jacuzzi in the Wellness apartment. Sunday: easy morning and departure.',
          'Couples often choose the Wellness apartment; solo or business guests pick Ginko 1–6 with daytime spa visits.',
        ],
      },
      {
        heading: 'Booking',
        paragraphs: [
          'Spa-season weekends fill quickly. Book ahead, especially the Wellness apartment. 50% deposit, balance on arrival.',
          'Check availability on the booking page or the Wellness Daruvar landing page.',
        ],
      },
    ],
  },
  {
    slug: 'kako-stici-u-daruvar',
    locale: 'en',
    title: 'How to get to Daruvar',
    description:
      'Car, bus, train or Zagreb Airport — practical routes to Daruvar and parking at Ginko Boutique Rooms.',
    publishedAt: '2026-08-25',
    readingTime: '4 min read',
    keywords: [
      'how to get to Daruvar',
      'Daruvar parking',
      'bus Daruvar',
      'train Daruvar',
      'Zagreb Airport Daruvar',
    ],
    coverImage: {
      src: '/images/hero/exterior-01.webp',
      alt: 'Ginko Boutique Rooms & Wellness – arriving in Daruvar',
    },
    sections: [
      {
        heading: 'By car',
        paragraphs: [
          'Daruvar is well connected by road from Zagreb (~120 km) and other inland cities. Ulica Tomaša Garika Masaryka 1 is in the centre — navigation takes you to the property.',
          'Guests have free private parking next to the building, with no need to reserve a spot.',
        ],
      },
      {
        heading: 'Bus and train',
        paragraphs: [
          'The bus and railway stations are about 500 m away — convenient without a car. From the station to Ginko is a short walk through the centre.',
          'Check current timetables before travel; weekends and holidays can be less frequent.',
        ],
      },
      {
        heading: 'Airport',
        paragraphs: [
          'The nearest major airport is Zagreb (ZAG). A rental car or transfer to Daruvar takes roughly an hour and a half, depending on traffic.',
          'After arrival you can head to the spa the same day — accommodation is in the same town loop.',
        ],
      },
    ],
  },

  // CS
  {
    slug: 'daruvarske-toplice-vodic',
    locale: 'cs',
    title: 'Lázně Daruvar — praktický průvodce',
    description:
      'Co očekávat od lázní Daruvar a aquaparku, jak daleko jsou od centra a jak složit den s ubytováním v Ginko Boutique Rooms.',
    publishedAt: '2026-08-25',
    readingTime: '5 min',
    keywords: [
      'lázně Daruvar',
      'Aquae Ballisae',
      'termální lázně Daruvar',
      'ubytování u lázní',
      'aquapark Daruvar',
    ],
    coverImage: {
      src: '/images/property/20241101_080530.jpg',
      alt: 'Okolí Daruvaru blízko lázní',
    },
    sections: [
      {
        heading: 'Lázně v srdci města',
        paragraphs: [
          'Lázně Daruvar a aquapark Aquae Ballisae jsou součástí identity města. Termální voda, bazény a programy regenerace lákají hosty celý rok — nejen v létě.',
          'Od Ginko Boutique Rooms (Ulica Tomaša Garika Masaryka 1) k lázním je asi 400 m: většina hostů jde pěšky.',
        ],
      },
      {
        heading: 'Jak složit den',
        paragraphs: [
          'Ranní nebo dopolední návštěva nechá odpoledne na odpočinek v pokoji nebo procházku zámeckým parkem. Rodiny často kombinují aquapark s krátkou pauzou v ubytování.',
          'Chcete-li soukromé spa večer, rezervujte Wellness apartmán se saunou a vířivkou.',
        ],
      },
      {
        heading: 'Ubytování u lázní',
        paragraphs: [
          'Blízkost šetří energii: můžete jít i víckrát denně. Přímá rezervace na ginko-sobe.com dává jasnou zálohu a domluvu s objektem.',
          'Víc o lokalitě a pokojích: průvodce „Co navštívit v Daruvaru“ a landing stránka ubytování u lázní.',
        ],
      },
    ],
  },
  {
    slug: 'wellness-vikend-u-daruvaru',
    locale: 'cs',
    title: 'Wellness víkend v Daruvaru',
    description:
      'Nápad na 2–3 noci: lázně ve dne, soukromá sauna a vířivka večer, klidné centrum Daruvaru bez davů pobřeží.',
    publishedAt: '2026-08-25',
    readingTime: '5 min',
    keywords: [
      'wellness víkend Daruvar',
      'sauna Daruvar',
      'vířivka ubytování',
      'víkend ve Slavonii',
      'wellness apartmán',
    ],
    coverImage: {
      src: '/images/property/20240906_091154.jpg',
      alt: 'Wellness a odpočinek v ubytování Ginko Daruvar',
    },
    sections: [
      {
        heading: 'Proč Daruvar na wellness víkend',
        paragraphs: [
          'Slavonie nabízí pomalejší rytmus než pobřeží: kratší transfery, méně davů a důraz na regeneraci. Daruvar spojuje termální prameny s kompaktním centrem.',
          'Ginko je základna pár minut od lázní — ideální pro hosty, kteří chtějí méně logistiky a víc odpočinku.',
        ],
      },
      {
        heading: 'Navržený rytmus (2–3 noci)',
        paragraphs: [
          'Pátek: příjezd, krátká procházka ke ginkgu a zámku, brzký spánek. Sobota: lázně nebo aquapark, odpoledne odpočinek, večer sauna/vířivka ve Wellness apartmánu. Neděle: klidné ráno a odjezd.',
          'Páry často volí Wellness apartmán; sólo nebo služební hosté pokoj Ginko 1–6 s denními návštěvami lázní.',
        ],
      },
      {
        heading: 'Rezervace',
        paragraphs: [
          'Víkendy v lázeňské sezóně se rychle plní. Rezervujte předem, zvlášť Wellness apartmán. Záloha 50 %, doplatek při příjezdu.',
          'Dostupnost zkontrolujte na stránce rezervace nebo landing stránce Wellness Daruvar.',
        ],
      },
    ],
  },
  {
    slug: 'kako-stici-u-daruvar',
    locale: 'cs',
    title: 'Jak se dostat do Daruvaru',
    description:
      'Auto, autobus, vlak nebo letiště Záhřeb — praktické cesty do Daruvaru a parkování u Ginko Boutique Rooms.',
    publishedAt: '2026-08-25',
    readingTime: '4 min',
    keywords: [
      'jak se dostat do Daruvaru',
      'Daruvar parkování',
      'autobus Daruvar',
      'vlak Daruvar',
      'letiště Záhřeb Daruvar',
    ],
    coverImage: {
      src: '/images/hero/exterior-01.webp',
      alt: 'Ginko Boutique Rooms & Wellness – příjezd do Daruvaru',
    },
    sections: [
      {
        heading: 'Autem',
        paragraphs: [
          'Daruvar je dobře napojený silnicemi ze Záhřebu (~120 km) i dalších vnitrozemských měst. Ulica Tomaša Garika Masaryka 1 je v centru — navigace vás dovede k objektu.',
          'Hosté mají soukromé parkování zdarma u objektu, místo není potřeba rezervovat.',
        ],
      },
      {
        heading: 'Autobus a vlak',
        paragraphs: [
          'Autobusové a železniční nádraží jsou asi 500 m — vhodné i bez auta. Od nádraží ke Ginku je krátká procházka centrem.',
          'Před cestou zkontrolujte aktuální jízdní řády; o víkendech a svátcích může být spojení řidší.',
        ],
      },
      {
        heading: 'Letiště',
        paragraphs: [
          'Nejbližší větší letiště je Záhřeb (ZAG). Pronajaté auto nebo transfer do Daruvaru trvá zhruba hodinu a půl podle dopravy.',
          'Po příjezdu můžete ještě tentýž den naplánovat lázně — ubytování je ve stejném okruhu města.',
        ],
      },
    ],
  },
];
