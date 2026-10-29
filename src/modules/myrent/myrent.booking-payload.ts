/**
 * Priprema MyRent rent_add payload iz Ginko bookinga.
 * Ne šalje ništa — čista transformacija.
 */

import { getMyRentObjectId } from './myrent.config';
import type { MyRentRentAddPayload } from './myrent.booking-sync.types';

/** Minimalni booking shape za sync (bez ovisnosti o cijelom DB redu). */
export type BookingForMyRentSync = {
  id: string;
  room_slug: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  adults: number;
  children: number;
  total_price: number;
  deposit: number;
  deposit_paid: boolean;
  include_wellness: boolean;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
};

export class MyRentPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MyRentPayloadError';
  }
}

function spaOfferForSlug(
  roomSlug: string,
  includeWellness: boolean,
): MyRentRentAddPayload['spa_offer'] {
  if (roomSlug === 'ginko-spa-1' || roomSlug === 'ginko-spa-2') {
    return includeWellness || roomSlug === 'ginko-spa-2' ? 'wellness' : 'standard';
  }
  return null;
}

/**
 * Gradi payload za budući MyRent write.
 * SPA 1 i SPA 2 → object_id 7460; razlikuju se spa_offer / note.
 */
export function buildMyRentRentAddPayload(
  booking: BookingForMyRentSync,
  opts?: { myRentUserId?: string },
): MyRentRentAddPayload {
  const objectId = getMyRentObjectId(booking.room_slug);
  if (objectId == null) {
    throw new MyRentPayloadError(
      `Nema MyRent object_id za sobu: ${booking.room_slug}`,
    );
  }

  const spaOffer = spaOfferForSlug(
    booking.room_slug,
    booking.include_wellness === true,
  );

  const noteParts = [
    'Source: Ginko website',
    `Ginko booking: ${booking.id}`,
    `room_slug: ${booking.room_slug}`,
  ];
  if (spaOffer === 'wellness') {
    noteParts.push('SPA offer: with wellness');
  } else if (spaOffer === 'standard') {
    noteParts.push('SPA offer: without wellness');
  }
  if (booking.notes?.trim()) {
    noteParts.push(`Guest notes: ${booking.notes.trim()}`);
  }

  const userId =
    opts?.myRentUserId?.trim() ||
    process.env.MYRENT_USER_ID?.trim() ||
    '';

  return {
    object_id: objectId,
    user_id: userId,
    from_date: booking.check_in,
    until_date: booking.check_out,
    erp_id: booking.id,
    adults: booking.adults,
    children: booking.children,
    price: Number(booking.total_price),
    in_advance: Number(booking.deposit),
    in_advance_paid: booking.deposit_paid ? 'Y' : 'N',
    paid: 'N',
    currency_id: '2',
    exchange: '1',
    contact_name: booking.guest_name,
    contact_email: booking.guest_email,
    contact_tel: booking.guest_phone,
    note: noteParts.join(' | '),
    spa_offer: spaOffer,
    room_slug: booking.room_slug,
    include_wellness: booking.include_wellness === true,
  };
}
