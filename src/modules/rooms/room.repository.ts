// Phase 7: updated to read from Supabase.
// Static config (rooms.config.ts) serves as fallback when DB is unavailable.
// Public interface is unchanged — all callers continue to work.

import type { Room, RoomLocale } from './room.types';
import { getAccommodationType, rooms as staticRooms, roomTranslations } from './rooms.config';
import { createServerSupabaseClient } from '@/lib/supabase';

// ── Static helpers (used as fallback + for server-side validation in API) ──

function applyLocaleOverlay(room: Room, locale: RoomLocale): Room {
  const localeMap = roomTranslations[locale] ?? roomTranslations.hr;
  const translated = localeMap[room.slug];
  if (!translated) return room;
  return { ...room, ...translated };
}

/** Quick lookup without locale — used for validation in API routes */
export function getRoomBySlug(slug: string): Room | undefined {
  return staticRooms.find((r) => r.slug === slug);
}

// ── DB helpers ──────────────────────────────────────────────────────────────

type DbRoom = {
  slug: string;
  capacity: number;
  size_m2: number | null;
  beds: string | null;
  price_off_season: number;
  price_high_season: number;
  amenities: string[];
  room_translations: { name: string; tagline: string | null; description: string | null; locale: string }[];
  room_media: { src: string; sort_order: number }[];
};

function mapDbRoom(r: DbRoom, locale: RoomLocale): Room {
  const t = r.room_translations.find((x) => x.locale === locale) ??
    r.room_translations.find((x) => x.locale === 'hr') ??
    r.room_translations[0];

  return {
    slug: r.slug,
    accommodationType: getAccommodationType(r.slug),
    name: t?.name ?? r.slug,
    tagline: t?.tagline ?? '',
    description: t?.description ?? '',
    capacity: r.capacity,
    capacityNote: `${r.capacity} ${locale === 'en' ? 'guests' : locale === 'de' ? 'Gäste' : 'osoba'}`,
    size: r.size_m2 ?? 0,
    beds: r.beds ?? '',
    view: false,
    balcony: false,
    floors: 1,
    priceOffSeason: r.price_off_season,
    priceHighSeason: r.price_high_season,
    fullyBooked: false,
    amenities: r.amenities ?? [],
    images: r.room_media
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => m.src),
  };
}

async function fetchRoomsFromDb(locale: RoomLocale): Promise<Room[] | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('rooms')
      .select('slug, capacity, size_m2, beds, price_off_season, price_high_season, amenities, room_translations(name, tagline, description, locale), room_media(src, sort_order)')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) return null;
    return (data as DbRoom[]).map((r) => mapDbRoom(r, locale));
  } catch {
    return null;
  }
}

async function fetchRoomFromDb(slug: string, locale: RoomLocale): Promise<Room | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('rooms')
      .select('slug, capacity, size_m2, beds, price_off_season, price_high_season, amenities, room_translations(name, tagline, description, locale), room_media(src, sort_order)')
      .eq('slug', slug)
      .eq('active', true)
      .single();

    if (error || !data) return null;
    return mapDbRoom(data as DbRoom, locale);
  } catch {
    return null;
  }
}

// ── Public interface ────────────────────────────────────────────────────────

export async function getRoom(slug: string, locale: RoomLocale = 'hr'): Promise<Room | undefined> {
  const dbRoom = await fetchRoomFromDb(slug, locale);
  if (dbRoom) return applyLocaleOverlay(dbRoom, locale);

  // Fallback to static config
  const room = staticRooms.find((r) => r.slug === slug);
  if (!room) return undefined;
  return applyLocaleOverlay(room, locale);
}

export async function getRooms(locale: RoomLocale = 'hr'): Promise<Room[]> {
  const dbRooms = await fetchRoomsFromDb(locale);
  if (dbRooms && dbRooms.length > 0) {
    return dbRooms.map((room) => applyLocaleOverlay(room, locale));
  }

  // Fallback to static config when DB is empty or unavailable
  return staticRooms.map((room) => applyLocaleOverlay(room, locale));
}

export async function getAvailableRooms(locale: RoomLocale = 'hr'): Promise<Room[]> {
  const all = await getRooms(locale);
  return all.filter((r) => !r.fullyBooked);
}
