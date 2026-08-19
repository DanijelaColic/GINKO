'use client';

import { Calendar, Users, MapPin, Wifi, Car, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { formatDisplayDate } from '@/modules/booking/dates';
import {
  DEPOSIT_PERCENT,
  SITE_NAME,
  buildAvailabilityHref,
} from '@/modules/booking/booking.config';
import { formatDate } from '@/modules/booking/dates';
import { PROPERTY_ADDRESS } from '@/modules/property/property-details.config';
import type { GoogleReviewSummary } from '@/modules/reviews/google-reviews.types';
import {
  formatReviewCountLabel,
  formatReviewRating,
  getRatingLabel,
} from '@/modules/reviews/review-labels';
import BedTypeIcons from './BedTypeIcons';
import type { Room } from '@/modules/rooms/room.types';
import type { PriceBreakdown } from '@/modules/booking/booking.types';
import {
  ACCOMMODATION_LABEL,
  EXTRA_BED_LABEL,
  CRIB_LABEL,
  BREAKFAST_LABEL,
} from '@/modules/booking/dates';

type Props = {
  room: Room;
  checkIn: Date;
  checkOut: Date;
  priceData: PriceBreakdown;
  adults: string;
  /** Broj djece kao string — ne React children */
  childrenCount: string;
  locale: string;
  readOnly?: boolean;
  reviewSummary?: GoogleReviewSummary | null;
};

const DEPOSIT_PCT = Math.round(DEPOSIT_PERCENT * 100);
const BALANCE_PCT = 100 - DEPOSIT_PCT;

const PRICE_LINE_KEYS: Record<string, 'summary.accommodation' | 'summary.extraBed' | 'summary.crib' | 'summary.breakfast'> = {
  [ACCOMMODATION_LABEL]: 'summary.accommodation',
  [EXTRA_BED_LABEL]: 'summary.extraBed',
  [CRIB_LABEL]: 'summary.crib',
  [BREAKFAST_LABEL]: 'summary.breakfast',
};

const SIDEBAR_AMENITY_KEYS = [
  { icon: Car, key: 'sidebar.amenityParking' },
  { icon: Wifi, key: 'sidebar.amenityWifi' },
  { icon: Sparkles, key: 'sidebar.amenityWellness' },
] as const;

export default function BookingSummaryCard({
  room,
  checkIn,
  checkOut,
  priceData,
  adults,
  childrenCount,
  locale,
  readOnly = false,
  reviewSummary,
}: Props) {
  const t = useTranslations('bookingWidget');

  const adultsCount = parseInt(adults) || 1;
  const kidsCount = parseInt(childrenCount) || 0;

  const countLabel = (
    kind: 'night' | 'adult' | 'child',
    n: number,
  ) => {
    if (kind === 'night') {
      if (n === 1) return t('labels.night.one');
      if (n >= 2 && n <= 4) return t('labels.night.few', { count: n });
      return t('labels.night.other', { count: n });
    }
    if (kind === 'adult') {
      if (n === 1) return t('labels.adult.one');
      if (n >= 2 && n <= 4) return t('labels.adult.few', { count: n });
      return t('labels.adult.other', { count: n });
    }
    if (n === 1) return t('labels.child.one');
    if (n >= 2 && n <= 4) return t('labels.child.few', { count: n });
    return t('labels.child.other', { count: n });
  };

  const guestsLabel = (() => {
    const parts = [countLabel('adult', adultsCount)];
    if (kidsCount > 0) parts.push(countLabel('child', kidsCount));
    return parts.join(', ');
  })();

  const nightsLabel = countLabel('night', priceData.nights);

  const reviewScore = reviewSummary
    ? formatReviewRating(reviewSummary.rating, locale)
    : null;
  const reviewCountLabel = reviewSummary
    ? formatReviewCountLabel(reviewSummary.reviewCount, locale)
    : null;
  const reviewLabel = reviewSummary ? getRatingLabel(reviewSummary.rating, locale) : null;

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
        {/* ── 2. Objekt · ocjena · adresa · soba · sadržaji ─────────── */}
        <div className="p-5 space-y-3">
          <h3 className="font-serif text-base font-semibold text-text leading-tight">
            {SITE_NAME}
          </h3>

          {/* Ocjena gostiju — Google recenzije */}
          {reviewSummary && reviewScore && reviewCountLabel && reviewLabel && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-9 h-8 rounded-md bg-primary text-white text-sm font-bold shrink-0 leading-none">
                {reviewScore}
              </span>
              <div className="text-sm leading-tight">
                <span className="font-semibold text-text">{reviewLabel}</span>
                <span className="text-muted"> · {reviewCountLabel}</span>
              </div>
            </div>
          )}

          {/* Adresa */}
          <p className="flex items-start gap-1.5 text-xs text-muted">
            <MapPin size={12} className="mt-0.5 shrink-0 text-primary" />
            {PROPERTY_ADDRESS}
          </p>

          {/* Naziv sobe */}
          <p className="font-serif text-sm font-semibold text-text leading-tight">
            {room.name}
          </p>

          {/* Sadržaji */}
          <div className="flex flex-wrap gap-1.5">
            {SIDEBAR_AMENITY_KEYS.map(({ icon: Icon, key }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 text-[11px] text-muted bg-stone-light border border-stone px-2 py-1 rounded-md"
              >
                <Icon size={11} className="text-primary shrink-0" />
                {t(key)}
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
              <span className="font-medium text-text">{nightsLabel}</span>
              {' · '}
              {t('sidebar.roomCount', { count: 1 })}
              {' · '}
              {guestsLabel}
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

          {/* Promijeni datume / goste — skriveno kad je rezervacija već kreirana */}
          {!readOnly && (
            <Link
              href={buildAvailabilityHref({
                room: room.slug,
                checkIn: formatDate(checkIn),
                checkOut: formatDate(checkOut),
                adults,
                children: childrenCount,
              })}
              className="text-[11px] text-primary hover:underline underline-offset-2 inline-block"
            >
              {t('sidebar.changeDates')}
            </Link>
          )}
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
                    label: PRICE_LINE_KEYS[line.label]
                      ? t(PRICE_LINE_KEYS[line.label])
                      : line.label,
                    pricePerNight: line.pricePerNight,
                  })}
                </span>
                <span className="text-text font-medium shrink-0">{line.subtotal} €</span>
              </div>
            ))}

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
              {t('sidebar.balanceNote')}
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
