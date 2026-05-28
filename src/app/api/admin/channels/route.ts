// New — Phase 9. Admin channel mapping CRUD.
// GET  /api/admin/channels        — list all mappings (auto-creates missing ones)
// PATCH /api/admin/channels       — update a mapping (body: { room_slug, import_ical_url, sync_enabled })
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import { rooms as staticRooms } from '@/modules/rooms/rooms.config';

// GET — list all mappings, auto-creating records for any room without one
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  // Ensure every room has a mapping row
  for (const room of staticRooms) {
    const { data: existing } = await supabase
      .from('room_channel_mappings')
      .select('id')
      .eq('room_slug', room.slug)
      .single();

    if (!existing) {
      await supabase
        .from('room_channel_mappings')
        .insert({ room_slug: room.slug });
    }
  }

  const { data, error } = await supabase
    .from('room_channel_mappings')
    .select('*')
    .order('room_slug', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — update import URL or sync_enabled for a room
export async function PATCH(request: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { room_slug, import_ical_url, sync_enabled } = await request.json();
  if (!room_slug) {
    return NextResponse.json({ error: 'Nedostaje room_slug' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (import_ical_url !== undefined) updates.import_ical_url = import_ical_url || null;
  if (sync_enabled !== undefined) updates.sync_enabled = sync_enabled;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('room_channel_mappings')
    .update(updates)
    .eq('room_slug', room_slug)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
