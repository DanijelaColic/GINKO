'use client';

import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { X, Check, Maximize2, Users } from 'lucide-react';
import BedTypeIcons from '@/components/hotel/BedTypeIcons';
import RoomModalGallery from '@/components/hotel/RoomModalGallery';
import { ROOM_AMENITY_ICONS } from '@/components/hotel/roomAmenityIcons';
import { groupRoomAmenities } from '@/modules/rooms/room-amenities.config';
import { BREAKFAST_PRICE_PER_PERSON_PER_NIGHT, BREAKFAST_PRICE_CHILD_3_12, DEPOSIT_PERCENT, EXTRA_BED_PRICE_PER_NIGHT } from '@/modules/booking/booking.config';
import type { GoogleReviewSummary } from '@/modules/reviews/google-reviews.types';
import {
  formatReviewRating,
  getRatingLabel,
} from '@/modules/reviews/review-labels';
import type { Room } from '@/modules/rooms/room.types';
import type { RoomReserveState } from '@/components/hotel/room-reserve-state';
import { nightCountLabel, type AvailabilityLabels } from '@/components/hotel/AvailabilitySection';
import { roomNeedsExtraBed } from '@/modules/booking/guest-occupancy';

type RoomStatus = {
  available: boolean;
  totalPrice: number;
  nights: number;
};

type RoomPlan = {
  breakfast: boolean;
};

type Props = {
  room: Room;
  status: RoomStatus | null | undefined;
  searched: boolean;
  plan: RoomPlan;
  adults: number;
  childAges: number[];
  breakfastPerNight: number;
  labels: AvailabilityLabels;
  reviewSummary?: GoogleReviewSummary | null;
  reserveState: RoomReserveState;
  onClose: () => void;
  onReserve: () => void;
  onFixReserve: () => void;
};

