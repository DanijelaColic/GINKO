'use client';

// Copied from Villa-Jurina/src/components/admin/BookingTimeline.tsx
// Adaptations: apartments → rooms, b.apartment_slug → b.room_slug,
//              imports from @/modules/rooms/rooms.config + @/modules/booking/{dates,booking.types}
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { rooms } from '@/modules/rooms/rooms.config';
import { parseLocalDate } from '@/modules/booking/dates';
import { bookingReference } from '@/modules/booking/booking.config';
import type { Booking } from '@/modules/booking/booking.types';

const COL_W = 38;
const ROW_H = 52;
const LABEL_W = 130;

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

const ROOM_TIMELINE_COLORS = [
  '#ec4899',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
];

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

export default function BookingTimeline({ bookings, onEditBooking }: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [offset, setOffset] = useState(0);

  const roomColorBySlug = useMemo(() => {
    return rooms.reduce<Record<string, string>>((acc, room, index) => {
      acc[room.slug] = ROOM_TIMELINE_COLORS[index % ROOM_TIMELINE_COLORS.length];
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

  const getBar = (b: Booking) => {
    const ci = parseLocalDate(b.check_in);
    const co = parseLocalDate(b.check_out);
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
  };

  const visibleForRoom = (slug: string) =>
    bookings.filter((b) => {
      if (b.room_slug !== slug) return false;
      const ci = parseLocalDate(b.check_in);
      const co = parseLocalDate(b.check_out);
      return co > rangeStart && ci < rangeEndExclusive;
    });

  const todayOffset = dayDiff(rangeStart, today);
  const todayVisible = todayOffset >= 0 && todayOffset < allDays.length;

  return (
    <div className="select-none">
      <div className="flex items-center gap-3 mb-5">
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
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
          {(['confirmed', 'pending', 'cancelled'] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={clsx('w-2.5 h-2.5 rounded-sm', DOT_COLORS[s])} />
              {s === 'confirmed' ? 'Potvrđeno' : s === 'pending' ? 'Na čekanju' : 'Otkazano'}
            </span>
          ))}
        </div>
      </div>

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
              Soba
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

          {/* Room rows */}
          {rooms.map((room, roomIdx) => {
            const roomBookings = visibleForRoom(room.slug);
            return (
              <div
                key={room.slug}
                className={clsx(
                  'flex border-b border-gray-100 last:border-b-0',
                  roomIdx % 2 === 1 && 'bg-gray-50/40',
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
                        style={{ backgroundColor: roomColorBySlug[room.slug] }}
                      />
                      {room.name}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-tight">{room.capacityNote}</p>
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
                      style={{ left: todayOffset * COL_W + Math.floor(COL_W / 2) }}
                      className="absolute top-0 bottom-0 w-px bg-primary/40 pointer-events-none z-10"
                    />
                  )}

                  {roomBookings.map((booking) => {
                    const { left, width, clipped } = getBar(booking);
                    if (width <= 0) return null;
                    const color = roomColorBySlug[booking.room_slug] ?? '#3b82f6';
                    const isPending = booking.status === 'pending';
                    const barStyle =
                      booking.status === 'confirmed'
                        ? { backgroundColor: color }
                        : isPending
                          ? { backgroundColor: `${color}33`, borderColor: `${color}99` }
                          : undefined;

                    return (
                      <button
                        key={booking.id}
                        onClick={() => onEditBooking(booking)}
                        style={{ left, width, top: 7, height: ROW_H - 14, ...barStyle }}
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
        Klikni na rezervaciju za uređivanje · sobe obojane različitim bojama · isprekidano = na čekanju
      </p>
    </div>
  );
}
