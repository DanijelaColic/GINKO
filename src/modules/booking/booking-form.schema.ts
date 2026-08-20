// Form validation types + simple validator
// No zod in this phase — keep it minimal

export type BookingFormData = {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  phone: string;
  bookingFor: 'self' | 'other';
  guestStayingName: string;
  adults: string;
  children: string;
  /** Starosti djece (godine) — duljina = children */
  childAges: number[];
  needsExtraBed: boolean;
  needsCrib: boolean;
  /** Broj osoba uz buffet doručak (0 = bez doručka) */
  breakfastGuests: string;
  arrivalTime: string;
  notes: string;
  isBusiness: boolean;
  companyName: string;
  vatId: string;
  agreeRules: boolean;
};

/** Stored values stay Croatian (owner/admin). Labels are translated in the form. */
export const BOOKING_COUNTRY_OPTIONS = [
  { value: 'Hrvatska', key: 'hr' },
  { value: 'Bosna i Hercegovina', key: 'ba' },
  { value: 'Srbija', key: 'rs' },
  { value: 'Slovenija', key: 'si' },
  { value: 'Austrija', key: 'at' },
  { value: 'Mađarska', key: 'hu' },
  { value: 'Njemačka', key: 'de' },
  { value: 'Italija', key: 'it' },
  { value: 'Češka', key: 'cz' },
  { value: 'Slovačka', key: 'sk' },
  { value: 'Poljska', key: 'pl' },
  { value: 'Nizozemska', key: 'nl' },
  { value: 'Belgija', key: 'be' },
  { value: 'Francuska', key: 'fr' },
  { value: 'Švicarska', key: 'ch' },
  { value: 'Velika Britanija', key: 'gb' },
  { value: 'SAD', key: 'us' },
  { value: 'Ostalo', key: 'other' },
] as const;

export const BOOKING_FORM_DEFAULTS: BookingFormData = {
  firstName: '',
  lastName: '',
  email: '',
  country: 'Hrvatska',
  phone: '',
  bookingFor: 'self',
  guestStayingName: '',
  adults: '2',
  children: '0',
  childAges: [],
  needsExtraBed: false,
  needsCrib: false,
  breakfastGuests: '0',
  arrivalTime: '',
  notes: '',
  isBusiness: false,
  companyName: '',
  vatId: '',
  agreeRules: false,
};

export type BookingFormErrors = Partial<Record<keyof BookingFormData, string>>;

export function validateBookingForm(data: BookingFormData): BookingFormErrors {
  const errors: BookingFormErrors = {};

  if (!data.firstName.trim()) errors.firstName = 'Required';
  if (!data.lastName.trim()) errors.lastName = 'Required';
  if (!data.email.trim() || !data.email.includes('@')) errors.email = 'Required';
  if (!data.country.trim()) errors.country = 'Required';
  if (!data.phone.trim()) errors.phone = 'Required';
  if (data.bookingFor === 'other' && !data.guestStayingName.trim()) {
    errors.guestStayingName = 'Required';
  }
  if (!data.agreeRules) errors.agreeRules = 'Required';

  return errors;
}
