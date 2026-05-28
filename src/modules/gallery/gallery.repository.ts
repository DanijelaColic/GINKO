// Phase 7: reads from Supabase gallery_items table.
// Falls back to static mock data when DB is unavailable (dev without Supabase).
import { createServerSupabaseClient } from '@/lib/supabase';
import type { GalleryItem } from './gallery.types';
import { isGalleryCategoryKey, DEFAULT_GALLERY_CATEGORY } from './gallery.categories';

// Static mock — kept as fallback for local dev before DB migration is applied.
const MOCK_ITEMS: GalleryItem[] = [
  // ── Exterior ──────────────────────────────────────────────────
  {
    id: 'ext-1',
    src: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80',
    category_key: 'exterior',
    alt_text: 'Ginko Sobe – ulaz i vrt',
    title: 'Ulaz i vrt',
    media_type: 'image',
    sort_order: 1,
  },
  {
    id: 'ext-2',
    src: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80',
    category_key: 'exterior',
    alt_text: 'Ginko Sobe – fasada i terasa',
    title: 'Fasada i terasa',
    media_type: 'image',
    sort_order: 2,
  },
  {
    id: 'ext-3',
    src: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80',
    category_key: 'exterior',
    alt_text: 'Ginko Sobe – noćni pogled na kuću',
    title: 'Noćni pogled',
    media_type: 'image',
    sort_order: 3,
  },
  // ── Rooms ─────────────────────────────────────────────────────
  {
    id: 'room-1',
    src: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
    category_key: 'rooms',
    alt_text: 'Soba Zelena – bračni krevet i zelenilo',
    title: 'Soba Zelena',
    media_type: 'image',
    sort_order: 1,
  },
  {
    id: 'room-2',
    src: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200&q=80',
    category_key: 'rooms',
    alt_text: 'Soba Orah – obiteljska soba s terasom',
    title: 'Soba Orah',
    media_type: 'image',
    sort_order: 2,
  },
  {
    id: 'room-3',
    src: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
    category_key: 'rooms',
    alt_text: 'Soba Bijela – minimalistički bijeli interijer',
    title: 'Soba Bijela',
    media_type: 'image',
    sort_order: 3,
  },
  {
    id: 'room-4',
    src: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80',
    category_key: 'rooms',
    alt_text: 'Soba – pogled kroz prozor na vrt',
    title: 'Pogled na vrt',
    media_type: 'image',
    sort_order: 4,
  },
  // ── Common areas ──────────────────────────────────────────────
  {
    id: 'common-1',
    src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
    category_key: 'common-areas',
    alt_text: 'Zajednička terasa s pogledom',
    title: 'Terasa',
    media_type: 'image',
    sort_order: 1,
  },
  {
    id: 'common-2',
    src: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80',
    category_key: 'common-areas',
    alt_text: 'Zajednički salon za odmor',
    title: 'Salon',
    media_type: 'image',
    sort_order: 2,
  },
  // ── Breakfast ─────────────────────────────────────────────────
  {
    id: 'brkfst-1',
    src: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=1200&q=80',
    category_key: 'breakfast',
    alt_text: 'Domaći doručak – svježi sir i med',
    title: 'Domaći doručak',
    media_type: 'image',
    sort_order: 1,
  },
  {
    id: 'brkfst-2',
    src: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200&q=80',
    category_key: 'breakfast',
    alt_text: 'Jutarnji obrok na terasi',
    title: 'Doručak na terasi',
    media_type: 'image',
    sort_order: 2,
  },
  // ── Surroundings ─────────────────────────────────────────────
  {
    id: 'surr-1',
    src: 'https://images.unsplash.com/photo-1555093183-3be7c0f24d89?w=1200&q=80',
    category_key: 'surroundings',
    alt_text: 'Zadar – stari grad i riva',
    title: 'Zadar stari grad',
    media_type: 'image',
    sort_order: 1,
  },
  {
    id: 'surr-2',
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    category_key: 'surroundings',
    alt_text: 'Dalmatinska obala – plaža i more',
    title: 'Dalmatinska plaža',
    media_type: 'image',
    sort_order: 2,
  },
  {
    id: 'surr-3',
    src: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=80',
    category_key: 'surroundings',
    alt_text: 'Zadar luka – jedrilice i zalazak',
    title: 'Zadar luka',
    media_type: 'image',
    sort_order: 3,
  },
];

export async function getGalleryItems(): Promise<GalleryItem[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('gallery_items')
      .select('id, src, category_key, alt_text, title, media_type, sort_order')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return MOCK_ITEMS;

    return data.map((row) => {
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
  } catch {
    return MOCK_ITEMS;
  }
}
