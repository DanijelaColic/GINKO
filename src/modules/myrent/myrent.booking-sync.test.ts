import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMyRentRentAddPayload } from './myrent.booking-payload';
import {
  syncBookingToMyRent,
  syncBookingToMyRentAfterPayment,
} from './myrent.booking-sync';
import {
  getMyRentSyncRecord,
  hasSuccessfulMyRentSync,
  listMyRentAdminAlerts,
  resetMyRentSyncLedgerForTests,
} from './myrent.sync-ledger';
import { getMyRentWriteConfig, isMyRentLiveWriteAllowed } from './myrent.write-config';
import {
  transportMyRentRentAdd,
  executeLiveMyRentRentAdd,
  buildMyRentRentAddRequestBody,
  parseMyRentRentAddResponse,
} from './myrent.write-transport';
import { setMyRentSyncStoreForTests } from './myrent.sync-store';
import type { BookingForMyRentSync } from './myrent.booking-payload';

function sampleBooking(
  overrides: Partial<BookingForMyRentSync> = {},
): BookingForMyRentSync {
  return {
    id: '11111111-2222-3333-4444-555555555555',
    room_slug: 'ginko-1',
    check_in: '2026-12-10',
    check_out: '2026-12-13',
    guest_name: 'Test Guest',
    guest_email: 'test@example.com',
    guest_phone: '+385991234567',
    adults: 2,
    children: 0,
    total_price: 180,
    deposit: 90,
    deposit_paid: true,
    include_wellness: false,
    notes: null,
    status: 'confirmed',
    ...overrides,
  };
}

describe('MyRent write config (defaults)', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('zadano WRITE_ENABLED=false i MODE=mock', () => {
    delete process.env.MYRENT_WRITE_ENABLED;
    delete process.env.MYRENT_WRITE_MODE;
    expect(getMyRentWriteConfig()).toEqual({
      enabled: false,
      mode: 'mock',
    });
    expect(isMyRentLiveWriteAllowed()).toBe(false);
  });
});

describe('buildMyRentRentAddPayload', () => {
  it('mapira sobu na object_id i erp_id = booking.id', () => {
    const payload = buildMyRentRentAddPayload(sampleBooking(), {
      myRentUserId: '1234',
    });
    expect(payload.object_id).toBe(16575);
    expect(payload.erp_id).toBe(sampleBooking().id);
    expect(payload.in_advance_paid).toBe('Y');
    expect(payload.spa_offer).toBeNull();
  });

  it('SPA wellness i bez wellnessa dijele object_id 7460', () => {
    const wellness = buildMyRentRentAddPayload(
      sampleBooking({
        room_slug: 'ginko-spa-2',
        include_wellness: true,
      }),
      { myRentUserId: '1' },
    );
    const standard = buildMyRentRentAddPayload(
      sampleBooking({
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        room_slug: 'ginko-spa-1',
        include_wellness: false,
      }),
      { myRentUserId: '1' },
    );
    expect(wellness.object_id).toBe(7460);
    expect(standard.object_id).toBe(7460);
    expect(wellness.spa_offer).toBe('wellness');
    expect(standard.spa_offer).toBe('standard');
  });
});

