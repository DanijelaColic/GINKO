import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('notFoundPage');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-bold">{t('title')}</h1>
      <p className="text-[--color-muted] max-w-md">{t('description')}</p>
      <Link
        href="/"
        className="rounded-lg bg-[--color-primary] px-6 py-3 text-white hover:bg-[--color-primary-dark] transition-colors"
      >
        {t('cta')}
      </Link>
    </div>
  );
}
