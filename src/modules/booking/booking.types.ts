// Copied from Villa-Velebita/src/modules/booking-admin/types/index.ts
// Adapted: apartment_slug → room_slug, Apartment → Room references removed

// ── Database types ────────────────────────────────────────────────

export type Booking = {
  id: string;
  room_slug: string;
  check_in: string;
  check_out: string;
  nights: number;
  guest_name: string;
  guest_first_name: string | null;
  guest_last_name: string | null;
  guest_country: string | null;
  guest_email: string;
  guest_phone: string | null;
  adults: number;
  children: number;
  booking_for: 'self' | 'other';
  guest_staying_name: string | null;
  needs_crib: boolean;
  is_business: boolean;
  company_name: string | null;
  vat_id: string | null;
  price_per_night: number;
  total_price: number;
  deposit: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  locale: string | null;
  notes: string | null;
  deposit_paid: boolean;
  created_at: string;
};

export type BookedRange = {
  check_in: string;
  check_out: string;
};

// ── Pricing types ─────────────────────────────────────────────────

export type PriceLine = {
  label: string;
  nights: number;
  pricePerNight: number;
  subtotal: number;
};

export type PriceBreakdown = {
  nights: number;
  totalPrice: number;
  deposit: number;
  lines: PriceLine[];
  discountAmount?: number;
  cleaningFee?: number;
};

// ── Booking public confirmation view ──────────────────────────────

import type { Room } from '@/modules/rooms/room.types';

export type BookingConfirmationData = {
  id: string;
  reference: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  guestName: string;
  guestEmail: string;
  roomName: string;
  room: Room;
  checkIn: string;
  checkOut: string;
  checkInIso: string;
  checkOutIso: string;
  nights: number;
  adults: number;
  children: number;
  pricePerNight: number;
  totalPrice: number;
  deposit: number;
  priceBreakdown: PriceBreakdown;
  createdAt: string;
  payment: {
    recipient: string;
    iban: string;
    bic: string;
    bankName: string;
    description: string;
  };
};

// ── Booking create input ───────────────────────────────────────────

export type BookingCreateInput = {
  room_slug: string;
  check_in: string;
  check_out: string;
  locale?: string;
  guest_name: string;
  guest_first_name?: string | null;
  guest_last_name?: string | null;
  guest_country?: string | null;
  guest_email: string;
  guest_phone?: string | null;
  adults: number;
  children: number;
  booking_for?: 'self' | 'other';
  guest_staying_name?: string | null;
  needs_crib?: boolean;
  is_business?: boolean;
  company_name?: string | null;
  vat_id?: string | null;
  notes?: string | null;
};
