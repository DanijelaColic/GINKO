// New — room update endpoint for admin room editor
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';

type Params = { params: Promise<{ slug: string }> };

// PATCH /api/admin/rooms/[slug] — update room base fields + translations
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const body = await request.json();

  const {
    price_off_season,
    price_high_season,
    min_nights,
    active,
    sort_order,
    capacity,
    amenities,
    translations, // { hr: { name, tagline, description }, en: {...}, de: {...} }
  } = body;

  const supabase = createServerSupabaseClient();

  // Fetch room id
  const { data: room, error: fetchError } = await supabase
    .from('rooms')
    .select('id')
    .eq('slug', slug)
    .single();

  if (fetchError || !room) {
    return NextResponse.json({ error: 'Soba nije pronađena' }, { status: 404 });
  }

  // Update base room fields (only provided fields)
  const roomUpdates: Record<string, unknown> = {};
  if (price_off_season !== undefined) roomUpdates.price_off_season = price_off_season;
  if (price_high_season !== undefined) roomUpdates.price_high_season = price_high_season;
  if (min_nights !== undefined) roomUpdates.min_nights = min_nights;
  if (active !== undefined) roomUpdates.active = active;
  if (sort_order !== undefined) roomUpdates.sort_order = sort_order;
  if (capacity !== undefined) roomUpdates.capacity = capacity;
  if (amenities !== undefined) roomUpdates.amenities = amenities;

  if (Object.keys(roomUpdates).length > 0) {
    const { error: updateError } = await supabase
      .from('rooms')
      .update(roomUpdates)
      .eq('id', room.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Upsert translations if provided
  if (translations && typeof translations === 'object') {
    for (const [locale, fields] of Object.entries(translations)) {
      if (!['hr', 'en', 'de'].includes(locale)) continue;
      const { error: trError } = await supabase.from('room_translations').upsert(
        {
          room_id: room.id,
          locale,
          ...(fields as Record<string, unknown>),
        },
        { onConflict: 'room_id,locale' },
      );
      if (trError) return NextResponse.json({ error: trError.message }, { status: 500 });
    }
  }

  // Return updated room
  const { data: updated, error: refetchError } = await supabase
    .from('rooms')
    .select('*, room_translations(*)')
    .eq('id', room.id)
    .single();

  if (refetchError) return NextResponse.json({ error: refetchError.message }, { status: 500 });
  return NextResponse.json(updated);
}
