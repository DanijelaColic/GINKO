'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Search, CalendarDays, Users, AlertCircle } from 'lucide-react';
import SearchFieldCell from '@/components/hotel/SearchFieldCell';
import {
  AVAILABILITY_SECTION_HREF,
  buildAvailabilityHref,
} from '@/modules/booking/booking.config';

const FIELD_CLASS =
  'text-text text-sm font-medium bg-transparent outline-none cursor-pointer w-full';
const SELECT_CLASS =
  'text-text text-sm font-medium bg-transparent outline-none cursor-pointer w-full';
const CELL_BORDER =
  'px-5 py-4 border-b sm:border-b-0 sm:border-r border-stone';

export default function HeroSearchBar() {
  const t = useTranslations('homePage');
  const router = useRouter();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [dateError, setDateError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      setDateError(t('availabilitySelectDates'));
      router.push(AVAILABILITY_SECTION_HREF);
      return;
    }
    setDateError(null);
    router.push(buildAvailabilityHref({ checkIn, checkOut, adults, children }));
  }

  return (
    <div className="w-full max-w-3xl flex flex-col gap-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-stretch gap-0 bg-white rounded-2xl shadow-2xl overflow-hidden w-full"
      >
        <SearchFieldCell
          icon={CalendarDays}
          iconSize={18}
          label={t('heroCheckIn')}
          className={`flex-1 ${CELL_BORDER}`}
        >
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (checkOut && e.target.value >= checkOut) setCheckOut('');
            }}
            className={FIELD_CLASS}
          />
        </SearchFieldCell>

        <SearchFieldCell
          icon={CalendarDays}
          iconSize={18}
          label={t('heroCheckOut')}
          className={`flex-1 ${CELL_BORDER}`}
        >
          <input
            type="date"
            value={checkOut}
            min={checkIn || today}
            onChange={(e) => setCheckOut(e.target.value)}
            className={FIELD_CLASS}
          />
        </SearchFieldCell>

        <SearchFieldCell
          icon={Users}
          iconSize={18}
          label={t('heroAdults')}
          className={CELL_BORDER}
        >
          <select
            value={adults}
            onChange={(e) => {
              const a = Number(e.target.value);
              setAdults(a);
              if (children > 3 - a) setChildren(Math.max(0, 3 - a));
            }}
            className={SELECT_CLASS}
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </SearchFieldCell>

        <SearchFieldCell
          icon={Users}
          iconSize={18}
          label={t('heroChildren')}
          className={CELL_BORDER}
        >
          <select
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            className={SELECT_CLASS}
          >
            {Array.from({ length: Math.max(1, 3 - adults + 1) }, (_, i) => i).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </SearchFieldCell>

        <button
          type="submit"
          className="flex w-full sm:w-auto self-stretch shrink-0 items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 sm:px-8 py-4 transition-colors text-sm whitespace-nowrap"
        >
          <Search size={17} />
          {t('heroSearch')}
        </button>
      </form>
      {dateError && (
        <p className="flex items-center gap-1.5 text-sm text-red-200 drop-shadow text-left px-1">
          <AlertCircle size={14} className="shrink-0" />
          {dateError}
        </p>
      )}
    </div>
  );
}
