/**
 * Tipovi za Ginko → MyRent sync (pripremna / mock faza).
 * Nema PII u logovima uspjeha — bookingId + status dovoljni.
 */

export type MyRentSyncStatus =
  | 'pending'
  | 'mocked_ok'
  /** Stvarni uspješan MyRent write (uz confirmedLiveSync=true) */
  | 'live_ok'
  | 'skipped_duplicate'
  | 'skipped_disabled'
  /**
   * MyRent je možda zaprimio rezervaciju (timeout / nejasan odgovor).
   * Nema automatskog ponovnog slanja — treba reconcile ili ručna provjera.
   */
  | 'uncertain'
  | 'failed';

/** Payload spreman za kasniji POST /user/rent_add (ili ekvivalent). */
export type MyRentRentAddPayload = {
  object_id: number;
  user_id: string;
  from_date: string;
  until_date: string;
  /** Ginko booking UUID — idempotencijski ključ */
  erp_id: string;
  adults: number;
  children: number;
  price: number;
  in_advance: number;
  in_advance_paid: 'Y' | 'N';
  paid: 'Y' | 'N';
  currency_id: string;
  exchange: string;
  /** MyRent kanal — WEB page */
  rent_source_id: number;
  contact_name: string;
  contact_email: string;
  contact_tel: string | null;
  note: string;
  /** SPA: wellness vs standard na istom object_id 7460 */
  spa_offer: 'wellness' | 'standard' | null;
  room_slug: string;
  include_wellness: boolean;
};

export type MyRentSyncRecord = {
  bookingId: string;
  status: MyRentSyncStatus;
  /** Mock ili budući MyRent rent id — null dok nije uspješno */
  myrentRentId: string | null;
  error: string | null;
  payloadErpId: string;
  objectId: number;
  attemptedAt: string;
  /** true samo nakon stvarnog uspješnog live write-a (u mock fazi uvijek false) */
  confirmedLiveSync: boolean;
};

export type MyRentAdminAlert = {
  id: string;
  type: 'myrent_sync_failed';
  bookingId: string;
  message: string;
  createdAt: string;
  acknowledged: boolean;
};

export type MyRentSyncResult = {
  record: MyRentSyncRecord;
  /** Administrator mora biti upozoren — nikad ne tvrdi da je live sync uspio */
  adminAlert: MyRentAdminAlert | null;
};
