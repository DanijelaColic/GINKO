'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import {
  CalendarDays, Users, AlertCircle, Maximize2,
} from 'lucide-react';
import BedTypeIcons from '@/components/hotel/BedTypeIcons';
import GuestPicker from '@/components/hotel/GuestPicker';
import RoomDetailModal from '@/components/hotel/RoomDetailModal';
import SearchFieldCell from '@/components/hotel/SearchFieldCell';
import { getRoomReserveState } from '@/components/hotel/room-reserve-state';
import { ROOM_AMENITY_ICONS } from '@/components/hotel/roomAmenityIcons';
import { calculatePrice, isRangeAvailable, parseLocalDate } from '@/modules/booking/dates';
import type { BookedRange } from '@/modules/booking/booking.types';
import type { AccommodationType, Room } from '@/modules/rooms/room.types';
import type { GoogleReviewSummary } from '@/modules/reviews/google-reviews.types';
import {
  CONTACT_EMAIL,
  AVAILABILITY_SECTION_ID,
  buildBookingHref,
  getAvailabilitySearchParams,
  propertySectionIdFromHash,
  BREAKFAST_PRICE_PER_PERSON_PER_NIGHT,
  BREAKFAST_PRICE_CHILD_3_12,
  EXTRA_BED_PRICE_PER_NIGHT,
} from '@/modules/booking/booking.config';
import {
  calculateBreakfastPerNight,
  childAgesComplete,
  parseChildAgesParam,
  resizeChildAges,
  resolvedChildAges,
  roomFitsGuestsPartial,
  roomNeedsExtraBed,
  serializeChildAges,
} from '@/modules/booking/guest-occupancy';
import { scrollToElement, scrollToSectionId } from '@/lib/scroll-to-section';

const FIELD_CLASS =
  'text-text text-sm font-medium bg-transparent outline-none cursor-pointer w-full';
const CELL_BORDER =
  'px-4 py-3 border-b sm:border-b-0 sm:border-r border-stone';

export type AvailabilityLabels = {
  selectDates: string;
  selectGuests: string;
  unavailableDates: string;
  searching: string;
  search: string;
  typeFilter: string;
  typeAll: string;
  typeRoom: string;
  typeApartment: string;
  unitRoom: string;
  unitApartment: string;
  catalogRoom: string;
  catalogApartment: string;
  noResultsAll: string;
  noResultsRooms: string;
  noResultsApartment: string;
  noResultsHint: string;
  contactUs: string;
  reserve: string;
  perNight: string;
  nightOne: string;
  nightFew: string;
  nightMany: string;
  planAccommodationOnly: string;
  planWithBreakfast: string;
  planBreakfastPerPerson: string;
  childAgesHint: string;
  childAgeNeeded: string;
  childAgeError: string;
  childAge: string;
  capacityLabel: string;
  title: string;
  subtitle: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  adults: string;
  children: string;
  guestsDone: string;
};

export function nightCountLabel(
  nights: number,
  labels: Pick<AvailabilityLabels, 'nightOne' | 'nightFew' | 'nightMany'>,
) {
  if (nights === 1) return labels.nightOne;
  if (nights >= 2 && nights <= 4) return labels.nightFew;
  return labels.nightMany;
}

type Props = {
  rooms: Room[];
  labels: AvailabilityLabels;
  reviewSummary?: GoogleReviewSummary | null;
};

type RoomStatus = {
  available: boolean;
  totalPrice: number;
  nights: number;
};

type TypeFilter = 'all' | AccommodationType;

type RoomPlan = {
  breakfast: boolean;
};

