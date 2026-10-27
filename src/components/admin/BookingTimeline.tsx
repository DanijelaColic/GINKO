'use client';

// Timeline: lokalne Ginko rezervacije + MyRent zauzetost (read-only).
// SPA 1/2 = jedan red (object_id 7460). Statistika u AdminBookings i dalje broji samo Ginko bookings.
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { parseLocalDate, formatDate } from '@/modules/booking/dates';
import { bookingReference } from '@/modules/booking/booking.config';
import type { Booking, BookedRange } from '@/modules/booking/booking.types';
import {
  MYRENT_TIMELINE_UNITS,
  subtractOccupiedRanges,
  type MyRentTimelineUnit,
} from '@/modules/myrent';

const COL_W = 38;
const ROW_H = 52;
const LABEL_W = 130;
const MYRENT_BAR_COLOR = '#94a3b8'; // slate-400 — zauzeto u MyRentu (bez PII)

const MONTHS_HR = [
  'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
  'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac',
];
const DAYS_SHORT = ['Po', 'Ut', 'Sr', 'Če', 'Pe', 'Su', 'Ne'];

const BAR_COLORS: Record<string, string> = {
  pending: 'text-amber-950',
  confirmed: 'text-white',
  cancelled: 'bg-gray-200 text-gray-400 line-through',
};

const DOT_COLORS: Record<string, string> = {
  pending: 'bg-amber-400',
  confirmed: 'bg-primary',
  cancelled: 'bg-gray-300',
};

const UNIT_TIMELINE_COLORS = [
  '#ec4899',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
];

type TimelineUnitOccupancy = {
  unitId: string;
  label: string;
  objectId: number;
  roomSlugs: string[];
  occupiedRanges: BookedRange[];
};

