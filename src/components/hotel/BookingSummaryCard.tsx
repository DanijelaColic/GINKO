'use client';

import { Calendar, Users, MapPin, Wifi, Car, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { formatDisplayDate } from '@/modules/booking/dates';
import {
  DEPOSIT_PERCENT,
  BALANCE_DAYS_BEFORE_CHECK_IN,
  LONG_STAY_DISCOUNT_NIGHTS,
  LONG_STAY_DISCOUNT_RATE,
  SITE_NAME,
  buildAvailabilityHref,
} from '@/modules/booking/booking.config';
import { formatDate } from '@/modules/booking/dates';
import {
  REVIEWS_COPY,
  GUEST_REVIEWS,
  PROPERTY_ADDRESS,
} from '@/modules/property/property-details.config';
import BedTypeIcons from './BedTypeIcons';
import type { Room } from '@/modules/rooms/room.types';
import type { PriceBreakdown } from '@/modules/booking/booking.types';

type Props = {
  room: Room;
  checkIn: Date;
  checkOut: Date;
  priceData: PriceBreakdown;
  adults: string;
  children: string;
  locale: string;
};

const DEPOSIT_PCT = Math.round(DEPOSIT_PERCENT * 100);
const BALANCE_PCT = 100 - DEPOSIT_PCT;

// 3 ključna sadržaja prikazana uz svaku sobu u sidebaru
const SIDEBAR_AMENITIES = [
  { icon: Car, label: 'Besplatno parkiralište' },
  { icon: Wifi, label: 'Besplatni Wi-Fi' },
  { icon: Sparkles, label: 'Wellness (sauna, jacuzzi)' },
] as const;

export default function BookingSummaryCard({
  room,
  checkIn,
  checkOut,
  priceData,
  adults,
  children,
  locale,
}: Props) {
  const t = useTranslations('bookingWidget');

  const adultsCount = parseInt(adults) || 1;
  const childrenCount = parseInt(children) || 0;

  const guestsLabel = (() => {
    const adultLabel =
      adultsCount === 1 ? 'odrasli' : adultsCount < 5 ? 'odrasla' : 'odraslih';
    const parts = [`${adultsCount} ${adultLabel}`];
    if (childrenCount > 0) {
      const childLabel = childrenCount === 1 ? 'dijete' : 'djece';
      parts.push(`${childrenCount} ${childLabel}`);
    }
    return parts.join(', ');
  })();

  const nightsLabel =
    priceData.nights === 1 ? 'noć' : priceData.nights < 5 ? 'noći' : 'noći';

  const reviewCount = GUEST_REVIEWS.length;
  const reviewScore = REVIEWS_COPY.overallScore.toLocaleString('hr-HR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const reviewCountLabel =
    reviewCount === 1 ? '1 recenzija' : reviewCount < 5 ? `${reviewCount} recenzije` : `${reviewCount} recenzija`;

  return (
    <div className="bg-white border border-stone rounded-2xl overflow-hidden shadow-sm">
      {/* ── 1. Slika sobe ─────────────────────────────────────────── */}
      {room.images[0] && (
        <div className="aspect-video overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={room.images[0]}
            alt={room.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="divide-y divide-stone">
        {/* ── 2. Objekt · ocjena · adresa · sadržaji ────────────────── */}
        <div className="p-5 space-y-3">
          {/* Naziv objekta */}
          <div>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-0.5">
              {t('sidebar.propertyLabel')}
            </p>
            <h3 className="font-serif text-base font-semibold text-text leading-tight">
              {SITE_NAME}
            </h3>
          </div>

          {/* Ocjena gostiju — plavi badge kao na Bookingu */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-8 rounded-md bg-primary text-white text-sm font-bold shrink-0 leading-none">
              {reviewScore}
            </span>
            <div className="text-sm leading-tight">
              <span className="font-semibold text-text">{REVIEWS_COPY.overallLabel}</span>
              <span className="text-muted"> · {reviewCountLabel}</span>
            </div>
          </div>

          {/* Adresa */}
          <p className="flex items-start gap-1.5 text-xs text-muted">
            <MapPin size={12} className="mt-0.5 shrink-0 text-primary" />
            {PROPERTY_ADDRESS}
          </p>

          {/* Sadržaji */}
          <div className="flex flex-wrap gap-1.5">
            {SIDEBAR_AMENITIES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 text-[11px] text-muted bg-stone-light border border-stone px-2 py-1 rounded-md"
              >
                <Icon size={11} className="text-primary shrink-0" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── 3. Detalji rezervacije ─────────────────────────────────── */}
        <div className="p-5 space-y-3">
          <h4 className="text-xs font-semibold text-text uppercase tracking-widest">
            {t('sidebar.reservationDetails')}
          </h4>

          {/* Dolazak / Odlazak — 2 stupca */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-stone-light rounded-xl px-3 py-2.5">
              <p className="text-[10px] text-muted flex items-center gap-1 mb-1">
                <Calendar size={10} />
                {t('sidebar.checkIn')}
              </p>
              <p className="text-sm font-semibold text-text leading-tight">
                {formatDisplayDate(checkIn, locale)}
              </p>
              <p className="text-[11px] text-muted mt-0.5">{t('sidebar.checkInTime')}</p>
            </div>
            <div className="bg-stone-light rounded-xl px-3 py-2.5">
              <p className="text-[10px] text-muted flex items-center gap-1 mb-1">
                <Calendar size={10} />
                {t('sidebar.checkOut')}
              </p>
              <p className="text-sm font-semibold text-text leading-tight">
                {formatDisplayDate(checkOut, locale)}
              </p>
              <p className="text-[11px] text-muted mt-0.5">{t('sidebar.checkOutTime')}</p>
            </div>
          </div>

          {/* Noći · soba · gosti */}
          <div className="flex items-center gap-1.5 text-sm">
            <Users size={13} className="text-primary shrink-0" />
            <span className="text-muted">
              <span className="font-medium text-text">{priceData.nights}</span>{' '}
              {nightsLabel} · 1 soba · {guestsLabel}
            </span>
          </div>

          {/* Soba + tip kreveta */}
          <div className="bg-stone-light rounded-xl px-3 py-2.5 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-text">1× {room.name}</p>
              <p className="text-[11px] text-muted shrink-0">{room.size} m²</p>
            </div>
            <BedTypeIcons beds={room.beds} iconSize={14} />
            <p className="text-[11px] text-muted">{room.capacityNote}</p>
          </div>

          {/* Promijeni datume / goste */}
          <Link
            href={buildAvailabilityHref({
              room: room.slug,
              checkIn: formatDate(checkIn),
              checkOut: formatDate(checkOut),
              adults,
              children,
            })}
            className="text-[11px] text-primary hover:underline underline-offset-2 inline-block"
          >
            {t('sidebar.changeDates')}
          </Link>
        </div>

        {/* ── 4. Pregled cijene ──────────────────────────────────────── */}
        <div className="p-5 space-y-3">
          <h4 className="text-xs font-semibold text-text uppercase tracking-widest">
            {t('sidebar.priceBreakdown')}
          </h4>

          <div className="space-y-1.5 text-sm">
            {priceData.lines.map((line) => (
              <div key={line.label} className="flex justify-between gap-2">
                <span className="text-muted">
                  {t('summary.line', {
                    nights: line.nights,
                    label: line.label,
                    pricePerNight: line.pricePerNight,
                  })}
                </span>
                <span className="text-text font-medium shrink-0">{line.subtotal} €</span>
              </div>
            ))}

            {priceData.discountAmount ? (
              <div className="flex justify-between gap-2">
                <span className="text-muted">
                  {t('summary.discount', {
                    nights: LONG_STAY_DISCOUNT_NIGHTS,
                    percent: Math.round(LONG_STAY_DISCOUNT_RATE * 100),
                  })}
                </span>
                <span className="text-primary font-medium shrink-0">
                  − {priceData.discountAmount} €
                </span>
              </div>
            ) : null}

            {!!priceData.cleaningFee && (
              <div className="flex justify-between gap-2">
                <span className="text-muted">{t('summary.cleaningFee')}</span>
                <span className="text-text font-medium shrink-0">
                  + {priceData.cleaningFee} €
                </span>
              </div>
            )}

            <div className="border-t border-stone pt-2.5 flex justify-between items-center">
              <span className="font-semibold text-text">{t('summary.total')}</span>
              <span className="font-bold text-primary text-xl">{priceData.totalPrice} €</span>
            </div>

            <p className="text-[11px] text-muted">{t('sidebar.allFeesIncluded')}</p>
          </div>

          {/* Depozit / ostatak */}
          <div className="bg-stone-light rounded-xl p-3 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted">{t('sidebar.deposit', { percent: DEPOSIT_PCT })}</span>
              <span className="text-accent font-semibold">{priceData.deposit} €</span>
            </div>
            {BALANCE_PCT > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-muted">{t('sidebar.balance', { percent: BALANCE_PCT })}</span>
                <span className="text-text font-medium">
                  {priceData.totalPrice - priceData.deposit} €
                </span>
              </div>
            )}
            <p className="text-[11px] text-muted/60 border-t border-stone pt-2">
              {t('sidebar.balanceNote', { days: BALANCE_DAYS_BEFORE_CHECK_IN })}
            </p>
          </div>
        </div>

        {/* ── 5. Otkazivanje + trust ─────────────────────────────────── */}
        <div className="p-5 space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
            <p className="text-xs font-medium text-text leading-snug">
              {t('sidebar.freeCancellation')}
            </p>
          </div>
          <p className="text-[11px] text-muted/70 pl-5">
            {t('sidebar.directBooking')}
          </p>
        </div>
      </div>
    </div>
  );
}
