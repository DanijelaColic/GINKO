'use client';

// Newly created — client wrapper that owns filter state and renders RoomCard grid

import { useState } from 'react';
import RoomCard from './RoomCard';
import RoomFilters from './RoomFilters';
import type { Room } from '@/modules/rooms/room.types';
import { getRoomPriceDisplay } from '@/modules/booking/room-display-price';
import type { ListingFromPriceMap } from '@/modules/myrent/myrent.listing-from-price';

type CardLabels = React.ComponentProps<typeof RoomCard>['labels'];

type Props = {
  rooms: Room[];
  cardLabels: CardLabels;
  filterLabels: {
    guestsLabel: string;
    maxPriceLabel: string;
    any: string;
    noResults: string;
  };
  myRentPricingEnabled?: boolean;
  listingFromBySlug?: ListingFromPriceMap;
};

export default function RoomGrid({
  rooms,
  cardLabels,
  filterLabels,
  myRentPricingEnabled = false,
  listingFromBySlug,
}: Props) {
  const maxGuests = Math.max(...rooms.map((r) => r.capacity), 1);
  const filterablePrices = rooms
    .map((r) =>
      getRoomPriceDisplay(r, myRentPricingEnabled, listingFromBySlug?.[r.slug]),
    )
    .filter(
      (d): d is { mode: 'fixed' | 'from'; perNight: number } =>
        d.mode === 'fixed' || d.mode === 'from',
    )
    .map((d) => d.perNight);
  const maxPrice = Math.max(...filterablePrices, 200);
  const hideMaxPrice = false;

  const [guests, setGuests] = useState(0);
  const [price, setPrice] = useState(0);

  const filtered = rooms.filter((r) => {
    if (guests > 0 && r.capacity < guests) return false;
    if (price > 0) {
      const display = getRoomPriceDisplay(
        r,
        myRentPricingEnabled,
        listingFromBySlug?.[r.slug],
      );
      if (
        (display.mode === 'fixed' || display.mode === 'from') &&
        display.perNight > price
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div>
      <div className="mb-8 p-4 bg-stone-light rounded-xl">
        <RoomFilters
          maxGuests={maxGuests}
          maxPrice={maxPrice}
          guests={guests}
          price={price}
          labels={filterLabels}
          onGuestsChange={setGuests}
          onPriceChange={setPrice}
          hideMaxPrice={hideMaxPrice}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted py-16 italic">{filterLabels.noResults}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((room, index) => (
            <RoomCard
              key={room.slug}
              room={room}
              labels={cardLabels}
              priority={index === 0}
              myRentPricingEnabled={myRentPricingEnabled}
              listingFromBySlug={listingFromBySlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
