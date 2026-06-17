// Adapted from VJ/src/app/(public)/privatnost/page.tsx
// Simplified: inline content instead of message-driven structure.
// Contact details are placeholder — fill in before launch.

import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getValidLocale } from '@/i18n/messages';
import { Link } from '@/i18n/navigation';
import { getBreadcrumbStructuredData } from '@/i18n/metadata';
import { CONTACT_EMAIL, SITE_NAME } from '@/modules/booking/booking.config';

const LAST_UPDATED = '28. svibnja 2026.';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Politika privatnosti',
    description:
      `Politika privatnosti ${SITE_NAME} — kako prikupljamo, koristimo i štitimo vaše osobne podatke sukladno GDPR-u.`,
    robots: { index: true },
    alternates: { canonical: '/privacy' },
  };
}

export default async function PrivacyPage() {
  const locale = getValidLocale(await getLocale());

  const breadcrumbJsonLd = getBreadcrumbStructuredData(locale, [
    { name: SITE_NAME, pathname: '/' },
    { name: 'Politika privatnosti', pathname: '/privacy' },
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
          Pravni dokumenti
        </p>
        <h1 className="text-4xl font-bold text-text mb-2">Politika privatnosti</h1>
        <p className="text-sm text-text/50">Zadnja izmjena: {LAST_UPDATED}</p>
      </div>

      <div className="space-y-10 text-text/70 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-text mb-3">1. Voditelj obrade</h2>
          <p>
            Voditelj obrade osobnih podataka je vlasnik smještajnog objekta {SITE_NAME}. Za
            pitanja vezana uz privatnost možete nas kontaktirati putem e-pošte:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">2. Podaci koje prikupljamo</h2>
          <p>Prikupljamo sljedeće kategorije osobnih podataka:</p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-sm">
            <li>
              <strong className="text-text">Rezervacijski podaci</strong> — ime, e-pošta, broj
              telefona, datumi boravka, broj gostiju.
            </li>
            <li>
              <strong className="text-text">Komunikacijski podaci</strong> — poruke koje nam
              šaljete putem obrasca za kontakt ili e-pošte.
            </li>
            <li>
              <strong className="text-text">Tehnički podaci</strong> — IP adresa, vrsta preglednika,
              kolačići (samo uz vašu suglasnost).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">3. Svrha i pravna osnova</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-stone/20">
                  <th className="py-2 pr-4 text-left font-medium text-text">Svrha</th>
                  <th className="py-2 text-left font-medium text-text">Pravna osnova</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/10">
                {[
                  ['Obrada rezervacije', 'Izvršenje ugovora (čl. 6(1)(b) GDPR)'],
                  ['Komunikacija i podrška', 'Legitimni interes / ugovor'],
                  ['Analitika (uz pristanak)', 'Suglasnost (čl. 6(1)(a) GDPR)'],
                ].map(([purpose, basis]) => (
                  <tr key={purpose}>
                    <td className="py-2 pr-4">{purpose}</td>
                    <td className="py-2">{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">4. Rokovi čuvanja</h2>
          <p>
            Rezervacijski podaci čuvaju se 7 godina sukladno računovodstvenim obvezama. Podaci
            za komunikaciju brišu se nakon 2 godine. Analitički podaci (uz pristanak) čuvaju se
            do opoziva pristanka.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">5. Vaša prava</h2>
          <p>Sukladno GDPR-u imate pravo na:</p>
          <ul className="mt-3 space-y-1 list-disc list-inside text-sm">
            {[
              'Pristup vašim osobnim podacima',
              'Ispravak netočnih podataka',
              'Brisanje podataka ("pravo na zaborav")',
              'Ograničenje obrade',
              'Prenosivost podataka',
              'Prigovor na obradu',
              'Opoziv pristanka (bez utjecaja na prethodnu obradu)',
            ].map((right) => (
              <li key={right}>{right}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            Zahtjev možete podnijeti na{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
              {CONTACT_EMAIL}
            </a>
            . Imate i pravo podnijeti pritužbu{' '}
            <a
              href="https://azop.hr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              AZOP-u
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">6. Kolačići</h2>
          <p>
            Koristimo neophodne kolačiće za rad stranice (lokalizacija). Analitičke kolačiće
            koristimo samo uz vašu suglasnost. Detalje možete pronaći u{' '}
            <Link href="/cookies" className="text-accent hover:underline">
              Politici kolačića
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text mb-3">7. Izmjene politike</h2>
          <p>
            Ova politika može se povremeno ažurirati. Datum zadnje izmjene uvijek je naveden na
            vrhu stranice.
          </p>
        </section>

        <div className="border-t border-stone/20 pt-6">
          <Link href="/" className="text-sm font-medium text-accent hover:underline">
            ← Povratak na početnu
          </Link>
        </div>
      </div>
    </div>
  );
}
