'use client';

// Copied from VV/src/modules/booking-admin/components/BookingCalendar.tsx
// Adaptations:
//   - prop renamed apartmentSlug → roomSlug
//   - API query param apartment= → room=
//   - imports point to @/modules/booking/dates + @/modules/booking/booking.types
//   - color: hover:bg-sand → hover:bg-stone

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import {
  startOfToday,
  addDays,
  isSameDay,
  isBeforeDay,
  diffDays,
  isDateBooked,
  getFirstBlockedAfter,
  getMonthGrid,
} from '@/modules/booking/dates';
import type { BookedRange } from '@/modules/booking/booking.types';

type DayState =
  | 'past'
  | 'booked'
  | 'check-in'
  | 'check-out'
  | 'in-range'
  | 'hover-range'
  | 'blocked-for-checkout'
  | 'too-close'
  | 'available';

type Props = {
  roomSlug: string;
  checkIn: Date | null;
  checkOut: Date | null;
  onCheckInSelect: (date: Date) => void;
  onCheckOutSelect: (date: Date) => void;
  onReset: () => void;
  bookingsApiPath?: string;
  minNights?: number;
};

export default function BookingCalendar({
  roomSlug,
  checkIn,
  checkOut,
  onCheckInSelect,
  onCheckOutSelect,
  onReset,
  bookingsApiPath = '/api/bookings',
  minNights = 2,
}: Props) {
  const locale = useLocale();
  const t = useTranslations('bookingWidget.calendar');
  const today = startOfToday();
  const [availability, setAvailability] = useState<{
    requestKey: string | null;
    bookedRanges: BookedRange[];
    error: string | null;
  }>({
    requestKey: null,
    bookedRanges: [],
    error: null,
  });
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const requestKey = `${bookingsApiPath}:${roomSlug}`;

  useEffect(() => {
    let isCancelled = false;

    fetch(`${bookingsApiPath}?room=${roomSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (isCancelled) return;
        if (Array.isArray(data)) {
          setAvailability({ requestKey, bookedRanges: data, error: null });
          return;
        }
        setAvailability({ requestKey, bookedRanges: [], error: t('errors.loadAvailability') });
      })
      .catch(() => {
        if (isCancelled) return;
        setAvailability({ requestKey, bookedRanges: [], error: t('errors.loadDates') });
      });

    return () => {
      isCancelled = true;
    };
  }, [roomSlug, bookingsApiPath, requestKey, t]);

  const loading = availability.requestKey !== requestKey;
  const error = loading ? null : availability.error;
  const bookedRanges = useMemo(
    () => (loading ? [] : availability.bookedRanges),
    [loading, availability.bookedRanges],
  );
  const effectiveHoverDate = checkOut ? null : hoverDate;

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long' }),
    [locale],
  );
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'short' }),
    [locale],
  );
  const weekdays = useMemo(() => {
    const baseMonday = new Date(Date.UTC(2024, 0, 1));
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(baseMonday);
      day.setUTCDate(baseMonday.getUTCDate() + index);
      return weekdayFormatter.format(day);
    });
  }, [weekdayFormatter]);

  const firstBlocked =
    checkIn && !checkOut ? getFirstBlockedAfter(checkIn, bookedRanges) : null;

  const getDayState = useCallback(
    (day: Date): DayState => {
      if (isBeforeDay(day, today)) return 'past';
      if (isDateBooked(day, bookedRanges)) return 'booked';
      if (checkIn && isSameDay(day, checkIn)) return 'check-in';
      if (checkOut && isSameDay(day, checkOut)) return 'check-out';
      if (checkIn && checkOut) {
        if (day > checkIn && day < checkOut) return 'in-range';
      }
      if (checkIn && !checkOut) {
        if (firstBlocked && !isBeforeDay(day, firstBlocked)) return 'blocked-for-checkout';
        if (isSameDay(day, addDays(checkIn, minNights - 1))) return 'too-close';
        if (effectiveHoverDate && day > checkIn && day < effectiveHoverDate) return 'hover-range';
      }
      return 'available';
    },
    [today, bookedRanges, checkIn, checkOut, effectiveHoverDate, firstBlocked, minNights],
  );

  const handleDayClick = useCallback(
    (day: Date) => {
      const state = getDayState(day);
      if (state === 'past' || state === 'booked') return;
      if (!checkIn || checkOut) {
        if (state === 'available' || state === 'blocked-for-checkout') {
          if (state === 'blocked-for-checkout') {
            if (!isDateBooked(day, bookedRanges)) {
              onReset();
              onCheckInSelect(day);
            }
          } else {
            onCheckInSelect(day);
          }
        }
        return;
      }
      if (checkIn && !checkOut) {
        if (state === 'too-close' || state === 'blocked-for-checkout') return;
        if (isSameDay(day, checkIn)) { onReset(); return; }
        if (isBeforeDay(day, checkIn)) { onReset(); onCheckInSelect(day); return; }
        const nights = diffDays(day, checkIn);
        if (nights < minNights) return;
        onCheckOutSelect(day);
      }
    },
    [getDayState, checkIn, checkOut, bookedRanges, onCheckInSelect, onCheckOutSelect, onReset, minNights],
  );

  const handleDayHover = useCallback(
    (day: Date) => {
      if (checkIn && !checkOut) setHoverDate(day);
    },
    [checkIn, checkOut],
  );

  const months = [monthOffset, monthOffset + 1].map((offset) => {
    const ref = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    return { year: ref.getFullYear(), month: ref.getMonth() };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted text-sm">
        <span className="animate-pulse">{t('loading')}</span>
      </div>
    );
  }

  if (error) {
    return <div className="py-10 text-center text-red-500 text-sm">{error}</div>;
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-6 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-green-100 border border-green-300 inline-block" />
          {t('legend.available')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-red-100 border border-red-300 inline-block" />
          {t('legend.booked')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-primary inline-block" />
          {t('legend.selected')}
        </span>
        {!checkIn && (
          <span className="ml-auto text-accent font-medium">{t('legend.pickCheckIn')}</span>
        )}
        {checkIn && !checkOut && (
          <span className="ml-auto text-accent font-medium">
            {t('legend.pickCheckOut', { minNights })}
          </span>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonthOffset((o) => Math.max(0, o - 1))}
          disabled={monthOffset === 0}
          className="p-2 rounded-full hover:bg-stone disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label={t('previousMonth')}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setMonthOffset((o) => o + 2)}
          className="p-2 rounded-full hover:bg-stone transition-colors"
          aria-label={t('nextMonth')}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Two calendar months */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {months.map(({ year, month }) => (
          <MonthGrid
            key={`${year}-${month}`}
            year={year}
            month={month}
            minNights={minNights}
            monthFormatter={monthFormatter}
            weekdays={weekdays}
            t={t}
            getDayState={getDayState}
            onDayClick={handleDayClick}
            onDayHover={handleDayHover}
          />
        ))}
      </div>

      {(checkIn || checkOut) && (
        <div className="mt-4 text-center">
          <button
            onClick={onReset}
            className="text-sm text-muted hover:text-primary underline underline-offset-2 transition-colors"
          >
            {t('reset')}
          </button>
        </div>
      )}
    </div>
  );
}

// ── MonthGrid ──────────────────────────────────────────────────────

type MonthGridProps = {
  year: number;
  month: number;
  minNights: number;
  monthFormatter: Intl.DateTimeFormat;
  weekdays: string[];
  t: ReturnType<typeof useTranslations<'bookingWidget.calendar'>>;
  getDayState: (day: Date) => DayState;
  onDayClick: (day: Date) => void;
  onDayHover: (day: Date) => void;
};

function MonthGrid({
  year,
  month,
  minNights,
  monthFormatter,
  weekdays,
  t,
  getDayState,
  onDayClick,
  onDayHover,
}: MonthGridProps) {
  const grid = getMonthGrid(year, month);
  const monthName = monthFormatter.format(new Date(year, month, 1));

  return (
    <div>
      <h3 className="text-center font-serif font-semibold text-text mb-4">
        {monthName} {year}
      </h3>
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map((d) => (
          <div key={d} className="text-center text-xs text-muted font-medium py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {grid.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const state = getDayState(day);
          const isInteractive =
            state === 'available' ||
            state === 'hover-range' ||
            state === 'check-in' ||
            state === 'check-out';

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              onMouseEnter={() => onDayHover(day)}
              className={clsx(
                'relative h-9 flex items-center justify-center text-sm select-none transition-colors',
                {
                  'text-gray-300 cursor-not-allowed':
                    state === 'past' || state === 'blocked-for-checkout',
                  'bg-red-50 text-red-300 cursor-not-allowed line-through': state === 'booked',
                  'bg-primary text-white font-semibold rounded-l-full cursor-pointer z-10':
                    state === 'check-in',
                  'bg-primary text-white font-semibold rounded-r-full cursor-pointer z-10':
                    state === 'check-out',
                  'bg-primary/15 text-primary': state === 'in-range',
                  'bg-primary/10 text-primary': state === 'hover-range',
                  'text-gray-400 cursor-not-allowed': state === 'too-close',
                  'text-text cursor-pointer hover:bg-primary/10 rounded-full': state === 'available',
                  'cursor-pointer': isInteractive,
                },
              )}
              title={
                state === 'booked'
                  ? t('tooltips.booked')
                  : state === 'too-close'
                    ? t('tooltips.minStay', { minNights })
                    : undefined
              }
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
