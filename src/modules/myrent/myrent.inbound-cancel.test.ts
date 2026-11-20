import { describe, expect, it, vi } from 'vitest';
import {
  MYRENT_INBOUND_CANCEL_REASON,
  decideInboundCancel,
  isMyRentActivationSchemaMissing,
  parseRentActiveFlag,
  runMyRentInboundCancelSync,
  shouldScanBookingForInboundCancel,
  type InboundCancelCandidate,
} from './myrent.inbound-cancel';

describe('shouldScanBookingForInboundCancel', () => {
  const base = {
    bookingStatus: 'confirmed',
    checkOut: '2026-12-17',
    myrentRentId: '2516049',
    syncStatus: 'live_ok',
    confirmedLiveSync: true,
    todayIso: '2026-11-04',
  };

  it('uključuje confirmed + live_ok + rent_id + check_out >= today', () => {
    expect(shouldScanBookingForInboundCancel(base)).toBe(true);
  });

  it('isključuje already cancelled', () => {
    expect(
      shouldScanBookingForInboundCancel({
        ...base,
        bookingStatus: 'cancelled',
      }),
    ).toBe(false);
  });

  it('isključuje pending / bez live_ok / bez rent id', () => {
    expect(
      shouldScanBookingForInboundCancel({ ...base, bookingStatus: 'pending' }),
    ).toBe(false);
    expect(
      shouldScanBookingForInboundCancel({ ...base, syncStatus: 'failed' }),
    ).toBe(false);
    expect(
      shouldScanBookingForInboundCancel({
        ...base,
        confirmedLiveSync: false,
      }),
    ).toBe(false);
    expect(
      shouldScanBookingForInboundCancel({ ...base, myrentRentId: '' }),
    ).toBe(false);
  });

  it('ne skenira stare rezervacije (check_out < today)', () => {
    expect(
      shouldScanBookingForInboundCancel({
        ...base,
        checkOut: '2026-10-01',
        todayIso: '2026-11-04',
      }),
    ).toBe(false);
  });
});

describe('parseRentActiveFlag', () => {
  it('parsira Y/N iz rent_get oblika', () => {
    expect(parseRentActiveFlag({ active: 'N', id: 2516049 })).toBe('N');
    expect(parseRentActiveFlag([{ active: 'Y' }])).toBe('Y');
    expect(parseRentActiveFlag({ active: 'n' })).toBe('N');
  });

  it('nejasan odgovor → unknown', () => {
    expect(parseRentActiveFlag(null)).toBe('unknown');
    expect(parseRentActiveFlag({})).toBe('unknown');
    expect(parseRentActiveFlag({ active: 'maybe' })).toBe('unknown');
  });
});

