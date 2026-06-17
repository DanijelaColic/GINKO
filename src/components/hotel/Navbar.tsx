'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { localizePath } from '@/i18n/pathnames';
import type { AppLocale } from '@/i18n/routing';

const NAV_LINKS = [
  { key: 'rooms', href: '/rooms' },
  { key: 'booking', href: '/booking' },
  { key: 'guides', href: '/guides' },
] as const;

const LOCALES: { code: AppLocale; label: string }[] = [
  { code: 'hr', label: 'HR' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

export default function Navbar() {
  const t = useTranslations('navbar');
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function switchLocale(next: AppLocale) {
    // Locale switch requires a hard navigation so next-intl re-reads the cookie
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;SameSite=Lax`;
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = localizePath(pathname, next);
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow ${
        isScrolled ? 'bg-white shadow-sm' : 'bg-white/95 backdrop-blur-sm'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* Brand */}
        <Link
          href="/"
          className="font-serif text-sm sm:text-base lg:text-lg font-semibold text-primary leading-snug max-w-[52%] sm:max-w-xs md:max-w-none shrink-0"
        >
          {t('brand')}
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ key, href }) => (
            <li key={key}>
              <Link
                href={href}
                className="text-sm font-medium text-[--color-text] hover:text-[--color-primary] transition-colors"
              >
                {t(`links.${key}`)}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop: locale switcher + CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-1 text-xs font-medium text-[--color-muted]">
            {LOCALES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => switchLocale(code)}
                className={`rounded px-2 py-1 transition-colors ${
                  locale === code
                    ? 'bg-[--color-primary] text-white'
                    : 'hover:bg-[--color-stone] text-[--color-muted]'
                }`}
                aria-label={`Switch to ${label}`}
              >
                {label}
              </button>
            ))}
          </div>
          <Link
            href="/booking"
            className="rounded-lg bg-[--color-primary] px-4 py-2 text-sm font-medium text-white hover:bg-[--color-primary-dark] transition-colors"
          >
            {t('cta')}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[--color-text]"
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="border-t border-[--color-stone] bg-white px-4 pb-6 md:hidden">
          <ul className="mt-4 flex flex-col gap-4">
            {NAV_LINKS.map(({ key, href }) => (
              <li key={key}>
                <Link
                  href={href}
                  className="block text-base font-medium text-[--color-text] hover:text-[--color-primary]"
                  onClick={() => setIsOpen(false)}
                >
                  {t(`links.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-2">
            {LOCALES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => switchLocale(code)}
                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                  locale === code
                    ? 'bg-[--color-primary] text-white'
                    : 'bg-[--color-stone] text-[--color-muted]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Link
            href="/booking"
            className="mt-4 block rounded-lg bg-[--color-primary] px-4 py-3 text-center text-sm font-medium text-white hover:bg-[--color-primary-dark] transition-colors"
            onClick={() => setIsOpen(false)}
          >
            {t('cta')}
          </Link>
        </div>
      )}
    </header>
  );
}
