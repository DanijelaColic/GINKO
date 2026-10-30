/**
 * Orkestracija Ginko → MyRent sync.
 * Persistencija: myrent_booking_sync (Supabase) ili memory store u testovima.
 * Ne mijenja Saferpay potvrdu gostu; greške → admin alert, ne "live OK".
 *
 * Live: atomski claim (RPC 015) PRIJE POST-a; {} → read-only reconcile;
 * uncertain = NIKAD automatski resend.
 */

import { buildMyRentRentAddPayload } from './myrent.booking-payload';
import type { BookingForMyRentSync } from './myrent.booking-payload';
import { getMyRentSyncStore } from './myrent.sync-store';
import type { SyncStoreRow } from './myrent.sync-store';
import * as writeTransport from './myrent.write-transport';
import * as reconcileMod from './myrent.reconcile';
import {
  buildOneShotClaimError,
  isConfirmedOneShotClaim,
  MYRENT_ONE_SHOT_CLAIM_PREFIX,
} from './myrent.one-shot-live';
import { isMyRentLiveWriteAllowedForBooking } from './myrent.write-config';
import type { MyRentSyncResult, MyRentSyncRecord } from './myrent.booking-sync.types';

export type SyncBookingToMyRentInput = {
  booking: BookingForMyRentSync;
  requireDepositPaid?: boolean;
  /** Za payment hook: mora biti confirmed. */
  requireConfirmed?: boolean;
};

function toResult(
  record: MyRentSyncRecord,
  adminAlert: MyRentSyncResult['adminAlert'],
): MyRentSyncResult {
  return { record, adminAlert };
}

/** Blokira auto-slanje: uncertain nikad; live uspjeh nikad. */
export function isMyRentAutoSyncBlocked(
  existing: (Pick<
    SyncStoreRow,
    'status' | 'confirmedLiveSync' | 'myrentRentId'
  > & { error?: string | null }) | null,
): { blocked: boolean; reason: string | null } {
  if (!existing) return { blocked: false, reason: null };
  if (existing.confirmedLiveSync === true && existing.myrentRentId) {
    return { blocked: true, reason: 'already_synced' };
  }
  if (existing.status === 'live_ok') {
    return { blocked: true, reason: 'status_live_ok' };
  }
  if (existing.status === 'uncertain') {
    return {
      blocked: true,
      reason:
        'Status uncertain — automatsko ponovno slanje zabranjeno (reconcile / ručna provjera).',
    };
  }
  if (
    typeof existing.error === 'string' &&
    existing.error.startsWith(MYRENT_ONE_SHOT_CLAIM_PREFIX)
  ) {
    return { blocked: true, reason: 'claim_marker' };
  }
  return { blocked: false, reason: null };
}

async function reconcileToLiveOk(params: {
  booking: BookingForMyRentSync;
  payloadErpId: string;
  objectId: number;
  now: string;
}): Promise<MyRentSyncRecord | null> {
  const reconciled = await reconcileMod
    .reconcileMyRentRentByBookingNote({
      bookingId: params.booking.id,
      objectId: params.objectId,
      checkIn: params.booking.check_in,
      checkOut: params.booking.check_out,
    })
    .catch(() => ({
      found: false as const,
      reason: 'Reconcile nije uspio.',
    }));

  if (!reconciled.found) return null;

  return {
    bookingId: params.booking.id,
    status: 'live_ok',
    myrentRentId: reconciled.rentId,
    error: null,
    payloadErpId: params.payloadErpId,
    objectId: params.objectId,
    attemptedAt: params.now,
    confirmedLiveSync: true,
  };
}

/**
 * Sinkronizira jednu rezervaciju (mock ili allowlist live).
 * Idempotentno + claim/lock protiv paralelnih pokušaja.
 */
