import type { AppLocale } from '@/i18n/routing';

export interface RoomTranslation {
  name: string;
  tagline: string;
  description: string;
  amenities: string[];
}

export interface Room {
  id: string;
  slug: string;
  /** Maximum occupancy */
  maxGuests: number;
  beds: number;
  /** Area in m² */
  areaM2: number;
  /** Base price per night in EUR */
  pricePerNightEur: number;
  coverImage: string;
  images: string[];
  translations: Record<AppLocale, RoomTranslation>;
}
