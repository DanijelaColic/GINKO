// Copied from Villa-Jurina/src/lib/apartments.ts → renamed Apartment→Room

export type AccommodationType = 'soba' | 'apartman';

export type Room = {
  slug: string;
  accommodationType: AccommodationType;
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
  price: number; // €/noć
  fullyBooked: boolean;
  amenities: string[];
  images: string[]; // paths under /public/images/rooms/[slug]/
  /** Soba podržava pomoćni ležaj (+20 €/noć) — Ginko 2–4 i apartmani */
  extraBedAvailable: boolean;
  /**
   * Slugovi fizički istog prostora — kad je jedan zauzet, svi linked su automatski nedostupni.
   * Koristi se za ginko-spa-1 (bez wellnessa) ↔ ginko-spa-2 (s wellnessom) koji dijele isti prostor.
   */
  linkedSlugs?: string[];
};

export type RoomLocale = 'hr' | 'en' | 'de';