type Props = {
  bookings: Booking[];
  onEditBooking: (b: Booking) => void;
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function addMonths(date: Date, n: number) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function dayDiff(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function getBarGeometry(
  checkInIso: string,
  checkOutIso: string,
  rangeStart: Date,
  rangeEndExclusive: Date,
) {
  const ci = parseLocalDate(checkInIso);
  const co = parseLocalDate(checkOutIso);
  const leftDays = dayDiff(rangeStart, ci);
  const clippedLeft = Math.max(0, leftDays);
  const clippedEnd = co < rangeEndExclusive ? co : rangeEndExclusive;
  const clippedStart = ci > rangeStart ? ci : rangeStart;
  const widthDays = dayDiff(clippedStart, clippedEnd);
  return {
    left: clippedLeft * COL_W + 1,
    width: widthDays * COL_W - 2,
    clipped: leftDays < 0,
  };
}

export default function BookingTimeline({ bookings, onEditBooking }: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [offset, setOffset] = useState(0);
  const [myrentUnits, setMyrentUnits] = useState<TimelineUnitOccupancy[] | null>(
    null,
  );
  const [myrentError, setMyrentError] = useState<string | null>(null);
  const [myrentLoading, setMyrentLoading] = useState(false);

  const unitColorById = useMemo(() => {
    return MYRENT_TIMELINE_UNITS.reduce<Record<string, string>>((acc, unit, index) => {
      acc[unit.unitId] = UNIT_TIMELINE_COLORS[index % UNIT_TIMELINE_COLORS.length];
      return acc;
    }, {});
  }, []);

  const months = useMemo(() => {
    return [0, 1].map((i) => {
      const ref = addMonths(today, offset + i);
      return {
        year: ref.getFullYear(),
        month: ref.getMonth(),
        days: daysInMonth(ref.getFullYear(), ref.getMonth()),
        startDate: ref,
      };
    });
  }, [today, offset]);

  const allDays = useMemo(() => {
    const days: Date[] = [];
    for (const m of months) {
      for (let d = 1; d <= m.days; d++) {
        days.push(new Date(m.year, m.month, d));
      }
    }
    return days;
  }, [months]);

  const rangeStart = allDays[0];
  const rangeEndExclusive = useMemo(
    () => new Date(allDays[allDays.length - 1].getTime() + 86_400_000),
    [allDays],
  );

  const dateFromIso = formatDate(rangeStart);
  const dateUntilIso = formatDate(allDays[allDays.length - 1]);

  useEffect(() => {
    let cancelled = false;
    setMyrentLoading(true);
    setMyrentError(null);

    fetch(
      `/api/admin/myrent/timeline?date_from=${dateFromIso}&date_until=${dateUntilIso}`,
    )
      .then(async (res) => {
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          units?: TimelineUnitOccupancy[];
        };
        if (cancelled) return;
        if (!res.ok || data.ok === false || !Array.isArray(data.units)) {
          setMyrentUnits(null);
          setMyrentError(
            data.error ||
              'MyRent kalendar nije dostupan. Termini se ne prikazuju kao slobodni.',
          );
          return;
        }
        setMyrentUnits(data.units);
        setMyrentError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setMyrentUnits(null);
        setMyrentError(
          'MyRent kalendar nije dostupan. Termini se ne prikazuju kao slobodni.',
        );
      })
      .finally(() => {
        if (!cancelled) setMyrentLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dateFromIso, dateUntilIso]);

  const visibleGinkoForUnit = (unit: MyRentTimelineUnit) =>
    bookings.filter((b) => {
      if (!unit.roomSlugs.includes(b.room_slug)) return false;
      const ci = parseLocalDate(b.check_in);
      const co = parseLocalDate(b.check_out);
      return co > rangeStart && ci < rangeEndExclusive;
    });

  /** Aktivne lokalne rezervacije — za oduzimanje od MyRent traka (bez dvostrukog prikaza). */
  const activeLocalRangesForUnit = (unit: MyRentTimelineUnit): BookedRange[] =>
    visibleGinkoForUnit(unit)
      .filter((b) => b.status !== 'cancelled')
      .map((b) => ({ check_in: b.check_in, check_out: b.check_out }));

  const myrentRangesForUnit = (unitId: string): BookedRange[] => {
    if (!myrentUnits) return [];
    const unit = myrentUnits.find((u) => u.unitId === unitId);
    return unit?.occupiedRanges ?? [];
  };

  const todayOffset = dayDiff(rangeStart, today);
  const todayVisible = todayOffset >= 0 && todayOffset < allDays.length;

  return (
    <div className="select-none">
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <button
          onClick={() => setOffset((o) => o - 1)}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          title="Prethodni mjesec"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-gray-700 min-w-[220px] text-center">
          {MONTHS_HR[months[0].month]} {months[0].year}
          <span className="text-gray-300 mx-2">·</span>
          {MONTHS_HR[months[1].month]} {months[1].year}
        </span>
        <button
          onClick={() => setOffset((o) => o + 1)}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          title="Sljedeći mjesec"
        >
          <ChevronRight size={18} />
        </button>
        {offset !== 0 && (
          <button
            onClick={() => setOffset(0)}
            className="ml-1 text-xs text-primary border border-primary/30 hover:bg-primary/5 px-3 py-1.5 rounded-full transition-colors"
          >
            Danas
          </button>
        )}
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: MYRENT_BAR_COLOR }}
            />
            MyRent zauzeto
          </span>
          {(['confirmed', 'pending', 'cancelled'] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={clsx('w-2.5 h-2.5 rounded-sm', DOT_COLORS[s])} />
              {s === 'confirmed'
                ? 'Ginko potvrđeno'
                : s === 'pending'
                  ? 'Ginko na čekanju'
                  : 'Ginko otkazano'}
            </span>
          ))}
        </div>
      </div>

      {myrentLoading && (
        <p className="text-xs text-gray-500 mb-3">Učitavam MyRent zauzetost…</p>
      )}
      {myrentError && (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {myrentError}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm bg-white">
        <div style={{ minWidth: LABEL_W + allDays.length * COL_W }}>
          {/* Month headers */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            <div style={{ width: LABEL_W }} className="shrink-0" />
            {months.map((m) => (
              <div
                key={`${m.year}-${m.month}`}
                style={{ width: m.days * COL_W }}
                className="text-center py-2 text-xs font-bold uppercase tracking-widest shrink-0 border-r border-gray-200 last:border-r-0"
              >
                <span className="text-gray-500">{MONTHS_HR[m.month]}</span>
                <span className="text-primary ml-1.5">{m.year}</span>
              </div>
            ))}
          </div>

          {/* Day headers */}
          <div className="flex border-b border-gray-200">
            <div
              style={{ width: LABEL_W }}
              className="shrink-0 px-3 py-2 text-xs text-gray-400 font-medium border-r border-gray-100"
            >
              Jedinica
            </div>
            {allDays.map((day, idx) => {
              const isToday = day.getTime() === today.getTime();
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isSep = idx === months[0].days - 1;
              return (
                <div
                  key={day.toISOString()}
                  style={{ width: COL_W }}
                  className={clsx(
                    'flex flex-col items-center justify-center py-1.5 shrink-0 text-xs border-r',
                    isSep ? 'border-r-gray-300' : 'border-r-gray-100',
                    isToday && 'bg-primary/10',
                    isWeekend && !isToday && 'bg-gray-50',
                  )}
                >
                  <span
                    className={clsx(
                      'font-semibold leading-none',
                      isToday
                        ? 'text-white bg-primary w-5 h-5 rounded-full flex items-center justify-center'
                        : isWeekend
                          ? 'text-gray-400'
                          : 'text-gray-700',
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <span
                    className={clsx(
                      'text-[9px] mt-0.5 font-medium uppercase',
                      isWeekend ? 'text-gray-400' : 'text-gray-300',
                    )}
                  >
                    {DAYS_SHORT[(day.getDay() + 6) % 7]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Physical unit rows (7) — SPA spojeno */}
          {MYRENT_TIMELINE_UNITS.map((unit, unitIdx) => {
            const ginkoBookings = visibleGinkoForUnit(unit);
            const myrentOnly = myrentError
              ? []
              : subtractOccupiedRanges(
                  myrentRangesForUnit(unit.unitId),
                  activeLocalRangesForUnit(unit),
                );
            const color = unitColorById[unit.unitId] ?? '#3b82f6';

            return (
              <div
                key={unit.unitId}
                className={clsx(
                  'flex border-b border-gray-100 last:border-b-0',
                  unitIdx % 2 === 1 && 'bg-gray-50/40',
                )}
                style={{ height: ROW_H }}
              >
                <div
                  style={{ width: LABEL_W }}
                  className="shrink-0 flex items-center px-3 border-r border-gray-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight flex items-center gap-1.5">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {unit.label}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      {unit.unitId === 'spa-2'
                        ? 'Wellness / bez wellnessa'
                        : `MyRent #${unit.objectId}`}
                    </p>
                  </div>
                </div>

                <div className="relative flex-1 overflow-hidden" style={{ height: ROW_H }}>
                  {allDays.map((day, idx) => {
                    const isToday = day.getTime() === today.getTime();
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const isSep = idx === months[0].days - 1;
                    return (
                      <div
                        key={idx}
                        style={{ left: idx * COL_W, width: COL_W }}
                        className={clsx(
                          'absolute top-0 bottom-0 border-r pointer-events-none',
                          isSep ? 'border-r-gray-200' : 'border-r-gray-100/60',
                          isToday && 'bg-primary/5',
                          isWeekend && !isToday && 'bg-gray-100/30',
                        )}
                      />
                    );
                  })}

                  {todayVisible && (
                    <div
                      style={{
                        left: todayOffset * COL_W + Math.floor(COL_W / 2),
                      }}
                      className="absolute top-0 bottom-0 w-px bg-primary/40 pointer-events-none z-10"
                    />
                  )}

                  {/* MyRent zauzetost — bez PII, nije klikabilno */}
                  {myrentOnly.map((range) => {
                    const { left, width, clipped } = getBarGeometry(
                      range.check_in,
                      range.check_out,
                      rangeStart,
                      rangeEndExclusive,
                    );
                    if (width <= 0) return null;
                    return (
                      <div
                        key={`mr-${unit.unitId}-${range.check_in}-${range.check_out}`}
                        style={{
                          left,
                          width,
                          top: 7,
                          height: ROW_H - 14,
                          backgroundColor: MYRENT_BAR_COLOR,
                        }}
                        className={clsx(
                          'absolute flex items-center px-2 overflow-hidden z-10',
                          'rounded-lg shadow-sm pointer-events-none',
                          clipped && 'rounded-l-none',
                        )}
                        title={`Zauzeto (MyRent) · ${range.check_in} → ${range.check_out}`}
                      >
                        {width > 70 && (
                          <span className="text-[10px] font-medium text-white/90 truncate">
                            MyRent
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Ginko web rezervacije — postojeći dizajn, klikabilno */}
                  {ginkoBookings.map((booking) => {
                    const { left, width, clipped } = getBarGeometry(
                      booking.check_in,
                      booking.check_out,
                      rangeStart,
                      rangeEndExclusive,
                    );
                    if (width <= 0) return null;
                    const isPending = booking.status === 'pending';
                    const barStyle =
                      booking.status === 'confirmed'
                        ? { backgroundColor: color }
                        : isPending
                          ? {
                              backgroundColor: `${color}33`,
                              borderColor: `${color}99`,
                            }
                          : undefined;

                    return (
                      <button
                        key={booking.id}
                        onClick={() => onEditBooking(booking)}
                        style={{
                          left,
                          width,
                          top: 7,
                          height: ROW_H - 14,
                          ...barStyle,
                        }}
                        className={clsx(
                          'absolute flex items-center px-2 overflow-hidden z-20',
                          'rounded-lg transition-all shadow-sm',
                          'focus:outline-none focus:ring-2 focus:ring-primary/40',
                          booking.status === 'pending' && 'border border-dashed',
                          BAR_COLORS[booking.status],
                          clipped && 'rounded-l-none border-l-2 border-l-white/40',
                          booking.status !== 'cancelled' && 'hover:opacity-90',
                        )}
                        title={`${bookingReference(booking.id)} · ${booking.guest_name} · ${booking.check_in} → ${booking.check_out} · ${booking.total_price}€`}
                      >
                        <span className="text-xs font-semibold truncate leading-tight">
                          {booking.guest_name}
                        </span>
                        {width > 100 && (
                          <span className="text-[10px] opacity-70 ml-1.5 shrink-0 hidden sm:inline">
                            {booking.nights}n
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Sivo = zauzeto u MyRentu (samo pregled) · boja = Ginko rezervacija (klik za uređivanje) ·
        SPA = jedna fizička jedinica · isprekidano = na čekanju
      </p>
    </div>
  );
}
