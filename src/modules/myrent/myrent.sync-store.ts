/**
 * Trajni sync store — Supabase (runtime) ili memorija (testovi).
 */

import { createServerSupabaseClient } from '@/lib/supabase';
import type {
  MyRentAdminAlert,
  MyRentSyncRecord,
  MyRentSyncStatus,
} from './myrent.booking-sync.types';

export type SyncStoreRow = MyRentSyncRecord & {
  attemptCount: number;
  syncLockUntil: string | null;
};

export type OneShotClaimResult = {
  claimed: boolean;
  reason: 'already_claimed' | 'already_synced' | 'error' | null;
  row: SyncStoreRow | null;
};

export type MyRentSyncStore = {
  get(bookingId: string): Promise<SyncStoreRow | null>;
  /** Insert ili update; ne pregazi confirmed_live_sync / mocked_ok uspjeh bez namjere */
  save(record: MyRentSyncRecord & { attemptCount?: number }): Promise<void>;
  /**
   * Atomski one-shot claim: status=uncertain trajno.
   * Samo jedan pozivatelj smije dobiti claimed=true.
   */
  claimOneShotAttempt(input: {
    bookingId: string;
    payloadErpId: string;
    objectId: number;
    claimError: string;
  }): Promise<OneShotClaimResult>;
  /**
   * Pokušaj zaključati red za sync.
   * false = već uspješno (mock/live) ili zaključano od drugog procesa.
   */
  tryAcquireLock(bookingId: string, erpId: string, objectId: number): Promise<{
    acquired: boolean;
    reason?: 'already_synced' | 'locked' | 'uncertain' | 'error';
    existing?: SyncStoreRow | null;
  }>;
  releaseLock(bookingId: string): Promise<void>;
  listNeedingAttention(): Promise<SyncStoreRow[]>;
  recordAlert(
    alert: Omit<MyRentAdminAlert, 'id' | 'createdAt' | 'acknowledged'>,
  ): Promise<MyRentAdminAlert>;
  listAlerts(): Promise<MyRentAdminAlert[]>;
  resetForTests?(): void;
};

function rowFromDb(r: Record<string, unknown>): SyncStoreRow {
  return {
    bookingId: String(r.booking_id),
    status: r.status as MyRentSyncStatus,
    myrentRentId: (r.myrent_rent_id as string | null) ?? null,
    error: (r.last_error as string | null) ?? null,
    payloadErpId: String(r.payload_erp_id),
    objectId: typeof r.object_id === 'number' ? r.object_id : Number(r.object_id) || 0,
    attemptedAt: r.last_attempted_at
      ? String(r.last_attempted_at)
      : String(r.updated_at ?? new Date().toISOString()),
    confirmedLiveSync: r.confirmed_live_sync === true,
    attemptCount: typeof r.attempt_count === 'number' ? r.attempt_count : 0,
    syncLockUntil: r.sync_lock_until ? String(r.sync_lock_until) : null,
  };
}

/**
 * Terminalni uspjeh = samo stvarni live MyRent upis.
 * mocked_ok NIJE terminalan — ne smije blokirati kasniji live sync.
 */
function isTerminalSuccess(row: SyncStoreRow | null | undefined): boolean {
  if (!row) return false;
  return row.confirmedLiveSync === true && Boolean(row.myrentRentId);
}

/** uncertain blokira auto acquire trajno (i nakon isteka locka). */
function isUncertainBlocked(row: SyncStoreRow | null | undefined): boolean {
  return row?.status === 'uncertain';
}

// ── In-memory (testovi) ───────────────────────────────────────────

