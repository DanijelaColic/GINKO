import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMyRentRentAddPayload } from './myrent.booking-payload';
import {
  syncBookingToMyRent,
  syncBookingToMyRentAfterPayment,
  isMyRentAutoSyncBlocked,
} from './myrent.booking-sync';
import {
  getMyRentSyncRecord,
  hasSuccessfulMyRentSync,
  listMyRentAdminAlerts,
  resetMyRentSyncLedgerForTests,
} from './myrent.sync-ledger';
import {
  getMyRentWriteConfig,
  isMyRentLiveWriteAllowed,
  isMyRentLiveWriteAllowedForBooking,
  isMyRentGlobalLiveWriteOpen,
  isMyRentTestLiveOpen,
  isMyRentProductionLiveOpen,
  MYRENT_LIVE_WRITE_CONFIRM_TOKEN,
  MYRENT_TEST_LIVE_CONFIRM_TOKEN,
  MYRENT_PRODUCTION_LIVE_CONFIRM_TOKEN,
} from './myrent.write-config';
import {
  transportMyRentRentAdd,
  executeLiveMyRentRentAdd,
  buildMyRentRentAddRequestBody,
  parseMyRentRentAddResponse,
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
import {
  findUniqueRentByGinkoNoteMarker,
  ginkoBookingNoteMarker,
  noteContainsGinkoBookingMarker,
} from './myrent.reconcile';
import * as writeTransport from './myrent.write-transport';
import * as reconcile from './myrent.reconcile';
import { MyRentApiError } from './myrent.client';

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
    delete process.env.MYRENT_LIVE_SCOPE;
    delete process.env.MYRENT_LIVE_WRITE_CONFIRM;
    delete process.env.MYRENT_LIVE_WRITE_BOOKING_ALLOWLIST;
    delete process.env.MYRENT_TEST_LIVE_CONFIRM;
    delete process.env.MYRENT_PRODUCTION_LIVE_CONFIRM;
    expect(getMyRentWriteConfig()).toEqual({
      enabled: false,
      mode: 'mock',
      scope: 'off',
    });
    expect(isMyRentLiveWriteAllowed()).toBe(false);
    expect(isMyRentGlobalLiveWriteOpen()).toBe(false);
    expect(isMyRentTestLiveOpen()).toBe(false);
    expect(isMyRentProductionLiveOpen()).toBe(false);
  });

  it('allowlist live zahtijeva SVE uvjete; inače false', () => {
    const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    process.env.MYRENT_WRITE_ENABLED = 'true';
    process.env.MYRENT_WRITE_MODE = 'live';
    process.env.MYRENT_LIVE_WRITE_CONFIRM = MYRENT_LIVE_WRITE_CONFIRM_TOKEN;
    process.env.MYRENT_LIVE_WRITE_BOOKING_ALLOWLIST = id;
    expect(isMyRentLiveWriteAllowedForBooking(id)).toBe(true);
    expect(isMyRentLiveWriteAllowedForBooking('other-uuid')).toBe(false);
    expect(isMyRentLiveWriteAllowed()).toBe(false);

    delete process.env.MYRENT_LIVE_WRITE_BOOKING_ALLOWLIST;
    expect(isMyRentLiveWriteAllowedForBooking(id)).toBe(false);

    process.env.MYRENT_LIVE_WRITE_BOOKING_ALLOWLIST = id;
    process.env.MYRENT_LIVE_WRITE_CONFIRM = 'WRONG';
    expect(isMyRentLiveWriteAllowedForBooking(id)).toBe(false);
  });

  it('TEST LIVE otvara sve bookinge samo s potpunim install/host/Saferpay TEST gateom', () => {
    const id = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
    process.env.MYRENT_WRITE_ENABLED = 'true';
    process.env.MYRENT_WRITE_MODE = 'live';
    process.env.MYRENT_LIVE_SCOPE = 'test';
    process.env.MYRENT_TEST_LIVE_CONFIRM = MYRENT_TEST_LIVE_CONFIRM_TOKEN;
    process.env.MYRENT_LIVE_INSTALL_ID = 'ginko-tau-test';
    process.env.MYRENT_EXPECTED_INSTALL_ID = 'ginko-tau-test';
    process.env.MYRENT_TEST_LIVE_SITE_HOSTS = 'ginko-tau.vercel.app';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://ginko-tau.vercel.app';
    process.env.SAFERPAY_BASE_URL = 'https://test.saferpay.com/api';

    expect(isMyRentTestLiveOpen()).toBe(true);
    expect(isMyRentProductionLiveOpen()).toBe(false);
    expect(isMyRentLiveWriteAllowed()).toBe(true);
    expect(isMyRentLiveWriteAllowedForBooking(id)).toBe(true);
    expect(isMyRentLiveWriteAllowedForBooking('other-uuid')).toBe(true);

    // Samo domena / scope bez install para → OFF
    process.env.MYRENT_EXPECTED_INSTALL_ID = 'other-install';
    expect(isMyRentTestLiveOpen()).toBe(false);
    expect(isMyRentLiveWriteAllowedForBooking(id)).toBe(false);

    process.env.MYRENT_EXPECTED_INSTALL_ID = 'ginko-tau-test';
    process.env.SAFERPAY_BASE_URL = 'https://www.saferpay.com/api';
    expect(isMyRentTestLiveOpen()).toBe(false);

    process.env.SAFERPAY_BASE_URL = 'https://test.saferpay.com/api';
    process.env.MYRENT_TEST_LIVE_SITE_HOSTS = 'other.example.com';
    expect(isMyRentTestLiveOpen()).toBe(false);
  });

  it('PRODUCTION LIVE ostaje OFF bez production confirm tokena', () => {
    process.env.MYRENT_WRITE_ENABLED = 'true';
    process.env.MYRENT_WRITE_MODE = 'live';
    process.env.MYRENT_LIVE_SCOPE = 'production';
    delete process.env.MYRENT_PRODUCTION_LIVE_CONFIRM;
    expect(isMyRentProductionLiveOpen()).toBe(false);
    expect(isMyRentLiveWriteAllowed()).toBe(false);

    process.env.MYRENT_PRODUCTION_LIVE_CONFIRM =
      MYRENT_PRODUCTION_LIVE_CONFIRM_TOKEN;
    expect(isMyRentProductionLiveOpen()).toBe(true);
    expect(isMyRentLiveWriteAllowedForBooking('any-id')).toBe(true);
  });
});

