export type MyRentPaymentSyncStatus =
  | 'pending'
  | 'live_ok'
  | 'skipped_disabled'
  | 'skipped_duplicate'
  | 'skipped_already_paid'
  | 'uncertain'
  | 'failed';

export type MyRentPaymentSyncRecord = {
  bookingId: string;
  status: MyRentPaymentSyncStatus;
  myrentRentId: string;
  paymentMethodId: number;
  amount: number;
  error: string | null;
  attemptedAt: string;
  attemptCount: number;
};

export type MyRentPaymentSyncResult = {
  record: MyRentPaymentSyncRecord;
  adminAlert: {
    type: 'myrent_payment_sync_uncertain';
    bookingId: string;
    message: string;
  } | null;
};

export type MyRentPaymentAddPayload = {
  rent_id: number;
  price: number;
  payment_method_id: number;
  currency_id: number;
  exchange: number;
  direction: number;
  paid: 'Y' | 'N';
  price_with_tax?: 'Y' | 'N';
};