// Copied from Villa-Jurina/src/app/api/admin/bookings/route.ts
// Adaptations: apartment_slug → room_slug, getApartment → getRoomBySlug,
//              calculatePrice from @/modules/booking/dates, removed email (Phase 9+)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import { getRoomBySlug } from '@/modules/rooms/room.repository';
import { parseLocalDate, diffDays, calculatePrice } from '@/modules/booking/dates';

// GET /api/admin/bookings — sve rezervacije
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('check_in', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/bookings — nova ručna rezervacija
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    room_slug,
    check_in,
    check_out,
    guest_name,
    guest_email,
    guest_phone,
    adults,
    children,
    notes,
    status,
    deposit_paid,
  } = body;

  const room = getRoomBySlug(room_slug);
  if (!room) return NextResponse.json({ error: 'Soba nije pronađena' }, { status: 404 });

  const checkInDate = parseLocalDate(check_in);
  const checkOutDate = parseLocalDate(check_out);
  const nights = diffDays(checkOutDate, checkInDate);

  if (nights < 1)
    return NextResponse.json({ error: 'Check-out mora biti nakon check-in' }, { status: 400 });

  const priceData = calculatePrice(checkInDate, checkOutDate, room);
  const { totalPrice, deposit } = priceData;
  const avgPricePerNight = Math.round(totalPrice / nights);

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      room_slug,
      check_in,
      check_out,
      nights,
      guest_name,
      guest_email: guest_email || '',
      guest_phone: guest_phone || null,
      adults: adults ?? 1,
      children: children ?? 0,
      price_per_night: avgPricePerNight,
      total_price: totalPrice,
      deposit,
      status: status ?? 'confirmed',
      deposit_paid: deposit_paid ?? false,
      locale: 'hr',
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/admin/bookings — grupno brisanje
export async function DELETE(request: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const ids = body?.ids;

  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === 'string')) {
    return NextResponse.json(
      { error: 'Polje ids mora biti neprazan niz stringova' },
      { status: 400 },
    );
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('bookings').delete().in('id', ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, deletedCount: ids.length });
}
