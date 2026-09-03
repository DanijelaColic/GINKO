// New — no equivalent in source projects
// Admin CRUD for rooms table (base prices, active flag, sort order)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';

// GET /api/admin/rooms — all rooms with translations + media count
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('rooms')
    .select('*, room_translations(*), room_media(id, sort_order, is_cover, src, alt_text)')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/admin/rooms/[slug] — update room base fields
// Handled by /api/admin/rooms/[slug]/route.ts below — this route handles bulk operations

// GET with no body returns all rooms (above)
