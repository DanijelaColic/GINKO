'use client';

import { Calendar, Users, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatDisplayDate } from '@/modules/booking/dates';
import {
  DEPOSIT_PERCENT,
  BALANCE_DAYS_BEFORE_CHECK_IN,
  LONG_STAY_DISCOUNT_NIGHTS,
  LONG_STAY_DISCOUNT_RATE,
} from '@/modules/booking/booking.config';
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

  return (
    <div className="bg-white border border-stone rounded-2xl overflow-hidden shadow-sm">
      {/* Slika sobe */}
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

      <div className="p-5 space-y-5">
        {/* Naziv sobe */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
            <MapPin size={11} />
            <span>Daruvar, Hrvatska</span>
          </div>
          <h3 className="font-serif text-lg font-semibold text-text leading-tight">
            {room.name}
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {room.capacityNote} · {room.size} m²
          </p>
        </div>

        {/* Datumi i gosti */}
        <div className="bg-stone-light rounded-xl divide-y divide-stone">
          <div className="flex justify-between items-center px-3 py-2.5 text-sm">
            <span className="text-muted flex items-center gap-1.5">
              <Calendar size={13} />
              {t('sidebar.checkIn')}
            </span>
            <span className="font-medium text-text text-right">
              {formatDisplayDate(checkIn, locale)}
            </span>
          </div>
          <div className="flex justify-between items-center px-3 py-2.5 text-sm">
            <span className="text-muted flex items-center gap-1.5">
              <Calendar size={13} />
              {t('sidebar.checkOut')}
            </span>
            <span className="font-medium text-text text-right">
              {formatDisplayDate(checkOut, locale)}
            </span>
          </div>
          <div className="flex justify-between items-center px-3 py-2.5 text-sm">
            <span className="text-muted flex items-center gap-1.5">
              <Users size={13} />
              {t('sidebar.guests')}
            </span>
            <span className="font-medium text-text text-right">
              {adultsCount}{' '}
              {adultsCount === 1 ? 'odrasli' : adultsCount < 5 ? 'odrasla' : 'odraslih'}
              {childrenCount > 0 && (
                <>
                  {', '}
                  {childrenCount} {childrenCount === 1 ? 'dijete' : 'djece'}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Sažetak cijene */}
        <div>
          <h4 className="text-xs font-semibold text-text uppercase tracking-widest mb-3">
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
          </div>
        </div>

        {/* Depozit i ostatak */}
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
          <p className="text-[11px] text-muted/70 border-t border-stone pt-2">
            {t('sidebar.directBooking')}
          </p>
        </div>
      </div>
    </div>
  );
}
