// Copied from Villa-Jurina/src/lib/apartments.ts → renamed Apartment→Room

export type Room = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  capacity: number;
  capacityNote: string;
  size: number; // m²
  beds: string;
  view: boolean;
  balcony: boolean;
  floors: number;
  priceOffSeason: number; // €/night outside July–August
  priceHighSeason: number; // €/night July–August
  fullyBooked: boolean;
  amenities: string[];
  images: string[]; // paths under /public/images/rooms/[slug]/
};

export type RoomLocale = 'hr' | 'en' | 'de';
