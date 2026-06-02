// Extracted from Villa-Jurina apartmani/page.tsx listing item → adapted into vertical card
// Color classes adapted: secondary→accent, sand→stone, sand-light→stone-light

import Image from 'next/image';
import { Users, Maximize2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Room } from '@/modules/rooms/room.types';

type Props = {
  room: Room;
  labels: {
    itemLabel: string;
    fullyBooked: string;
    duplex: string;
    seaView: string;
    balcony: string;
    priceTitle: string;
    offSeason: string;
    highSeason: string;
    perNight: string;
    unavailable: string;
    details: string;
    book: string;
  };
};

export default function RoomCard({ room, labels }: Props) {
  return (
    <div className="rounded-2xl border border-stone bg-white overflow-hidden flex flex-col">
      {/* Cover image */}
      <Link
        href={`/rooms/${room.slug}`}
        className="aspect-[4/3] relative bg-stone block group overflow-hidden"
      >
        {room.images[0] ? (
          <Image
            src={room.images[0]}
            alt={room.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted text-sm italic">
            — foto dolazi uskoro —
          </div>
        )}
        {room.fullyBooked && (
          <div className="absolute top-3 left-3 bg-text/80 text-white text-xs font-medium px-3 py-1.5 rounded-full z-10">
            {labels.fullyBooked}
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-accent font-medium tracking-widest text-xs uppercase mb-1">
          {labels.itemLabel}
        </p>
        <h2 className="font-serif text-xl font-semibold text-text mb-1">{room.name}</h2>
        <p className="text-muted text-sm leading-relaxed mb-4">{room.tagline}</p>

        {/* Stats */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Users size={13} className="text-accent" />
            {room.capacityNote}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Maximize2 size={13} className="text-accent" />
            {room.size} m²
          </span>
          {room.floors > 1 && (
            <span className="text-xs bg-stone text-text px-2.5 py-1 rounded-full">
              {labels.duplex}
            </span>
          )}
          {room.view && (
            <span className="text-xs bg-stone text-text px-2.5 py-1 rounded-full">
              {labels.seaView}
            </span>
          )}
          {room.balcony && (
            <span className="text-xs bg-stone text-text px-2.5 py-1 rounded-full">
              {labels.balcony}
            </span>
          )}
        </div>

        {/* Price */}
        {!room.fullyBooked ? (
          <div className="mb-4 p-3 bg-stone-light rounded-xl">
            <p className="text-xs text-muted uppercase tracking-widest font-medium mb-1.5">
              {labels.priceTitle}
            </p>
            {room.priceOffSeason === room.priceHighSeason ? (
              // Flat pricing — same all year
              <div className="flex items-baseline gap-1.5">
                <p className="text-primary font-semibold text-lg">{room.priceOffSeason}€</p>
                <p className="text-xs text-muted">{labels.perNight}</p>
              </div>
            ) : (
              // Seasonal pricing
              <div className="flex gap-5">
                <div>
                  <p className="text-xs text-muted mb-0.5">{labels.offSeason}</p>
                  <p className="text-primary font-semibold">{room.priceOffSeason}€</p>
                </div>
                <div className="w-px bg-stone" />
                <div>
                  <p className="text-xs text-muted mb-0.5">{labels.highSeason}</p>
                  <p className="text-primary font-semibold">{room.priceHighSeason}€</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4 p-3 bg-stone-light rounded-xl text-muted text-sm">
            {labels.unavailable}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <Link
            href={`/rooms/${room.slug}`}
            className="border border-primary text-primary hover:bg-primary hover:text-white font-medium px-4 py-2 rounded-full transition-colors text-sm"
          >
            {labels.details}
          </Link>
          {!room.fullyBooked && (
            <Link
              href={`/booking?room=${room.slug}`}
              className="bg-accent hover:bg-accent-light text-white font-medium px-4 py-2 rounded-full transition-colors text-sm"
            >
              {labels.book}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
