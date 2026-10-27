/**
 * Fizičke smještajne jedinice za admin Timeline (7 redova).
 * SPA ponude dijele object_id 7460 → jedan red.
 */

import { MYRENT_OBJECT_IDS } from './myrent.config';

export type MyRentTimelineUnit = {
  /** Stabilan ID reda u Timelineu */
  unitId: string;
  label: string;
  objectId: number;
  /** Ginko slugovi koji pripadaju ovoj jedinici (SPA → oba) */
  roomSlugs: readonly string[];
};

export const MYRENT_TIMELINE_UNITS: readonly MyRentTimelineUnit[] = [
  {
    unitId: 'ginko-1',
    label: 'Ginko 1',
    objectId: MYRENT_OBJECT_IDS['ginko-1']!,
    roomSlugs: ['ginko-1'],
  },
  {
    unitId: 'ginko-2',
    label: 'Ginko 2',
    objectId: MYRENT_OBJECT_IDS['ginko-2']!,
    roomSlugs: ['ginko-2'],
  },
  {
    unitId: 'ginko-3',
    label: 'Ginko 3',
    objectId: MYRENT_OBJECT_IDS['ginko-3']!,
    roomSlugs: ['ginko-3'],
  },
  {
    unitId: 'ginko-4',
    label: 'Ginko 4',
    objectId: MYRENT_OBJECT_IDS['ginko-4']!,
    roomSlugs: ['ginko-4'],
  },
  {
    unitId: 'ginko-5',
    label: 'Ginko 5',
    objectId: MYRENT_OBJECT_IDS['ginko-5']!,
    roomSlugs: ['ginko-5'],
  },
  {
    unitId: 'ginko-6',
    label: 'Ginko 6',
    objectId: MYRENT_OBJECT_IDS['ginko-6']!,
    roomSlugs: ['ginko-6'],
  },
  {
    unitId: 'spa-2',
    label: 'SPA Apartman',
    objectId: 7460,
    roomSlugs: ['ginko-spa-1', 'ginko-spa-2'],
  },
] as const;

export function getTimelineUnitForRoomSlug(
  roomSlug: string,
): MyRentTimelineUnit | undefined {
  return MYRENT_TIMELINE_UNITS.find((u) => u.roomSlugs.includes(roomSlug));
}
