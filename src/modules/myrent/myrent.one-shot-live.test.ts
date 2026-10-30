import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  assertOneShotBookingEligible,
  buildOneShotClaimError,
  isConfirmedOneShotClaim,
  isMyRentOneShotLiveAuthorized,
  isOneShotAlreadyAttempted,
  MYRENT_ONE_SHOT_CLAIM_PREFIX,
  MYRENT_ONE_SHOT_LIVE_CONFIRM,
  runMyRentOneShotLive,
  type OneShotBookingRow,
  type OneShotDeps,
} from './myrent.one-shot-live';
import { isMyRentLiveWriteAllowed } from './myrent.write-config';
import type { MyRentSyncRecord } from './myrent.booking-sync.types';
import { MYRENT_RENT_SOURCE_WEB_PAGE } from './myrent.config';
import {
  createMemoryMyRentSyncStore,
  type OneShotClaimResult,
} from './myrent.sync-store';
import { myrentRequest, MyRentApiError } from './myrent.client';
import * as myrentAuth from './myrent.auth';
import * as myrentConfig from './myrent.config';

const BOOKING_ID = '839c5c10-0c43-4e95-802b-723ac17e7f3f';

function sampleBooking(
  overrides: Partial<OneShotBookingRow> = {},
): OneShotBookingRow {
  return {
    id: BOOKING_ID,
    room_slug: 'ginko-1',
    check_in: '2027-02-15',
    check_out: '2027-02-17',
    guest_name: 'Secret Guest',
    guest_email: 'secret@example.com',
    guest_phone: '+38599111222',
    adults: 2,
    children: 0,
    total_price: 120,
    deposit: 60,
    deposit_paid: true,
    include_wellness: false,
    notes: null,
    status: 'confirmed',
    ...overrides,
  };
}

function makeDeps(opts: {
  booking?: OneShotBookingRow | null;
  sync?: MyRentSyncRecord | null;
  availOk?: boolean;
  postImpl?: (body: Record<string, unknown>) => Promise<unknown>;
  claimImpl?: OneShotDeps['claimOneShotAttempt'];
  prepareAuth?: () => Promise<void>;
}): {
  deps: OneShotDeps;
  postSpy: ReturnType<typeof vi.fn>;
  claimSpy: ReturnType<typeof vi.fn>;
  saves: MyRentSyncRecord[];
  logs: string[];
  setSync: (r: MyRentSyncRecord | null) => void;
} {
  const saves: MyRentSyncRecord[] = [];
  const logs: string[] = [];
  let sync = opts.sync ?? null;
  const postSpy = vi.fn(
    opts.postImpl ??
      (async () => ({
        id: 999001,
        guid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      })),
  );

  const defaultClaim: OneShotDeps['claimOneShotAttempt'] = async (input) => {
    if (
      sync &&
      (sync.status === 'uncertain' ||
        sync.status === 'live_ok' ||
        sync.confirmedLiveSync)
    ) {
      return {
        claimed: false,
        reason: sync.status === 'uncertain' ? 'already_claimed' : 'already_synced',
        row: {
          ...sync,
          attemptCount: 1,
          syncLockUntil: null,
        },
      };
    }
    const row = {
      bookingId: input.bookingId,
      status: 'uncertain' as const,
      myrentRentId: null,
      error: input.claimError,
      payloadErpId: input.payloadErpId,
      objectId: input.objectId,
      attemptedAt: '2026-10-30T12:00:00.000Z',
      confirmedLiveSync: false,
      attemptCount: 1,
      syncLockUntil: null,
    };
    sync = row;
    return { claimed: true, reason: null, row };
  };

  const claimSpy = vi.fn(opts.claimImpl ?? defaultClaim);

  const deps: OneShotDeps = {
    loadBooking: async () => opts.booking ?? null,
    getSyncRecord: async () =>
      sync
        ? {
            ...sync,
            attemptCount: 1,
            syncLockUntil: null,
          }
        : null,
    claimOneShotAttempt: claimSpy,
    saveSyncRecord: async (record) => {
      saves.push(record);
      sync = record;
    },
    checkMyRentAvailability: async () =>
      opts.availOk === false
        ? { ok: false, message: 'MyRent: termin nije slobodan (zauzet 2027-02-15).' }
        : { ok: true, message: 'MyRent termin slobodan (read-only).' },
    prepareAuthForWrite: opts.prepareAuth ?? (async () => undefined),
    postRentAdd: postSpy,
    nowIso: () => '2026-10-30T12:00:00.000Z',
    log: (line) => logs.push(line),
  };

  return {
    deps,
    postSpy,
    claimSpy,
    saves,
    logs,
    setSync: (r) => {
      sync = r;
    },
  };
}

