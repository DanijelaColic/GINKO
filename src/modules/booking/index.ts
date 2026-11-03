export type {
  Booking,
  BookedRange,
  PriceLine,
  PriceBreakdown,
  BookingCreateInput,
} from './booking.types';

export {
  SITE_NAME,
  MIN_NIGHTS,
  DEPOSIT_PERCENT,
  calculateDeposit,
  BALANCE_DAYS_BEFORE_CHECK_IN,
  CLEANING_FEE,
  RECIPIENT_IBAN,
  RECIPIENT_NAME,
  RECIPIENT_BIC,
  RECIPIENT_BANK_NAME,
} from './booking.config';

export { calculatePrice } from './pricing.service';
export { resolveBookingPrice } from './resolve-booking-price';
export type {
  BookingPriceSource,
  ResolvedBookingPrice,
} from './resolve-booking-price';
export { evaluateQuotedPrice, pricesMatch } from './quoted-price';
export type { QuotedPriceInput } from './quoted-price';
export { fetchStayQuote, StayQuoteError } from './fetch-stay-quote';
export type {
  StayPriceQuoteResponse,
  StayPriceQuoteRequest,
} from './quote.types';
export {
  isDateBooked,
  isRangeAvailable,
  getFirstBlockedAfter,
  assertBookingStayAvailable,
  recheckAvailabilityBeforeBookingConfirm,
  AvailabilityUnavailableError,
  DatesUnavailableError,
} from './availability.service';
export {
  getGuestConfirmationViewState,
  shouldSendGuestConfirmationEmail,
} from './confirmation-display-state';
export type { GuestConfirmationViewState } from './confirmation-display-state';
export { getBookedRanges, createBooking } from './booking.repository';
export type { BookingFormData } from './booking-form.schema';
export { BOOKING_FORM_DEFAULTS, validateBookingForm } from './booking-form.schema';
