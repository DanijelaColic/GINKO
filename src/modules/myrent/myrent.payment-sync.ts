/**
 * Orkestracija MyRent payment_add nakon uspješnog rent_add (live_ok).
 */

import type { BookingForMyRentSync } from './myrent.booking-payload';
import {
  explainMyRentPaymentSyncBlocked,
  getMyRentSaferpayPaymentMethodId,
  isMyRentPaymentSyncFeatureEnabled,
  isMyRentPaymentSyncLiveAllowedForBooking,
} from './myrent.payment-sync-config';
import type {
  MyRentPaymentSyncRecord,
  MyRentPaymentSyncResult,
} from './myrent.payment-sync.types';
import { getMyRentPaymentSyncStore } from './myrent.payment-sync-store';
import { transportMyRentPaymentAdd } from './myrent.payment-transport';
import { fetchMyRentAdvancePaidFlag } from './myrent.rent-deposit-read';

export type EnsureMyRentPaymentSyncInput = {
  booking: BookingForMyRentSync;
  myrentRentId: string;
  myrentRentGuid?: string | null;
};

function isRentSyncReady(
  myrentRentId: string | null | undefined,
): myrentRentId is string {
  return typeof myrentRentId === 'string' && myrentRentId.trim().length > 0;
}

function toResult(
  record: MyRentPaymentSyncRecord,
  adminAlert: MyRentPaymentSyncResult['adminAlert'],
): MyRentPaymentSyncResult {
  return { record, adminAlert };
}

export function isMyRentPaymentSyncBlocked(
  existing: Pick<MyRentPaymentSyncRecord, 'status'> | null,
): { blocked: boolean; reason: string | null } {
  if (!existing) return { blocked: false, reason: null };
  if (
    existing.status === 'live_ok' ||
    existing.status === 'skipped_already_paid'
  ) {
    return { blocked: true, reason: 'already_synced' };
  }
  if (existing.status === 'uncertain') {
    return {
      blocked: true,
      reason: 'uncertain — bez automatskog ponovnog payment_add.',
    };
  }
  return { blocked: false, reason: null };
}

/**
 * Nakon confirmed depozita + live MyRent rent id.
 * Nikad ne baca — poziva se iz Saferpay hooka.
 */
export async function ensureMyRentDepositPaymentSync(
  input: EnsureMyRentPaymentSyncInput,
): Promise<MyRentPaymentSyncResult | null> {
  const { booking, myrentRentId, myrentRentGuid } = input;
  const now = new Date().toISOString();

  if (booking.deposit_paid !== true || booking.status !== 'confirmed') {
    return null;
  }
  if (!isRentSyncReady(myrentRentId)) {
    return null;
  }

  const methodId = getMyRentSaferpayPaymentMethodId();
  const store = getMyRentPaymentSyncStore();

  const existing = await store.get(booking.id);
  const block = isMyRentPaymentSyncBlocked(existing);
  if (block.blocked && existing) {
    return toResult(
      {
        ...existing,
        status:
          existing.status === 'live_ok' ||
          existing.status === 'skipped_already_paid'
            ? 'skipped_duplicate'
            : existing.status,
        error: null,
        attemptedAt: now,
      },
      null,
    );
  }

  if (!isMyRentPaymentSyncFeatureEnabled()) {
    const record: MyRentPaymentSyncRecord = {
      bookingId: booking.id,
      status: 'skipped_disabled',
      myrentRentId,
      paymentMethodId: methodId ?? 0,
      amount: Number(booking.deposit),
      error: explainMyRentPaymentSyncBlocked(booking.id),
      attemptedAt: now,
      attemptCount: existing?.attemptCount ?? 0,
    };
    await store.save(record).catch(() => undefined);
    return toResult(record, null);
  }

  if (methodId == null) {
    const record: MyRentPaymentSyncRecord = {
      bookingId: booking.id,
      status: 'skipped_disabled',
      myrentRentId,
      paymentMethodId: 0,
      amount: Number(booking.deposit),
      error: 'missing_method_id',
      attemptedAt: now,
      attemptCount: existing?.attemptCount ?? 0,
    };
    await store.save(record).catch(() => undefined);
    return toResult(record, null);
  }

  if (!isMyRentPaymentSyncLiveAllowedForBooking(booking.id)) {
    const record: MyRentPaymentSyncRecord = {
      bookingId: booking.id,
      status: 'skipped_disabled',
      myrentRentId,
      paymentMethodId: methodId,
      amount: Number(booking.deposit),
      error: explainMyRentPaymentSyncBlocked(booking.id),
      attemptedAt: now,
      attemptCount: existing?.attemptCount ?? 0,
    };
    await store.save(record).catch(() => undefined);
    return toResult(record, null);
  }

  const advancePaid = await fetchMyRentAdvancePaidFlag({
    rentGuid: myrentRentGuid,
  });
  if (advancePaid === 'Y') {
    const record: MyRentPaymentSyncRecord = {
      bookingId: booking.id,
      status: 'skipped_already_paid',
      myrentRentId,
      paymentMethodId: methodId,
      amount: Number(booking.deposit),
      error: null,
      attemptedAt: now,
      attemptCount: existing?.attemptCount ?? 0,
    };
    await store.save(record).catch(() => undefined);
    return toResult(record, null);
  }

  const lock = await store.tryAcquireLock({
    bookingId: booking.id,
    myrentRentId,
    paymentMethodId: methodId,
    amount: Number(booking.deposit),
  });

  if (!lock.acquired) {
    if (lock.reason === 'already_synced' && lock.existing) {
      return toResult(
        {
          ...lock.existing,
          status: 'skipped_duplicate',
          error: null,
          attemptedAt: now,
        },
        null,
      );
    }
    if (lock.reason === 'uncertain' && lock.existing) {
      return toResult(lock.existing, null);
    }
    return null;
  }

  try {
    const transport = await transportMyRentPaymentAdd({
      bookingId: booking.id,
      myrentRentId,
      depositAmount: Number(booking.deposit),
    });

    if (transport.ok && transport.confirmedLiveSync) {
      const record: MyRentPaymentSyncRecord = {
        bookingId: booking.id,
        status: 'live_ok',
        myrentRentId,
        paymentMethodId: methodId,
        amount: Number(booking.deposit),
        error: null,
        attemptedAt: now,
        attemptCount: (lock.existing?.attemptCount ?? 0) + 1,
      };
      await store.save(record);
      return toResult(record, null);
    }

    if (transport.uncertain) {
      const record: MyRentPaymentSyncRecord = {
        bookingId: booking.id,
        status: 'uncertain',
        myrentRentId,
        paymentMethodId: methodId,
        amount: Number(booking.deposit),
        error: transport.error ?? 'payment_add nejasan',
        attemptedAt: now,
        attemptCount: (lock.existing?.attemptCount ?? 0) + 1,
      };
      await store.save(record);
      return toResult(record, {
        type: 'myrent_payment_sync_uncertain',
        bookingId: booking.id,
        message: record.error!,
      });
    }

    const record: MyRentPaymentSyncRecord = {
      bookingId: booking.id,
      status: 'failed',
      myrentRentId,
      paymentMethodId: methodId,
      amount: Number(booking.deposit),
      error: transport.error ?? 'payment_add nije uspio',
      attemptedAt: now,
      attemptCount: (lock.existing?.attemptCount ?? 0) + 1,
    };
    await store.save(record);
    return toResult(record, null);
  } finally {
    await store.releaseLock(booking.id).catch(() => undefined);
  }
}