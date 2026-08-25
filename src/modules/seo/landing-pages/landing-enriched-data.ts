import type { LandingEnrichedMap } from './landing-enriched-types';

const HERO = '/images/hero/exterior-01.webp';
const IMG_PROPERTY = '/images/property/20240504_154454.jpg';
const IMG_WELLNESS = '/images/property/20240906_091154.jpg';
const IMG_TOWN = '/images/property/20241101_080530.jpg';
const IMG_ROOM = '/images/property/20250405_085232.jpg';

export const LANDING_ENRICHED: LandingEnrichedMap = {
  'sobe-daruvar': {
    hr: {
      eyebrow: 'Daruvar · Boutique sobe',
      heroImage: {
        src: HERO,
        alt: 'Ginko Boutique Rooms & Wellness – fasada objekta u Daruvaru',
      },
      highlights: [
        'Nekoliko minuta hoda do Daruvarskih toplica',
        'WiFi, klima i besplatan privatni parking',
        'Direktna rezervacija bez provizije platforme',
      ],
      sections: [
        {
          heading: 'Zašto birati sobe u centru Daruvara',
          paragraphs: [
            'Daruvar je miran spa grad: toplice, aqua park, dvorac Janković i stablo ginka u istom krugu. Sobe u centru štede vrijeme na prijevozu i omogućuju lagan ritam — jutarnji dolazak na tretman, popodne u gradu, večer u miru.',
            'Ginko Boutique Rooms & Wellness nalazi se na Ulici Tomaša Garika Masaryka 1. Odavde ste blizu restorana, kafića i javnog prijevoza, a ipak u privatnom boutique smještaju.',
          ],
        },
        {
          heading: 'Što očekivati od Ginko soba',
          paragraphs: [
            'U ponudi su sobe Ginko 1–6 te wellness apartmani s privatnom saunom i jacuzzijem. Svaka jedinica ima klimu, WiFi i pristup zajedničkim prostorima; gosti dobivaju besplatno parkiralište uz objekt.',
            'Direktna rezervacija na ginko-sobe.com znači jasan depozit od 50 % i ostatak na dolasku — bez skrivenih naknada posrednika.',
          ],
        },
        {
          heading: 'Idealno za wellness, poslovni put ili vikend',
          paragraphs: [
            'Gosti dolaze zbog toplica, oporavka, kraćeg poslovnog putovanja ili opuštenog vikenda u Slavoniji. Kućni red podržava tišinu nakon 23:00.',
            'Za više prostora ili kuhanje birajte apartman; za privatni wellness — Wellness apartman. Detalje i dostupnost provjerite na stranici soba.',
          ],
        },
      ],
      activitiesSectionTitle: 'Što raditi u blizini',
      activities: [
        {
          title: 'Daruvarske toplice',
          description:
            'Termalni bazeni i aqua park Aquae Ballisae na nekoliko minuta hoda od objekta.',
          image: IMG_TOWN,
          imageAlt: 'Okolica Daruvara uz Ginko smještaj',
        },
        {
          title: 'Dvorac Janković i ginkgo',
          description:
            'Park i legendarno stablo ginka — inspiracija za ime objekta — u srcu grada.',
          image: IMG_PROPERTY,
          imageAlt: 'Ginko Boutique Rooms u centru Daruvara',
        },
        {
          title: 'Wellness u objektu',
          description:
            'Za privatnu saunu i jacuzzi rezervirajte Wellness apartman uz direktnu rezervaciju.',
          image: IMG_WELLNESS,
          imageAlt: 'Wellness i opuštanje u Ginko smještaju',
        },
        {
          title: 'Boutique sobe',
          description:
            'Pažljivo uređene sobe s modernim sadržajima, klimom i WiFi-jem za ugodan boravak.',
          image: IMG_ROOM,
          imageAlt: 'Boutique soba u Ginko Daruvar',
        },
      ],
      midCtaTitle: 'Želite termin koji vama odgovara?',
      midCtaBody:
        'Pregledajte dostupnost soba i rezervirajte direktno — brži dogovor detalja i bez provizija platformi.',
      midCtaPrimaryLabel: 'Rezervacija',
      midCtaGalleryLabel: 'Galerija',
      faqSectionTitle: 'Često postavljana pitanja',
      faqs: [
        {
          question: 'Koliko su daleko Daruvarske toplice?',
          answer:
            'Toplice i aqua park udaljeni su oko 400 m — nekoliko minuta hoda od objekta na Masarykovoj ulici.',
        },
        {
          question: 'Je li parking uključen?',
          answer:
            'Da. Besplatno privatno parkiralište dostupno je gostima uz objekt, bez posebne rezervacije mjesta.',
        },
        {
          question: 'Kako rezervirati sobu?',
          answer:
            'Odaberite datume na stranici rezervacije ili dostupnosti, pošaljite upit i potvrdite depozit od 50 %. Ostatak plaćate na dolasku.',
        },
        {
          question: 'Imate li sobe s wellnessom?',
          answer:
            'Da. Wellness apartmani uključuju privatnu saunu i jacuzzi. Kapacitet i cijene vidite na stranici soba.',
        },
      ],
      reservationIntro:
        'Odaberite datume, broj gostiju i sobu — rezervacija ide direktno s objektom, bez posrednika.',
      guidesBlockTitle: 'Vodič za boravak u Daruvaru',
      guidesBlockIntro:
        'Praktični savjeti za planiranje: atrakcije, sezona i kako složiti odmor uz toplice.',
    },
    en: {
      eyebrow: 'Daruvar · Boutique rooms',
      heroImage: {
        src: HERO,
        alt: 'Ginko Boutique Rooms & Wellness – property exterior in Daruvar',
      },
      highlights: [
        'A few minutes’ walk to Daruvar Spa',
        'WiFi, air conditioning and free private parking',
        'Direct booking with no platform commission',
      ],
      sections: [
        {
          heading: 'Why choose rooms in central Daruvar',
          paragraphs: [
            'Daruvar is a calm spa town: thermal baths, aqua park, Janković Castle and the ginkgo tree within a short radius. Staying in the centre saves travel time and keeps a gentle pace — morning treatments, afternoon in town, quiet evenings.',
            'Ginko Boutique Rooms & Wellness is at Ulica Tomaša Garika Masaryka 1. You are close to cafés, restaurants and public transport, yet in private boutique accommodation.',
          ],
        },
        {
          heading: 'What to expect from Ginko rooms',
          paragraphs: [
            'We offer rooms Ginko 1–6 plus wellness apartments with a private sauna and jacuzzi. Every unit has AC, WiFi and access to shared spaces; guests get free parking next to the property.',
            'Booking direct on ginko-sobe.com means a clear 50% deposit and the balance on arrival — no hidden middleman fees.',
          ],
        },
        {
          heading: 'Ideal for wellness, business or a weekend',
          paragraphs: [
            'Guests come for the spa, recovery, short business trips or a relaxed weekend in Slavonia. House rules support quiet after 23:00.',
            'For more space or cooking, choose an apartment; for private wellness — the Wellness apartment. Check details and availability on the rooms page.',
          ],
        },
      ],
      activitiesSectionTitle: 'What to do nearby',
      activities: [
        {
          title: 'Daruvar Spa',
          description:
            'Thermal pools and Aquae Ballisae aqua park a few minutes on foot from the property.',
          image: IMG_TOWN,
          imageAlt: 'Daruvar surroundings near Ginko',
        },
        {
          title: 'Janković Castle & ginkgo',
          description:
            'The park and legendary ginkgo tree — the inspiration for our name — in the heart of town.',
          image: IMG_PROPERTY,
          imageAlt: 'Ginko Boutique Rooms in central Daruvar',
        },
        {
          title: 'On-site wellness',
          description:
            'For a private sauna and jacuzzi, book a Wellness apartment with direct reservation.',
          image: IMG_WELLNESS,
          imageAlt: 'Wellness at Ginko accommodation',
        },
        {
          title: 'Boutique rooms',
          description:
            'Thoughtfully furnished rooms with modern amenities, AC and WiFi for a comfortable stay.',
          image: IMG_ROOM,
          imageAlt: 'Boutique room at Ginko Daruvar',
        },
      ],
      midCtaTitle: 'Want dates that work for you?',
      midCtaBody:
        'Check room availability and book directly — faster detail agreements and no platform commissions.',
      midCtaPrimaryLabel: 'Book',
      midCtaGalleryLabel: 'Gallery',
      faqSectionTitle: 'Frequently asked questions',
      faqs: [
        {
          question: 'How far is Daruvar Spa?',
          answer:
            'The spa and aqua park are about 400 m away — a few minutes’ walk from the property on Masaryk Street.',
        },
        {
          question: 'Is parking included?',
          answer:
            'Yes. Free private parking is available for guests next to the property, with no need to reserve a spot.',
        },
        {
          question: 'How do I book a room?',
          answer:
            'Pick dates on the booking or availability page, send your request and confirm the 50% deposit. Pay the balance on arrival.',
        },
        {
          question: 'Do you have wellness rooms?',
          answer:
            'Yes. Wellness apartments include a private sauna and jacuzzi. See capacity and rates on the rooms page.',
        },
      ],
      reservationIntro:
        'Choose dates, guests and a room — booking goes directly with the property, no middleman.',
      guidesBlockTitle: 'Guide to staying in Daruvar',
      guidesBlockIntro:
        'Practical tips for planning: attractions, season and how to combine a stay with the spa.',
    },
    cs: {
      eyebrow: 'Daruvar · Boutique pokoje',
      heroImage: {
        src: HERO,
        alt: 'Ginko Boutique Rooms & Wellness – fasáda objektu v Daruvaru',
      },
      highlights: [
        'Pár minut chůze k lázním Daruvar',
        'WiFi, klimatizace a soukromé parkování zdarma',
        'Přímá rezervace bez provize platforem',
      ],
      sections: [
        {
          heading: 'Proč zvolit pokoje v centru Daruvaru',
          paragraphs: [
            'Daruvar je klidné lázeňské město: termální bazény, aquapark, zámek Janković a strom ginkgo v krátkém okruhu. Pokoje v centru šetří čas na dopravě a umožňují pohodový rytmus.',
            'Ginko Boutique Rooms & Wellness je na Ulici Tomaša Garika Masaryka 1 — blízko kaváren, restaurací i MHD, přitom v soukromém boutique ubytování.',
          ],
        },
        {
          heading: 'Co očekávat od pokojů Ginko',
          paragraphs: [
            'Nabízíme pokoje Ginko 1–6 a wellness apartmány se soukromou saunou a jacuzzi. Každá jednotka má klimatizaci, WiFi a přístup ke společným prostorám; hosté mají parkování zdarma.',
            'Přímá rezervace na ginko-sobe.com znamená jasnou zálohu 50 % a doplatek při příjezdu — bez skrytých poplatků zprostředkovatelů.',
          ],
        },
        {
          heading: 'Ideální pro wellness, služební cestu nebo víkend',
          paragraphs: [
            'Hosté přijíždějí kvůli lázním, regeneraci, krátké služební cestě nebo odpočinkovému víkendu ve Slavonii. Domovní řád podporuje ticho po 23:00.',
            'Pro více prostoru nebo vaření zvolte apartmán; pro soukromý wellness — Wellness apartmán. Detaily a dostupnost najdete na stránce pokojů.',
          ],
        },
      ],
      activitiesSectionTitle: 'Co dělat v okolí',
      activities: [
        {
          title: 'Lázně Daruvar',
          description:
            'Termální bazény a aquapark Aquae Ballisae pár minut chůze od objektu.',
          image: IMG_TOWN,
          imageAlt: 'Okolí Daruvaru u ubytování Ginko',
        },
        {
          title: 'Zámek Janković a ginkgo',
          description:
            'Park a legendární strom ginkgo — inspirace pro název objektu — v srdci města.',
          image: IMG_PROPERTY,
          imageAlt: 'Ginko Boutique Rooms v centru Daruvaru',
        },
        {
          title: 'Wellness v objektu',
          description:
            'Pro soukromou saunu a jacuzzi rezervujte Wellness apartmán s přímou rezervací.',
          image: IMG_WELLNESS,
          imageAlt: 'Wellness v ubytování Ginko',
        },
        {
          title: 'Boutique pokoje',
          description:
            'Pečlivě zařízené pokoje s moderním vybavením, klimatizací a WiFi.',
          image: IMG_ROOM,
          imageAlt: 'Boutique pokoj v Ginko Daruvar',
        },
      ],
      midCtaTitle: 'Chcete termín, který vám vyhovuje?',
      midCtaBody:
        'Prohlédněte dostupnost pokojů a rezervujte přímo — rychlejší domluva detailů a bez provizí platforem.',
      midCtaPrimaryLabel: 'Rezervace',
      midCtaGalleryLabel: 'Galerie',
      faqSectionTitle: 'Často kladené otázky',
      faqs: [
        {
          question: 'Jak daleko jsou lázně Daruvar?',
          answer:
            'Lázně a aquapark jsou asi 400 m — pár minut chůze od objektu na Masarykově ulici.',
        },
        {
          question: 'Je parkování v ceně?',
          answer:
            'Ano. Soukromé parkování zdarma je k dispozici hostům u objektu, bez nutnosti rezervovat místo.',
        },
        {
          question: 'Jak rezervovat pokoj?',
          answer:
            'Vyberte data na stránce rezervace nebo dostupnosti, odešlete poptávku a potvrďte zálohu 50 %. Doplatek platíte při příjezdu.',
        },
        {
          question: 'Máte pokoje s wellness?',
          answer:
            'Ano. Wellness apartmány zahrnují soukromou saunu a jacuzzi. Kapacitu a ceny najdete na stránce pokojů.',
        },
      ],
      reservationIntro:
        'Zvolte data, počet hostů a pokoj — rezervace probíhá přímo s objektem, bez prostředníka.',
      guidesBlockTitle: 'Průvodce pobytem v Daruvaru',
      guidesBlockIntro:
        'Praktické tipy pro plánování: atrakce, sezóna a jak spojit pobyt s lázněmi.',
    },
  },

  'privatni-smjestaj-daruvar': {
    hr: {
      eyebrow: 'Daruvar · Privatni smještaj',
      heroImage: {
        src: IMG_PROPERTY,
        alt: 'Privatni smještaj Ginko Boutique Rooms u Daruvaru',
      },
      highlights: [
        'Boutique sobe i wellness apartmani, ne hotelski corridor',
        'Direktna komunikacija s domaćinom',
        'Jasni uvjeti: 50 % depozit, ostatak na dolasku',
      ],
      sections: [
        {
          heading: 'Što znači privatni smještaj u Daruvaru',
          paragraphs: [
            'Privatni smještaj nudi više kontrole nad ritmom boravka nego veliki hotel: manje gužve, osobniji kontakt i fokus na udobnost sobe ili apartmana. U Daruvaru je to osobito praktično uz toplice — dolazite i odlazite kad vama odgovara.',
            'Ginko Boutique Rooms & Wellness spaja boutique doživljaj s pouzdanim sadržajima: WiFi, klima, parking i opcija privatnog wellnessa.',
          ],
        },
        {
          heading: 'Zašto rezervirati direktno',
          paragraphs: [
            'Direktna rezervacija znači da dogovor ide s objektom — bez Booking ili Airbnb provizije koja se često prelije na cijenu. Depozit od 50 % potvrđuje termin; ostatak plaćate u smještaju.',
            'Lakše dogovarate doručak, pomoćni ležaj, kasniji check-in ili posebne potrebe jer komunicirate s domaćinom, ne s call centrom platforme.',
          ],
        },
        {
          heading: 'Za koga je Ginko dobar izbor',
          paragraphs: [
            'Parovi na wellness vikendu, gosti na oporavku uz toplice, solo ili poslovni putnici, te manje obitelji koje žele miran centar Daruvara.',
            'Ako vam treba više prostora ili kuhanje, pogledajte apartmane; za saunu i jacuzzi — Wellness apartman. Usporedite sobe i rezervirajte termin koji vam odgovara.',
          ],
        },
      ],
      activitiesSectionTitle: 'Prednosti lokacije',
      activities: [
        {
          title: 'Centar grada',
          description:
            'Restorani, kafići i park dvorca na nekoliko minuta hoda — privatni smještaj bez izolacije.',
          image: IMG_TOWN,
          imageAlt: 'Centar Daruvara blizu Ginko smještaja',
        },
        {
          title: 'Toplice uz vrata',
          description:
            'Daruvarske toplice ~400 m — idealna baza za dnevne tretmane i večernji povratak.',
          image: IMG_PROPERTY,
          imageAlt: 'Lokacija Ginko uz daruvarske atrakcije',
        },
        {
          title: 'Privatni wellness',
          description:
            'Wellness apartmani s saunom i jacuzzijem za goste koji žele privatnost nakon toplica.',
          image: IMG_WELLNESS,
          imageAlt: 'Privatni wellness u Ginko apartmanu',
        },
        {
          title: 'Jednostavan dolazak',
          description:
            'Autobusna i željeznička stanica ~500 m; Zagreb zračna luka ~120 km; parking besplatan.',
          image: IMG_ROOM,
          imageAlt: 'Dolazak i smještaj u Ginko Daruvar',
        },
      ],
      midCtaTitle: 'Spremni za direktnu rezervaciju?',
      midCtaBody:
        'Provjerite dostupnost, odaberite sobu ili apartman i rezervirajte bez posrednika — jasni uvjeti od prvog koraka.',
      midCtaPrimaryLabel: 'Rezerviraj',
      midCtaGalleryLabel: 'Galerija',
      faqSectionTitle: 'Često postavljana pitanja',
      faqs: [
        {
          question: 'Je li ovo hotel ili privatni smještaj?',
          answer:
            'Ginko je boutique privatni smještaj — sobe i apartmani s osobnim pristupom, ne veliki hotelski lanac.',
        },
        {
          question: 'Zašto ne rezervirati preko Booking.com?',
          answer:
            'Možete, ali direktna rezervacija na ginko-sobe.com izbjegava proviziju platforme i olakšava dogovor detalja s domaćinom.',
        },
        {
          question: 'Koji su uvjeti otkazivanja?',
          answer:
            'Depozit je 50 % pri rezervaciji. Detalje besplatnog otkazivanja i rokove potvrđujemo uz rezervaciju (obično 14 dana unaprijed).',
        },
        {
          question: 'Može li se dogovoriti doručak?',
          answer:
            'Da — doručak i pomoćni ležaj mogu se dogovoriti pri rezervaciji, ovisno o dostupnosti.',
        },
      ],
      reservationIntro:
        'Pošaljite upit s datumima i brojem gostiju. Potvrda ide e-mailom uz link za depozit.',
      guidesBlockTitle: 'Vodič prije dolaska',
      guidesBlockIntro:
        'Pročitajte što posjetiti i kako planirati odmor u Daruvaru prije nego rezervirate termin.',
    },
    en: {
      eyebrow: 'Daruvar · Private accommodation',
      heroImage: {
        src: IMG_PROPERTY,
        alt: 'Private accommodation at Ginko Boutique Rooms in Daruvar',
      },
      highlights: [
        'Boutique rooms and wellness apartments — not a hotel corridor',
        'Direct communication with the host',
        'Clear terms: 50% deposit, balance on arrival',
      ],
      sections: [
        {
          heading: 'What private accommodation in Daruvar means',
          paragraphs: [
            'Private stays give more control over your pace than a large hotel: fewer crowds, more personal contact, and a focus on room or apartment comfort. In Daruvar that pairs well with the spa — come and go on your schedule.',
            'Ginko Boutique Rooms & Wellness combines a boutique feel with reliable amenities: WiFi, AC, parking and optional private wellness.',
          ],
        },
        {
          heading: 'Why book directly',
          paragraphs: [
            'Direct booking means you arrange with the property — no Booking or Airbnb commission that often ends up in the price. A 50% deposit secures the dates; pay the rest on arrival.',
            'It is easier to arrange breakfast, an extra bed, late check-in or special needs because you talk to the host, not a platform call centre.',
          ],
        },
        {
          heading: 'Who Ginko suits',
          paragraphs: [
            'Couples on a wellness weekend, guests recovering at the spa, solo or business travellers, and smaller families who want a quiet Daruvar centre.',
            'Need more space or a kitchen? See the apartments. Want a sauna and jacuzzi? Choose a Wellness apartment. Compare rooms and book the dates that fit.',
          ],
        },
      ],
      activitiesSectionTitle: 'Location advantages',
      activities: [
        {
          title: 'Town centre',
          description:
            'Restaurants, cafés and the castle park a few minutes away — private stay without isolation.',
          image: IMG_TOWN,
          imageAlt: 'Daruvar centre near Ginko',
        },
        {
          title: 'Spa at the door',
          description:
            'Daruvar Spa ~400 m — a practical base for daytime treatments and evening return.',
          image: IMG_PROPERTY,
          imageAlt: 'Ginko location near Daruvar attractions',
        },
        {
          title: 'Private wellness',
          description:
            'Wellness apartments with sauna and jacuzzi for guests who want privacy after the spa.',
          image: IMG_WELLNESS,
          imageAlt: 'Private wellness in a Ginko apartment',
        },
        {
          title: 'Easy arrival',
          description:
            'Bus and train stations ~500 m; Zagreb airport ~120 km; parking free.',
          image: IMG_ROOM,
          imageAlt: 'Arrival and stay at Ginko Daruvar',
        },
      ],
      midCtaTitle: 'Ready to book directly?',
      midCtaBody:
        'Check availability, pick a room or apartment and book without a middleman — clear terms from the first step.',
      midCtaPrimaryLabel: 'Book',
      midCtaGalleryLabel: 'Gallery',
      faqSectionTitle: 'Frequently asked questions',
      faqs: [
        {
          question: 'Is this a hotel or private accommodation?',
          answer:
            'Ginko is boutique private accommodation — rooms and apartments with a personal approach, not a large hotel chain.',
        },
        {
          question: 'Why not book via Booking.com?',
          answer:
            'You can, but booking direct on ginko-sobe.com avoids platform commission and makes it easier to arrange details with the host.',
        },
        {
          question: 'What are the cancellation terms?',
          answer:
            'Deposit is 50% at booking. Free-cancellation details and deadlines are confirmed with your reservation (typically 14 days ahead).',
        },
        {
          question: 'Can breakfast be arranged?',
          answer:
            'Yes — breakfast and an extra bed can be arranged at booking, subject to availability.',
        },
      ],
      reservationIntro:
        'Send a request with dates and guest count. Confirmation comes by email with a deposit link.',
      guidesBlockTitle: 'Guide before you arrive',
      guidesBlockIntro:
        'Read what to visit and how to plan a Daruvar stay before you lock in dates.',
    },
    cs: {
      eyebrow: 'Daruvar · Soukromé ubytování',
      heroImage: {
        src: IMG_PROPERTY,
        alt: 'Soukromé ubytování Ginko Boutique Rooms v Daruvaru',
      },
      highlights: [
        'Boutique pokoje a wellness apartmány — ne hotelová chodba',
        'Přímá komunikace s hostitelem',
        'Jasné podmínky: záloha 50 %, doplatek při příjezdu',
      ],
      sections: [
        {
          heading: 'Co znamená soukromé ubytování v Daruvaru',
          paragraphs: [
            'Soukromé ubytování dává víc kontroly nad rytmem pobytu než velký hotel: méně davů, osobnější kontakt a důraz na pohodlí pokoje nebo apartmánu. V Daruvaru to skvěle ladí s lázněmi.',
            'Ginko Boutique Rooms & Wellness spojuje boutique atmosféru se spolehlivým zázemím: WiFi, klimatizace, parkování a možnost soukromého wellness.',
          ],
        },
        {
          heading: 'Proč rezervovat přímo',
          paragraphs: [
            'Přímá rezervace znamená dohodu s objektem — bez Booking nebo Airbnb provize, která často končí v ceně. Záloha 50 % potvrzuje termín; zbytek platíte při příjezdu.',
            'Snáz domluvíte snídani, přistýlku, pozdní check-in nebo speciální požadavky, protože mluvíte s hostitelem, ne s call centrem platformy.',
          ],
        },
        {
          heading: 'Pro koho je Ginko vhodné',
          paragraphs: [
            'Páry na wellness víkend, hosté na regeneraci u lázní, sólo nebo služební cestující a menší rodiny, které chtějí klidné centrum Daruvaru.',
            'Potřebujete víc prostoru nebo kuchyň? Podívejte se na apartmány. Chcete saunu a jacuzzi? Zvolte Wellness apartmán.',
          ],
        },
      ],
      activitiesSectionTitle: 'Výhody lokality',
      activities: [
        {
          title: 'Centrum města',
          description:
            'Restaurace, kavárny a zámecký park pár minut chůze — soukromé ubytování bez izolace.',
          image: IMG_TOWN,
          imageAlt: 'Centrum Daruvaru blízko Ginko',
        },
        {
          title: 'Lázně za dveřmi',
          description:
            'Lázně Daruvar ~400 m — ideální základna pro denní procedury a večerní návrat.',
          image: IMG_PROPERTY,
          imageAlt: 'Lokace Ginko u atrakcí Daruvaru',
        },
        {
          title: 'Soukromý wellness',
          description:
            'Wellness apartmány se saunou a jacuzzi pro hosty, kteří chtějí soukromí po lázních.',
          image: IMG_WELLNESS,
          imageAlt: 'Soukromý wellness v apartmánu Ginko',
        },
        {
          title: 'Snadný příjezd',
          description:
            'Autobus a vlak ~500 m; letiště Záhřeb ~120 km; parkování zdarma.',
          image: IMG_ROOM,
          imageAlt: 'Příjezd a pobyt v Ginko Daruvar',
        },
      ],
      midCtaTitle: 'Připraveni rezervovat přímo?',
      midCtaBody:
        'Zkontrolujte dostupnost, vyberte pokoj nebo apartmán a rezervujte bez prostředníka — jasné podmínky od prvního kroku.',
      midCtaPrimaryLabel: 'Rezervovat',
      midCtaGalleryLabel: 'Galerie',
      faqSectionTitle: 'Často kladené otázky',
      faqs: [
        {
          question: 'Je to hotel, nebo soukromé ubytování?',
          answer:
            'Ginko je boutique soukromé ubytování — pokoje a apartmány s osobním přístupem, ne velký hotelový řetězec.',
        },
        {
          question: 'Proč nererezervovat přes Booking.com?',
          answer:
            'Můžete, ale přímá rezervace na ginko-sobe.com se vyhne provizi platformy a usnadní domluvu detailů s hostitelem.',
        },
        {
          question: 'Jaké jsou podmínky storna?',
          answer:
            'Záloha je 50 % při rezervaci. Detaily bezplatného storna a lhůty potvrzujeme spolu s rezervací (obvykle 14 dní předem).',
        },
        {
          question: 'Lze domluvit snídani?',
          answer:
            'Ano — snídani a přistýlku lze domluvit při rezervaci, podle dostupnosti.',
        },
      ],
      reservationIntro:
        'Pošlete poptávku s daty a počtem hostů. Potvrzení přijde e-mailem s odkazem na zálohu.',
      guidesBlockTitle: 'Průvodce před příjezdem',
      guidesBlockIntro:
        'Přečtěte si, co navštívit a jak naplánovat pobyt v Daruvaru, než rezervujete termín.',
    },
  },

  'wellness-daruvar': {
    hr: {
      eyebrow: 'Daruvar · Wellness',
      heroImage: {
        src: IMG_WELLNESS,
        alt: 'Wellness apartman Ginko – privatna sauna i jacuzzi u Daruvaru',
      },
      highlights: [
        'Privatna sauna i jacuzzi u Wellness apartmanu',
        'Toplice ~400 m — termalni dan + večernji oporavak',
        'Direktna rezervacija bez platformskih naknada',
      ],
      sections: [
        {
          heading: 'Wellness koji ostaje privatno',
          paragraphs: [
            'Nakon dana u Daruvarskim toplicama želite mir, ne gužvu u hotelskom spa centru. Ginko Wellness apartman daje saunu i jacuzzi unutar vaše jedinice — ritam birate sami.',
            'U istom objektu dostupne su i boutique sobe ako putujete u grupi: netko bira wellness, netko klasičnu sobu.',
          ],
        },
        {
          heading: 'Kombinacija toplica i privatnog spa',
          paragraphs: [
            'Jutro ili popodne u toplicama i aqua parku, navečer sauna i jacuzzi u apartmanu. Blizina (~400 m) štedi vrijeme i energiju.',
            'Za kraći wellness vikend dovoljna su 2–3 noćenja; u sezoni toplica termine rezervirajte unaprijed.',
          ],
        },
        {
          heading: 'Što je uključeno',
          paragraphs: [
            'Wellness apartman uključuje privatnu saunu, jacuzzi, klimu, WiFi, terasu i pristup kuhinji — uz besplatno parkiralište.',
            'Depozit 50 % pri rezervaciji; ostatak na dolasku. Doručak i pomoćni ležaj dogovaraju se po potrebi.',
          ],
        },
      ],
      activitiesSectionTitle: 'Wellness ritam u Daruvaru',
      activities: [
        {
          title: 'Daruvarske toplice',
          description: 'Termalni bazeni i tretmani na nekoliko minuta hoda od objekta.',
          image: IMG_TOWN,
          imageAlt: 'Okolica toplica uz Ginko smještaj',
        },
        {
          title: 'Privatna sauna',
          description: 'Sauna u Wellness apartmanu — bez rezervacije termina u zajedničkom spa-u.',
          image: IMG_WELLNESS,
          imageAlt: 'Privatni wellness u Ginko apartmanu',
        },
        {
          title: 'Jacuzzi',
          description: 'Oporavak nakon toplica ili šetnje perivojem dvorca Janković.',
          image: IMG_PROPERTY,
          imageAlt: 'Opuštanje nakon dana u Daruvaru',
        },
        {
          title: 'Boutique baza',
          description: 'Centar grada, parking i miran kućni red nakon 23:00.',
          image: IMG_ROOM,
          imageAlt: 'Boutique smještaj Ginko Daruvar',
        },
      ],
      midCtaTitle: 'Želite Wellness apartman?',
      midCtaBody:
        'Provjerite dostupnost Wellness apartmana i rezervirajte direktno — jasni uvjeti, bez posrednika.',
      midCtaPrimaryLabel: 'Rezervacija',
      midCtaGalleryLabel: 'Galerija',
      faqSectionTitle: 'Često postavljana pitanja',
      faqs: [
        {
          question: 'Je li sauna i jacuzzi u sobi ili zajednički?',
          answer:
            'U Wellness apartmanu (ginko-spa-2) sauna i jacuzzi su privatni — rezervirani za vašu jedinicu tijekom boravka.',
        },
        {
          question: 'Mogu li rezervirati običnu sobu i koristiti wellness?',
          answer:
            'Privatni wellness dolazi uz Wellness apartman. Ostale sobe nemaju privatnu saunu/jacuzzi; toplice su i dalje blizu.',
        },
        {
          question: 'Koliko gostiju prima Wellness apartman?',
          answer:
            'Kapacitet ovisi o konfiguraciji (obično 2+ s opcijom pomoćnog ležaja). Detalje vidite na stranici soba.',
        },
        {
          question: 'Je li wellness pogodan uz toplice?',
          answer:
            'Da — gosti često kombiniraju termalne bazene danju i privatni spa navečer. Toplice su ~400 m od objekta.',
        },
      ],
      reservationIntro:
        'Odaberite datume za Wellness apartman ili sobu — potvrda ide e-mailom uz depozit.',
      guidesBlockTitle: 'Vodič za wellness boravak',
      guidesBlockIntro: 'Savjeti za planiranje odmora uz toplice i privatni spa u Daruvaru.',
    },
    en: {
      eyebrow: 'Daruvar · Wellness',
      heroImage: {
        src: IMG_WELLNESS,
        alt: 'Ginko Wellness apartment – private sauna and jacuzzi in Daruvar',
      },
      highlights: [
        'Private sauna and jacuzzi in the Wellness apartment',
        'Spa ~400 m — thermal day + evening recovery',
        'Direct booking with no platform fees',
      ],
      sections: [
        {
          heading: 'Wellness that stays private',
          paragraphs: [
            'After a day at Daruvar Spa you want quiet, not a crowded hotel spa floor. The Ginko Wellness apartment puts a sauna and jacuzzi inside your unit — you set the pace.',
            'Boutique rooms are available in the same property if you travel as a group: some guests choose wellness, others a classic room.',
          ],
        },
        {
          heading: 'Spa plus private recovery',
          paragraphs: [
            'Morning or afternoon at the baths and aqua park, evening sauna and jacuzzi in the apartment. The short walk (~400 m) saves time and energy.',
            'A 2–3 night wellness weekend is enough for many guests; book ahead in spa season.',
          ],
        },
        {
          heading: 'What is included',
          paragraphs: [
            'The Wellness apartment includes a private sauna, jacuzzi, AC, WiFi, terrace and kitchen access — plus free parking.',
            '50% deposit at booking; balance on arrival. Breakfast and an extra bed can be arranged if needed.',
          ],
        },
      ],
      activitiesSectionTitle: 'A wellness rhythm in Daruvar',
      activities: [
        {
          title: 'Daruvar Spa',
          description: 'Thermal pools and treatments a few minutes on foot from the property.',
          image: IMG_TOWN,
          imageAlt: 'Spa area near Ginko accommodation',
        },
        {
          title: 'Private sauna',
          description: 'Sauna in the Wellness apartment — no shared spa slot booking.',
          image: IMG_WELLNESS,
          imageAlt: 'Private wellness in a Ginko apartment',
        },
        {
          title: 'Jacuzzi',
          description: 'Recover after the spa or a walk through Janković Castle park.',
          image: IMG_PROPERTY,
          imageAlt: 'Relaxation after a day in Daruvar',
        },
        {
          title: 'Boutique base',
          description: 'Town centre, parking and quiet house rules after 23:00.',
          image: IMG_ROOM,
          imageAlt: 'Boutique stay at Ginko Daruvar',
        },
      ],
      midCtaTitle: 'Want the Wellness apartment?',
      midCtaBody:
        'Check Wellness apartment availability and book direct — clear terms, no middleman.',
      midCtaPrimaryLabel: 'Book',
      midCtaGalleryLabel: 'Gallery',
      faqSectionTitle: 'Frequently asked questions',
      faqs: [
        {
          question: 'Are the sauna and jacuzzi in-room or shared?',
          answer:
            'In the Wellness apartment (ginko-spa-2) the sauna and jacuzzi are private — reserved for your unit during the stay.',
        },
        {
          question: 'Can I book a regular room and still use wellness?',
          answer:
            'Private wellness comes with the Wellness apartment. Other rooms do not include a private sauna/jacuzzi; the public spa is still nearby.',
        },
        {
          question: 'How many guests does the Wellness apartment sleep?',
          answer:
            'Capacity depends on configuration (typically 2+ with an optional extra bed). See details on the rooms page.',
        },
        {
          question: 'Does wellness work well with the spa?',
          answer:
            'Yes — guests often combine thermal pools by day and private spa in the evening. The spa is ~400 m from the property.',
        },
      ],
      reservationIntro:
        'Pick dates for the Wellness apartment or a room — confirmation by email with deposit.',
      guidesBlockTitle: 'Guide for a wellness stay',
      guidesBlockIntro: 'Tips for planning a spa-focused stay with private recovery in Daruvar.',
    },
    cs: {
      eyebrow: 'Daruvar · Wellness',
      heroImage: {
        src: IMG_WELLNESS,
        alt: 'Wellness apartmán Ginko – soukromá sauna a vířivka v Daruvaru',
      },
      highlights: [
        'Soukromá sauna a vířivka ve Wellness apartmánu',
        'Lázně ~400 m — termální den + večerní regenerace',
        'Přímá rezervace bez poplatků platforem',
      ],
      sections: [
        {
          heading: 'Wellness, který zůstává soukromý',
          paragraphs: [
            'Po dni v lázních Daruvar chcete klid, ne přeplněné hotelové spa. Ginko Wellness apartmán má saunu a vířivku ve vaší jednotce — tempo volíte vy.',
            'Ve stejném objektu jsou i boutique pokoje, pokud cestujete ve skupině.',
          ],
        },
        {
          heading: 'Lázně plus soukromá regenerace',
          paragraphs: [
            'Dopoledne nebo odpoledne v lázních a aquaparku, večer sauna a vířivka v apartmánu. Krátká cesta (~400 m) šetří čas.',
            'Na wellness víkend často stačí 2–3 noci; v lázeňské sezóně rezervujte předem.',
          ],
        },
        {
          heading: 'Co je v ceně',
          paragraphs: [
            'Wellness apartmán zahrnuje soukromou saunu, vířivku, klimatizaci, WiFi, terasu a přístup do kuchyně — plus parkování zdarma.',
            'Záloha 50 % při rezervaci; doplatek při příjezdu. Snídani a přistýlku lze domluvit dle potřeby.',
          ],
        },
      ],
      activitiesSectionTitle: 'Wellness rytmus v Daruvaru',
      activities: [
        {
          title: 'Lázně Daruvar',
          description: 'Termální bazény a procedury pár minut chůze od objektu.',
          image: IMG_TOWN,
          imageAlt: 'Okolí lázní u ubytování Ginko',
        },
        {
          title: 'Soukromá sauna',
          description: 'Sauna ve Wellness apartmánu — bez rezervace slotu ve společném spa.',
          image: IMG_WELLNESS,
          imageAlt: 'Soukromý wellness v apartmánu Ginko',
        },
        {
          title: 'Vířivka',
          description: 'Regenerace po lázních nebo procházce zámeckým parkem.',
          image: IMG_PROPERTY,
          imageAlt: 'Odpočinek po dni v Daruvaru',
        },
        {
          title: 'Boutique základna',
          description: 'Centrum města, parkování a klidný domovní řád po 23:00.',
          image: IMG_ROOM,
          imageAlt: 'Boutique ubytování Ginko Daruvar',
        },
      ],
      midCtaTitle: 'Chcete Wellness apartmán?',
      midCtaBody:
        'Zkontrolujte dostupnost Wellness apartmánu a rezervujte přímo — jasné podmínky, bez prostředníka.',
      midCtaPrimaryLabel: 'Rezervace',
      midCtaGalleryLabel: 'Galerie',
      faqSectionTitle: 'Často kladené otázky',
      faqs: [
        {
          question: 'Je sauna a vířivka v pokoji, nebo společná?',
          answer:
            'Ve Wellness apartmánu (ginko-spa-2) jsou sauna a vířivka soukromé — vyhrazené pro vaši jednotku po dobu pobytu.',
        },
        {
          question: 'Mohu rezervovat běžný pokoj a využívat wellness?',
          answer:
            'Soukromý wellness je u Wellness apartmánu. Ostatní pokoje nemají soukromou saunu/vířivku; veřejné lázně jsou stále blízko.',
        },
        {
          question: 'Kolik hostů ubytuje Wellness apartmán?',
          answer:
            'Kapacita závisí na konfiguraci (obvykle 2+ s možností přistýlky). Detaily najdete na stránce pokojů.',
        },
        {
          question: 'Hodí se wellness k lázním?',
          answer:
            'Ano — hosté často kombinují termální bazény ve dne a soukromé spa večer. Lázně jsou ~400 m od objektu.',
        },
      ],
      reservationIntro:
        'Zvolte data pro Wellness apartmán nebo pokoj — potvrzení e-mailem se zálohou.',
      guidesBlockTitle: 'Průvodce wellness pobytem',
      guidesBlockIntro: 'Tipy na plánování pobytu u lázní se soukromým spa v Daruvaru.',
    },
  },

  'smjestaj-uz-daruvarske-toplice': {
    hr: {
      eyebrow: 'Daruvar · Uz toplice',
      heroImage: {
        src: IMG_TOWN,
        alt: 'Smještaj uz Daruvarske toplice – Ginko Boutique Rooms',
      },
      highlights: [
        '~400 m do Daruvarskih toplica i aqua parka',
        'Centar grada — šetnja umjesto transfera',
        'Sobe i wellness apartmani s parkingom',
      ],
      sections: [
        {
          heading: 'Zašto smještaj blizu toplica mijenja ritam',
          paragraphs: [
            'Kad su toplice prioritet, udaljenost od smještaja određuje koliko energije trošite na dolaske i odlaske. Ginko je u centru Daruvara, oko 400 m od Daruvarskih toplica i aqua parka Aquae Ballisae.',
            'Možete planirati jutarnji tretman, povratak na odmor i drugi odlazak navečer — bez traženja parkinga na drugom kraju grada.',
          ],
        },
        {
          heading: 'Što dobivate uz lokaciju',
          paragraphs: [
            'Boutique sobe i apartmani s WiFi-jem, klimom i besplatnim parkingom. Za privatni spa nakon toplica — Wellness apartman s saunom i jacuzzijem.',
            'Direktna rezervacija znači jasan depozit i komunikaciju s objektom, korisno kad usklađujete termine tretmana i check-in.',
          ],
        },
        {
          heading: 'Praktično za obitelji i parove',
          paragraphs: [
            'Obitelji cijene kratku šetnju do aqua parka; parovi miran povratak u boutique sobu. Kućni red podržava tišinu nakon 23:00.',
            'Zagreb je ~120 km; autobusna i željeznička stanica ~500 m — pogodno i bez auta.',
          ],
        },
      ],
      activitiesSectionTitle: 'Uz toplice i još malo',
      activities: [
        {
          title: 'Daruvarske toplice',
          description: 'Termalni kompleks i aqua park na nekoliko minuta hoda.',
          image: IMG_TOWN,
          imageAlt: 'Blizina Daruvarskih toplica',
        },
        {
          title: 'Park i ginkgo',
          description: 'Dvorac Janković i stablo ginka — 50 m od centra, lagana šetnja.',
          image: IMG_PROPERTY,
          imageAlt: 'Centar Daruvara uz Ginko',
        },
        {
          title: 'Privatni wellness',
          description: 'Sauna i jacuzzi u apartmanu nakon dana u toplicama.',
          image: IMG_WELLNESS,
          imageAlt: 'Wellness uz smještaj kod toplica',
        },
        {
          title: 'Sobe za kraći boravak',
          description: 'Ginko 1–6 za vikend uz toplice bez nepotrebnog prostora.',
          image: IMG_ROOM,
          imageAlt: 'Soba blizu Daruvarskih toplica',
        },
      ],
      midCtaTitle: 'Planirate boravak uz toplice?',
      midCtaBody:
        'Odaberite datume i sobu u blizini toplica — rezervacija direktno, bez posrednika.',
      midCtaPrimaryLabel: 'Rezervacija',
      midCtaGalleryLabel: 'Galerija',
      faqSectionTitle: 'Često postavljana pitanja',
      faqs: [
        {
          question: 'Koliko točno do ulaza u toplice?',
          answer:
            'Oko 400 m / nekoliko minuta hoda od Ulica Tomaša Garika Masaryka 1. Točno vrijeme ovisi o tempu i odabranom ulazu.',
        },
        {
          question: 'Treba li auto za dolazak do toplica?',
          answer:
            'Ne — većina gostiju ide pješice. Parking uz objekt ostaje besplatan ako ipak vozite.',
        },
        {
          question: 'Je li smještaj pogodan za aqua park s djecom?',
          answer:
            'Da. Kratka udaljenost pojednostavljuje dolaske s djecom; sobe i apartmani pokrivaju različite kapacitete.',
        },
        {
          question: 'Mogu li spojiti toplice i privatni spa?',
          answer:
            'Da — rezervirajte Wellness apartman za saunu i jacuzzi nakon termalnog dana.',
        },
      ],
      reservationIntro:
        'Pošaljite upit s datumima — potvrda i depozit stižu e-mailom.',
      guidesBlockTitle: 'Vodič uz toplice',
      guidesBlockIntro: 'Što posjetiti i kako složiti dan između toplica i centra Daruvara.',
    },
    en: {
      eyebrow: 'Daruvar · Near the spa',
      heroImage: {
        src: IMG_TOWN,
        alt: 'Accommodation near Daruvar Spa – Ginko Boutique Rooms',
      },
      highlights: [
        '~400 m to Daruvar Spa and the aqua park',
        'Town centre — walk instead of transfers',
        'Rooms and wellness apartments with parking',
      ],
      sections: [
        {
          heading: 'Why staying near the spa changes your day',
          paragraphs: [
            'When the spa is the priority, distance from your room decides how much energy you spend commuting. Ginko sits in central Daruvar, about 400 m from Daruvar Spa and Aquae Ballisae aqua park.',
            'You can plan a morning treatment, return to rest, and go again in the evening — without hunting for parking across town.',
          ],
        },
        {
          heading: 'What you get with the location',
          paragraphs: [
            'Boutique rooms and apartments with WiFi, AC and free parking. For private spa after the baths — the Wellness apartment with sauna and jacuzzi.',
            'Direct booking means a clear deposit and communication with the property, useful when aligning treatment times and check-in.',
          ],
        },
        {
          heading: 'Practical for families and couples',
          paragraphs: [
            'Families value the short walk to the aqua park; couples value a quiet return to a boutique room. House rules support quiet after 23:00.',
            'Zagreb is ~120 km; bus and train stations ~500 m — workable even without a car.',
          ],
        },
      ],
      activitiesSectionTitle: 'Beside the spa — and a little more',
      activities: [
        {
          title: 'Daruvar Spa',
          description: 'Thermal complex and aqua park a few minutes on foot.',
          image: IMG_TOWN,
          imageAlt: 'Near Daruvar Spa',
        },
        {
          title: 'Park and ginkgo',
          description: 'Janković Castle and the ginkgo tree — an easy stroll from the centre.',
          image: IMG_PROPERTY,
          imageAlt: 'Central Daruvar near Ginko',
        },
        {
          title: 'Private wellness',
          description: 'Sauna and jacuzzi in the apartment after a spa day.',
          image: IMG_WELLNESS,
          imageAlt: 'Wellness with a spa-side stay',
        },
        {
          title: 'Rooms for shorter stays',
          description: 'Ginko 1–6 for a spa weekend without unused space.',
          image: IMG_ROOM,
          imageAlt: 'Room near Daruvar Spa',
        },
      ],
      midCtaTitle: 'Planning a spa-side stay?',
      midCtaBody:
        'Pick dates and a room near the spa — book direct, no middleman.',
      midCtaPrimaryLabel: 'Book',
      midCtaGalleryLabel: 'Gallery',
      faqSectionTitle: 'Frequently asked questions',
      faqs: [
        {
          question: 'Exactly how far to the spa entrance?',
          answer:
            'About 400 m / a few minutes’ walk from Ulica Tomaša Garika Masaryka 1. Exact time depends on pace and which entrance you use.',
        },
        {
          question: 'Do I need a car to reach the spa?',
          answer:
            'No — most guests walk. Parking at the property stays free if you drive anyway.',
        },
        {
          question: 'Is it suitable for the aqua park with children?',
          answer:
            'Yes. The short distance simplifies trips with kids; rooms and apartments cover different capacities.',
        },
        {
          question: 'Can I combine the spa with private wellness?',
          answer:
            'Yes — book the Wellness apartment for a sauna and jacuzzi after a thermal day.',
        },
      ],
      reservationIntro:
        'Send a request with dates — confirmation and deposit arrive by email.',
      guidesBlockTitle: 'Guide for a spa stay',
      guidesBlockIntro: 'What to visit and how to split the day between the spa and Daruvar centre.',
    },
    cs: {
      eyebrow: 'Daruvar · U lázní',
      heroImage: {
        src: IMG_TOWN,
        alt: 'Ubytování u lázní Daruvar – Ginko Boutique Rooms',
      },
      highlights: [
        '~400 m k lázním Daruvar a aquaparku',
        'Centrum města — chůze místo transferů',
        'Pokoje a wellness apartmány s parkováním',
      ],
      sections: [
        {
          heading: 'Proč ubytování u lázní mění rytmus dne',
          paragraphs: [
            'Když jsou lázně prioritou, vzdálenost od pokoje rozhoduje, kolik energie spálíte na dojíždění. Ginko je v centru Daruvaru, asi 400 m od lázní a aquaparku Aquae Ballisae.',
            'Můžete naplánovat ranní proceduru, návrat k odpočinku a další odchod večer — bez hledání parkování na druhém konci města.',
          ],
        },
        {
          heading: 'Co získáte s lokalitou',
          paragraphs: [
            'Boutique pokoje a apartmány s WiFi, klimatizací a parkováním zdarma. Pro soukromé spa po lázních — Wellness apartmán se saunou a vířivkou.',
            'Přímá rezervace znamená jasnou zálohu a komunikaci s objektem — užitečné při slaďování procedur a check-inu.',
          ],
        },
        {
          heading: 'Praktické pro rodiny i páry',
          paragraphs: [
            'Rodiny ocení krátkou cestu k aquaparku; páry klidný návrat do boutique pokoje. Domovní řád podporuje ticho po 23:00.',
            'Záhřeb je ~120 km; autobus a vlak ~500 m — zvládnutelné i bez auta.',
          ],
        },
      ],
      activitiesSectionTitle: 'U lázní — a ještě něco navíc',
      activities: [
        {
          title: 'Lázně Daruvar',
          description: 'Termální komplex a aquapark pár minut chůze.',
          image: IMG_TOWN,
          imageAlt: 'Blízko lázní Daruvar',
        },
        {
          title: 'Park a ginkgo',
          description: 'Zámek Janković a strom ginkgo — snadná procházka z centra.',
          image: IMG_PROPERTY,
          imageAlt: 'Centrum Daruvaru u Ginko',
        },
        {
          title: 'Soukromý wellness',
          description: 'Sauna a vířivka v apartmánu po dni v lázních.',
          image: IMG_WELLNESS,
          imageAlt: 'Wellness u ubytování u lázní',
        },
        {
          title: 'Pokoje na kratší pobyt',
          description: 'Ginko 1–6 na víkend u lázní bez zbytečného prostoru.',
          image: IMG_ROOM,
          imageAlt: 'Pokoj blízko lázní Daruvar',
        },
      ],
      midCtaTitle: 'Plánujete pobyt u lázní?',
      midCtaBody:
        'Vyberte data a pokoj blízko lázní — rezervace přímo, bez prostředníka.',
      midCtaPrimaryLabel: 'Rezervace',
      midCtaGalleryLabel: 'Galerie',
      faqSectionTitle: 'Často kladené otázky',
      faqs: [
        {
          question: 'Jak přesně daleko je vchod do lázní?',
          answer:
            'Asi 400 m / pár minut chůze od Ulici Tomaša Garika Masaryka 1. Přesný čas závisí na tempu a zvoleném vchodu.',
        },
        {
          question: 'Potřebuji auto k lázním?',
          answer:
            'Ne — většina hostů jde pěšky. Parkování u objektu zůstává zdarma, pokud stejně jedete autem.',
        },
        {
          question: 'Hodí se to k aquaparku s dětmi?',
          answer:
            'Ano. Krátká vzdálenost zjednodušuje cesty s dětmi; pokoje a apartmány pokrývají různé kapacity.',
        },
        {
          question: 'Mohu spojit lázně a soukromé spa?',
          answer:
            'Ano — rezervujte Wellness apartmán pro saunu a vířivku po termálním dni.',
        },
      ],
      reservationIntro:
        'Pošlete poptávku s daty — potvrzení a záloha přijdou e-mailem.',
      guidesBlockTitle: 'Průvodce pobytem u lázní',
      guidesBlockIntro: 'Co navštívit a jak rozdělit den mezi lázně a centrum Daruvaru.',
    },
  },
};
