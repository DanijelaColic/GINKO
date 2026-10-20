// Phase 7: reads from Supabase gallery_items table.
// Falls back to static mock data when DB is unavailable (dev without Supabase).
import { createServerSupabaseClient } from '@/lib/supabase';
import type { GalleryItem } from './gallery.types';
import { isGalleryCategoryKey, DEFAULT_GALLERY_CATEGORY } from './gallery.categories';
import { localizeGalleryItems } from './gallery.i18n';

// Static mock — kept as fallback for local dev before DB migration is applied.
// Guest photos omitted until publishing permission is confirmed.
const MOCK_ITEMS: GalleryItem[] = [
  // ── Exterior ──────────────────────────────────────────────────
  {
    id: 'ext-1',
    src: '/images/property/exterior-entrance-01.webp',
    category_key: 'exterior',
    alt_text: 'Ginko Sobe — ulaz',
    title: 'Ulaz',
    media_type: 'image',
    sort_order: 1,
  },
  {
    id: 'ext-2',
    src: '/images/property/20240504_154454.jpg',
    category_key: 'exterior',
    alt_text: 'Ginko Sobe — objekt, Daruvar',
    title: 'Objekt',
    media_type: 'image',
    sort_order: 2,
  },
  {
    id: 'ext-3',
    src: '/images/property/20240906_085556.jpg',
    category_key: 'exterior',
    alt_text: 'Ginko Sobe — pogled na objekt',
    title: 'Pogled na objekt',
    media_type: 'image',
    sort_order: 3,
  },
  {
    id: 'ext-4',
    src: '/images/property/20251202_144635.jpg',
    category_key: 'exterior',
    alt_text: 'Ginko Sobe — eksterijer',
    title: 'Eksterijer',
    media_type: 'image',
    sort_order: 4,
  },
  // ── Rooms ─────────────────────────────────────────────────────
  {
    id: 'room-1',
    src: '/images/rooms/ginko-1/01-cover.webp',
    category_key: 'rooms',
    alt_text: 'Ginko 1 — soba',
    title: 'Ginko 1',
    media_type: 'image',
    sort_order: 1,
  },
  {
    id: 'room-2',
    src: '/images/rooms/ginko-2/01-cover.webp',
    category_key: 'rooms',
    alt_text: 'Ginko 2 — soba',
    title: 'Ginko 2',
    media_type: 'image',
    sort_order: 2,
  },
  {
    id: 'room-3',
    src: '/images/rooms/ginko-3/01-cover.webp',
    category_key: 'rooms',
    alt_text: 'Ginko 3 — soba',
    title: 'Ginko 3',
    media_type: 'image',
    sort_order: 3,
  },
  {
    id: 'room-4',
    src: '/images/rooms/ginko-4/01-cover.webp',
    category_key: 'rooms',
    alt_text: 'Ginko 4 — soba',
    title: 'Ginko 4',
    media_type: 'image',
    sort_order: 4,
  },
  {
    id: 'room-5',
    src: '/images/rooms/ginko-5/01-cover.webp',
    category_key: 'rooms',
    alt_text: 'Ginko 5 — soba',
    title: 'Ginko 5',
    media_type: 'image',
    sort_order: 5,
  },
  {
    id: 'room-6',
    src: '/images/rooms/ginko-6/01-cover.webp',
    category_key: 'rooms',
    alt_text: 'Ginko 6 — soba',
    title: 'Ginko 6',
    media_type: 'image',
    sort_order: 6,
  },
  {
    id: 'room-apt',
    src: '/images/rooms/apartment/01-living.webp',
    category_key: 'rooms',
    alt_text: 'Apartman — dnevni boravak',
    title: 'Apartman',
    media_type: 'image',
    sort_order: 7,
  },
  {
    id: 'room-wellness',
    src: '/images/rooms/apartment/wellness-01-jacuzzi-cover.webp',
    category_key: 'rooms',
    alt_text: 'Wellness Apartman — jacuzzi',
    title: 'Wellness Apartman',
    media_type: 'image',
    sort_order: 8,
  },
  // ── Common areas ──────────────────────────────────────────────
  {
    id: 'common-1',
    src: '/images/property/20240906_091154.jpg',
    category_key: 'common-areas',
    alt_text: 'Ginko Sobe — zajednički prostori',
    title: 'Zajednički prostori',
    media_type: 'image',
    sort_order: 1,
  },
  {
    id: 'common-2',
    src: '/images/property/20240906_091257.jpg',
    category_key: 'common-areas',
    alt_text: 'Ginko Sobe — terasa',
    title: 'Terasa',
    media_type: 'image',
    sort_order: 2,
  },
  {
    id: 'common-3',
    src: '/images/shared/amenity-kettle-01.webp',
    category_key: 'common-areas',
    alt_text: 'Ginko Sobe — čaj i kava u sobi',
    title: 'Čaj i kava',
    media_type: 'image',
    sort_order: 3,
  },
  {
    id: 'common-4',
    src: '/images/shared/bathroom-marble-01.webp',
    category_key: 'common-areas',
    alt_text: 'Ginko Sobe — kupaonica',
    title: 'Kupaonica',
    media_type: 'image',
    sort_order: 4,
  },
  // ── Breakfast ─────────────────────────────────────────────────
  {
    id: 'brkfst-1',
    src: '/images/property/breakfast-coffee-buffet-01.webp',
    category_key: 'breakfast',
    alt_text: 'Ginko Sobe — doručak, aparat za kavu',
    title: 'Doručak — kava',
    media_type: 'image',
    sort_order: 1,
  },
  {
    id: 'brkfst-2',
    src: '/images/property/breakfast-cold-buffet-01.webp',
    category_key: 'breakfast',
    alt_text: 'Ginko Sobe — hladni buffet',
    title: 'Doručak — buffet',
    media_type: 'image',
    sort_order: 2,
  },
  {
    id: 'brkfst-3',
    src: '/images/property/breakfast-pastries-01.webp',
    category_key: 'breakfast',
    alt_text: 'Ginko Sobe — peciva',
    title: 'Doručak — peciva',
    media_type: 'image',
    sort_order: 3,
  },
  {
    id: 'brkfst-4',
    src: '/images/property/breakfast-ham-cheese-01.webp',
    category_key: 'breakfast',
    alt_text: 'Ginko Sobe — šunka i sir',
    title: 'Doručak — hladno',
    media_type: 'image',
    sort_order: 4,
  },
  {
    id: 'brkfst-5',
    src: '/images/property/breakfast-coffee-close-01.webp',
    category_key: 'breakfast',
    alt_text: 'Ginko Sobe — stanica za kavu',
    title: 'Stanica za kavu',
    media_type: 'image',
    sort_order: 5,
  },
  {
    id: 'brkfst-6',
    src: '/images/property/breakfast-eggs-yogurt-01.webp',
    category_key: 'breakfast',
    alt_text: 'Ginko Sobe — jaja i jogurt',
    title: 'Doručak — detalj',
    media_type: 'image',
    sort_order: 6,
  },
  // ── Surroundings ─────────────────────────────────────────────
  {
    id: 'surr-1',
    src: '/images/property/20250501_174531.jpg',
    category_key: 'surroundings',
    alt_text: 'Okolica Daruvara',
    title: 'Okolica Daruvara',
    media_type: 'image',
    sort_order: 1,
  },
  {
    id: 'surr-2',
    src: '/images/property/20240929_072608.jpg',
    category_key: 'surroundings',
    alt_text: 'Daruvar — priroda i okolica',
    title: 'Daruvar okolica',
    media_type: 'image',
    sort_order: 2,
  },
  {
    id: 'surr-3',
    src: '/images/property/20251228_151836.jpg',
    category_key: 'surroundings',
    alt_text: 'Daruvar — grad',
    title: 'Daruvar',
    media_type: 'image',
    sort_order: 3,
  },
];

export async function getGalleryItems(
  locale: string | null | undefined = 'hr',
): Promise<GalleryItem[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('gallery_items')
      .select('id, src, category_key, alt_text, title, media_type, sort_order')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return localizeGalleryItems(MOCK_ITEMS, locale);
    }

    const rows = data.map((row) => {
      const rawKey = row.category_key as string;
      return {
        id: row.id as string,
        src: row.src as string,
        category_key: isGalleryCategoryKey(rawKey) ? rawKey : DEFAULT_GALLERY_CATEGORY,
        alt_text: row.alt_text as string | null,
        title: row.title as string | null,
        media_type: row.media_type as 'image' | 'video',
        sort_order: row.sort_order as number,
      } satisfies GalleryItem;
    });

    return localizeGalleryItems(rows, locale);
  } catch {
    return localizeGalleryItems(MOCK_ITEMS, locale);
  }
}
