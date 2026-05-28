import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getValidLocale } from '@/i18n/messages';
import { getSeoNavLinks } from '@/modules/seo/seo-nav-links';

type InternalLinksProps = {
  currentPath: string;
};

const CORE_LINKS = [
  { href: '/rooms', labelKey: 'rooms' },
  { href: '/booking', labelKey: 'booking' },
  { href: '/guides', labelKey: 'guides' },
  { href: '/gallery', labelKey: 'gallery' },
] as const;

function normalizePath(path: string) {
  return path.replace(/\/$/, '') || '/';
}

export async function InternalLinks({ currentPath }: InternalLinksProps) {
  const locale = getValidLocale(await getLocale());
  const t = await getTranslations('navbar');
  const normalizedCurrent = normalizePath(currentPath);

  const links = [
    ...getSeoNavLinks(locale),
    ...CORE_LINKS.map((item) => ({
      href: item.href,
      label: t(`links.${item.labelKey}`),
    })),
  ].filter((item) => normalizePath(item.href) !== normalizedCurrent);

  return (
    <nav
      aria-label={t('menuLabel')}
      className="mt-10 rounded-xl border border-stone/20 bg-white p-5 shadow-sm"
    >
      <ul className="flex flex-wrap gap-2.5">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex rounded-full border border-stone/20 px-3 py-1.5 text-sm text-text transition-colors hover:border-accent hover:text-accent"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
