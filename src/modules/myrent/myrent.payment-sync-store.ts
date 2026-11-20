/**
 * Ledger za MyRent payment_add.
 */

import { createServerSupabaseClient } from '@/lib/supabase';
import type {
  MyRentPaymentSyncRecord,
  MyRentPaymentSyncStatus,
} from './myrent.payment-sync.types';

export type PaymentSyncStoreRow = MyRentPaymentSyncRecord & {
  syncLockUntil: string | null;
};

export type MyRentPaymentSyncStore = {
  get(bookingId: string): Promise<PaymentSyncStoreRow | null>;
  save(record: MyRentPaymentSyncRecord): Promise<void>;
  tryAcquireLock(input: {
    bookingId: string;
    myrentRentId: string;
    paymentMethodId: number;
    amount: number;
  }): Promise<{
    acquired: boolean;
    reason?: 'already_synced' | 'locked' | 'uncertain' | 'error';
    existing?: PaymentSyncStoreRow | null;
  }>;
  releaseLock(bookingId: string): Promise<void>;
  resetForTests?(): void;
};

function rowFromDb(r: Record<string, unknown>): PaymentSyncStoreRow {
  return {
    bookingId: String(r.booking_id),
    status: r.status as MyRentPaymentSyncStatus,
    myrentRentId: String(r.myrent_rent_id),
    paymentMethodId: Number(r.payment_method_id),
    amount: Number(r.amount),
    error: (r.last_error as string | null) ?? null,
    attemptedAt: r.last_attempted_at
      ? String(r.last_attempted_at)
      : String(r.updated_at ?? new Date().toISOString()),
    attemptCount: typeof r.attempt_count === 'number' ? r.attempt_count : 0,
    syncLockUntil: r.sync_lock_until ? String(r.sync_lock_until) : null,
  };
}

export function createMemoryMyRentPaymentSyncStore(): MyRentPaymentSyncStore {
  const byBooking = new Map<string, PaymentSyncStoreRow>();

  return {
    async get(bookingId) {
      return byBooking.get(bookingId) ?? null;
    },
    async save(record) {
      const prev = byBooking.get(record.bookingId);
      byBooking.set(record.bookingId, {
        ...record,
        syncLockUntil: null,
        attemptCount: record.attemptCount ?? (prev?.attemptCount ?? 0) + 1,
      });
    },
    async tryAcquireLock(input) {
      const existing = byBooking.get(input.bookingId);
      if (existing?.status === 'live_ok') {
        return { acquired: false, reason: 'already_synced', existing };
      }
      if (existing?.status === 'uncertain') {
        return { acquired: false, reason: 'uncertain', existing };
      }
      if (
        existing?.syncLockUntil &&
        new Date(existing.syncLockUntil).getTime() > Date.now()
      ) {
        return { acquired: false, reason: 'locked', existing };
      }
      const row: PaymentSyncStoreRow = {
        bookingId: input.bookingId,
        status: 'pending',
        myrentRentId: input.myrentRentId,
        paymentMethodId: input.paymentMethodId,
        amount: input.amount,
        error: null,
        attemptedAt: new Date().toISOString(),
        attemptCount: existing?.attemptCount ?? 0,
        syncLockUntil: new Date(Date.now() + 60_000).toISOString(),
      };
      byBooking.set(input.bookingId, row);
      return { acquired: true, existing: row };
    },
    async releaseLock(bookingId) {
      const row = byBooking.get(bookingId);
      if (row) {
        byBooking.set(bookingId, { ...row, syncLockUntil: null });
      }
    },
    resetForTests() {
      byBooking.clear();
    },
  };
}

export function createSupabaseMyRentPaymentSyncStore(): MyRentPaymentSyncStore {
  return {
    async get(bookingId) {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from('myrent_payment_sync')
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
      const { error } = await supabase.from('myrent_payment_sync').upsert(
        {
          booking_id: record.bookingId,
          status: record.status,
          myrent_rent_id: record.myrentRentId,
          payment_method_id: record.paymentMethodId,
          amount: record.amount,
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
    async tryAcquireLock(input) {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase.rpc(
        'acquire_myrent_payment_sync_lock',
        {
          p_booking_id: input.bookingId,
          p_myrent_rent_id: input.myrentRentId,
          p_payment_method_id: input.paymentMethodId,
          p_amount: input.amount,
          p_lock_ttl_seconds: 60,
        },
      );
      if (error) throw error;
      const payload = data as {
        acquired?: boolean;
        reason?: 'already_synced' | 'locked' | 'uncertain' | 'error' | null;
        row?: Record<string, unknown> | null;
      } | null;
      const existing = payload?.row ? rowFromDb(payload.row) : null;
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
        .from('myrent_payment_sync')
        .update({
          sync_lock_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId);
    },
  };
}

let defaultStore: MyRentPaymentSyncStore | null = null;

export function getMyRentPaymentSyncStore(): MyRentPaymentSyncStore {
  if (!defaultStore) {
    defaultStore = createSupabaseMyRentPaymentSyncStore();
  }
  return defaultStore;
}

export function setMyRentPaymentSyncStoreForTests(
  store: MyRentPaymentSyncStore | null,
): void {
  defaultStore = store;
}