/**
 * Kompatibilni wrapper oko SyncStore (testovi + jednostavni helperi).
 */

import {
  createMemoryMyRentSyncStore,
  getMyRentSyncStore,
  setMyRentSyncStoreForTests,
  type SyncStoreRow,
} from './myrent.sync-store';
import type {
  MyRentAdminAlert,
  MyRentSyncRecord,
} from './myrent.booking-sync.types';

let memoryForTests = createMemoryMyRentSyncStore();

export function resetMyRentSyncLedgerForTests(): void {
  memoryForTests = createMemoryMyRentSyncStore();
  setMyRentSyncStoreForTests(memoryForTests);
  memoryForTests.resetForTests?.();
}

export async function getMyRentSyncRecord(
  bookingId: string,
): Promise<MyRentSyncRecord | null> {
  return getMyRentSyncStore().get(bookingId);
}

export async function listMyRentSyncRecordsNeedingAttention(): Promise<
  SyncStoreRow[]
> {
  return getMyRentSyncStore().listNeedingAttention();
}

/** Samo confirmed live MyRent upis. mocked_ok → false. */
export function hasSuccessfulMyRentSyncFromRow(
  row: MyRentSyncRecord | null,
): boolean {
  if (!row) return false;
  return row.confirmedLiveSync === true && Boolean(row.myrentRentId);
}

export async function hasSuccessfulMyRentSync(
  bookingId: string,
): Promise<boolean> {
  const row = await getMyRentSyncRecord(bookingId);
  return hasSuccessfulMyRentSyncFromRow(row);
}

/** Alias: jasno da je riječ o live potvrdi, ne o mocku. */
export const hasConfirmedLiveMyRentSync = hasSuccessfulMyRentSync;
export const hasConfirmedLiveMyRentSyncFromRow = hasSuccessfulMyRentSyncFromRow;

export async function listMyRentAdminAlerts(): Promise<MyRentAdminAlert[]> {
  return getMyRentSyncStore().listAlerts();
}
