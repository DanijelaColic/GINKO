export const GALLERY_CATEGORIES = [
  { key: 'exterior', label: 'Eksterijer' },
  { key: 'rooms', label: 'Sobe' },
  { key: 'common-areas', label: 'Zajednički prostori' },
  { key: 'breakfast', label: 'Doručak' },
  { key: 'surroundings', label: 'Okolica Daruvara' },
] as const;

export type GalleryCategoryKey = (typeof GALLERY_CATEGORIES)[number]['key'];

export const DEFAULT_GALLERY_CATEGORY: GalleryCategoryKey = 'exterior';

export function isGalleryCategoryKey(value: string): value is GalleryCategoryKey {
  return GALLERY_CATEGORIES.some((c) => c.key === value);
}

export function getGalleryCategoryLabel(key: string) {
  return GALLERY_CATEGORIES.find((c) => c.key === key)?.label ?? 'Ostalo';
}
