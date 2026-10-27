import { describe, expect, it } from 'vitest';
import {
  MYRENT_TIMELINE_UNITS,
  getTimelineUnitForRoomSlug,
  subtractOccupiedRanges,
  occupiedDatesToBookedRanges,
} from '@/modules/myrent';

describe('MYRENT_TIMELINE_UNITS', () => {
  it('ima 7 fizičkih jedinica', () => {
    expect(MYRENT_TIMELINE_UNITS).toHaveLength(7);
  });

  it('SPA slugovi dijele jedan red i object_id 7460', () => {
    const spa = MYRENT_TIMELINE_UNITS.find((u) => u.unitId === 'spa-2');
    expect(spa?.objectId).toBe(7460);
    expect([...spa!.roomSlugs].sort()).toEqual(['ginko-spa-1', 'ginko-spa-2']);
    expect(getTimelineUnitForRoomSlug('ginko-spa-1')?.unitId).toBe('spa-2');
    expect(getTimelineUnitForRoomSlug('ginko-spa-2')?.unitId).toBe('spa-2');
  });

  it('object_id vrijednosti su jedinstvene po jedinici', () => {
    const ids = MYRENT_TIMELINE_UNITS.map((u) => u.objectId);
    expect(new Set(ids).size).toBe(7);
  });
});

describe('subtractOccupiedRanges (dedupe Timeline)', () => {
  it('uklanja noći pokrivene lokalnom Ginko rezervacijom', () => {
    const myrent = occupiedDatesToBookedRanges([
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
    ]);
    const local = [{ check_in: '2026-11-08', check_out: '2026-11-10' }];
    expect(subtractOccupiedRanges(myrent, local)).toEqual([
      { check_in: '2026-11-10', check_out: '2026-11-11' },
    ]);
  });

  it('vraća prazno kad lokalno potpuno pokriva MyRent', () => {
    const myrent = occupiedDatesToBookedRanges(['2026-11-08', '2026-11-09']);
    const local = [{ check_in: '2026-11-08', check_out: '2026-11-10' }];
    expect(subtractOccupiedRanges(myrent, local)).toEqual([]);
  });

  it('ne mijenja MyRent kad nema lokalnog preklapanja', () => {
    const myrent = occupiedDatesToBookedRanges(['2026-11-08', '2026-11-09']);
    expect(subtractOccupiedRanges(myrent, [])).toEqual(myrent);
  });
});