export default function AvailabilitySection({ rooms, labels, reviewSummary }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState<Array<number | null>>([]);
  const [highlightedRoom, setHighlightedRoom] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, RoomStatus | null>>({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [showAgeErrors, setShowAgeErrors] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [roomPlans, setRoomPlans] = useState<Record<string, RoomPlan>>({});
  const [detailRoomSlug, setDetailRoomSlug] = useState<string | null>(null);

  const getRoomPlan = (slug: string): RoomPlan =>
    roomPlans[slug] ?? { breakfast: false };

  const setRoomPlan = (slug: string, plan: Partial<RoomPlan>) =>
    setRoomPlans((prev) => ({ ...prev, [slug]: { ...getRoomPlan(slug), ...plan } }));

  const resultsRef = useRef<HTMLDivElement>(null);
  const lastAutoSearchKey = useRef('');

  const today = new Date().toISOString().split('T')[0];
  const hasDates = !!(checkIn && checkOut && checkIn < checkOut);

  const agesResolved = useMemo(
    () => resolvedChildAges(children, childAges),
    [children, childAges],
  );

  const breakfastPerNight = useMemo(
    () => calculateBreakfastPerNight(adults, agesResolved),
    [adults, agesResolved],
  );

  const runAvailabilityCheck = useCallback(
    async (
      dates?: {
        checkIn: string;
        checkOut: string;
        adults?: number;
        children?: number;
        childAges?: Array<number | null>;
      },
      scrollToResults = false,
    ) => {
      const ci = dates?.checkIn ?? checkIn;
      const co = dates?.checkOut ?? checkOut;
      const adultsCount = dates?.adults ?? adults;
      const childrenCount = dates?.children ?? children;
      const agesInput = dates?.childAges ?? childAges;

      if (!ci || !co || ci >= co) {
        setDateError(labels.selectDates);
        return false;
      }

      if (!childAgesComplete(childrenCount, agesInput)) {
        setDateError(null);
        setShowAgeErrors(true);
        setGuestsOpen(true);
        return false;
      }

      setDateError(null);
      setShowAgeErrors(false);
      setLoading(true);
      setSearched(true);

      const ciDate = parseLocalDate(ci);
      const coDate = parseLocalDate(co);
      const ages = resolvedChildAges(childrenCount, agesInput);

      const results = await Promise.all(
        rooms.map(async (room) => {
          try {
            const res = await fetch(`/api/bookings?room=${room.slug}`);
            const bookedRanges: BookedRange[] = res.ok ? await res.json() : [];
            const available = isRangeAvailable(ciDate, coDate, bookedRanges);
            const extraBeds = roomNeedsExtraBed(room, adultsCount, ages) ? 1 : 0;
            const priceData = available
              ? calculatePrice(ciDate, coDate, room, { extraBeds })
              : null;
            return {
              slug: room.slug,
              status: available && priceData
                ? { available: true, totalPrice: priceData.totalPrice, nights: priceData.nights }
                : { available: false, totalPrice: 0, nights: 0 },
            };
          } catch {
            return { slug: room.slug, status: null };
          }
        }),
      );

      const map: Record<string, RoomStatus | null> = {};
      results.forEach(({ slug, status }) => { map[slug] = status; });
      setStatuses(map);
      setLoading(false);

      if (scrollToResults) {
        requestAnimationFrame(() => {
          if (resultsRef.current) {
            scrollToElement(resultsRef.current);
          } else {
            scrollToSectionId(AVAILABILITY_SECTION_ID);
          }
        });
      }

      return true;
    },
    [checkIn, checkOut, rooms, labels.selectDates, adults, children, childAges],
  );

  // Latest check fn — keep in ref via effect (avoid updating ref during render)
  const runAvailabilityCheckRef = useRef(runAvailabilityCheck);
  useEffect(() => {
    runAvailabilityCheckRef.current = runAvailabilityCheck;
  }, [runAvailabilityCheck]);

  // Prefill + auto-provjera iz URL-a — samo kad se searchParams promijene
  useEffect(() => {
    const params = getAvailabilitySearchParams(
      searchParams.toString(),
      typeof window !== 'undefined' ? window.location.hash : '',
    );

    const ci = params.get('checkIn');
    const co = params.get('checkOut');
    const room = params.get('room');
    const a = parseInt(params.get('adults') ?? '');
    const ch = parseInt(params.get('children') ?? '');
    const agesFromUrl = parseChildAgesParam(params.get('childAges'));

    const nextAdults = !isNaN(a) && a >= 0 ? a : undefined;
    const nextChildren = !isNaN(ch) && ch >= 0 ? ch : undefined;
    const nextAges =
      nextChildren !== undefined
        ? agesFromUrl.length === nextChildren
          ? agesFromUrl
          : resizeChildAges(agesFromUrl, nextChildren)
        : undefined;

    // URL → form sync (legitimate external-system sync; batch in rAF)
    requestAnimationFrame(() => {
      if (ci) setCheckIn(ci);
      if (co) setCheckOut(co);
      if (room) setHighlightedRoom(room);
      if (nextAdults !== undefined) setAdults(nextAdults);
      if (nextChildren !== undefined && nextAges !== undefined) {
        setChildren(nextChildren);
        setChildAges(nextAges);
      }
    });

    const sectionId = propertySectionIdFromHash(window.location.hash);
    if (sectionId === AVAILABILITY_SECTION_ID) {
      requestAnimationFrame(() => scrollToSectionId(AVAILABILITY_SECTION_ID));
    }

    if (ci && co && ci < co) {
      const key = `${ci}|${co}|${params.get('adults') ?? ''}|${params.get('children') ?? ''}|${params.get('childAges') ?? ''}|${room ?? ''}`;
      if (key !== lastAutoSearchKey.current) {
        lastAutoSearchKey.current = key;
        void runAvailabilityCheckRef.current(
          {
            checkIn: ci,
            checkOut: co,
            ...(nextAdults !== undefined ? { adults: nextAdults } : {}),
            ...(nextChildren !== undefined ? { children: nextChildren } : {}),
            ...(nextAges !== undefined ? { childAges: nextAges } : {}),
          },
          true,
        );
      }
    }
  }, [searchParams]);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await runAvailabilityCheck(undefined, true);
    },
    [runAvailabilityCheck],
  );

  const handleReserve = (roomSlug: string) => {
    const state = getRoomReserveState(roomSlug, hasDates, adults, searched, statuses);
    if (state !== 'ready') {
      handleFixReserve(roomSlug);
      return;
    }
    setDateError(null);
    const plan = getRoomPlan(roomSlug);
    const ages = resolvedChildAges(children, childAges);
    router.push(buildBookingHref({
      room: roomSlug,
      checkIn,
      checkOut,
      adults,
      children,
      childAges: ages.length ? serializeChildAges(ages) : undefined,
      breakfast: plan.breakfast ? adults + children : 0,
      step: 2,
    }));
  };

  const handleFixReserve = useCallback(
    (roomSlug: string) => {
      setDetailRoomSlug(null);
      const state = getRoomReserveState(roomSlug, hasDates, adults, searched, statuses);

      if (state === 'dates') {
        setDateError(labels.selectDates);
      } else if (state === 'guests') {
        setDateError(labels.selectGuests);
      } else if (state === 'search') {
        void runAvailabilityCheck(undefined, true);
      } else if (state === 'unavailable') {
        setDateError(labels.unavailableDates);
      }

      requestAnimationFrame(() => scrollToSectionId(AVAILABILITY_SECTION_ID));
    },
    [hasDates, adults, searched, statuses, labels, runAvailabilityCheck],
  );

  const availableRooms = rooms.filter((r) => {
    if (typeFilter !== 'all' && r.accommodationType !== typeFilter) return false;
    if (r.fullyBooked) return false;
    // Kapacitet po ležajima — čim su gosti odabrani (npr. 2+dijete 16 → nema Ginko 1)
    if (
      (adults > 0 || children > 0) &&
      !roomFitsGuestsPartial(r, adults, children, childAges)
    ) {
      return false;
    }
    if (searched && statuses[r.slug]?.available === false) return false;
    return true;
  });

  const detailRoom = detailRoomSlug
    ? rooms.find((r) => r.slug === detailRoomSlug) ?? null
    : null;

  const noResultsMessage =
    typeFilter === 'apartman'
      ? labels.noResultsApartment
      : typeFilter === 'soba'
        ? labels.noResultsRooms
        : labels.noResultsAll;

  return (
    <section className="py-14 px-4 bg-stone-light scroll-mt-28" id={AVAILABILITY_SECTION_ID}>
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-text mb-2">
          {labels.title}
        </h2>
        <p className="text-muted text-sm mb-6">
          {labels.subtitle}
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row items-stretch bg-white border border-stone rounded-xl overflow-visible mb-8 shadow-sm relative z-30"
        >
          <SearchFieldCell
            icon={CalendarDays}
            label={labels.checkIn}
            className={`flex-1 ${CELL_BORDER}`}
          >
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value >= checkOut) setCheckOut('');
                setSearched(false);
                setDateError(null);
              }}
              className={FIELD_CLASS}
            />
          </SearchFieldCell>

          <SearchFieldCell
            icon={CalendarDays}
            label={labels.checkOut}
            className={`flex-1 ${CELL_BORDER}`}
          >
            <input
              type="date"
              value={checkOut}
              min={checkIn || today}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setSearched(false);
                setDateError(null);
              }}
              className={FIELD_CLASS}
            />
          </SearchFieldCell>

          <SearchFieldCell
            icon={Users}
            label={labels.guests}
            className={`${CELL_BORDER} relative z-40 flex-1 sm:min-w-[180px]`}
          >
            <GuestPicker
              adults={adults}
              childrenCount={children}
              childAges={childAges}
              open={guestsOpen}
              onOpenChange={setGuestsOpen}
              showAgeErrors={showAgeErrors}
              onAdultsChange={(n) => {
                setAdults(n);
                setSearched(false);
              }}
              onChildrenChange={(n) => {
                setChildren(n);
                setSearched(false);
                if (n === 0) setShowAgeErrors(false);
              }}
              onChildAgesChange={(ages) => {
                setChildAges(ages);
                setSearched(false);
                if (showAgeErrors && childAgesComplete(children, ages)) {
                  setShowAgeErrors(false);
                }
              }}
              labels={{
                adults: labels.adults,
                children: labels.children,
                guests: labels.guests,
                childAge: labels.childAge,
                childAgeNeeded: labels.childAgeNeeded,
                childAgeError: labels.childAgeError,
                agesHint: labels.childAgesHint,
                done: labels.guestsDone,
              }}
            />
          </SearchFieldCell>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full sm:w-auto self-stretch shrink-0 items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 transition-colors text-sm whitespace-nowrap"
          >
            {loading ? labels.searching : labels.search}
          </button>
        </form>

        {dateError && (
          <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{dateError}</span>
          </div>
        )}

        {/* Filter: soba / apartman */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted mr-1">
            {labels.typeFilter}
          </span>
          {([
            { value: 'all', label: labels.typeAll },
            { value: 'soba', label: labels.typeRoom },
            { value: 'apartman', label: labels.typeApartment },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTypeFilter(value)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                typeFilter === value
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-stone text-text hover:border-primary/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Kartice soba */}
        <div ref={resultsRef} className="flex flex-col gap-4 scroll-mt-28">
          {availableRooms.map((room) => {
            const status = statuses[room.slug];
            const isHighlighted = highlightedRoom === room.slug;

            return (
              <div
                key={room.slug}
                className={`bg-white border rounded-xl overflow-hidden flex flex-col sm:flex-row ${
                  isHighlighted ? 'border-primary ring-2 ring-primary/20' : 'border-stone'
                }`}
              >
                {/* Slika — otvara Booking-stil modal */}
                <button
                  type="button"
                  onClick={() => setDetailRoomSlug(room.slug)}
                  className="relative shrink-0 w-full sm:w-56 h-44 sm:h-auto overflow-hidden block cursor-pointer text-left"
                >
                  {room.images[0] ? (
                    <Image
                      src={room.images[0]}
                      alt={room.name}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 224px"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-stone flex items-center justify-center text-muted text-xs italic">
                      — foto dolazi —
                    </div>
                  )}
                </button>

                {/* Detalji */}
                <div className="flex-1 p-5 flex flex-col sm:flex-row gap-4">
                  {/* Lijevo: Booking-stil detalji */}
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => setDetailRoomSlug(room.slug)}
                      className="text-base font-semibold text-primary hover:underline mb-1 leading-tight text-left"
                    >
                      {room.name}
                    </button>

                    {searched && status?.available ? (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 mb-3">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                        {room.accommodationType === 'apartman'
                          ? labels.unitApartment
                          : labels.unitRoom}
                      </p>
                    ) : (
                      <p className="text-xs font-medium text-muted mb-3">
                        {room.accommodationType === 'apartman'
                          ? labels.catalogApartment
                          : labels.catalogRoom}
                      </p>
                    )}

                    <div className="mb-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-text bg-stone-light border border-stone px-2 py-0.5 rounded">
                          {labels.capacityLabel} {room.capacityNote}
                        </span>
                      </div>
                      <BedTypeIcons beds={room.beds} iconSize={22} />
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Maximize2 size={12} className="text-text shrink-0" />
                        {room.size} m²
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {room.amenities.map((item) => {
                        const entry = ROOM_AMENITY_ICONS[item];
                        const Icon = entry?.icon;
                        return (
                          <span
                            key={item}
                            className="inline-flex items-center gap-1 text-[11px] text-muted bg-stone/70 border border-stone px-2 py-0.5 rounded"
                          >
                            {Icon && <Icon size={11} className="shrink-0 text-primary" />}
                            {item}
                          </span>
                        );
                      })}
                    </div>

                    {/* ── Rate plan: samo smještaj / s doručkom ─────── */}
                    {(() => {
                      const plan = getRoomPlan(room.slug);
                      const needsExtra = roomNeedsExtraBed(room, adults, agesResolved);
                      const basePrice = room.price + (needsExtra ? EXTRA_BED_PRICE_PER_NIGHT : 0);
                      const bfExtra = breakfastPerNight;
                      return (
                        <div className="mt-3 border border-stone rounded-lg overflow-hidden text-sm divide-y divide-stone">
                          <label className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${!plan.breakfast ? 'bg-primary/5' : 'hover:bg-stone-light/60'}`}>
                            <span className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`plan-${room.slug}`}
                                checked={!plan.breakfast}
                                onChange={() => setRoomPlan(room.slug, { breakfast: false })}
                                className="accent-primary"
                              />
                              <span className="font-medium text-text">{labels.planAccommodationOnly}</span>
                            </span>
                            <span className="font-semibold text-primary shrink-0 ml-3">
                              {basePrice} € <span className="text-xs font-normal text-muted">/ {labels.perNight}</span>
                            </span>
                          </label>
                          <label className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${plan.breakfast ? 'bg-primary/5' : 'hover:bg-stone-light/60'}`}>
                            <span className="flex items-center gap-2 min-w-0">
                              <input
                                type="radio"
                                name={`plan-${room.slug}`}
                                checked={plan.breakfast}
                                onChange={() => setRoomPlan(room.slug, { breakfast: true })}
                                className="accent-primary shrink-0"
                              />
                              <span className="min-w-0">
                                <span className="font-medium text-text">{labels.planWithBreakfast}</span>
                                <span className="block text-[11px] text-muted leading-snug mt-0.5">
                                  0–2 gratis · 3–12 {BREAKFAST_PRICE_CHILD_3_12} € · 13+ {BREAKFAST_PRICE_PER_PERSON_PER_NIGHT} €/{labels.planBreakfastPerPerson}
                                </span>
                              </span>
                            </span>
                            <span className="font-semibold text-primary shrink-0 ml-3">
                              {basePrice + bfExtra} € <span className="text-xs font-normal text-muted">/ {labels.perNight}</span>
                            </span>
                          </label>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Desno: ukupna cijena + CTA */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-stone sm:pl-5">
                    <div className="text-right">
                      {searched && status?.available && status.totalPrice ? (
                        (() => {
                          const plan = getRoomPlan(room.slug);
                          const nights = status.nights;
                          const bfExtra = plan.breakfast ? breakfastPerNight * nights : 0;
                          const displayTotal = status.totalPrice + bfExtra;
                          return (
                            <>
                              <p className="text-2xl font-bold text-primary leading-none">
                                {displayTotal} €
                              </p>
                              <p className="text-xs text-muted mt-0.5">
                                {nights}{' '}
                                {nightCountLabel(nights, labels)}
                              </p>
                            </>
                          );
                        })()
                      ) : (
                        (() => {
                          const plan = getRoomPlan(room.slug);
                          const needsExtra = roomNeedsExtraBed(room, adults, agesResolved);
                          const basePrice = room.price + (needsExtra ? EXTRA_BED_PRICE_PER_NIGHT : 0);
                          const displayPrice = basePrice + (plan.breakfast ? breakfastPerNight : 0);
                          return (
                            <>
                              <p className="text-2xl font-bold text-primary leading-none">
                                {displayPrice} €
                              </p>
                              <p className="text-xs text-muted mt-0.5">{labels.perNight}</p>
                            </>
                          );
                        })()
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleReserve(room.slug)}
                      className="bg-primary hover:bg-primary-dark text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap"
                    >
                      {labels.reserve}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {searched && !loading && availableRooms.length === 0 && (
            <div className="text-center py-14 text-muted">
              <p className="font-serif text-xl font-semibold text-text mb-2">
                {noResultsMessage}
              </p>
              <p className="text-sm mb-6">
                {labels.noResultsHint}
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm"
              >
                {labels.contactUs}
              </a>
            </div>
          )}
        </div>
      </div>

      {detailRoom && (
        <RoomDetailModal
          room={detailRoom}
          status={statuses[detailRoom.slug]}
          searched={searched}
          plan={getRoomPlan(detailRoom.slug)}
          adults={adults}
          childAges={agesResolved}
          breakfastPerNight={breakfastPerNight}
          labels={labels}
          reviewSummary={reviewSummary}
          reserveState={getRoomReserveState(
            detailRoom.slug,
            hasDates,
            adults,
            searched,
            statuses,
          )}
          onClose={() => setDetailRoomSlug(null)}
          onReserve={() => {
            setDetailRoomSlug(null);
            handleReserve(detailRoom.slug);
          }}
          onFixReserve={() => handleFixReserve(detailRoom.slug)}
        />
      )}
    </section>
  );
}