export function createMemoryMyRentSyncStore(): MyRentSyncStore {
  const byBooking = new Map<string, SyncStoreRow>();
  const alerts: MyRentAdminAlert[] = [];

  return {
    async get(bookingId) {
      return byBooking.get(bookingId) ?? null;
    },
    async save(record) {
      const prev = byBooking.get(record.bookingId);
      byBooking.set(record.bookingId, {
        ...record,
        attemptCount:
          record.attemptCount ?? (prev?.attemptCount ?? 0) + 1,
        syncLockUntil: prev?.syncLockUntil ?? null,
      });
    },
    async claimOneShotAttempt(input) {
      // Sinhrono check-and-set (bez await između) — atomarno u single-thread JS.
      const existing = byBooking.get(input.bookingId) ?? null;
      if (existing?.confirmedLiveSync === true || existing?.status === 'live_ok') {
        return { claimed: false, reason: 'already_synced', row: existing };
      }
      if (existing?.status === 'uncertain') {
        return { claimed: false, reason: 'already_claimed', row: existing };
      }
      const row: SyncStoreRow = {
        bookingId: input.bookingId,
        status: 'uncertain',
        myrentRentId: null,
        error: input.claimError,
        payloadErpId: input.payloadErpId,
        objectId: input.objectId,
        attemptedAt: new Date().toISOString(),
        confirmedLiveSync: false,
        attemptCount: (existing?.attemptCount ?? 0) + 1,
        syncLockUntil: null,
      };
      byBooking.set(input.bookingId, row);
      return { claimed: true, reason: null, row };
    },
    async tryAcquireLock(bookingId, erpId, objectId) {
      const existing = byBooking.get(bookingId) ?? null;
      if (isTerminalSuccess(existing)) {
        return { acquired: false, reason: 'already_synced', existing };
      }
      if (isUncertainBlocked(existing)) {
        return { acquired: false, reason: 'uncertain', existing };
      }
      const now = Date.now();
      if (
        existing?.syncLockUntil &&
        new Date(existing.syncLockUntil).getTime() > now
      ) {
        return { acquired: false, reason: 'locked', existing };
      }
      const lockUntil = new Date(now + 60_000).toISOString();
      byBooking.set(bookingId, {
        bookingId,
        status: existing?.status ?? 'pending',
        myrentRentId: existing?.myrentRentId ?? null,
        error: existing?.error ?? null,
        payloadErpId: erpId,
        objectId,
        attemptedAt: new Date().toISOString(),
        confirmedLiveSync: false,
        attemptCount: existing?.attemptCount ?? 0,
        syncLockUntil: lockUntil,
      });
      return { acquired: true, existing: byBooking.get(bookingId) };
    },
    async releaseLock(bookingId) {
      const existing = byBooking.get(bookingId);
      if (!existing) return;
      byBooking.set(bookingId, { ...existing, syncLockUntil: null });
    },
    async listNeedingAttention() {
      return [...byBooking.values()].filter(
        (r) =>
          !r.confirmedLiveSync &&
          (r.status === 'failed' ||
            r.status === 'uncertain' ||
            r.status === 'skipped_disabled' ||
            r.status === 'mocked_ok' ||
            r.status === 'pending'),
      );
    },
    async recordAlert(alert) {
      const full: MyRentAdminAlert = {
        ...alert,
        id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        acknowledged: false,
      };
      alerts.push(full);
      return full;
    },
    async listAlerts() {
      return [...alerts];
    },
    resetForTests() {
      byBooking.clear();
      alerts.length = 0;
    },
  };
}

// ── Supabase ──────────────────────────────────────────────────────

