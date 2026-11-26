import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MYRENT_OBJECT_IDS } from '@/modules/myrent/myrent.config';
import { rooms } from '@/modules/rooms/rooms.config';
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_OVERLAP_ADMIN_MESSAGE,
  SHARED_SPA_OCCUPANCY_UNIT,
  SHARED_SPA_ROOM_SLUGS,
  bookingOverlapConflictResponse,
  isBookingOverlapConflict,
  occupancyUnitForSlug,
} from './booking-overlap';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);

function readSql(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

describe('occupancy unit', () => {
  it('SPA 1 i SPA 2 dijele unit:7460, ostale sobe ne', () => {
    expect(occupancyUnitForSlug('ginko-spa-1')).toBe(SHARED_SPA_OCCUPANCY_UNIT);
    expect(occupancyUnitForSlug('ginko-spa-2')).toBe(SHARED_SPA_OCCUPANCY_UNIT);
    expect(occupancyUnitForSlug('ginko-1')).toBe('room:ginko-1');
    expect(occupancyUnitForSlug('ginko-6')).toBe('room:ginko-6');
    expect(occupancyUnitForSlug('ginko-1')).not.toBe(
      occupancyUnitForSlug('ginko-2'),
    );
  });

  it('jedini dijeljeni MyRent object je 7460 i poklapa se s linkedSlugs', () => {
    const grouped = new Map<number, string[]>();
    for (const [slug, objectId] of Object.entries(MYRENT_OBJECT_IDS)) {
      const list = grouped.get(objectId) ?? [];
      list.push(slug);
      grouped.set(objectId, list);
    }
    const shared = [...grouped.entries()].filter(([, slugs]) => slugs.length > 1);
    expect(shared).toHaveLength(1);
    expect(shared[0][0]).toBe(7460);
    expect(shared[0][1].slice().sort()).toEqual(
      [...SHARED_SPA_ROOM_SLUGS].slice().sort(),
    );

    for (const room of rooms) {
      expect(MYRENT_OBJECT_IDS[room.slug]).toEqual(expect.any(Number));
      const links = (room.linkedSlugs ?? []).slice().sort();
      if ((SHARED_SPA_ROOM_SLUGS as readonly string[]).includes(room.slug)) {
        expect(links).toEqual(
          SHARED_SPA_ROOM_SLUGS.filter((slug) => slug !== room.slug),
        );
      } else {
        expect(links).toEqual([]);
      }
    }
  });

  it('migracija, audit i rollback koriste iste slugove, statuse i raspon', () => {
    const migration = readSql('supabase/migrations/021_booking_overlap_exclusion.sql');
    const audit = readSql('supabase/scripts/booking_overlap_audit.sql');
    const rollback = readSql(
      'supabase/scripts/021_booking_overlap_exclusion_rollback.sql',
    );

    for (const slug of SHARED_SPA_ROOM_SLUGS) {
      expect(migration).toContain(`'${slug}'`);
      expect(audit).toContain(`'${slug}'`);
    }
    for (const room of rooms) {
      expect(audit).toContain(`'${room.slug}'`);
    }
    expect(migration).toContain(SHARED_SPA_OCCUPANCY_UNIT);
    expect(audit).toContain(SHARED_SPA_OCCUPANCY_UNIT);
    expect(migration).toContain(`status in ('${ACTIVE_BOOKING_STATUSES.join("', '")}')`);
    expect(migration).toContain(`'[)'`);
    expect(audit).toContain(`'[)'`);
    expect(migration).toContain('cancelled');
    expect(rollback).toContain('drop constraint if exists bookings_no_active_overlap');
    expect(rollback).toContain('drop column if exists occupancy_unit');
    expect(rollback).not.toContain('drop extension');
    expect(rollback).not.toContain('delete from');
  });
});

describe('overlap conflict response', () => {
  it('prepoznaje 23P01 i ime constrainta', () => {
    expect(isBookingOverlapConflict({ code: '23P01', message: 'conflict' })).toBe(
      true,
    );
    expect(
      isBookingOverlapConflict({
        code: '23505',
        message: 'violates exclusion constraint "bookings_no_active_overlap"',
      }),
    ).toBe(true);
    expect(isBookingOverlapConflict({ code: '23505', message: 'duplicate' })).toBe(
      false,
    );
    expect(isBookingOverlapConflict(null)).toBe(false);
  });

  it('admin odgovor je 409 s jasnom porukom', async () => {
    const response = bookingOverlapConflictResponse();
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: BOOKING_OVERLAP_ADMIN_MESSAGE,
      code: 'datesUnavailable',
    });
  });
});