describe('MyRent one-shot live (mockovi, bez stvarnog writea)', () => {
  it('globalni hard-gate ostaje false', () => {
    expect(isMyRentLiveWriteAllowed()).toBe(false);
  });

  it('eligible: confirmed + deposit_paid', () => {
    expect(assertOneShotBookingEligible(sampleBooking()).ok).toBe(true);
    expect(
      assertOneShotBookingEligible(sampleBooking({ status: 'pending' })).ok,
    ).toBe(false);
    expect(
      assertOneShotBookingEligible(sampleBooking({ deposit_paid: false })).ok,
    ).toBe(false);
    expect(
      assertOneShotBookingEligible(sampleBooking({ status: 'cancelled' })).ok,
    ).toBe(false);
  });

  it('autorizacija: default dry-run; krivi token blokira; točan token live', () => {
    expect(
      isMyRentOneShotLiveAuthorized({
        bookingId: BOOKING_ID,
        explicitBookingId: BOOKING_ID,
        liveConfirmToken: null,
      }),
    ).toMatchObject({ authorized: true, dryRun: true });

    expect(
      isMyRentOneShotLiveAuthorized({
        bookingId: BOOKING_ID,
        explicitBookingId: 'other-uuid',
        liveConfirmToken: null,
      }).authorized,
    ).toBe(false);

    expect(
      isMyRentOneShotLiveAuthorized({
        bookingId: BOOKING_ID,
        explicitBookingId: BOOKING_ID,
        liveConfirmToken: 'WRONG',
      }).authorized,
    ).toBe(false);

    expect(
      isMyRentOneShotLiveAuthorized({
        bookingId: BOOKING_ID,
        explicitBookingId: BOOKING_ID,
        liveConfirmToken: MYRENT_ONE_SHOT_LIVE_CONFIRM,
      }),
    ).toMatchObject({ authorized: true, dryRun: false });
  });

  it('DRY-RUN: nema claima ni POST-a; summary bez PII u logu', async () => {
    const { deps, postSpy, claimSpy, saves, logs } = makeDeps({
      booking: sampleBooking(),
    });
    const result = await runMyRentOneShotLive(
      {
        bookingId: BOOKING_ID,
        explicitBookingId: BOOKING_ID,
        liveConfirmToken: null,
      },
      deps,
    );
    expect(result.status).toBe('dry_run_ok');
    expect(result.ok).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(postSpy).not.toHaveBeenCalled();
    expect(claimSpy).not.toHaveBeenCalled();
    expect(saves).toHaveLength(0);
    expect(result.summary?.objectId).toBe(16575);
    expect(result.summary?.rentSourceId).toBe(MYRENT_RENT_SOURCE_WEB_PAGE);
    expect(result.summary?.currencyId).toBe('2');
    expect(result.summary?.price).toBe(120);
    expect(result.summary?.deposit).toBe(60);
    const joined = logs.join('\n');
    expect(joined).not.toContain('Secret Guest');
    expect(joined).not.toContain('secret@example.com');
    expect(joined).not.toContain('+38599111222');
  });

  it('pre-check fail (zauzet termin) → nema claima ni POST-a', async () => {
    const { deps, postSpy, claimSpy } = makeDeps({
      booking: sampleBooking(),
      availOk: false,
    });
    const result = await runMyRentOneShotLive(
      {
        bookingId: BOOKING_ID,
        explicitBookingId: BOOKING_ID,
        liveConfirmToken: MYRENT_ONE_SHOT_LIVE_CONFIRM,
      },
      deps,
    );
    expect(result.status).toBe('precheck_failed');
    expect(postSpy).not.toHaveBeenCalled();
    expect(claimSpy).not.toHaveBeenCalled();
  });

  it('uspješan odgovor: atomski claim prije POST-a, zatim live_ok', async () => {
    const { deps, postSpy, claimSpy, saves } = makeDeps({
      booking: sampleBooking(),
    });
    const result = await runMyRentOneShotLive(
      {
        bookingId: BOOKING_ID,
        explicitBookingId: BOOKING_ID,
        liveConfirmToken: MYRENT_ONE_SHOT_LIVE_CONFIRM,
      },
      deps,
    );
    expect(result.status).toBe('live_ok');
    expect(result.myrentRentId).toBe('999001');
    expect(claimSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(claimSpy.mock.invocationCallOrder[0]!).toBeLessThan(
      postSpy.mock.invocationCallOrder[0]!,
    );
    expect(saves[saves.length - 1]?.status).toBe('live_ok');
    expect(saves[saves.length - 1]?.confirmedLiveSync).toBe(true);
    const body = postSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body.object_id).toBe(16575);
    expect(body.rent_source_id).toBe(129343);
    expect(body.currency_id).toBe('2');
    expect(body.from_date).toBe('2027-02-15');
    expect(body.until_date).toBe('2027-02-17');
    expect(body.price).toBe(120);
    expect(body.in_advance).toBe(60);
  });

  it('claim nije potvrđen → HTTP nije poslan', async () => {
    const { deps, postSpy } = makeDeps({
      booking: sampleBooking(),
      claimImpl: async () => ({
        claimed: false,
        reason: 'error',
        row: null,
      }),
    });
    const result = await runMyRentOneShotLive(
      {
        bookingId: BOOKING_ID,
        explicitBookingId: BOOKING_ID,
        liveConfirmToken: MYRENT_ONE_SHOT_LIVE_CONFIRM,
      },
      deps,
    );
    expect(result.status).toBe('blocked');
    expect(result.message).toMatch(/claim nije potvrđen/i);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('ponovljeno pokretanje nakon claima / uncertain → blokirano, 0 POST', async () => {
    const claim = buildOneShotClaimError(
      BOOKING_ID,
      '2026-10-30T12:00:00.000Z',
    );
    const { deps, postSpy, claimSpy } = makeDeps({
      booking: sampleBooking(),
      sync: {
        bookingId: BOOKING_ID,
        status: 'uncertain',
        myrentRentId: null,
        error: claim,
        payloadErpId: BOOKING_ID,
        objectId: 16575,
        attemptedAt: '2026-10-30T12:00:00.000Z',
        confirmedLiveSync: false,
      },
    });
    const result = await runMyRentOneShotLive(
      {
        bookingId: BOOKING_ID,
        explicitBookingId: BOOKING_ID,
        liveConfirmToken: MYRENT_ONE_SHOT_LIVE_CONFIRM,
      },
      deps,
    );
    expect(result.status).toBe('blocked');
    expect(result.message).toMatch(/Ponovni upis zabranjen/);
    expect(postSpy).not.toHaveBeenCalled();
    expect(claimSpy).not.toHaveBeenCalled();
    expect(
      isOneShotAlreadyAttempted({
        bookingId: BOOKING_ID,
        status: 'uncertain',
        myrentRentId: null,
        error: claim,
        payloadErpId: BOOKING_ID,
        objectId: 16575,
        attemptedAt: '2026-10-30T12:00:00.000Z',
        confirmedLiveSync: false,
        attemptCount: 1,
        syncLockUntil: null,
      }).attempted,
    ).toBe(true);
    expect(
      isConfirmedOneShotClaim({
        bookingId: BOOKING_ID,
        status: 'uncertain',
        myrentRentId: null,
        error: claim,
        payloadErpId: BOOKING_ID,
        objectId: 16575,
        attemptedAt: '2026-10-30T12:00:00.000Z',
        confirmedLiveSync: false,
        attemptCount: 1,
        syncLockUntil: null,
      }),
    ).toBe(true);
  });

  it('timeout → uncertain, bez retryja na drugom pozivu', async () => {
    const { deps, postSpy, saves } = makeDeps({
      booking: sampleBooking(),
      postImpl: async () => {
        throw new Error('fetch failed: ETIMEDOUT');
      },
    });
    const first = await runMyRentOneShotLive(
      {
        bookingId: BOOKING_ID,
        explicitBookingId: BOOKING_ID,
        liveConfirmToken: MYRENT_ONE_SHOT_LIVE_CONFIRM,
      },
      deps,
    );
    expect(first.status).toBe('uncertain');
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(saves[saves.length - 1]?.status).toBe('uncertain');

    const second = await runMyRentOneShotLive(
      {
        bookingId: BOOKING_ID,
        explicitBookingId: BOOKING_ID,
        liveConfirmToken: MYRENT_ONE_SHOT_LIVE_CONFIRM,
      },
      deps,
    );
    expect(second.status).toBe('blocked');
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('nejasan odgovor → uncertain, 0 retry', async () => {
    const { deps, postSpy } = makeDeps({
      booking: sampleBooking(),
      postImpl: async () => ({}),
    });
    const result = await runMyRentOneShotLive(
      {
        bookingId: BOOKING_ID,
        explicitBookingId: BOOKING_ID,
        liveConfirmToken: MYRENT_ONE_SHOT_LIVE_CONFIRM,
      },
      deps,
    );
    expect(result.status).toBe('uncertain');
    expect(postSpy).toHaveBeenCalledTimes(1);

    const again = await runMyRentOneShotLive(
      {
        bookingId: BOOKING_ID,
        explicitBookingId: BOOKING_ID,
        liveConfirmToken: MYRENT_ONE_SHOT_LIVE_CONFIRM,
      },
      deps,
    );
    expect(again.status).toBe('blocked');
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('dva paralelna procesa: samo jedan claim i najviše jedan POST', async () => {
    const store = createMemoryMyRentSyncStore();
    const postSpy = vi.fn(async () => ({ id: 42 }));
    const logs: string[] = [];

    const sharedDeps = (): OneShotDeps => ({
      loadBooking: async () => sampleBooking(),
      getSyncRecord: (id) => store.get(id),
      claimOneShotAttempt: (input) => store.claimOneShotAttempt(input),
      saveSyncRecord: (record) => store.save(record),
      checkMyRentAvailability: async () => ({
        ok: true,
        message: 'MyRent termin slobodan (read-only).',
      }),
      prepareAuthForWrite: async () => undefined,
      postRentAdd: postSpy,
      nowIso: () => '2026-10-30T12:00:00.000Z',
      log: (line) => logs.push(line),
    });

    const [a, b] = await Promise.all([
      runMyRentOneShotLive(
        {
          bookingId: BOOKING_ID,
          explicitBookingId: BOOKING_ID,
          liveConfirmToken: MYRENT_ONE_SHOT_LIVE_CONFIRM,
        },
        sharedDeps(),
      ),
      runMyRentOneShotLive(
        {
          bookingId: BOOKING_ID,
          explicitBookingId: BOOKING_ID,
          liveConfirmToken: MYRENT_ONE_SHOT_LIVE_CONFIRM,
        },
        sharedDeps(),
      ),
    ]);

    const outcomes = [a.status, b.status].sort();
    expect(outcomes).toContain('live_ok');
    expect(outcomes).toContain('blocked');
    expect(postSpy).toHaveBeenCalledTimes(1);

    const claims = await Promise.all([
      store.claimOneShotAttempt({
        bookingId: BOOKING_ID,
        payloadErpId: BOOKING_ID,
        objectId: 16575,
        claimError: buildOneShotClaimError(BOOKING_ID, 'x'),
      }),
      store.claimOneShotAttempt({
        bookingId: `${BOOKING_ID}`,
        payloadErpId: BOOKING_ID,
        objectId: 16575,
        claimError: buildOneShotClaimError(BOOKING_ID, 'y'),
      }),
    ]);
    // Već live_ok / uncertain — oba claima moraju pasti
    expect(claims.every((c: OneShotClaimResult) => !c.claimed)).toBe(true);
  });

  it('prekid nakon claima: drugi proces ne šalje HTTP', async () => {
    const store = createMemoryMyRentSyncStore();
    const claimError = buildOneShotClaimError(
      BOOKING_ID,
      '2026-10-30T12:00:00.000Z',
    );
    const claimed = await store.claimOneShotAttempt({
      bookingId: BOOKING_ID,
      payloadErpId: BOOKING_ID,
      objectId: 16575,
      claimError,
    });
    expect(claimed.claimed).toBe(true);
    expect(isConfirmedOneShotClaim(claimed.row)).toBe(true);

    // Simulacija pada procesa: claim postoji, POST nikad nije poslan.
    const postSpy = vi.fn();
    const result = await runMyRentOneShotLive(
      {
        bookingId: BOOKING_ID,
        explicitBookingId: BOOKING_ID,
        liveConfirmToken: MYRENT_ONE_SHOT_LIVE_CONFIRM,
      },
      {
        loadBooking: async () => sampleBooking(),
        getSyncRecord: (id) => store.get(id),
        claimOneShotAttempt: (input) => store.claimOneShotAttempt(input),
        saveSyncRecord: (record) => store.save(record),
        checkMyRentAvailability: async () => ({
          ok: true,
          message: 'ok',
        }),
        prepareAuthForWrite: async () => undefined,
        postRentAdd: postSpy,
        nowIso: () => '2026-10-30T12:00:00.000Z',
        log: () => undefined,
      },
    );
    expect(result.status).toBe('blocked');
    expect(postSpy).not.toHaveBeenCalled();
    const row = await store.get(BOOKING_ID);
    expect(row?.status).toBe('uncertain');
  });

  it('auth priprema fail → bez claima i bez POST-a', async () => {
    const { deps, postSpy, claimSpy } = makeDeps({
      booking: sampleBooking(),
      prepareAuth: async () => {
        throw new Error('token generate failed');
      },
    });
    const result = await runMyRentOneShotLive(
      {
        bookingId: BOOKING_ID,
        explicitBookingId: BOOKING_ID,
        liveConfirmToken: MYRENT_ONE_SHOT_LIVE_CONFIRM,
      },
      deps,
    );
    expect(result.status).toBe('failed');
    expect(claimSpy).not.toHaveBeenCalled();
    expect(postSpy).not.toHaveBeenCalled();
  });
});

describe('myrentRequest allowAuthRetry (one-shot write)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.spyOn(myrentConfig, 'getMyRentConfig').mockReturnValue({
      apiBaseUrl: 'https://api.example.test',
      authUrl: 'https://auth.example.test/auth/generate',
      b2bGuid: 'b2b',
      userGuid: 'user',
      userId: '1',
      publicKey: 'pk',
      authKey: 'ak',
      apiAuth: 'Bearer x',
    });
    vi.spyOn(myrentAuth, 'getMyRentToken').mockResolvedValue('tok-1');
    vi.spyOn(myrentAuth, 'clearMyRentTokenCache').mockImplementation(() => undefined);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('401/403 s allowAuthRetry=false → jedan HTTP, bez retryja', async () => {
    const fetchSpy = vi.fn(async () =>
      new Response('unauthorized', { status: 401 }),
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    await expect(
      myrentRequest({
        method: 'POST',
        path: '/user/rent_add',
        body: { object_id: 1 },
        allowAuthRetry: false,
      }),
    ).rejects.toBeInstanceOf(MyRentApiError);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(myrentAuth.clearMyRentTokenCache).not.toHaveBeenCalled();
  });

  it('401 s allowAuthRetry=true (read default) → jedan retry', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(new Response('unauthorized', { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    await myrentRequest({
      method: 'GET',
      path: '/user/objects_get',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(myrentAuth.clearMyRentTokenCache).toHaveBeenCalled();
  });
});
