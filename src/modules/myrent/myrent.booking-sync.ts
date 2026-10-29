/**
 * Orkestracija Ginko → MyRent sync (mock faza).
 * Persistencija: myrent_booking_sync (Supabase) ili memory store u testovima.
 * Ne mijenja Saferpay potvrdu gostu; greške → admin alert, ne "live OK".
 */

import { buildMyRentRentAddPayload } from './myrent.booking-payload';
import type { BookingForMyRentSync } from './myrent.booking-payload';
import { getMyRentSyncStore } from './myrent.sync-store';
import { transportMyRentRentAdd } from './myrent.write-transport';
import type { MyRentSyncResult, MyRentSyncRecord } from './myrent.booking-sync.types';

export type SyncBookingToMyRentInput = {
  booking: BookingForMyRentSync;
  requireDepositPaid?: boolean;
};

function toResult(
  record: MyRentSyncRecord,
  adminAlert: MyRentSyncResult['adminAlert'],
): MyRentSyncResult {
  return { record, adminAlert };
}

/**
 * Sinkronizira jednu rezervaciju (mock ili budući live).
 * Idempotentno + lock protiv paralelnih pokušaja.
 * Nikad ne postavlja confirmedLiveSync=true u mock fazi.
 */
export async function syncBookingToMyRent(
  input: SyncBookingToMyRentInput,
): Promise<MyRentSyncResult> {
  const { booking } = input;
  const requireDeposit = input.requireDepositPaid !== false;
  const store = getMyRentSyncStore();
  const now = new Date().toISOString();

  if (requireDeposit && !booking.deposit_paid) {
    const record: MyRentSyncRecord = {
      bookingId: booking.id,
      status: 'failed',
      myrentRentId: null,
      error: 'Depozit nije plaćen — MyRent sync nije pokrenut.',
      payloadErpId: booking.id,
      objectId: 0,
      attemptedAt: now,
      confirmedLiveSync: false,
    };
    await store.save(record);
    const adminAlert = await store.recordAlert({
      type: 'myrent_sync_failed',
      bookingId: booking.id,
      message: record.error!,
    });
    return toResult(record, adminAlert);
  }

  let payload;
  try {
    payload = buildMyRentRentAddPayload(booking);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payload greška';
    const record: MyRentSyncRecord = {
      bookingId: booking.id,
      status: 'failed',
      myrentRentId: null,
      error: message,
      payloadErpId: booking.id,
      objectId: 0,
      attemptedAt: now,
      confirmedLiveSync: false,
    };
    await store.save(record);
    const adminAlert = await store.recordAlert({
      type: 'myrent_sync_failed',
      bookingId: booking.id,
      message,
    });
    return toResult(record, adminAlert);
  }

  const lock = await store.tryAcquireLock(
    booking.id,
    payload.erp_id,
    payload.object_id,
  );

  if (!lock.acquired) {
    if (lock.reason === 'already_synced' && lock.existing) {
      return toResult(
        {
          bookingId: lock.existing.bookingId,
          status: 'skipped_duplicate',
          myrentRentId: lock.existing.myrentRentId,
          error: null,
          payloadErpId: lock.existing.payloadErpId,
          objectId: lock.existing.objectId,
          attemptedAt: now,
          confirmedLiveSync: lock.existing.confirmedLiveSync === true,
        },
        null,
      );
    }
    const record: MyRentSyncRecord = {
      bookingId: booking.id,
      status: 'skipped_duplicate',
      myrentRentId: lock.existing?.myrentRentId ?? null,
      error: 'Sync već u tijeku (lock).',
      payloadErpId: payload.erp_id,
      objectId: payload.object_id,
      attemptedAt: now,
      confirmedLiveSync: false,
    };
    return toResult(record, null);
  }

  try {
    const transport = await transportMyRentRentAdd(payload);

    if (transport.ok && transport.mode === 'mock') {
      const record: MyRentSyncRecord = {
        bookingId: booking.id,
        status: 'mocked_ok',
        myrentRentId: transport.rentId,
        error: null,
        payloadErpId: payload.erp_id,
        objectId: payload.object_id,
        attemptedAt: now,
        confirmedLiveSync: false,
      };
      await store.save(record);
      return toResult(record, null);
    }

    // Live OK — samo ako gate + transport potvrde (trenutno nedostupno)
    if (
      transport.ok &&
      transport.mode === 'live' &&
      transport.confirmedLiveSync &&
      transport.rentId
    ) {
      const record: MyRentSyncRecord = {
        bookingId: booking.id,
        status: 'live_ok',
        myrentRentId: transport.rentId,
        error: null,
        payloadErpId: payload.erp_id,
        objectId: payload.object_id,
        attemptedAt: now,
        confirmedLiveSync: true,
      };
      await store.save(record);
      return toResult(record, null);
    }

    if (!transport.ok) {
      const status =
        transport.error?.includes('isključen') ||
        transport.error?.includes('WRITE_ENABLED') ||
        transport.error?.includes('nije aktiviran')
          ? ('skipped_disabled' as const)
          : ('failed' as const);

      const record: MyRentSyncRecord = {
        bookingId: booking.id,
        status,
        myrentRentId: null,
        error: transport.error,
        payloadErpId: payload.erp_id,
        objectId: payload.object_id,
        attemptedAt: now,
        confirmedLiveSync: false,
      };
      await store.save(record);

      const adminAlert =
        booking.deposit_paid && status === 'failed'
          ? await store.recordAlert({
              type: 'myrent_sync_failed',
              bookingId: booking.id,
              message:
                transport.error ??
                'MyRent sync nije uspio nakon plaćenog depozita. Ne smatra se uspješno sinkroniziranim.',
            })
          : null;

      return toResult(record, adminAlert);
    }

    const record: MyRentSyncRecord = {
      bookingId: booking.id,
      status: 'failed',
      myrentRentId: transport.rentId,
      error: 'Neočekivan transport rezultat bez live potvrde.',
      payloadErpId: payload.erp_id,
      objectId: payload.object_id,
      attemptedAt: now,
      confirmedLiveSync: false,
    };
    await store.save(record);
    const adminAlert = await store.recordAlert({
      type: 'myrent_sync_failed',
      bookingId: booking.id,
      message: record.error!,
    });
    return toResult(record, adminAlert);
  } finally {
    await store.releaseLock(booking.id).catch(() => undefined);
  }
}

export async function syncBookingToMyRentAfterPayment(
  booking: BookingForMyRentSync,
): Promise<MyRentSyncResult | null> {
  const store = getMyRentSyncStore();
  try {
    return await syncBookingToMyRent({
      booking: { ...booking, deposit_paid: true },
      requireDepositPaid: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'MyRent sync greška';
    const adminAlert = await store.recordAlert({
      type: 'myrent_sync_failed',
      bookingId: booking.id,
      message,
    });
    const record: MyRentSyncRecord = {
      bookingId: booking.id,
      status: 'failed',
      myrentRentId: null,
      error: message,
      payloadErpId: booking.id,
      objectId: 0,
      attemptedAt: new Date().toISOString(),
      confirmedLiveSync: false,
    };
    await store.save(record).catch(() => undefined);
    console.error('[myrent-sync] after payment failed:', booking.id, message);
    return { record, adminAlert };
  }
}
