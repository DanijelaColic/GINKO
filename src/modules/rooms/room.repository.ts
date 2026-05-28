// Copied from Villa-Jurina/src/lib/apartments.ts → getApartment/getApartments/getAvailableApartments
// Renamed: Apartment→Room, apartment→room, apartments→rooms

import type { Room, RoomLocale } from './room.types';
import { rooms, roomTranslations } from './rooms.config';

function getLocalizedRoom(room: Room, locale: RoomLocale): Room {
  const localeMap = roomTranslations[locale] ?? roomTranslations.hr;
  const translated = localeMap[room.slug];
  if (!translated) return room;
  return { ...room, ...translated };
}

export function getRoom(slug: string, locale: RoomLocale = 'hr'): Room | undefined {
  const room = rooms.find((r) => r.slug === slug);
  if (!room) return undefined;
  return getLocalizedRoom(room, locale);
}

export function getRooms(locale: RoomLocale = 'hr'): Room[] {
  return rooms.map((room) => getLocalizedRoom(room, locale));
}

export function getAvailableRooms(locale: RoomLocale = 'hr'): Room[] {
  return getRooms(locale).filter((r) => !r.fullyBooked);
}
