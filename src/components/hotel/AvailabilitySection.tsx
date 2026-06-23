'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import {
  CalendarDays, Users, AlertCircle,
  Wifi, Wind, Car, Waves, Tv, Sun, Flame,
  PawPrint, UtensilsCrossed, Maximize2,
} from 'lucide-react';
import BedTypeIcons from '@/components/hotel/BedTypeIcons';
import { calculatePrice, isRangeAvailable, parseLocalDate } from '@/modules/booking/dates';
import type { BookedRange } from '@/modules/booking/booking.types';
import type { Room } from '@/modules/rooms/room.types';
import {
  CONTACT_EMAIL,
  AVAILABILITY_SECTION_ID,
  buildBookingHref,
  getAvailabilitySearchParams,
  propertySectionIdFromHash,
} from '@/modules/booking/booking.config';
import { scrollToElement, scrollToSectionId } from '@/lib/scroll-to-section';

type AmenityIconEntry = { icon: React.ElementType; label: string };

const AMENITY_ICONS: Record<string, AmenityIconEntry> = {
  'WiFi':                   { icon: Wifi,            label: 'Besplatni Wi-Fi' },
  'LCD TV':                 { icon: Tv,              label: 'LCD TV' },
  'Satelitski TV':          { icon: Tv,              label: 'SAT TV' },
  'Klima':                  { icon: Wind,            label: 'Klima-uređaj' },
  'Sauna':                  { icon: Waves,           label: 'Sauna' },
  'Jacuzzi':                { icon: Waves,           label: 'Jacuzzi' },
  'Terasa':                 { icon: Sun,             label: 'Terasa' },
  'Parking':                { icon: Car,             label: 'Besplatno parkiralište' },
  'Grijanje':               { icon: Flame,           label: 'Grijanje' },
  'Posebna kuhinja':        { icon: UtensilsCrossed, label: 'Kuhinja' },
  'Kućni ljubimci na upit': { icon: PawPrint,        label: 'Kućni ljubimci na upit' },
};

type Props = {
  rooms: Room[];
};

type RoomStatus = {
  available: boolean;
  totalPrice: number;
  nights: number;
};

