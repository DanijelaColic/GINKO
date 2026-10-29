import { describe, expect, it, vi } from 'vitest';
import {
  assertBookingStayAvailable,
  AvailabilityUnavailableError,
  DatesUnavailableError,
  getAvailabilitySlugsForRoom,
} from './availability.service';
import { occupiedDatesToBookedRanges } from '@/modules/myrent';
import type { BookedRange } from './booking.types';

describe('assertBookingStayAvailable (bez MyRent/Supabase write)', () => {
  it('propušta slobodan termin kad su MyRent i lokalno prazni', async () => {
    await expect(
      assertBookingStayAvailable('ginko-1', '2026-11-08', '2026-11-10', {
        fetchMyRentRangesForWindow: vi.fn().mockResolvedValue([]),
        fetchLocalRanges: vi.fn().mockResolvedValue([]),
      }),
    ).resolves.toBeUndefined();
  });

  it('odbija termin zauzet u MyRentu', async () => {
    const myrentRanges = occupiedDatesToBookedRanges([
      '2026-11-08',
      '2026-11-09',
    ]);
    await expect(
      assertBookingStayAvailable('ginko-1', '2026-11-08', '2026-11-10', {
        fetchMyRentRangesForWindow: vi.fn().mockResolvedValue(myrentRanges),
        fetchLocalRanges: vi.fn().mockResolvedValue([]),
      }),
    ).rejects.toBeInstanceOf(DatesUnavailableError);
  });

  it('odbija termin zauzet lokalnom rezervacijom', async () => {
    const local: BookedRange[] = [
      { check_in: '2026-11-07', check_out: '2026-11-09' },
    ];
    await expect(
      assertBookingStayAvailable('ginko-1', '2026-11-08', '2026-11-10', {
        fetchMyRentRangesForWindow: vi.fn().mockResolvedValue([]),
        fetchLocalRanges: vi.fn().mockResolvedValue(local),
      }),
    ).rejects.toBeInstanceOf(DatesUnavailableError);
  });

  it('odbija termin blokiran blocked_dates / iCal rangeom', async () => {
    const blocked: BookedRange[] = [
      { check_in: '2026-11-08', check_out: '2026-11-12' },
    ];
    await expect(
      assertBookingStayAvailable('ginko-2', '2026-11-08', '2026-11-10', {
        fetchMyRentRangesForWindow: vi.fn().mockResolvedValue([]),
        fetchLocalRanges: vi.fn().mockResolvedValue(blocked),
      }),
    ).rejects.toBeInstanceOf(DatesUnavailableError);
  });

  it('dan odlaska prethodnog gosta ostaje dostupan za novi dolazak', async () => {
    // Prethodni gost: 6.–8.11. → checkout 8.11. = naš check-in
    const previousStay = occupiedDatesToBookedRanges([
      '2026-11-06',
      '2026-11-07',
    ]);
    // range check_out = 2026-11-08
    expect(previousStay).toEqual([
      { check_in: '2026-11-06', check_out: '2026-11-08' },
    ]);

    await expect(
      assertBookingStayAvailable('ginko-1', '2026-11-08', '2026-11-10', {
        fetchMyRentRangesForWindow: vi.fn().mockResolvedValue(previousStay),
        fetchLocalRanges: vi.fn().mockResolvedValue([]),
      }),
    ).resolves.toBeUndefined();
  });

  it('MyRent nedostupan → AvailabilityUnavailableError (fail-closed)', async () => {
    await expect(
      assertBookingStayAvailable('ginko-1', '2026-11-08', '2026-11-10', {
        fetchMyRentRangesForWindow: vi
          .fn()
          .mockRejectedValue(new AvailabilityUnavailableError()),
        fetchLocalRanges: vi.fn().mockResolvedValue([]),
      }),
    ).rejects.toBeInstanceOf(AvailabilityUnavailableError);
  });

  it('SPA: lokalna rezervacija na spa-1 blokira spa-2 (isti slug set)', async () => {
    const spaSlugs = getAvailabilitySlugsForRoom('ginko-spa-2').sort();
    expect(spaSlugs).toEqual(['ginko-spa-1', 'ginko-spa-2']);

    // Simulacija: fetchLocalRanges za spa-2 već uključuje rezervacije spa-1
    // (getAvailabilitySlugsForRoom u pravom fetchu)
    const localFromSharedUnit: BookedRange[] = [
      { check_in: '2026-11-08', check_out: '2026-11-10' },
    ];

    await expect(
      assertBookingStayAvailable('ginko-spa-2', '2026-11-08', '2026-11-10', {
        fetchMyRentRangesForWindow: vi.fn().mockResolvedValue([]),
        fetchLocalRanges: vi.fn().mockResolvedValue(localFromSharedUnit),
      }),
    ).rejects.toBeInstanceOf(DatesUnavailableError);

    await expect(
      assertBookingStayAvailable('ginko-spa-1', '2026-11-08', '2026-11-10', {
        fetchMyRentRangesForWindow: vi.fn().mockResolvedValue(
          occupiedDatesToBookedRanges(['2026-11-08', '2026-11-09']),
        ),
        fetchLocalRanges: vi.fn().mockResolvedValue([]),
      }),
    ).rejects.toBeInstanceOf(DatesUnavailableError);
  });

  it('zove MyRent s uskim prozorom boravka (svježi re-check)', async () => {
    const fetchMyRent = vi.fn().mockResolvedValue([]);
    const fetchLocal = vi.fn().mockResolvedValue([]);
    await assertBookingStayAvailable('ginko-3', '2026-12-01', '2026-12-04', {
      fetchMyRentRangesForWindow: fetchMyRent,
      fetchLocalRanges: fetchLocal,
    });
    expect(fetchMyRent).toHaveBeenCalledWith(
      'ginko-3',
      '2026-12-01',
      '2026-12-04',
    );
    expect(fetchLocal).toHaveBeenCalledWith('ginko-3', {
      excludeBookingId: undefined,
    });
  });

  it('excludeBookingId prosljeđuje se lokalnom fetchu (self ne blokira)', async () => {
    const selfId = '11111111-2222-3333-4444-555555555555';
    const fetchMyRent = vi.fn().mockResolvedValue([]);
    const fetchLocal = vi.fn().mockResolvedValue([]);
    await assertBookingStayAvailable(
      'ginko-1',
      '2026-11-08',
      '2026-11-10',
      {
        fetchMyRentRangesForWindow: fetchMyRent,
        fetchLocalRanges: fetchLocal,
      },
      { excludeBookingId: selfId },
    );
    expect(fetchLocal).toHaveBeenCalledWith('ginko-1', {
      excludeBookingId: selfId,
    });
  });

  it('bez excludea: lokalni overlap i dalje blokira', async () => {
    const local: BookedRange[] = [
      { check_in: '2026-11-08', check_out: '2026-11-10' },
    ];
    await expect(
      assertBookingStayAvailable(
        'ginko-1',
        '2026-11-08',
        '2026-11-10',
        {
          fetchMyRentRangesForWindow: vi.fn().mockResolvedValue([]),
          fetchLocalRanges: vi.fn().mockResolvedValue(local),
        },
        { excludeBookingId: 'other-id' },
      ),
    ).rejects.toBeInstanceOf(DatesUnavailableError);
  });
});
