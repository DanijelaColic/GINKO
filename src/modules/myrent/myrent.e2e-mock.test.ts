/**
 * Izolirani end-to-end mock test Ginko → MyRent sync.
 * Fixture = javna polja rezervacije REZ-839C5C10 (bez produkcijskog Supabase upisa).
 * Memory store + fetch spy — 0 stvarnih MyRent write poziva.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMyRentRentAddPayload } from './myrent.booking-payload';
import {
  syncBookingToMyRent,
  isMyRentAutoSyncBlocked,
} from './myrent.booking-sync';
import {
  getMyRentSyncRecord,
  hasSuccessfulMyRentSync,
  resetMyRentSyncLedgerForTests,
} from './myrent.sync-ledger';
import { isMyRentLiveWriteAllowed } from './myrent.write-config';
import {
  buildMyRentRentAddRequestBody,
  transportMyRentRentAdd,
} from './myrent.write-transport';
import {
  createMemoryMyRentSyncStore,
  setMyRentSyncStoreForTests,
} from './myrent.sync-store';
import type { BookingForMyRentSync } from './myrent.booking-payload';
import {
  MYRENT_CURRENCY_EUR,
  MYRENT_RENT_SOURCE_WEB_PAGE,
} from './myrent.config';
import { ginkoBookingNoteMarker } from './myrent.reconcile';
import * as writeTransport from './myrent.write-transport';
import * as reconcileMod from './myrent.reconcile';

/** REZ-839C5C10 — fixture (nema PII potrebnog za assert; kontakt je sintetički). */
const REZ_839C5C10: BookingForMyRentSync = {
  id: '839c5c10-0c43-4e95-802b-723ac17e7f3f',
  room_slug: 'ginko-1',
  check_in: '2027-02-15',
  check_out: '2027-02-17',
  guest_name: 'E2E Mock Guest',
  guest_email: 'e2e-mock@example.com',
  guest_phone: null,
  adults: 2,
  children: 0,
  total_price: 120,
  deposit: 60,
  deposit_paid: true,
  include_wellness: false,
  notes: null,
  status: 'confirmed',
};

