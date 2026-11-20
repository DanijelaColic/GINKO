'use client';

import type { RoomPriceDisplay } from '@/modules/booking/room-display-price';

type Props = {
  display: RoomPriceDisplay;
  perNightLabel: string;
  fromPerNightLabel: string;
  fromPriceNote: string;
  selectDatesHint: string;
  /** Kompaktan prikaz u kartici */
  compact?: boolean;
  /** Dodaj +X €/noć uz fiksnu (npr. pomoćni ležaj) */
  extraPerNight?: number;
  className?: string;
  amountClassName?: string;
};

export default function RoomPriceListing({
  display,
  perNightLabel,
  fromPerNightLabel,
  fromPriceNote,
  selectDatesHint,
  compact = false,
  extraPerNight = 0,
  className = '',
  amountClassName = 'text-primary font-semibold text-lg',
}: Props) {
  if (display.mode === 'select_dates') {
    return (
      <p
        className={`text-sm text-muted leading-snug ${compact ? 'text-xs' : ''} ${className}`}
      >
        {selectDatesHint}
      </p>
    );
  }

  if (display.mode === 'from') {
    const amount = display.perNight + extraPerNight;
    return (
      <div className={`space-y-1 ${className}`}>
        <div className={`flex items-baseline gap-1.5 flex-wrap ${compact ? '' : ''}`}>
          <p className={amountClassName}>
            {fromPerNightLabel.replace('{amount}', String(amount))}
          </p>
        </div>
        <p className={`text-xs text-muted leading-snug ${compact ? 'text-[11px]' : ''}`}>
          {fromPriceNote}
        </p>
      </div>
    );
  }

  const amount = display.perNight + extraPerNight;
  return (
    <div className={`flex items-baseline gap-1.5 flex-wrap ${className}`}>
      <p className={amountClassName}>
        {amount} €
      </p>
      <p className="text-xs text-muted">{perNightLabel}</p>
    </div>
  );
}