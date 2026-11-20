/**
 * Gate za MyRent payment_add (depozit).
 * Default: isključeno. TEST Saferpay zahtijeva zasebnu potvrdu.
 */

import {
  getMyRentWriteConfig,
  isMyRentLiveWriteAllowedForBooking,
  isMyRentProductionLiveOpen,
  isMyRentTestLiveOpen,
  isSaferpayTestEnvironment,
} from './myrent.write-config';

export const MYRENT_TEST_PAYMENT_SYNC_CONFIRM_TOKEN =
  'I_UNDERSTAND_TEST_MYRENT_PAYMENT_SYNC';

export const MYRENT_PRODUCTION_PAYMENT_SYNC_CONFIRM_TOKEN =
  'I_UNDERSTAND_PRODUCTION_MYRENT_PAYMENT_SYNC';

function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined || raw.trim() === '') return defaultValue;
  const v = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return defaultValue;
}

export function isMyRentPaymentSyncFeatureEnabled(): boolean {
  return parseBool(process.env.MYRENT_PAYMENT_SYNC_ENABLED, false);
}

export function getMyRentSaferpayPaymentMethodId(): number | null {
  const raw = process.env.MYRENT_PAYMENT_METHOD_SAFERPAY_ID?.trim() ?? '';
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}

function isTestPaymentSyncExplicitlyAllowed(): boolean {
  if (!isSaferpayTestEnvironment()) return false;
  const onTest = parseBool(
    process.env.MYRENT_PAYMENT_SYNC_ON_SAFERPAY_TEST,
    false,
  );
  if (!onTest) return false;
  const confirm = (
    process.env.MYRENT_TEST_PAYMENT_SYNC_CONFIRM ?? ''
  ).trim();
  return confirm === MYRENT_TEST_PAYMENT_SYNC_CONFIRM_TOKEN;
}

function isProductionPaymentSyncExplicitlyAllowed(): boolean {
  if (isSaferpayTestEnvironment()) return false;
  const confirm = (
    process.env.MYRENT_PRODUCTION_PAYMENT_SYNC_CONFIRM ?? ''
  ).trim();
  return confirm === MYRENT_PRODUCTION_PAYMENT_SYNC_CONFIRM_TOKEN;
}

/**
 * Smije li se poslati stvarni HTTP payment_add za ovaj booking?
 * Zahtijeva: feature flag, payment method ID, rent write gate + scope potvrdu.
 */
export function isMyRentPaymentSyncLiveAllowedForBooking(
  bookingId: string,
): boolean {
  if (!isMyRentPaymentSyncFeatureEnabled()) return false;
  if (getMyRentSaferpayPaymentMethodId() == null) return false;
  if (!isMyRentLiveWriteAllowedForBooking(bookingId)) return false;

  const cfg = getMyRentWriteConfig();
  if (!cfg.enabled || cfg.mode !== 'live') return false;

  if (isMyRentTestLiveOpen()) {
    return isTestPaymentSyncExplicitlyAllowed();
  }
  if (isMyRentProductionLiveOpen()) {
    return isProductionPaymentSyncExplicitlyAllowed();
  }

  // Allowlist live write — payment sync dopušten samo uz production-style confirm
  return isProductionPaymentSyncExplicitlyAllowed();
}

export type MyRentPaymentSyncSkipReason =
  | 'disabled'
  | 'missing_method_id'
  | 'rent_gate_closed'
  | 'saferpay_test_blocked'
  | 'missing_confirm';

export function explainMyRentPaymentSyncBlocked(
  bookingId: string,
): MyRentPaymentSyncSkipReason {
  if (!isMyRentPaymentSyncFeatureEnabled()) return 'disabled';
  if (getMyRentSaferpayPaymentMethodId() == null) return 'missing_method_id';
  if (!isMyRentLiveWriteAllowedForBooking(bookingId)) return 'rent_gate_closed';
  if (isSaferpayTestEnvironment() && !isTestPaymentSyncExplicitlyAllowed()) {
    return 'saferpay_test_blocked';
  }
  if (
    !isTestPaymentSyncExplicitlyAllowed() &&
    !isProductionPaymentSyncExplicitlyAllowed()
  ) {
    return 'missing_confirm';
  }
  return 'disabled';
}