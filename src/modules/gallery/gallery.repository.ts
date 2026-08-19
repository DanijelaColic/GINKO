// Phase 7: reads from Supabase gallery_items table.
// Falls back to static mock data when DB is unavailable (dev without Supabase).
import { createServerSupabaseClient } from '@/lib/supabase';
import type { GalleryItem } from './gallery.types';
import { isGalleryCategoryKey, DEFAULT_GALLERY_CATEGORY } from './gallery.categories';
import { localizeGalleryItems } from './gallery.i18n';

// Static mock — kept as fallback for local dev before DB migration is applied.
const MOCK_ITEMS: GalleryItem[] = [
  // ── Exterior ──────────────────────────────────────────────────
  {
    id: 'ext-1',
    src: '/images/property/20240504_154454.jpg',
    category_key: 'exterior',
    alt_text: 'Ginko Sobe — objekt, Daruvar',
    title: 'Objekt',
    media_type: 'image',
    sort_order: 1,
  },
  {
    id: 'ext-2',
    src: '/images/property/20240906_085556.jpg',
    category_key: 'exterior',
    alt_text: 'Ginko Sobe — pogled na objekt',
    title: 'Pogled na objekt',
    media_type: 'image',
    sort_order: 2,
  },
  {
    id: 'ext-3',
    src: '/images/property/20251202_144635.jpg',
    category_key: 'exterior',
    alt_text: 'Ginko Sobe — eksterijer',
    title: 'Eksterijer',
    media_type: 'image',
    sort_order: 3,
  },
  {
    id: 'ext-4',
    src: '/images/property/20251202_144813.jpg',
    category_key: 'exterior',
    alt_text: 'Ginko Sobe — fasada',
    title: 'Fasada',
    media_type: 'image',
    sort_order: 4,
  },
  // ── Rooms ─────────────────────────────────────────────────────
  {
    id: 'room-1',
    src: '/images/rooms/ginko-1/01-cover.jpg',
    category_key: 'rooms',
    alt_text: 'Ginko 1 — soba',
    title: 'Ginko 1',
    media_type: 'image',
    sort_order: 1,
  },
  {
    id: 'room-2',
    src: '/images/rooms/ginko-2/01-cover.jpg',
    category_key: 'rooms',
    alt_text: 'Ginko 2 — soba s terasom',
    title: 'Ginko 2',
    media_type: 'image',
    sort_order: 2,
  },
  {
    id: 'room-3',
    src: '/images/rooms/ginko-spa-2/01-cover.png',
    category_key: 'rooms',
    alt_text: 'Ginko SPA 2 — wellness suita',
    title: 'Ginko SPA 2',
    media_type: 'image',
    sort_order: 3,
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
    src: '/images/property/20240906_091321.jpg',
    category_key: 'common-areas',
    alt_text: 'Ginko Sobe — detalji',
    title: 'Detalji',
    media_type: 'image',
    sort_order: 3,
  },
  {
    id: 'common-4',
    src: '/images/property/20240906_091344.jpg',
    category_key: 'common-areas',
    alt_text: 'Ginko Sobe — prostori',
    title: 'Prostori',
    media_type: 'image',
    sort_order: 4,
  },
  // ── Breakfast ─────────────────────────────────────────────────
  {
    id: 'brkfst-1',
    src: '/images/property/20241101_080530.jpg',
    category_key: 'breakfast',
    alt_text: 'Ginko Sobe — doručak',
    title: 'Doručak',
    media_type: 'image',
    sort_order: 1,
  },
  {
    id: 'brkfst-2',
    src: '/images/property/20241101_080707.jpg',
    category_key: 'breakfast',
    alt_text: 'Ginko Sobe — jutarnji obrok',
    title: 'Jutarnji obrok',
    media_type: 'image',
    sort_order: 2,
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
