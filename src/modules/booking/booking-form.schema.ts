// Form validation types + simple validator
// No zod in this phase — keep it minimal

export type BookingFormData = {
  name: string;
  email: string;
  phone: string;
  adults: string;
  children: string;
  notes: string;
  agreeRules: boolean;
};

export const BOOKING_FORM_DEFAULTS: BookingFormData = {
  name: '',
  email: '',
  phone: '',
  adults: '2',
  children: '0',
  notes: '',
  agreeRules: false,
};

export type BookingFormErrors = Partial<Record<keyof BookingFormData, string>>;

export function validateBookingForm(data: BookingFormData): BookingFormErrors {
  const errors: BookingFormErrors = {};

  if (!data.name.trim()) errors.name = 'Required';
  if (!data.email.trim() || !data.email.includes('@')) errors.email = 'Required';
  if (!data.phone.trim()) errors.phone = 'Required';
  if (!data.agreeRules) errors.agreeRules = 'Required';

  return errors;
}
