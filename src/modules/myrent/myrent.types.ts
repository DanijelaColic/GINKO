/** Kalendarski dan iz MyRent GET /object_prices/get_calendar */

export type MyRentCalendarDay = {
  day: string;
  price?: number;
  free?: string;
  enable?: string;
  is_booked?: string;
  stock_available?: number;
  stock_free?: number;
  min_stay?: number;
  check_in?: string;
  check_out?: string;
  object_id?: number;
  item_id?: number;
  [key: string]: unknown;
};

export type MyRentOccupiedDay = {
  day: string;
  reason: 'booked' | 'not_free' | 'disabled' | 'no_stock';
  price: number | null;
  free: string | null;
  is_booked: string | null;
  enable: string | null;
  stock_available: number | null;
};

export type MyRentCalendarResult = {
  objectId: number;
  roomSlug: string | null;
  dateFrom: string;
  dateUntil: string;
  days: MyRentCalendarDay[];
  occupied: MyRentOccupiedDay[];
  summary: {
    totalDays: number;
    occupiedDays: number;
    availableDays: number;
  };
};
