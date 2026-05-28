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
  guest_email: string;
  guest_phone: string | null;
  adults: number;
  children: number;
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

// ── Booking create input ───────────────────────────────────────────

export type BookingCreateInput = {
  room_slug: string;
  check_in: string;
  check_out: string;
  locale?: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  adults: number;
  children: number;
  notes?: string;
};