export function createSupabaseMyRentSyncStore(): MyRentSyncStore {
  return {
    async get(bookingId) {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from('myrent_booking_sync')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();
      if (error) throw error;
      return data ? rowFromDb(data as Record<string, unknown>) : null;
    },

    async save(record) {
      const supabase = createServerSupabaseClient();
      const existing = await this.get(record.bookingId);
      const attemptCount =
        record.attemptCount ?? (existing?.attemptCount ?? 0) + 1;

      const { error } = await supabase.from('myrent_booking_sync').upsert(
        {
          booking_id: record.bookingId,
          status: record.status,
          myrent_rent_id: record.myrentRentId,
          confirmed_live_sync: record.confirmedLiveSync === true,
          payload_erp_id: record.payloadErpId,
          object_id: record.objectId || null,
          last_error: record.error,
          attempt_count: attemptCount,
          last_attempted_at: record.attemptedAt,
          sync_lock_until: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'booking_id' },
      );
      if (error) throw error;
    },

    async claimOneShotAttempt(input) {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase.rpc(
        'claim_myrent_one_shot_attempt',
        {
          p_booking_id: input.bookingId,
          p_payload_erp_id: input.payloadErpId,
          p_object_id: input.objectId || null,
          p_claim_error: input.claimError,
        },
      );
      if (error) throw error;

      const payload = data as {
        claimed?: boolean;
        reason?: 'already_claimed' | 'already_synced' | 'error' | null;
        row?: Record<string, unknown> | null;
      } | null;

      const row = payload?.row ? rowFromDb(payload.row) : null;
      if (payload?.claimed === true) {
        return { claimed: true, reason: null, row };
      }

      const reasonRaw = payload?.reason;
      const reason =
        reasonRaw === 'already_claimed' ||
        reasonRaw === 'already_synced' ||
        reasonRaw === 'error'
          ? reasonRaw
          : 'error';

      return { claimed: false, reason, row };
    },

    async tryAcquireLock(bookingId, erpId, objectId) {
      // Atomski lock u Postgresu (INSERT … ON CONFLICT DO UPDATE … WHERE).
      // Nema check-then-act race između dva HTTP requesta.
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase.rpc(
        'acquire_myrent_booking_sync_lock',
        {
          p_booking_id: bookingId,
          p_payload_erp_id: erpId,
          p_object_id: objectId || null,
          p_lock_ttl_seconds: 60,
        },
      );

      if (error) throw error;

      const payload = data as {
        acquired?: boolean;
        reason?: 'already_synced' | 'locked' | 'uncertain' | 'error' | null;
        row?: Record<string, unknown> | null;
      } | null;

      const existing = payload?.row
        ? rowFromDb(payload.row)
        : null;

      if (payload?.acquired) {
        return { acquired: true, existing };
      }

      const reasonRaw = payload?.reason;
      const reason =
        reasonRaw === 'already_synced' ||
        reasonRaw === 'locked' ||
        reasonRaw === 'uncertain' ||
        reasonRaw === 'error'
          ? reasonRaw
          : 'error';

      return { acquired: false, reason, existing };
    },

    async releaseLock(bookingId) {
      const supabase = createServerSupabaseClient();
      await supabase
        .from('myrent_booking_sync')
        .update({
          sync_lock_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId);
    },

    async listNeedingAttention() {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from('myrent_booking_sync')
        .select('*')
        .eq('confirmed_live_sync', false)
        .in('status', [
          'failed',
          'uncertain',
          'skipped_disabled',
          'mocked_ok',
          'pending',
        ])
        .order('last_attempted_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => rowFromDb(r as Record<string, unknown>));
    },

    async recordAlert(alert) {
      // Persistiranog alerts table nema — last_error na sync redu je izvor istine.
      // In-memory mirror za trenutni request / log.
      return {
        ...alert,
        id: `alert_${Date.now()}`,
        createdAt: new Date().toISOString(),
        acknowledged: false,
      };
    },

    async listAlerts() {
      const rows = await this.listNeedingAttention();
      return rows
        .filter((r) => r.status === 'failed' && r.error)
        .map((r) => ({
          id: `sync_${r.bookingId}`,
          type: 'myrent_sync_failed' as const,
          bookingId: r.bookingId,
          message: r.error ?? 'MyRent sync nije uspio',
          createdAt: r.attemptedAt,
          acknowledged: false,
        }));
    },
  };
}

let defaultStore: MyRentSyncStore | null = null;

export function getMyRentSyncStore(): MyRentSyncStore {
  if (!defaultStore) {
    defaultStore = createSupabaseMyRentSyncStore();
  }
  return defaultStore;
}

/** Samo za testove — zamijeni store. */
export function setMyRentSyncStoreForTests(store: MyRentSyncStore | null): void {
  defaultStore = store;
}