describe('buildMyRentRentAddPayload', () => {
  it('mapira sobu, erp_id, rent_source_id WEB page i currency EUR', () => {
    const payload = buildMyRentRentAddPayload(sampleBooking(), {
      myRentUserId: '1234',
    });
    expect(payload.object_id).toBe(16575);
    expect(payload.erp_id).toBe(sampleBooking().id);
    expect(payload.in_advance_paid).toBe('Y');
    expect(payload.spa_offer).toBeNull();
    expect(payload.rent_source_id).toBe(MYRENT_RENT_SOURCE_WEB_PAGE);
    expect(payload.currency_id).toBe(MYRENT_CURRENCY_EUR);
    expect(payload.note).toContain(ginkoBookingNoteMarker(sampleBooking().id));
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
    expect(wellness.rent_source_id).toBe(MYRENT_RENT_SOURCE_WEB_PAGE);
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
    expect(result.uncertain).toBe(false);
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
    expect(result.uncertain).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('parseMyRentRentAddResponse', () => {
  it('podržava number, string, objekt i niz', () => {
    expect(parseMyRentRentAddResponse(2282782)).toEqual({
      rentId: '2282782',
      rentGuid: null,
      unambiguous: true,
    });
    expect(parseMyRentRentAddResponse('abc')).toEqual({
      rentId: 'abc',
      rentGuid: null,
      unambiguous: true,
    });
    expect(parseMyRentRentAddResponse({ rent_id: 9 })).toEqual({
      rentId: '9',
      rentGuid: null,
      unambiguous: true,
    });
    expect(
      parseMyRentRentAddResponse({
        id: 11,
        guid: 'f90a5a0e-b6ba-11f1-af57-9c6b006df76b',
      }),
    ).toEqual({
      rentId: '11',
      rentGuid: 'f90a5a0e-b6ba-11f1-af57-9c6b006df76b',
      unambiguous: true,
    });
    expect(
      parseMyRentRentAddResponse({
        rent_guid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      }),
    ).toEqual({
      rentId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      rentGuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      unambiguous: true,
    });
    expect(
      parseMyRentRentAddResponse([
        { id: 2500105, guid: 'f90a5a0e-b6ba-11f1-af57-9c6b006df76b' },
      ]),
    ).toEqual({
      rentId: '2500105',
      rentGuid: 'f90a5a0e-b6ba-11f1-af57-9c6b006df76b',
      unambiguous: true,
    });
    expect(parseMyRentRentAddResponse([])).toEqual({
      rentId: null,
      rentGuid: null,
      unambiguous: false,
    });
    expect(parseMyRentRentAddResponse([{}, {}])).toEqual({
      rentId: null,
      rentGuid: null,
      unambiguous: false,
    });
    expect(parseMyRentRentAddResponse({})).toEqual({
      rentId: null,
      rentGuid: null,
      unambiguous: false,
    });
  });
});

describe('reconcile po Ginko note markeru', () => {
  const bookingId = sampleBooking().id;

  it('pronalazi točno jedan match po oznaci', () => {
    const match = findUniqueRentByGinkoNoteMarker(
      [
        {
          id: 1,
          note: `Source: Ginko website | ${ginkoBookingNoteMarker(bookingId)}`,
        },
        { id: 2, note: 'other' },
      ],
      bookingId,
    );
    expect(match?.id).toBe(1);
  });

  it('ne zaključuje po sobi/datumima — bez note markera → null', () => {
    expect(
      findUniqueRentByGinkoNoteMarker(
        [
          {
            id: 1,
            object_id: 16575,
            date_from: '2026-12-10',
            date_until: '2026-12-13',
            note: null,
          },
        ],
        bookingId,
      ),
    ).toBeNull();
  });

  it('više pogodaka → null (ručna provjera)', () => {
    const marker = ginkoBookingNoteMarker(bookingId);
    expect(
      findUniqueRentByGinkoNoteMarker(
        [
          { id: 1, note: marker },
          { id: 2, note: `x | ${marker}` },
        ],
        bookingId,
      ),
    ).toBeNull();
  });

  it('noteContainsGinkoBookingMarker', () => {
    expect(noteContainsGinkoBookingMarker(null, bookingId)).toBe(false);
    expect(
      noteContainsGinkoBookingMarker(ginkoBookingNoteMarker(bookingId), bookingId),
    ).toBe(true);
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
    vi.restoreAllMocks();
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
    expect(await hasSuccessfulMyRentSync(sampleBooking().id)).toBe(false);

    const second = await syncBookingToMyRent({ booking: sampleBooking() });
    expect(second.record.status).toBe('mocked_ok');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('live confirmed blokira drugi sync (idempotencija)', async () => {
    const store = createMemoryMyRentSyncStore();
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
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('paralelni lock: drugi pokušaj dok je lock aktivan → skipped', async () => {
    const store = createMemoryMyRentSyncStore();
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

  it('afterPayment: pending ili cancelled → failed, bez transporta', async () => {
    const transportSpy = vi.spyOn(writeTransport, 'transportMyRentRentAdd');
    const pending = await syncBookingToMyRentAfterPayment(
      sampleBooking({ status: 'pending' }),
    );
    expect(pending?.record.status).toBe('failed');
    expect(pending?.record.error).toMatch(/nije confirmed/i);

    const cancelled = await syncBookingToMyRentAfterPayment(
      sampleBooking({ status: 'cancelled', id: 'cccccccc-dddd-eeee-ffff-000000000001' }),
    );
    expect(cancelled?.record.status).toBe('failed');
    expect(cancelled?.record.error).toMatch(/cancelled/i);
    expect(transportSpy).not.toHaveBeenCalled();
  });

  it('afterPayment: deposit_paid=false → failed (ne forsira true)', async () => {
    const result = await syncBookingToMyRentAfterPayment(
      sampleBooking({ deposit_paid: false }),
    );
    expect(result?.record.status).toBe('failed');
    expect(result?.record.error).toMatch(/Depozit nije plaćen/);
  });

  it('timeout / uncertain → nema auto-resenda ni nakon release locka', async () => {
    const transportSpy = vi
      .spyOn(writeTransport, 'transportMyRentRentAdd')
      .mockResolvedValue({
        ok: false,
        mode: 'live',
        rentId: null,
        rentGuid: null,
        error: 'MyRent timeout / prekid veze',
        confirmedLiveSync: false,
        uncertain: true,
      });
    vi.spyOn(reconcile, 'reconcileMyRentRentByBookingNote').mockResolvedValue({
      found: false,
      reason: 'Nema pouzdanog podudaranja',
    });

    const first = await syncBookingToMyRent({ booking: sampleBooking() });
    expect(first.record.status).toBe('uncertain');
    expect(first.record.confirmedLiveSync).toBe(false);
    expect(first.adminAlert).not.toBeNull();
    expect(transportSpy).toHaveBeenCalledTimes(1);

    const second = await syncBookingToMyRent({ booking: sampleBooking() });
    expect(second.record.status).toBe('uncertain');
    expect(transportSpy).toHaveBeenCalledTimes(1);

    const store = (
      await import('./myrent.sync-store')
    ).getMyRentSyncStore();
    const lock = await store.tryAcquireLock(
      sampleBooking().id,
      sampleBooking().id,
      16575,
    );
    expect(lock.acquired).toBe(false);
    expect(lock.reason).toBe('uncertain');
  });

  it('uncertain + uspješan reconcile → live_ok bez drugog writea', async () => {
    const transportSpy = vi
      .spyOn(writeTransport, 'transportMyRentRentAdd')
      .mockResolvedValue({
        ok: false,
        mode: 'live',
        rentId: null,
        rentGuid: null,
        error: 'nejasan odgovor',
        confirmedLiveSync: false,
        uncertain: true,
      });
    vi.spyOn(reconcile, 'reconcileMyRentRentByBookingNote').mockResolvedValue({
      found: true,
      rentId: '2500105',
      rentGuid: 'f90a5a0e-b6ba-11f1-af57-9c6b006df76b',
    });

    const result = await syncBookingToMyRent({ booking: sampleBooking() });
    expect(result.record.status).toBe('live_ok');
    expect(result.record.confirmedLiveSync).toBe(true);
    expect(result.record.myrentRentId).toBe('2500105');
    expect(transportSpy).toHaveBeenCalledTimes(1);
  });

  it('isMyRentAutoSyncBlocked blokira uncertain', () => {
    expect(
      isMyRentAutoSyncBlocked({
        status: 'uncertain',
        confirmedLiveSync: false,
        myrentRentId: null,
      }).blocked,
    ).toBe(true);
    expect(
      isMyRentAutoSyncBlocked({
        status: 'mocked_ok',
        confirmedLiveSync: false,
        myrentRentId: 'mock_rent_11111111',
      }).blocked,
    ).toBe(false);
  });
});

describe('live rent_add transport (hard-gated, bez HTTP)', () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');

  beforeEach(() => {
    fetchSpy.mockClear();
  });

  it('buildMyRentRentAddRequestBody šalje rent_source_id, bez status/payment ID-eva', () => {
    const payload = buildMyRentRentAddPayload(sampleBooking(), {
      myRentUserId: '99',
    });
    const body = buildMyRentRentAddRequestBody(payload);
    expect(body.object_id).toBe(16575);
    expect(body.erp_id).toBe(sampleBooking().id);
    expect(body.in_advance_paid).toBe('Y');
    expect(body.rent_source_id).toBe(MYRENT_RENT_SOURCE_WEB_PAGE);
    expect(body.currency_id).toBe(MYRENT_CURRENCY_EUR);
    expect(body).not.toHaveProperty('payment_method_id');
    expect(body).not.toHaveProperty('rent_status_id');
    expect(body).not.toHaveProperty('spa_offer');
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
    expect(result.uncertain).toBe(false);
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

  it('isMyRentLiveWriteAllowed ostaje false (nema globalnog writea)', () => {
    expect(isMyRentLiveWriteAllowed()).toBe(false);
    expect(isMyRentGlobalLiveWriteOpen()).toBe(false);
  });

  it('mode=live bez allowlista → skipped_disabled, bez HTTP', async () => {
    process.env.MYRENT_WRITE_ENABLED = 'true';
    process.env.MYRENT_WRITE_MODE = 'live';
    process.env.MYRENT_LIVE_WRITE_CONFIRM = MYRENT_LIVE_WRITE_CONFIRM_TOKEN;
    delete process.env.MYRENT_LIVE_WRITE_BOOKING_ALLOWLIST;
    const result = await transportMyRentRentAdd(
      buildMyRentRentAddPayload(sampleBooking(), { myRentUserId: '1' }),
    );
    expect(result.ok).toBe(false);
    expect(result.confirmedLiveSync).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('live allowlist sync (mock HTTP, bez stvarnog MyRent writea)', () => {
  const envBackup = { ...process.env };
  const booking = sampleBooking({
    id: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
  });

  beforeEach(() => {
    resetMyRentSyncLedgerForTests();
    setMyRentSyncStoreForTests(createMemoryMyRentSyncStore());
    process.env.MYRENT_WRITE_ENABLED = 'true';
    process.env.MYRENT_WRITE_MODE = 'live';
    process.env.MYRENT_LIVE_WRITE_CONFIRM = MYRENT_LIVE_WRITE_CONFIRM_TOKEN;
    process.env.MYRENT_LIVE_WRITE_BOOKING_ALLOWLIST = booking.id;
    process.env.MYRENT_USER_ID = '99';
  });

  afterEach(() => {
    process.env = { ...envBackup };
    setMyRentSyncStoreForTests(null);
    vi.restoreAllMocks();
  });

  function enableLiveMocks(opts: {
    postImpl?: () => Promise<unknown>;
    reconcile?:
      | { found: true; rentId: string; rentGuid: string }
      | { found: false; reason: string };
  }) {
    vi.spyOn(writeTransport, 'prepareMyRentAuthForLiveWrite').mockResolvedValue(
      undefined,
    );
    const transportSpy = vi
      .spyOn(writeTransport, 'transportMyRentRentAdd')
      .mockImplementation(async () => {
        try {
          const raw = opts.postImpl ? await opts.postImpl() : { id: 2514467 };
          const parsed = parseMyRentRentAddResponse(raw);
          if (!parsed.unambiguous || !parsed.rentId) {
            return {
              ok: false,
              mode: 'live',
              rentId: null,
              rentGuid: null,
              error:
                'MyRent /user/rent_add odgovor bez nedvosmislenog rent ID-a',
              confirmedLiveSync: false,
              uncertain: true,
            };
          }
          return {
            ok: true,
            mode: 'live',
            rentId: parsed.rentId,
            rentGuid: parsed.rentGuid,
            error: null,
            confirmedLiveSync: true,
            uncertain: false,
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'err';
          return {
            ok: false,
            mode: 'live',
            rentId: null,
            rentGuid: null,
            error: message,
            confirmedLiveSync: false,
            uncertain: true,
          };
        }
      });

    if (opts.reconcile) {
      vi.spyOn(reconcile, 'reconcileMyRentRentByBookingNote').mockResolvedValue(
        opts.reconcile,
      );
    }

    return { transportSpy };
  }

  it('HTTP 200 {} + reconcile → live_ok, jedan transport', async () => {
    const { transportSpy } = enableLiveMocks({
      postImpl: async () => ({}),
      reconcile: {
        found: true,
        rentId: '2514467',
        rentGuid: '85746a32-d425-11f1-af57-9c6b006df76b',
      },
    });
    const result = await syncBookingToMyRent({ booking });
    expect(result.record.status).toBe('live_ok');
    expect(result.record.myrentRentId).toBe('2514467');
    expect(result.record.confirmedLiveSync).toBe(true);
    expect(transportSpy).toHaveBeenCalledTimes(1);
  });

  it('HTTP 200 {} bez reconcile → uncertain, drugi sync 0 POST', async () => {
    const { transportSpy } = enableLiveMocks({
      postImpl: async () => ({}),
      reconcile: { found: false, reason: 'nema markera' },
    });
    const first = await syncBookingToMyRent({ booking });
    expect(first.record.status).toBe('uncertain');
    expect(transportSpy).toHaveBeenCalledTimes(1);

    const second = await syncBookingToMyRent({ booking });
    expect(second.record.status).toBe('uncertain');
    expect(transportSpy).toHaveBeenCalledTimes(1);
  });

  it('timeout → uncertain, bez drugog POST-a', async () => {
    const { transportSpy } = enableLiveMocks({
      postImpl: async () => {
        throw new Error('fetch failed: ETIMEDOUT');
      },
      reconcile: { found: false, reason: 'timeout window' },
    });
    const first = await syncBookingToMyRent({ booking });
    expect(first.record.status).toBe('uncertain');
    expect(transportSpy).toHaveBeenCalledTimes(1);
    const second = await syncBookingToMyRent({ booking });
    expect(second.record.status).toBe('uncertain');
    expect(transportSpy).toHaveBeenCalledTimes(1);
  });

  it('401/403 nakon claima → uncertain, bez retry transporta', async () => {
    const { transportSpy } = enableLiveMocks({
      postImpl: async () => {
        throw new MyRentApiError(401, 'MyRent API POST /user/rent_add failed (HTTP 401).');
      },
      reconcile: { found: false, reason: 'auth' },
    });
    const result = await syncBookingToMyRent({ booking });
    expect(result.record.status).toBe('uncertain');
    expect(transportSpy).toHaveBeenCalledTimes(1);
  });

  it('MyRent nedostupan → uncertain, bez auto-resenda', async () => {
    const { transportSpy } = enableLiveMocks({
      postImpl: async () => {
        throw new Error('network unavailable');
      },
      reconcile: { found: false, reason: 'down' },
    });
    const first = await syncBookingToMyRent({ booking });
    expect(first.record.status).toBe('uncertain');
    await syncBookingToMyRent({ booking });
    expect(transportSpy).toHaveBeenCalledTimes(1);
  });

  it('paralelni webhookovi: jedan claim / najviše jedan POST', async () => {
    let posts = 0;
    enableLiveMocks({
      postImpl: async () => {
        posts += 1;
        return { id: 42 };
      },
    });
    const [a, b] = await Promise.all([
      syncBookingToMyRent({ booking }),
      syncBookingToMyRent({ booking }),
    ]);
    const statuses = [a.record.status, b.record.status].sort();
    expect(statuses).toContain('live_ok');
    expect(posts).toBe(1);
  });

  it('auth fail prije claima → failed, 0 POST', async () => {
    vi.spyOn(writeTransport, 'prepareMyRentAuthForLiveWrite').mockRejectedValue(
      new Error('token generate failed'),
    );
    const transportSpy = vi.spyOn(writeTransport, 'transportMyRentRentAdd');
    const result = await syncBookingToMyRent({ booking });
    expect(result.record.status).toBe('failed');
    expect(result.record.error).toMatch(/Auth prije claima/);
    expect(transportSpy).not.toHaveBeenCalled();
  });

  it('isključeni live gate (krivi confirm) → skipped_disabled', async () => {
    process.env.MYRENT_LIVE_WRITE_CONFIRM = 'NOPE';
    const transportSpy = vi.spyOn(writeTransport, 'transportMyRentRentAdd');
    // Bez allowlist live — pada na transport mock/disabled path
    const result = await syncBookingToMyRent({ booking });
    // mode=live u env ali allowlist gate false → transport vraća skipped stil
    expect(['skipped_disabled', 'failed']).toContain(result.record.status);
    expect(result.record.confirmedLiveSync).toBe(false);
    // transport se zove u mock/disabled grani
    expect(transportSpy).toHaveBeenCalled();
  });
});

describe('TEST LIVE sync (mock HTTP, bez UUID allowliste)', () => {
  const envBackup = { ...process.env };
  const booking = sampleBooking({
    id: 'cccccccc-dddd-eeee-ffff-000011112222',
  });

  beforeEach(() => {
    resetMyRentSyncLedgerForTests();
    setMyRentSyncStoreForTests(createMemoryMyRentSyncStore());
    process.env.MYRENT_WRITE_ENABLED = 'true';
    process.env.MYRENT_WRITE_MODE = 'live';
    process.env.MYRENT_LIVE_SCOPE = 'test';
    process.env.MYRENT_TEST_LIVE_CONFIRM = MYRENT_TEST_LIVE_CONFIRM_TOKEN;
    process.env.MYRENT_LIVE_INSTALL_ID = 'ginko-tau-test';
    process.env.MYRENT_EXPECTED_INSTALL_ID = 'ginko-tau-test';
    process.env.MYRENT_TEST_LIVE_SITE_HOSTS = 'ginko-tau.vercel.app';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://ginko-tau.vercel.app';
    process.env.SAFERPAY_BASE_URL = 'https://test.saferpay.com/api';
    process.env.MYRENT_USER_ID = '99';
    delete process.env.MYRENT_LIVE_WRITE_BOOKING_ALLOWLIST;
    delete process.env.MYRENT_PRODUCTION_LIVE_CONFIRM;
  });

  afterEach(() => {
    process.env = { ...envBackup };
    setMyRentSyncStoreForTests(null);
    vi.restoreAllMocks();
  });

  it('TEST LIVE gate otvoren → live_ok bez allowliste; drugi sync 0 POST', async () => {
    expect(isMyRentTestLiveOpen()).toBe(true);
    vi.spyOn(writeTransport, 'prepareMyRentAuthForLiveWrite').mockResolvedValue(
      undefined,
    );
    const transportSpy = vi
      .spyOn(writeTransport, 'transportMyRentRentAdd')
      .mockResolvedValue({
        ok: true,
        mode: 'live',
        rentId: '9001',
        rentGuid: null,
        error: null,
        confirmedLiveSync: true,
        uncertain: false,
      });

    const first = await syncBookingToMyRent({ booking });
    expect(first.record.status).toBe('live_ok');
    expect(transportSpy).toHaveBeenCalledTimes(1);

    // Drugi sync: već live_ok → skipped_duplicate, 0 dodatnih POST-ova
    const second = await syncBookingToMyRent({ booking });
    expect(second.record.status).toBe('skipped_duplicate');
    expect(transportSpy).toHaveBeenCalledTimes(1);
  });

  it('PRODUCTION LIVE nije uključen kad je scope=test', () => {
    expect(isMyRentProductionLiveOpen()).toBe(false);
  });
});
