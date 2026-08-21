/**
 * Faza 3 — deep linkovi iz widgeta na postojeće stranice/sekcije.
 * Bot ne izmišlja sadržaj; samo šalje gosta na pravo mjesto.
 */

import {
  AVAILABILITY_SECTION_HREF,
  AVAILABILITY_SECTION_ID,
  FACILITIES_SECTION_ID,
  SURROUNDINGS_SECTION_ID,
  propertySectionHref,
} from '@/modules/booking/booking.config';

export type ChatDeepLinkId =
  | 'availability'
  | 'booking'
  | 'rooms'
  | 'wellnessRoom'
  | 'gallery'
  | 'surroundings'
  | 'facilities'
  | 'privacy'
  | 'cookies'
  | 'whatsapp';

export type ChatDeepLinkDef = {
  href: string;
  /** Ako postoji, na naslovnici scrollamo umjesto pune navigacije */
  hashId?: string;
};

export const CHAT_DEEP_LINKS: Record<
  Exclude<ChatDeepLinkId, 'whatsapp'>,
  ChatDeepLinkDef
> = {
  availability: {
    href: AVAILABILITY_SECTION_HREF,
    hashId: AVAILABILITY_SECTION_ID,
  },
  booking: { href: '/booking' },
  rooms: { href: '/rooms' },
  wellnessRoom: { href: '/rooms/ginko-spa-2' },
  gallery: { href: '/gallery' },
  surroundings: {
    href: propertySectionHref(SURROUNDINGS_SECTION_ID),
    hashId: SURROUNDINGS_SECTION_ID,
  },
  facilities: {
    href: propertySectionHref(FACILITIES_SECTION_ID),
    hashId: FACILITIES_SECTION_ID,
  },
  privacy: { href: '/privacy' },
  cookies: { href: '/cookies' },
};

/** Maks. 2 linka po temi — kontekst, ne cijeli sitemap */
export const TOPIC_DEEP_LINKS: Record<string, readonly ChatDeepLinkId[]> = {
  parking: ['facilities'],
  breakfast: ['booking'],
  wifi: ['facilities'],
  therms: ['surroundings'],
  attractions: ['surroundings'],
  pets: ['booking'],
  checkin: ['facilities'],
  checkinTimes: ['facilities'],
  wellness: ['wellnessRoom', 'availability'],
  families: ['rooms'],
  booking: ['booking'],
  cancellation: ['booking', 'facilities'],
  invoice: ['booking'],
  deposit_payment: ['booking'],
  children_ages: ['booking', 'facilities'],
  smoking: ['facilities'],
  min_nights: ['booking'],
};

export function deepLinksForTopic(topicId: string): readonly ChatDeepLinkId[] {
  return TOPIC_DEEP_LINKS[topicId] ?? [];
}