export default function RoomDetailModal({
  room,
  status,
  searched,
  plan,
  adults,
  childAges,
  breakfastPerNight,
  labels,
  reviewSummary,
  reserveState,
  onClose,
  onReserve,
  onFixReserve,
}: Props) {
  const t = useTranslations('roomDetailModal');
  const locale = useLocale();
  const amenityGroups = groupRoomAmenities(room);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const needsExtra = roomNeedsExtraBed(room, adults, childAges);
  const basePerNight = room.price + (needsExtra ? EXTRA_BED_PRICE_PER_NIGHT : 0);
  const breakfastExtra = plan.breakfast
    ? breakfastPerNight * (status?.nights ?? 1)
    : 0;
  const breakfastNight = plan.breakfast ? breakfastPerNight : 0;

  const displayTotal = searched && status?.available && status.totalPrice
    ? status.totalPrice + breakfastExtra
    : basePerNight + breakfastNight;

  const nights = status?.nights ?? 0;
  const showStayTotal = searched && status?.available && nights > 0;

  const depositPct = Math.round(DEPOSIT_PERCENT * 100);
  const balancePct = 100 - depositPct;
  const depositAmount = Math.round(displayTotal * DEPOSIT_PERCENT);
  const balanceAmount = displayTotal - depositAmount;

  const reviewScore = reviewSummary
    ? formatReviewRating(reviewSummary.rating, locale)
    : null;
  const reviewLabel = reviewSummary ? getRatingLabel(reviewSummary.rating, locale) : null;

  const resolveItemLabel = (item: string) => {
    if (item === '__sea_view__') return t('amenitySeaView');
    if (item === '__balcony__') return t('amenityBalcony');
    if (item === '__no_smoking__') return t('noSmoking');
    return item;
  };

  const groupTitle = (id: string) => {
    const key = `group${id.charAt(0).toUpperCase()}${id.slice(1)}` as
      | 'groupBathroom'
      | 'groupView'
      | 'groupFacilities'
      | 'groupWellness'
      | 'groupSmoking';
    return t(key);
  };

  const isReady = reserveState === 'ready';

  const ctaLabel = (() => {
    switch (reserveState) {
      case 'dates':
        return t('selectDatesCta');
      case 'guests':
        return t('selectGuestsCta');
      case 'search':
        return t('checkAvailabilityCta');
      case 'unavailable':
        return t('changeDatesCta');
      default:
        return labels.reserve;
    }
  })();

  const ctaHint = (() => {
    switch (reserveState) {
      case 'dates':
        return t('selectDatesHint');
      case 'guests':
        return t('selectGuestsHint');
      case 'search':
        return t('checkAvailabilityHint');
      case 'unavailable':
        return t('unavailableHint');
      default:
        return null;
    }
  })();

  const handleCtaClick = () => {
    if (isReady) onReserve();
    else onFixReserve();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden bg-white sm:h-[90vh] sm:rounded-xl sm:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-detail-title"
      >
        {/* Zatvori */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-full bg-white/95 p-2 text-muted shadow hover:bg-white hover:text-text transition-colors"
          aria-label={t('close')}
        >
          <X size={20} />
        </button>

        {/* Scroll: galerija + detalji + donji bar (nije fiksan) */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col md:flex-row md:items-start">
            {/* Lijevo: galerija — sticky na desktopu dok se skrola desno */}
            <div className="h-[220px] shrink-0 md:h-auto md:w-[45%] md:sticky md:top-0 md:self-start border-b md:border-b-0 md:border-r border-stone">
              <div className="h-full md:min-h-[min(70vh,560px)]">
                <RoomModalGallery images={room.images} alt={room.name} />
              </div>
            </div>

            {/* Desno: detalji */}
            <div className="flex-1 px-5 py-5 sm:px-6">
            <h2
              id="room-detail-title"
              className="text-lg sm:text-xl font-bold text-text leading-snug pr-10 mb-3"
            >
              {room.name}
            </h2>

            {/* Chipovi sadržaja */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className="inline-flex items-center gap-1 text-[11px] text-muted bg-stone/70 border border-stone px-2 py-0.5 rounded">
                <Maximize2 size={11} className="shrink-0 text-primary" />
                {room.size} m²
              </span>
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

            {/* Veličina + kreveti */}
            <div className="mb-4 space-y-2 border-b border-stone pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-text bg-stone-light border border-stone px-2 py-0.5 rounded">
                  {labels.capacityLabel} {room.capacityNote}
                </span>
              </div>
              <p className="text-sm text-text">
                <span className="font-semibold">{t('sizeLabel')}</span>{' '}
                {room.size} m²
              </p>
              <BedTypeIcons beds={room.beds} iconSize={22} />
            </div>

            {/* Recenzije gostiju — Booking stil */}
            {reviewSummary && reviewScore && reviewLabel && (
              <div className="mb-4 flex items-center gap-2.5 border-b border-stone pb-4">
                <span className="inline-flex items-center justify-center min-w-[2.25rem] h-8 rounded-md bg-primary text-white text-sm font-bold shrink-0 px-1.5 leading-none">
                  {reviewScore}
                </span>
                <p className="text-sm text-text leading-snug">
                  <span className="font-semibold">{reviewLabel}</span>
                  <span className="text-muted">
                    {' '}
                    – {t('basedOnReviews', { count: reviewSummary.reviewCount })}
                  </span>
                </p>
              </div>
            )}

            {/* Opis */}
            <p className="text-sm text-muted leading-relaxed mb-6">{room.description}</p>

            {/* Grupirani sadržaji */}
            <div className="space-y-5">
              {amenityGroups.map((group) => (
                <div key={group.id}>
                  <h3 className="font-semibold text-sm text-text mb-2">
                    {groupTitle(group.id)}
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted">
                        <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{resolveItemLabel(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          </div>

          {/* Donji bar — na kraju scrolla */}
          <div className="border-t border-stone bg-white px-4 py-4 sm:px-5">
            {/* Red: naziv sobe + cijena */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-start gap-2 min-w-0">
              <Users size={16} className="text-muted shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-text leading-snug">{room.name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl sm:text-2xl font-bold text-emerald-700 leading-none">
                {displayTotal} €
              </p>
              <p className="text-xs text-muted mt-0.5">
                {showStayTotal
                  ? t('forNights', { nights, label: nightCountLabel(nights, labels) })
                  : labels.perNight}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {/* Lijevo: uvjeti + kreveti */}
            <div className="space-y-1.5 min-w-0">
              <p className="flex items-start gap-2 text-sm text-emerald-700">
                <Check size={15} className="shrink-0 mt-0.5" />
                <span>{t('freeCancellation')}</span>
              </p>
              <p className="flex items-start gap-2 text-sm text-text">
                <Check size={15} className="shrink-0 mt-0.5 text-primary" />
                <span>
                  {t('depositAtBooking', { percent: depositPct, amount: depositAmount })}
                </span>
              </p>
              <p className="text-sm text-muted pl-[23px]">
                {t('balanceAtProperty', { percent: balancePct, amount: balanceAmount })}
              </p>
              <p className="text-sm text-muted pl-[23px]">
                {plan.breakfast
                  ? t('breakfastIncludedAgeBased', {
                      adult: BREAKFAST_PRICE_PER_PERSON_PER_NIGHT,
                      child: BREAKFAST_PRICE_CHILD_3_12,
                    })
                  : t('breakfastOptionalAgeBased', {
                      adult: BREAKFAST_PRICE_PER_PERSON_PER_NIGHT,
                      child: BREAKFAST_PRICE_CHILD_3_12,
                    })}
              </p>
              <div className="pt-1 pl-[23px]">
                <BedTypeIcons beds={room.beds} iconSize={16} />
              </div>
            </div>

            {/* Desno: CTA */}
            <div className="flex flex-col items-stretch sm:items-end gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCtaClick}
                className={
                  isReady
                    ? 'bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap'
                    : 'border border-stone bg-stone-light hover:bg-stone text-text font-semibold px-8 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap'
                }
              >
                {ctaLabel}
              </button>
              {isReady ? (
                <>
                  <span className="text-xs text-muted text-center sm:text-right">{t('bookInMinutes')}</span>
                  <span className="text-[10px] text-muted text-center sm:text-right">{t('depositAtBookingNote')}</span>
                </>
              ) : (
                <span className="text-xs text-muted text-center sm:text-right max-w-[220px]">{ctaHint}</span>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
