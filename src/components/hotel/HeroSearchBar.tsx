'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Search, CalendarDays, Users, AlertCircle } from 'lucide-react';
import SearchFieldCell from '@/components/hotel/SearchFieldCell';
import GuestPicker from '@/components/hotel/GuestPicker';
import {
  AVAILABILITY_SECTION_HREF,
  buildAvailabilityHref,
} from '@/modules/booking/booking.config';
import {
  childAgesComplete,
  serializeChildAges,
  resolvedChildAges,
} from '@/modules/booking/guest-occupancy';

const FIELD_CLASS =
  'text-text text-sm font-medium bg-transparent outline-none cursor-pointer w-full';
const CELL_BORDER =
  'px-5 py-4 border-b sm:border-b-0 sm:border-r border-stone';

export default function HeroSearchBar() {
  const t = useTranslations('homePage');
  const router = useRouter();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState<Array<number | null>>([]);
  const [dateError, setDateError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      setDateError(t('availabilitySelectDates'));
      router.push(AVAILABILITY_SECTION_HREF);
      return;
    }
    if (!childAgesComplete(children, childAges)) {
      setDateError(t('availabilitySelectChildAges'));
      return;
    }
    setDateError(null);
    const ages = resolvedChildAges(children, childAges);
    router.push(
      buildAvailabilityHref({
        checkIn,
        checkOut,
        adults,
        children,
        childAges: ages.length ? serializeChildAges(ages) : undefined,
      }),
    );
  }

  return (
    <div className="w-full max-w-3xl flex flex-col gap-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-stretch gap-0 bg-white rounded-2xl shadow-2xl overflow-visible w-full relative z-30"
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
          label={t('heroGuests')}
          className={`${CELL_BORDER} relative z-40 sm:min-w-[180px]`}
        >
          <GuestPicker
            adults={adults}
            children={children}
            childAges={childAges}
            onAdultsChange={setAdults}
            onChildrenChange={setChildren}
            onChildAgesChange={setChildAges}
            labels={{
              adults: t('heroAdults'),
              children: t('heroChildren'),
              guests: t('heroGuests'),
              childAgeNeeded: t('heroChildAgeNeeded'),
              agesHint: t('heroChildAgesHint'),
              done: t('heroGuestsDone'),
            }}
          />
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
