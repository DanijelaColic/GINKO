// GET /api/admin/payments?status=...&from=YYYY-MM-DD&to=YYYY-MM-DD
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status   = searchParams.get('status')   ?? '';
  const from     = searchParams.get('from')     ?? '';
  const to       = searchParams.get('to')       ?? '';
  const bookingId = searchParams.get('bookingId') ?? '';

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from('payment_intents')
    .select(
      `id, provider_payment_id, amount, currency, status, metadata, created_at, updated_at,
       booking_id,
       booking:bookings(
         id, guest_name, guest_email, room_slug, check_in, check_out,
         deposit, total_price, deposit_paid, status
       )`,
    )
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (from)   query = query.gte('created_at', `${from}T00:00:00Z`);
  if (to)     query = query.lte('created_at', `${to}T23:59:59Z`);
  if (bookingId) query = query.eq('booking_id', bookingId);

  const { data, error } = await query.limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
