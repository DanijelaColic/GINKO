'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { localizePath } from '@/i18n/pathnames';
import type { AppLocale } from '@/i18n/routing';
import {
  AVAILABILITY_SECTION_HREF,
  OVERVIEW_SECTION_ID,
  PROPERTY_NAV_ITEMS,
  PROPERTY_SUBNAV_SECTION_IDS,
  propertySectionHref,
} from '@/modules/booking/booking.config';

const LOCALES: { code: AppLocale; label: string }[] = [
  { code: 'hr', label: 'HR' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

function sectionLinkClass(isActive: boolean) {
  return `rounded-md px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-[--color-text] hover:bg-[--color-stone] hover:text-[--color-primary]'
  }`;
}

export default function Navbar() {
  const t = useTranslations('navbar');
  const tSections = useTranslations('homePage.subnav');
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>(OVERVIEW_SECTION_ID);
  const navListRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isHome) return;

    const hash = window.location.hash.slice(1);
    if (
      hash &&
      (PROPERTY_SUBNAV_SECTION_IDS as readonly string[]).includes(hash)
    ) {
      setActiveSectionId(hash);
    }
  }, [isHome]);

  useEffect(() => {
    if (!isHome) return;

    const elements = PROPERTY_SUBNAV_SECTION_IDS.map((id) =>
      document.getElementById(id),
    ).filter(Boolean) as HTMLElement[];

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.15, 0.4] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isHome]);

  useEffect(() => {
    if (!isHome || !navListRef.current) return;
    const activeEl = navListRef.current.querySelector<HTMLElement>(
      `[data-section="${activeSectionId}"]`,
    );
    activeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeSectionId, isHome]);

  function switchLocale(next: AppLocale) {
    // Locale switch requires a hard navigation so next-intl re-reads the cookie
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;SameSite=Lax`;
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = localizePath(pathname, next);
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSectionId(id);
    setIsOpen(false);
  }

  function renderSectionLink(
    key: (typeof PROPERTY_NAV_ITEMS)[number]['key'],
    id: string,
    className: string,
  ) {
    const isActive = isHome && activeSectionId === id;
    const label = tSections(key);

    if (isHome) {
      return (
        <button
          type="button"
          data-section={id}
          onClick={() => scrollToSection(id)}
          className={className}
        >
          {label}
        </button>
      );
    }

    return (
      <Link href={propertySectionHref(id)} className={className} onClick={() => setIsOpen(false)}>
        {label}
      </Link>
    );
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow ${
        isScrolled ? 'bg-white shadow-sm' : 'bg-white/95 backdrop-blur-sm'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:py-4">
        {/* Brand */}
        <Link
          href="/"
          className="font-serif text-sm sm:text-base lg:text-lg font-semibold text-primary leading-snug max-w-[40%] sm:max-w-xs lg:max-w-none shrink-0"
        >
          {t('brand')}
        </Link>

        {/* Desktop: sekcije objekta */}
        <ul
          ref={navListRef}
          className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto md:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {PROPERTY_NAV_ITEMS.map(({ key, id }) => (
            <li key={id} className="shrink-0">
              {renderSectionLink(key, id, sectionLinkClass(isHome && activeSectionId === id))}
            </li>
          ))}
        </ul>

        {/* Desktop: locale switcher + CTA */}
        <div className="hidden shrink-0 items-center gap-2 lg:gap-3 md:flex">
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
            href={AVAILABILITY_SECTION_HREF}
            className="rounded-lg bg-[--color-primary] px-3 lg:px-4 py-2 text-sm font-medium text-white hover:bg-[--color-primary-dark] transition-colors whitespace-nowrap"
          >
            {t('cta')}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[--color-text] shrink-0"
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="border-t border-[--color-stone] bg-white px-4 pb-6 md:hidden">
          <ul className="mt-4 flex flex-col gap-1">
            {PROPERTY_NAV_ITEMS.map(({ key, id }) => (
              <li key={id}>
                {renderSectionLink(
                  key,
                  id,
                  `block w-full text-left rounded-md px-3 py-2.5 text-base font-medium transition-colors ${
                    isHome && activeSectionId === id
                      ? 'bg-primary/10 text-primary'
                      : 'text-[--color-text] hover:bg-[--color-stone] hover:text-[--color-primary]'
                  }`,
                )}
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
            href={AVAILABILITY_SECTION_HREF}
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