describe('runMyRentInboundCancelSync', () => {
  const candidate: InboundCancelCandidate = {
    bookingId: 'b70f45d4-c1b9-4bab-8d9a-bc10be0c02a2',
    bookingStatus: 'confirmed',
    checkIn: '2026-12-15',
    checkOut: '2026-12-17',
    myrentRentId: '2516049',
    myrentRentGuid: '93d6a393-d7d1-11f1-af57-9c6b006df76b',
    seenActiveAt: '2026-11-01T00:00:00.000Z',
  };
  const markers = {
    markSeenActive: async () => undefined,
    markNotYetActive: async () => undefined,
  };

  it('active=N nakon viđenog active=Y → cancel + audit reason', async () => {
    const cancel = vi.fn(async () => 'cancelled' as const);
    const result = await runMyRentInboundCancelSync({
      ...markers,
      listCandidates: async () => [candidate],
      fetchRentActive: async () => 'N',
      cancelBookingIfConfirmed: cancel,
    });

    expect(result.scanned).toBe(1);
    expect(result.cancelled).toBe(1);
    expect(result.errors).toBe(0);
    expect(cancel).toHaveBeenCalledWith({
      bookingId: candidate.bookingId,
      myrentRentId: '2516049',
      myrentRentGuid: candidate.myrentRentGuid,
      reason: MYRENT_INBOUND_CANCEL_REASON,
    });
    expect(result.actions[0]?.outcome).toBe('cancelled');
  });

  it('active=N bez prethodnog active=Y ne otkazuje', async () => {
    const cancel = vi.fn(async () => 'cancelled' as const);
    const markNotYetActive = vi.fn(async () => undefined);
    const result = await runMyRentInboundCancelSync({
      ...markers,
      markNotYetActive,
      listCandidates: async () => [{ ...candidate, seenActiveAt: null }],
      fetchRentActive: async () => 'N',
      cancelBookingIfConfirmed: cancel,
    });
    expect(result.cancelled).toBe(0);
    expect(cancel).not.toHaveBeenCalled();
    expect(markNotYetActive).toHaveBeenCalledTimes(1);
    expect(result.actions[0]?.outcome).toBe('skipped_not_yet_active');
  });

  it('stari red bez seenActiveAt (nepotpuni podaci) ne otkazuje', async () => {
    const cancel = vi.fn(async () => 'cancelled' as const);
    const { seenActiveAt: _dropped, ...legacy } = candidate;
    const result = await runMyRentInboundCancelSync({
      ...markers,
      listCandidates: async () => [legacy],
      fetchRentActive: async () => 'N',
      cancelBookingIfConfirmed: cancel,
    });
    expect(result.cancelled).toBe(0);
    expect(cancel).not.toHaveBeenCalled();
    expect(decideInboundCancel({
      bookingStatus: 'confirmed',
      active: 'N',
      seenActiveAt: undefined,
    })).toBe('skip_not_yet_active');
  });

  it('active=Y pa active=N: prvo zabilježi Y, zatim otkaži', async () => {
    const cancel = vi.fn(async () => 'cancelled' as const);
    const markSeenActive = vi.fn(async () => undefined);
    const first = await runMyRentInboundCancelSync({
      ...markers,
      markSeenActive,
      listCandidates: async () => [{ ...candidate, seenActiveAt: null }],
      fetchRentActive: async () => 'Y',
      cancelBookingIfConfirmed: cancel,
    });
    expect(first.cancelled).toBe(0);
    expect(markSeenActive).toHaveBeenCalledTimes(1);
    expect(cancel).not.toHaveBeenCalled();

    const second = await runMyRentInboundCancelSync({
      ...markers,
      listCandidates: async () => [candidate],
      fetchRentActive: async () => 'N',
      cancelBookingIfConfirmed: cancel,
    });
    expect(second.cancelled).toBe(1);
    expect(second.actions[0]?.outcome).toBe('cancelled');
  });

  it('active=Y → ne mijenja booking', async () => {
    const cancel = vi.fn(async () => 'cancelled' as const);
    const result = await runMyRentInboundCancelSync({
      ...markers,
      listCandidates: async () => [candidate],
      fetchRentActive: async () => 'Y',
      cancelBookingIfConfirmed: cancel,
    });
    expect(result.cancelled).toBe(0);
    expect(result.skipped).toBe(1);
    expect(cancel).not.toHaveBeenCalled();
  });

  it('unknown / API nejasan → ne mijenja status', async () => {
    const cancel = vi.fn(async () => 'cancelled' as const);
    const result = await runMyRentInboundCancelSync({
      ...markers,
      listCandidates: async () => [candidate],
      fetchRentActive: async () => 'unknown',
      cancelBookingIfConfirmed: cancel,
    });
    expect(result.cancelled).toBe(0);
    expect(cancel).not.toHaveBeenCalled();
    expect(result.actions[0]?.outcome).toBe('skipped_unknown');
  });

  it('već cancelled u raceu → skipped_already_cancelled', async () => {
    const result = await runMyRentInboundCancelSync({
      ...markers,
      listCandidates: async () => [candidate],
      fetchRentActive: async () => 'N',
      cancelBookingIfConfirmed: async () => 'already_cancelled',
    });
    expect(result.cancelled).toBe(0);
    expect(result.actions[0]?.outcome).toBe('skipped_already_cancelled');
  });

  it('već otkazana rezervacija se preskače prije MyRent fetcha', async () => {
    const fetchRentActive = vi.fn(async () => 'N' as const);
    const cancel = vi.fn(async () => 'cancelled' as const);
    const result = await runMyRentInboundCancelSync({
      ...markers,
      listCandidates: async () => [
        { ...candidate, bookingStatus: 'cancelled' },
      ],
      fetchRentActive,
      cancelBookingIfConfirmed: cancel,
    });
    expect(result.cancelled).toBe(0);
    expect(fetchRentActive).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
    expect(result.actions[0]?.outcome).toBe('skipped_already_cancelled');
  });

  it('nedostupna migracija seen_active_at ne otkazuje', async () => {
    const cancel = vi.fn(async () => 'cancelled' as const);
    const result = await runMyRentInboundCancelSync({
      ...markers,
      listCandidates: async () => {
        throw new Error(
          'column myrent_booking_sync.seen_active_at does not exist',
        );
      },
      fetchRentActive: async () => 'N',
      cancelBookingIfConfirmed: cancel,
    });
    expect(result.migrationPending).toBe(true);
    expect(result.cancelled).toBe(0);
    expect(cancel).not.toHaveBeenCalled();
    expect(
      isMyRentActivationSchemaMissing(
        new Error('column seen_active_at does not exist'),
      ),
    ).toBe(true);
  });

  it('privremena API greška ne otkazuje i ne briše seen_active_at', async () => {
    const cancel = vi.fn(async () => 'cancelled' as const);
    const markSeenActive = vi.fn(async () => undefined);
    const result = await runMyRentInboundCancelSync({
      ...markers,
      markSeenActive,
      listCandidates: async () => [candidate],
      fetchRentActive: async () => {
        throw new Error('MyRent timeout');
      },
      cancelBookingIfConfirmed: cancel,
    });
    expect(result.cancelled).toBe(0);
    expect(result.errors).toBe(1);
    expect(cancel).not.toHaveBeenCalled();
    expect(markSeenActive).not.toHaveBeenCalled();
    expect(result.actions[0]?.outcome).toBe('error');
  });

  it('ne poziva refund ni payment API (samo cancel callback)', async () => {
    const cancel = vi.fn(async () => 'cancelled' as const);
    await runMyRentInboundCancelSync({
      listCandidates: async () => [candidate],
      fetchRentActive: async () => 'N',
      cancelBookingIfConfirmed: cancel,
    });
    expect(cancel.mock.calls[0]?.[0]).not.toHaveProperty('refund');
    expect(Object.keys(cancel.mock.calls[0]?.[0] ?? {})).toEqual([
      'bookingId',
      'myrentRentId',
      'myrentRentGuid',
      'reason',
    ]);
  });
});