describe('transportMyRentRentAdd — bez HTTP write', () => {
  const envBackup = { ...process.env };
  const fetchSpy = vi.spyOn(globalThis, 'fetch');

  beforeEach(() => {
    fetchSpy.mockClear();
    process.env.MYRENT_WRITE_ENABLED = 'true';
    process.env.MYRENT_WRITE_MODE = 'mock';
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('mock OK bez fetch poziva i bez live potvrde', async () => {
    const payload = buildMyRentRentAddPayload(sampleBooking(), {
      myRentUserId: '1',
    });
    const result = await transportMyRentRentAdd(payload);
    expect(result.ok).toBe(true);
    expect(result.mode).toBe('mock');
    expect(result.confirmedLiveSync).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('live mode ne šalje HTTP (nije aktiviran)', async () => {
    process.env.MYRENT_WRITE_MODE = 'live';
    const payload = buildMyRentRentAddPayload(sampleBooking(), {
      myRentUserId: '1',
    });
    const result = await transportMyRentRentAdd(payload);
    expect(result.ok).toBe(false);
    expect(result.confirmedLiveSync).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('syncBookingToMyRent (memory store)', () => {
  const envBackup = { ...process.env };
  const fetchSpy = vi.spyOn(globalThis, 'fetch');

  beforeEach(() => {
    resetMyRentSyncLedgerForTests();
    fetchSpy.mockClear();
    process.env.MYRENT_WRITE_ENABLED = 'true';
    process.env.MYRENT_WRITE_MODE = 'mock';
    process.env.MYRENT_USER_ID = '99';
  });

  afterEach(() => {
    process.env = { ...envBackup };
    setMyRentSyncStoreForTests(null);
  });

  it('mock sync bilježi mocked_ok bez live potvrde', async () => {
    const result = await syncBookingToMyRent({
      booking: sampleBooking(),
    });
    expect(result.record.status).toBe('mocked_ok');
    expect(result.record.confirmedLiveSync).toBe(false);
    expect(result.record.objectId).toBe(16575);
    expect(result.adminAlert).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('mocked_ok nije live uspjeh i ne blokira ponovni sync pokušaj', async () => {
    const first = await syncBookingToMyRent({ booking: sampleBooking() });
    expect(first.record.status).toBe('mocked_ok');
    expect(first.record.confirmedLiveSync).toBe(false);
    expect(await hasSuccessfulMyRentSync(sampleBooking().id)).toBe(false);

    const second = await syncBookingToMyRent({ booking: sampleBooking() });
    expect(second.record.status).toBe('mocked_ok');
    expect(second.record.confirmedLiveSync).toBe(false);
    expect(await hasSuccessfulMyRentSync(sampleBooking().id)).toBe(false);

    const stored = await getMyRentSyncRecord(sampleBooking().id);
    expect(stored?.status).toBe('mocked_ok');
    expect(stored?.confirmedLiveSync).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('live confirmed blokira drugi sync (idempotencija)', async () => {
    const store = (
      await import('./myrent.sync-store')
    ).createMemoryMyRentSyncStore();
    setMyRentSyncStoreForTests(store);
    const booking = sampleBooking({
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    });
    await store.save({
      bookingId: booking.id,
      status: 'live_ok',
      myrentRentId: '2282782',
      error: null,
      payloadErpId: booking.id,
      objectId: 16575,
      attemptedAt: new Date().toISOString(),
      confirmedLiveSync: true,
    });
    expect(await hasSuccessfulMyRentSync(booking.id)).toBe(true);

    const result = await syncBookingToMyRent({ booking });
    expect(result.record.status).toBe('skipped_duplicate');
    expect(result.record.confirmedLiveSync).toBe(true);
    expect(result.record.myrentRentId).toBe('2282782');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('paralelni lock: drugi pokušaj dok je lock aktivan → skipped', async () => {
    const store = (
      await import('./myrent.sync-store')
    ).createMemoryMyRentSyncStore();
    setMyRentSyncStoreForTests(store);
    const booking = sampleBooking({
      id: '99999999-8888-7777-6666-555555555555',
    });
    const lock1 = await store.tryAcquireLock(booking.id, booking.id, 16575);
    expect(lock1.acquired).toBe(true);
    const result = await syncBookingToMyRent({ booking });
    expect(result.record.status).toBe('skipped_duplicate');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('write disabled → skipped_disabled, bez HTTP', async () => {
    process.env.MYRENT_WRITE_ENABLED = 'false';
    const result = await syncBookingToMyRent({
      booking: sampleBooking(),
    });
    expect(result.record.status).toBe('skipped_disabled');
    expect(result.record.confirmedLiveSync).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('neplaćen depozit → failed + admin alert', async () => {
    const result = await syncBookingToMyRent({
      booking: sampleBooking({ deposit_paid: false }),
    });
    expect(result.record.status).toBe('failed');
    expect(result.adminAlert?.type).toBe('myrent_sync_failed');
    expect(await listMyRentAdminAlerts()).toHaveLength(1);
  });

  it('afterPayment kuka ne baca i ne tvrdi live sync', async () => {
    const result = await syncBookingToMyRentAfterPayment(sampleBooking());
    expect(result?.record.status).toBe('mocked_ok');
    expect(result?.record.confirmedLiveSync).toBe(false);
    const stored = await getMyRentSyncRecord(sampleBooking().id);
    expect(stored?.myrentRentId).toMatch(/^mock_rent_/);
  });
});

describe('live rent_add transport (hard-gated, bez HTTP)', () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');

  beforeEach(() => {
    fetchSpy.mockClear();
  });

  it('buildMyRentRentAddRequestBody šalje samo poznata polja (bez nagađanih ID-eva)', () => {
    const payload = buildMyRentRentAddPayload(sampleBooking(), {
      myRentUserId: '99',
    });
    const body = buildMyRentRentAddRequestBody(payload);
    expect(body.object_id).toBe(16575);
    expect(body.erp_id).toBe(sampleBooking().id);
    expect(body.in_advance_paid).toBe('Y');
    expect(body).not.toHaveProperty('rent_source_id');
    expect(body).not.toHaveProperty('payment_method_id');
    expect(body).not.toHaveProperty('rent_status_id');
    expect(body).not.toHaveProperty('spa_offer');
  });

  it('parseMyRentRentAddResponse podržava number/string/objekt', () => {
    expect(parseMyRentRentAddResponse(2282782)).toBe('2282782');
    expect(parseMyRentRentAddResponse('abc')).toBe('abc');
    expect(parseMyRentRentAddResponse({ rent_id: 9 })).toBe('9');
    expect(parseMyRentRentAddResponse({})).toBeNull();
  });

  it('executeLiveMyRentRentAdd ne zove HTTP dok je gate zatvoren', async () => {
    process.env.MYRENT_WRITE_ENABLED = 'true';
    process.env.MYRENT_WRITE_MODE = 'live';
    const payload = buildMyRentRentAddPayload(sampleBooking(), {
      myRentUserId: '1',
    });
    const result = await executeLiveMyRentRentAdd(payload);
    expect(result.ok).toBe(false);
    expect(result.confirmedLiveSync).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('transport u live mode env i dalje bez HTTP (gate)', async () => {
    process.env.MYRENT_WRITE_ENABLED = 'true';
    process.env.MYRENT_WRITE_MODE = 'live';
    const payload = buildMyRentRentAddPayload(sampleBooking(), {
      myRentUserId: '1',
    });
    const result = await transportMyRentRentAdd(payload);
    expect(result.ok).toBe(false);
    expect(result.mode).toBe('live');
    expect(result.confirmedLiveSync).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
