// New — no equivalent in source projects (Ginko has seasonal_rates table, VJ/VV did not)
// CRUD for seasonal/pricing overrides per room
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';

// GET /api/admin/pricing?room=slug
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roomSlug = searchParams.get('room');

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from('seasonal_rates')
    .select('*')
    .order('valid_from', { ascending: true });

  if (roomSlug) query = query.eq('room_slug', roomSlug);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/pricing — add seasonal rate
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { room_slug, valid_from, valid_to, price_per_night, label } = await request.json();

  if (!room_slug || !valid_from || !valid_to || !price_per_night) {
    return NextResponse.json(
      { error: 'Nedostaju polja: room_slug, valid_from, valid_to, price_per_night' },
      { status: 400 },
    );
  }

  if (valid_to <= valid_from) {
    return NextResponse.json({ error: 'valid_to mora biti nakon valid_from' }, { status: 400 });
  }

  if (price_per_night <= 0) {
    return NextResponse.json({ error: 'Cijena mora biti pozitivna' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('seasonal_rates')
    .insert({ room_slug, valid_from, valid_to, price_per_night, label: label || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/admin/pricing — delete by id
export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Nedostaje id' }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('seasonal_rates').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
