import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Phone, Mail, Clock, MapPin } from 'lucide-react';
import { PROPERTY_MAP_URL } from '@/modules/property/property-details.config';

const YEAR = new Date().getFullYear();

const NAV_LINKS = [
  { key: 'home', href: '/' },
  { key: 'rooms', href: '/rooms' },
  { key: 'booking', href: '/booking' },
  { key: 'guides', href: '/guides' },
  { key: 'gallery', href: '/gallery' },
] as const;

const LEGAL_LINKS = [
  { key: 'privacy', href: '/privacy' },
  { key: 'cookies', href: '/cookies' },
] as const;

export default async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer className="relative z-10 bg-text text-white shrink-0">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Brand column */}
          <div>
            <p className="font-serif text-lg font-semibold leading-tight">{t('brand')}</p>
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

          {/* Contact */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
              {t('contactTitle')}
            </p>
            <address className="not-italic space-y-2.5">
              <a
                href={PROPERTY_MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm text-white/70 hover:text-white transition-colors leading-snug"
              >
                <MapPin size={14} className="shrink-0 mt-0.5 text-white/40" />
                <span>
                  Trg Presvetog Trojstva 3<br />
                  43500 Daruvar, Hrvatska
                </span>
              </a>
              <a
                href="tel:+385959000799"
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                <Phone size={14} className="shrink-0 text-white/40" />
                095 9000 799
              </a>
              <a
                href="mailto:ginko.sobe@gmail.com"
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                <Mail size={14} className="shrink-0 text-white/40" />
                ginko.sobe@gmail.com
              </a>
              <p className="flex items-start gap-2 text-sm text-white/60">
                <Clock size={14} className="shrink-0 mt-0.5 text-white/40" />
                <span>
                  {t('checkIn')}<br />
                  {t('checkOut')}
                </span>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <span>&copy; {YEAR} {t('brand')} &mdash; {t('rights')}</span>
          <nav aria-label="Legal" className="flex gap-4">
            {LEGAL_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className="hover:text-white/60 transition-colors"
              >
                {t(`legal.${key}`)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