export async function syncBookingToMyRent(
  input: SyncBookingToMyRentInput,
): Promise<MyRentSyncResult> {
  const { booking } = input;
  const requireDeposit = input.requireDepositPaid !== false;
  const requireConfirmed = input.requireConfirmed === true;
  const store = getMyRentSyncStore();
  const now = new Date().toISOString();

  if (booking.status === 'cancelled') {
    const record: MyRentSyncRecord = {
      bookingId: booking.id,
      status: 'failed',
      myrentRentId: null,
      error: 'Rezervacija je cancelled — MyRent sync nije pokrenut.',
      payloadErpId: booking.id,
      objectId: 0,
      attemptedAt: now,
      confirmedLiveSync: false,
    };
    await store.save(record);
    return toResult(record, null);
  }

  if (requireConfirmed && booking.status !== 'confirmed') {
    const record: MyRentSyncRecord = {
      bookingId: booking.id,
      status: 'failed',
      myrentRentId: null,
      error: `Rezervacija nije confirmed (status=${booking.status}) — MyRent sync nije pokrenut.`,
      payloadErpId: booking.id,
      objectId: 0,
      attemptedAt: now,
      confirmedLiveSync: false,
    };
    await store.save(record);
    return toResult(record, null);
  }

  if (requireDeposit && booking.deposit_paid !== true) {
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

  const existing = await store.get(booking.id);
  const autoBlock = isMyRentAutoSyncBlocked(existing);
  if (autoBlock.blocked) {
    if (existing?.status === 'uncertain') {
      return toResult(
        {
          bookingId: existing.bookingId,
          status: 'uncertain',
          myrentRentId: existing.myrentRentId,
          error: existing.error ?? autoBlock.reason,
          payloadErpId: existing.payloadErpId,
          objectId: existing.objectId,
          attemptedAt: now,
          confirmedLiveSync: false,
        },
        null,
      );
    }
    return toResult(
      {
        bookingId: existing!.bookingId,
        status: 'skipped_duplicate',
        myrentRentId: existing!.myrentRentId,
        error: null,
        payloadErpId: existing!.payloadErpId,
        objectId: existing!.objectId,
        attemptedAt: now,
        confirmedLiveSync: existing!.confirmedLiveSync === true,
      },
      null,
    );
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

  const liveForBooking = isMyRentLiveWriteAllowedForBooking(booking.id);

  // ── LIVE putanja: auth → atomski claim → jedan POST ─────────────
  if (liveForBooking) {
    try {
      await writeTransport.prepareMyRentAuthForLiveWrite();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'MyRent auth priprema nije uspjela';
      const record: MyRentSyncRecord = {
        bookingId: booking.id,
        status: 'failed',
        myrentRentId: null,
        error: `Auth prije claima nije uspjela — bez POST-a. ${message}`.slice(
          0,
          500,
        ),
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
    }

    const claimError = buildOneShotClaimError(booking.id, now);
    const claim = await store.claimOneShotAttempt({
      bookingId: booking.id,
      payloadErpId: payload.erp_id,
      objectId: payload.object_id,
      claimError,
    });

    if (!claim.claimed || !isConfirmedOneShotClaim(claim.row)) {
      return toResult(
        {
          bookingId: booking.id,
          status: 'skipped_duplicate',
          myrentRentId: claim.row?.myrentRentId ?? null,
          error: `Atomski claim nije uspio (${claim.reason ?? 'unconfirmed'}) — HTTP nije poslan.`,
          payloadErpId: payload.erp_id,
          objectId: payload.object_id,
          attemptedAt: now,
          confirmedLiveSync: claim.row?.confirmedLiveSync === true,
        },
        null,
      );
    }

    const transport = await writeTransport.transportMyRentRentAdd(payload);

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
        attemptedAt: new Date().toISOString(),
        confirmedLiveSync: true,
      };
      await store.save(record);
      return toResult(record, null);
    }

    // {} / timeout / nejasan — read-only reconcile; bez drugog POST-a
    if (transport.uncertain) {
      const liveOk = await reconcileToLiveOk({
        booking,
        payloadErpId: payload.erp_id,
        objectId: payload.object_id,
        now: new Date().toISOString(),
      });
      if (liveOk) {
        await store.save(liveOk);
        return toResult(liveOk, null);
      }

      const record: MyRentSyncRecord = {
        bookingId: booking.id,
        status: 'uncertain',
        myrentRentId: null,
        error:
          transport.error ??
          'MyRent odgovor nejasan nakon claima — reconcile nije našao marker; bez auto-resenda.',
        payloadErpId: payload.erp_id,
        objectId: payload.object_id,
        attemptedAt: new Date().toISOString(),
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

    // Nakon claima: ostani uncertain (ne failed) — spriječi drugi POST
    const record: MyRentSyncRecord = {
      bookingId: booking.id,
      status: 'uncertain',
      myrentRentId: null,
      error:
        transport.error ??
        'MyRent live pokušaj bez potvrde nakon claima — bez auto-resenda.',
      payloadErpId: payload.erp_id,
      objectId: payload.object_id,
      attemptedAt: new Date().toISOString(),
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

  // ── MOCK / disabled putanja (TTL lock) ──────────────────────────
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
    if (lock.existing?.status === 'uncertain') {
      return toResult(
        {
          bookingId: lock.existing.bookingId,
          status: 'uncertain',
          myrentRentId: lock.existing.myrentRentId,
          error:
            lock.existing.error ??
            'Status uncertain — automatsko ponovno slanje zabranjeno.',
          payloadErpId: lock.existing.payloadErpId,
          objectId: lock.existing.objectId,
          attemptedAt: now,
          confirmedLiveSync: false,
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
    const transport = await writeTransport.transportMyRentRentAdd(payload);

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

    // Ne bi trebalo doći do live ovdje (gate/allowlist false)
    if (transport.uncertain) {
      const liveOk = await reconcileToLiveOk({
        booking,
        payloadErpId: payload.erp_id,
        objectId: payload.object_id,
        now,
      });
      if (liveOk) {
        await store.save(liveOk);
        return toResult(liveOk, null);
      }
      const record: MyRentSyncRecord = {
        bookingId: booking.id,
        status: 'uncertain',
        myrentRentId: null,
        error: transport.error ?? 'MyRent odgovor nejasan — bez auto-resenda.',
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
    }

    if (!transport.ok) {
      const status =
        transport.error?.includes('isključen') ||
        transport.error?.includes('WRITE_ENABLED') ||
        transport.error?.includes('allowlist') ||
        transport.error?.includes('nije dozvoljen') ||
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
      booking,
      requireDepositPaid: true,
      requireConfirmed: true,
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