export default function AvailabilitySection({ rooms }: Props) {
  const t = useTranslations('homePage');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [highlightedRoom, setHighlightedRoom] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, RoomStatus | null>>({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);
  const lastAutoSearchKey = useRef('');

  const today = new Date().toISOString().split('T')[0];
  const hasDates = !!(checkIn && checkOut && checkIn < checkOut);

  const runAvailabilityCheck = useCallback(
    async (dates?: { checkIn: string; checkOut: string }, scrollToResults = false) => {
      const ci = dates?.checkIn ?? checkIn;
      const co = dates?.checkOut ?? checkOut;

      if (!ci || !co || ci >= co) {
        setDateError(t('availabilitySelectDates'));
        return false;
      }

      setDateError(null);
      setLoading(true);
      setSearched(true);

      const ciDate = parseLocalDate(ci);
      const coDate = parseLocalDate(co);

      const results = await Promise.all(
        rooms.map(async (room) => {
          try {
            const res = await fetch(`/api/bookings?room=${room.slug}`);
            const bookedRanges: BookedRange[] = res.ok ? await res.json() : [];
            const available = isRangeAvailable(ciDate, coDate, bookedRanges);
            const priceData = available ? calculatePrice(ciDate, coDate, room) : null;
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
    [checkIn, checkOut, rooms, t],
  );

  // Prefill + auto-provjera iz URL-a (hero search bar, linkovi soba)
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

    if (ci) setCheckIn(ci);
    if (co) setCheckOut(co);
    if (room) setHighlightedRoom(room);
    if (!isNaN(a) && a >= 1) setAdults(a);
    if (!isNaN(ch) && ch >= 0) setChildren(ch);

    const sectionId = propertySectionIdFromHash(window.location.hash);
    if (sectionId === AVAILABILITY_SECTION_ID) {
      requestAnimationFrame(() => scrollToSectionId(AVAILABILITY_SECTION_ID));
    }

    if (ci && co && ci < co) {
      const key = `${ci}|${co}|${params.get('adults') ?? ''}|${params.get('children') ?? ''}|${room ?? ''}`;
      if (key !== lastAutoSearchKey.current) {
        lastAutoSearchKey.current = key;
        void runAvailabilityCheck({ checkIn: ci, checkOut: co }, true);
      }
    }
  }, [searchParams, runAvailabilityCheck]);

  useEffect(() => {
    if (hasDates) setDateError(null);
  }, [hasDates]);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await runAvailabilityCheck(undefined, true);
    },
    [runAvailabilityCheck],
  );

  const handleReserve = (roomSlug: string) => {
    if (!hasDates) {
      setDateError(t('availabilitySelectDates'));
      return;
    }
    setDateError(null);
    router.push(buildBookingHref({ room: roomSlug, checkIn, checkOut, adults, children }));
  };

  const totalGuests = adults + children;

  const availableRooms = rooms.filter((r) => {
    if (r.fullyBooked) return false;
    if (r.capacity < totalGuests) return false;
    if (searched && statuses[r.slug]?.available === false) return false;
    return true;
  });

  return (
    <section className="py-14 px-4 bg-stone-light scroll-mt-28" id={AVAILABILITY_SECTION_ID}>
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-text mb-2">
          Raspoloživost
        </h2>
        <p className="text-muted text-sm mb-6">
          Odaberite datume i provjerite dostupnost
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row items-stretch bg-white border border-stone rounded-xl overflow-hidden mb-8 shadow-sm"
        >
          <label className="flex-1 flex items-center gap-3 px-4 py-3 border-b sm:border-b-0 sm:border-r border-stone hover:bg-stone-light/60 cursor-pointer">
            <CalendarDays size={16} className="text-primary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
                Dolazak
              </span>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (checkOut && e.target.value >= checkOut) setCheckOut('');
                  setSearched(false);
                }}
                className="text-text text-sm font-medium bg-transparent outline-none cursor-pointer w-full"
              />
            </div>
          </label>

          <label className="flex-1 flex items-center gap-3 px-4 py-3 border-b sm:border-b-0 sm:border-r border-stone hover:bg-stone-light/60 cursor-pointer">
            <CalendarDays size={16} className="text-primary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
                Odlazak
              </span>
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={(e) => { setCheckOut(e.target.value); setSearched(false); }}
                className="text-text text-sm font-medium bg-transparent outline-none cursor-pointer w-full"
              />
            </div>
          </label>

          {/* Odrasli */}
          <label className="flex items-center gap-3 px-4 py-3 border-b sm:border-b-0 sm:border-r border-stone hover:bg-stone-light/60 cursor-pointer">
            <Users size={16} className="text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
                Odrasli
              </span>
              <select
                value={adults}
                onChange={(e) => {
                  const a = Number(e.target.value);
                  setAdults(a);
                  if (children > 3 - a) setChildren(Math.max(0, 3 - a));
                  setSearched(false);
                }}
                className="text-text text-sm font-medium bg-transparent outline-none cursor-pointer pr-2"
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </label>

          {/* Djeca */}
          <label className="flex items-center gap-3 px-4 py-3 border-b sm:border-b-0 sm:border-r border-stone hover:bg-stone-light/60 cursor-pointer">
            <Users size={16} className="text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-muted">
                Djeca
              </span>
              <select
                value={children}
                onChange={(e) => { setChildren(Number(e.target.value)); setSearched(false); }}
                className="text-text text-sm font-medium bg-transparent outline-none cursor-pointer pr-2"
              >
                {Array.from({ length: Math.max(1, 3 - adults + 1) }, (_, i) => i).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full sm:w-auto self-stretch shrink-0 items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 transition-colors text-sm whitespace-nowrap"
          >
            {loading ? t('availabilitySearching') : t('heroSearch')}
          </button>
        </form>

        {dateError && (
          <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{dateError}</span>
          </div>
        )}

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
                {/* Slika */}
                <Link
                  href={`/rooms/${room.slug}`}
                  className="relative shrink-0 w-full sm:w-56 h-44 sm:h-auto overflow-hidden block"
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
                </Link>

                {/* Detalji */}
                <div className="flex-1 p-5 flex flex-col sm:flex-row gap-4">
                  {/* Lijevo: Booking-stil detalji */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/rooms/${room.slug}`}>
                      <h3 className="text-base font-semibold text-primary hover:underline mb-1 leading-tight">
                        {room.name}
                      </h3>
                    </Link>

                    <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 mb-3">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                      1 soba dostupna
                    </p>

                    <div className="mb-3 space-y-2">
                      <BedTypeIcons beds={room.beds} iconSize={22} />
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Maximize2 size={12} className="text-text shrink-0" />
                        {room.size} m²
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {room.amenities.map((item) => {
                        const entry = AMENITY_ICONS[item];
                        const Icon = entry?.icon;
                        return (
                          <span
                            key={item}
                            className="inline-flex items-center gap-1 text-[11px] text-muted bg-stone/70 border border-stone px-2 py-0.5 rounded"
                          >
                            {Icon && <Icon size={11} className="shrink-0 text-primary" />}
                            {entry?.label ?? item}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Desno: cijena + CTA */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-stone sm:pl-5">
                    <div className="text-right">
                      {searched && status?.available && status.totalPrice ? (
                        <>
                          <p className="text-2xl font-bold text-primary leading-none">
                            {status.totalPrice} €
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {status.nights} {status.nights === 1 ? 'noć' : 'noći'}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-primary leading-none">
                            {room.priceOffSeason} €
                          </p>
                          <p className="text-xs text-muted mt-0.5">po noći</p>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleReserve(room.slug)}
                      className="bg-primary hover:bg-primary-dark text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap"
                    >
                      Rezerviraj
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {searched && !loading && availableRooms.length === 0 && (
            <div className="text-center py-14 text-muted">
              <p className="font-serif text-xl font-semibold text-text mb-2">
                Nema dostupnih soba za odabrani period.
              </p>
              <p className="text-sm mb-6">
                Pokušajte s drugim datumima ili nas kontaktirajte direktno.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm"
              >
                Kontaktirajte nas
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
