'use client';

// Newly created — client wrapper that owns filter state and renders RoomCard grid

import { useState } from 'react';
import RoomCard from './RoomCard';
import RoomFilters from './RoomFilters';
import type { Room } from '@/modules/rooms/room.types';

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
};

export default function RoomGrid({ rooms, cardLabels, filterLabels }: Props) {
  const maxGuests = Math.max(...rooms.map((r) => r.capacity), 1);
  const maxPrice = Math.max(...rooms.map((r) => r.price), 200);

  const [guests, setGuests] = useState(0);
  const [price, setPrice] = useState(0);

  const filtered = rooms.filter((r) => {
    if (guests > 0 && r.capacity < guests) return false;
    if (price > 0 && r.price > price) return false;
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
