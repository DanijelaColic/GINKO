// New — no equivalent in source projects (Ginko has blocked_dates table, VJ/VV did not)
// CRUD for manual calendar blocks per room
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';

// GET /api/admin/blocked-dates?room=slug  (or all if no param)
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roomSlug = searchParams.get('room');

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from('blocked_dates')
    .select('*')
    .order('check_in', { ascending: true });

  if (roomSlug) query = query.eq('room_slug', roomSlug);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/blocked-dates — create a block
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { room_slug, check_in, check_out, reason } = await request.json();

  if (!room_slug || !check_in || !check_out) {
    return NextResponse.json({ error: 'Nedostaju polja: room_slug, check_in, check_out' }, { status: 400 });
  }

  if (check_out <= check_in) {
    return NextResponse.json({ error: 'check_out mora biti nakon check_in' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('blocked_dates')
    .insert({ room_slug, check_in, check_out, reason: reason || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/admin/blocked-dates — delete by id (body: { id })
export async function DELETE(request: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Nedostaje id' }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('blocked_dates').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
