import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';

const LAST_UPDATED = '28. svibnja 2026.';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Politika kolačića',
    description:
      'Politika kolačića Ginko Sobe — koje kolačiće koristimo i kako upravljati vašim postavkama.',
    robots: { index: true },
    alternates: { canonical: '/cookies' },
  };
}

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
          Pravni dokumenti
        </p>
        <h1 className="text-4xl font-bold text-text mb-2">Politika kolačića</h1>
        <p className="text-sm text-text/50">Zadnja izmjena: {LAST_UPDATED}</p>
      </div>

      <div className="space-y-10 text-text/70 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-text mb-3">Što su kolačići?</h2>
          <p>
            Kolačići (cookies) su male tekstualne datoteke koje web stranice pohranjuju u vašem
            pregledniku. Koriste se za pamćenje vaših postavki i analizu korištenja stranice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">Kolačići koje koristimo</h2>
          <div className="space-y-3">
            <div className="rounded-xl border border-stone/20 bg-stone/5 p-4">
              <p className="font-medium text-text mb-1">Neophodne (uvijek aktivne)</p>
              <p className="text-sm">
                Kolačić za odabir jezika (<code className="text-xs bg-stone/20 px-1 rounded">NEXT_LOCALE</code>)
                — pamti vaš odabrani jezik i neophodan je za ispravan prikaz sadržaja. Ne zahtijeva
                pristanak.
              </p>
            </div>
            <div className="rounded-xl border border-stone/20 bg-stone/5 p-4">
              <p className="font-medium text-text mb-1">Analitički (uz pristanak)</p>
              <p className="text-sm">
                Kolačiće za analitiku koristimo samo ako ste prihvatili. Prikupljamo anonimne
                podatke o posjetu (pregledane stranice, trajanje posjeta) radi poboljšanja
                korisničkog iskustva. Nema osobnih podataka.
              </p>
            </div>
            <div className="rounded-xl border border-stone/20 bg-stone/5 p-4">
              <p className="font-medium text-text mb-1">Suglasnost za kolačiće</p>
              <p className="text-sm">
                Kolačić{' '}
                <code className="text-xs bg-stone/20 px-1 rounded">ginko_cookie_consent</code>{' '}
                pohranjuje vašu odluku (prihvaćeno/odbijeno) kako ne bismo ponavljali upit pri
                svakom posjetu.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">Upravljanje kolačićima</h2>
          <p>
            Analitiku možete odbiti ili opozvati u svakom trenutku putem bannera koji se
            pojavljuje pri prvom posjetu. Kolačiće možete i izbrisati izravno u postavkama svog
            preglednika.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">Treće strane</h2>
          <p>
            Stranica koristi Unsplash za fotografije i Google Fonts za pisma — oba servisa mogu
            pohraniti tehničke kolačiće. Pogledajte njihove politike privatnosti za detalje.
          </p>
        </section>

        <div className="flex gap-4 border-t border-stone/20 pt-6">
          <Link href="/privacy" className="text-sm font-medium text-accent hover:underline">
            Politika privatnosti
          </Link>
          <Link href="/" className="text-sm font-medium text-accent hover:underline">
            ← Početna
          </Link>
        </div>
      </div>
    </div>
  );
}
