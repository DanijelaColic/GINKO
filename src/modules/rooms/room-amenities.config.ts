import type { Room } from './room.types';

export type AmenityGroupId = 'bathroom' | 'view' | 'facilities' | 'wellness' | 'smoking';

export type AmenityGroup = {
  id: AmenityGroupId;
  items: string[];
};

const BATHROOM_KEYS = new Set([
  'Ručnici', 'Towels', 'Handtücher',
  'Posteljina', 'Linen', 'Bettwäsche',
]);

const VIEW_KEYS = new Set([
  'Terasa', 'Terrace', 'Terrasse',
]);

const WELLNESS_KEYS = new Set([
  'Sauna', 'Jacuzzi', 'Privatna sauna',
]);

/** Grupira sadržaje sobe u Booking.com stil sekcija */
export function groupRoomAmenities(room: Pick<Room, 'amenities' | 'view' | 'balcony'>): AmenityGroup[] {
  const bathroom: string[] = [];
  const view: string[] = [];
  const wellness: string[] = [];
  const facilities: string[] = [];

  for (const item of room.amenities) {
    if (BATHROOM_KEYS.has(item)) {
      bathroom.push(item);
    } else if (VIEW_KEYS.has(item)) {
      view.push(item);
    } else if (WELLNESS_KEYS.has(item)) {
      wellness.push(item);
    } else {
      facilities.push(item);
    }
  }

  if (room.view && !view.length) {
    view.push('__sea_view__');
  }
  if (room.balcony && !view.some((v) => VIEW_KEYS.has(v))) {
    view.push('__balcony__');
  }

  const groups: AmenityGroup[] = [];

  if (bathroom.length) groups.push({ id: 'bathroom', items: bathroom });
  if (view.length) groups.push({ id: 'view', items: view });
  if (wellness.length) groups.push({ id: 'wellness', items: wellness });
  if (facilities.length) groups.push({ id: 'facilities', items: facilities });
  groups.push({ id: 'smoking', items: ['__no_smoking__'] });

  return groups;
}
