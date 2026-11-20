/**
 * Javni prikaz cijene smještaja (Faza 1) — ne mijenja checkout / resolveBookingPrice.
 *
 * MYRENT_PRICING_ENABLED=false → fiksni room.price (DB/listing).
 * MYRENT_PRICING_ENABLED=true → MyRent slugovi: tekst „odaberite datume“;
 * ginko-spa-1: fiksno iz rooms.config (90 €).
 */

import { getRoomBySlug } from '@/modules/rooms/room.repository';
import type { Room } from '@/modules/rooms/room.types';
import { usesMyRentStayPricing } from '@/modules/myrent/myrent.pricing-config';

export type RoomPriceDisplay =
  | { mode: 'fixed'; perNight: number }
  | { mode: 'select_dates' };

export function getRoomPriceDisplay(
  room: Pick<Room, 'slug' | 'price'>,
  myRentPricingEnabled: boolean,
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

  return { mode: 'select_dates' };
}

/** Za JSON-LD Offer — cijena samo kad je javno fiksna. */
export function getJsonLdOfferPrice(
  room: Pick<Room, 'slug' | 'price'>,
  myRentPricingEnabled: boolean,
): number | undefined {
  const display = getRoomPriceDisplay(room, myRentPricingEnabled);
  return display.mode === 'fixed' ? display.perNight : undefined;
}