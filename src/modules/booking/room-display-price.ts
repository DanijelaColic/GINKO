/**
 * Javni prikaz cijene smještaja — ne mijenja checkout / resolveBookingPrice.
 *
 * MYRENT_PRICING_ENABLED=false → fiksni room.price (DB/listing).
 * MYRENT_PRICING_ENABLED=true → MyRent slugovi: „Od X €” iz listing cachea ili hint;
 * ginko-spa-1: fiksno iz rooms.config (90 €).
 */

import { getRoomBySlug } from '@/modules/rooms/room.repository';
import type { Room } from '@/modules/rooms/room.types';
import { usesMyRentStayPricing } from '@/modules/myrent/myrent.pricing-config';
import type { ListingFromPriceEntry } from '@/modules/myrent/myrent.listing-from-price';

export type RoomPriceDisplay =
  | { mode: 'fixed'; perNight: number }
  | {
      mode: 'from';
      perNight: number;
      referenceCheckIn?: string;
      referenceNights?: number;
    }
  | { mode: 'select_dates' };

export function getRoomPriceDisplay(
  room: Pick<Room, 'slug' | 'price'>,
  myRentPricingEnabled: boolean,
  listing?: ListingFromPriceEntry | null,
): RoomPriceDisplay {
  if (!myRentPricingEnabled) {
    return { mode: 'fixed', perNight: room.price };
  }

  if (!usesMyRentStayPricing(room.slug, true)) {
    const configured = getRoomBySlug(room.slug);
    return {
      mode: 'fixed',
      perNight: configured?.price ?? room.price,
    };
  }

  if (listing?.mode === 'from') {
    return {
      mode: 'from',
      perNight: listing.perNight,
      referenceCheckIn: listing.referenceCheckIn,
      referenceNights: listing.referenceNights,
    };
  }

  return { mode: 'select_dates' };
}

/** Za JSON-LD Offer — cijena samo kad je javno fiksna. */
export function getJsonLdOfferPrice(
  room: Pick<Room, 'slug' | 'price'>,
  myRentPricingEnabled: boolean,
  listing?: ListingFromPriceEntry | null,
): number | undefined {
  const display = getRoomPriceDisplay(room, myRentPricingEnabled, listing);
  return display.mode === 'fixed' ? display.perNight : undefined;
}