export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

export interface BookingRequest {
  roomId: string;
  checkIn: string; // ISO date YYYY-MM-DD
  checkOut: string; // ISO date YYYY-MM-DD
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  notes?: string;
}

export interface Booking extends BookingRequest {
  id: string;
  status: BookingStatus;
  totalEur: number;
  createdAt: string;
}