describe('E2E mock — REZ-839C5C10 (izolirano, bez produkcijskog Supabasea)', () => {
  const envBackup = { ...process.env };
  const fetchSpy = vi.spyOn(globalThis, 'fetch');

  beforeEach(() => {
    resetMyRentSyncLedgerForTests();
    setMyRentSyncStoreForTests(createMemoryMyRentSyncStore());
    fetchSpy.mockClear();
    fetchSpy.mockImplementation(() => {
      throw new Error(
        'E2E mock: neočekivan fetch — produkcijski/MyRent HTTP zabranjen u ovom testu',
      );
    });
    process.env.MYRENT_WRITE_ENABLED = 'true';
    process.env.MYRENT_WRITE_MODE = 'mock';
    process.env.MYRENT_USER_ID = '1317';
  });

  afterEach(() => {
    process.env = { ...envBackup };
    setMyRentSyncStoreForTests(null);
    vi.restoreAllMocks();
  });

  it('hard-gate ostaje false (nema live HTTP puta)', () => {
    expect(isMyRentLiveWriteAllowed()).toBe(false);
  });

  it('payload + request body: object_id, rent_source_id, currency, datumi, cijena, depozit', () => {
    const payload = buildMyRentRentAddPayload(REZ_839C5C10, {
      myRentUserId: '1317',
    });
    expect(payload.object_id).toBe(16575);
    expect(payload.rent_source_id).toBe(MYRENT_RENT_SOURCE_WEB_PAGE);
    expect(payload.rent_source_id).toBe(129343);
    expect(payload.currency_id).toBe(MYRENT_CURRENCY_EUR);
    expect(payload.currency_id).toBe('2');
    expect(payload.from_date).toBe('2027-02-15');
    expect(payload.until_date).toBe('2027-02-17');
    expect(payload.price).toBe(120);
    expect(payload.in_advance).toBe(60);
    expect(payload.in_advance_paid).toBe('Y');
    expect(payload.erp_id).toBe(REZ_839C5C10.id);
    expect(payload.note).toContain(ginkoBookingNoteMarker(REZ_839C5C10.id));

    const body = buildMyRentRentAddRequestBody(payload);
    expect(body.object_id).toBe(16575);
    expect(body.rent_source_id).toBe(129343);
    expect(body.currency_id).toBe('2');
    expect(body.from_date).toBe('2027-02-15');
    expect(body.until_date).toBe('2027-02-17');
    expect(body.price).toBe(120);
    expect(body.in_advance).toBe(60);
    expect(body).not.toHaveProperty('rent_status_id');
    expect(body).not.toHaveProperty('payment_method_id');
  });

  it('uspješan mock sync → mocked_ok, confirmed_live_sync=false, bez HTTP', async () => {
    const result = await syncBookingToMyRent({ booking: REZ_839C5C10 });

    expect(result.record.status).toBe('mocked_ok');
    expect(result.record.confirmedLiveSync).toBe(false);
    expect(result.record.objectId).toBe(16575);
    expect(result.record.myrentRentId).toBe('mock_rent_839c5c10');
    expect(result.record.payloadErpId).toBe(REZ_839C5C10.id);
    expect(await hasSuccessfulMyRentSync(REZ_839C5C10.id)).toBe(false);

    const stored = await getMyRentSyncRecord(REZ_839C5C10.id);
    expect(stored?.status).toBe('mocked_ok');
    expect(stored?.confirmedLiveSync).toBe(false);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(isMyRentLiveWriteAllowed()).toBe(false);
  });

  it('ponovljeni sync ostaje mock — nema stvarnog MyRent writea', async () => {
    const first = await syncBookingToMyRent({ booking: REZ_839C5C10 });
    expect(first.record.status).toBe('mocked_ok');

    const second = await syncBookingToMyRent({ booking: REZ_839C5C10 });
    expect(second.record.status).toBe('mocked_ok');
    expect(second.record.confirmedLiveSync).toBe(false);
    expect(await hasSuccessfulMyRentSync(REZ_839C5C10.id)).toBe(false);

    // transport mock i dalje ne zove fetch; hard-gate zatvoren
    const transport = await transportMyRentRentAdd(
      buildMyRentRentAddPayload(REZ_839C5C10, { myRentUserId: '1317' }),
    );
    expect(transport.mode).toBe('mock');
    expect(transport.confirmedLiveSync).toBe(false);
    expect(transport.uncertain).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('timeout / uncertain sprječava automatski retry (0 write)', async () => {
    const transportSpy = vi
      .spyOn(writeTransport, 'transportMyRentRentAdd')
      .mockResolvedValue({
        ok: false,
        mode: 'live',
        rentId: null,
        rentGuid: null,
        error: 'MyRent timeout / prekid veze — moguće da je rezervacija zaprimljena',
        confirmedLiveSync: false,
        uncertain: true,
      });
    vi.spyOn(reconcileMod, 'reconcileMyRentRentByBookingNote').mockResolvedValue({
      found: false,
      reason: 'Nema pouzdanog podudaranja po Ginko oznaci u napomeni',
    });

    const first = await syncBookingToMyRent({ booking: REZ_839C5C10 });
    expect(first.record.status).toBe('uncertain');
    expect(first.record.confirmedLiveSync).toBe(false);
    expect(transportSpy).toHaveBeenCalledTimes(1);

    const second = await syncBookingToMyRent({ booking: REZ_839C5C10 });
    expect(second.record.status).toBe('uncertain');
    expect(transportSpy).toHaveBeenCalledTimes(1);

    expect(
      isMyRentAutoSyncBlocked({
        status: 'uncertain',
        confirmedLiveSync: false,
        myrentRentId: null,
      }).blocked,
    ).toBe(true);

    const store = createMemoryMyRentSyncStore();
    // izolirani lock check na uncertain redu
    await store.save({
      bookingId: REZ_839C5C10.id,
      status: 'uncertain',
      myrentRentId: null,
      error: 'timeout',
      payloadErpId: REZ_839C5C10.id,
      objectId: 16575,
      attemptedAt: new Date().toISOString(),
      confirmedLiveSync: false,
    });
    const lock = await store.tryAcquireLock(
      REZ_839C5C10.id,
      REZ_839C5C10.id,
      16575,
    );
    expect(lock.acquired).toBe(false);
    expect(lock.reason).toBe('uncertain');

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('WRITE_ENABLED=false → skipped_disabled, i dalje bez HTTP', async () => {
    process.env.MYRENT_WRITE_ENABLED = 'false';
    const result = await syncBookingToMyRent({ booking: REZ_839C5C10 });
    expect(result.record.status).toBe('skipped_disabled');
    expect(result.record.confirmedLiveSync).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
