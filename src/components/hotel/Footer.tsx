import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

const YEAR = new Date().getFullYear();

const NAV_LINKS = [
  { key: 'home', href: '/' },
  { key: 'rooms', href: '/rooms' },
  { key: 'booking', href: '/booking' },
  { key: 'guides', href: '/guides' },
] as const;

export default async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer className="bg-[--color-text] text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Brand column */}
          <div>
            <p className="font-serif text-lg font-semibold">{t('brand')}</p>
            <p className="mt-2 text-sm text-white/60">{t('tagline')}</p>
          </div>

          {/* Navigation */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
              {t('navTitle')}
            </p>
            <ul className="space-y-2">
              {NAV_LINKS.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {t(`links.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact placeholder */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
              {t('contactTitle')}
            </p>
            {/* Contact details will be added in a later phase */}
            <p className="text-sm text-white/40 italic">— coming soon —</p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/30">
          &copy; {YEAR} {t('brand')} &mdash; {t('rights')}
        </div>
      </div>
    </footer>
  );
}
