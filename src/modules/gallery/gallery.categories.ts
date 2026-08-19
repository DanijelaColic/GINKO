export const GALLERY_CATEGORIES = [
  { key: 'exterior' },
  { key: 'rooms' },
  { key: 'common-areas' },
  { key: 'breakfast' },
  { key: 'surroundings' },
] as const;

export type GalleryCategoryKey = (typeof GALLERY_CATEGORIES)[number]['key'];

export const DEFAULT_GALLERY_CATEGORY: GalleryCategoryKey = 'exterior';

export function isGalleryCategoryKey(value: string): value is GalleryCategoryKey {
  return GALLERY_CATEGORIES.some((c) => c.key === value);
}
