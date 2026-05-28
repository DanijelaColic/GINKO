// New — Stripe 4. Admin-only action: create or recreate a Stripe Checkout Session
// for a booking. Unlike the public /api/payments/checkout, the admin endpoint:
//   - is protected by admin cookie (not guest token)
//   - generates the booking-view token server-side
//   - can recreate a link for an expired/failed session
//
// POST /api/admin/payments/link   body: { bookingId: string }
// Returns: { url: string, checkoutSessionId: string }
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import { createBookingViewToken } from '@/lib/bookingConfirmation';
import { createCheckoutSession } from '@/modules/payments/payment.service';
import { eurToCents } from '@/modules/payments/payment.types';

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookingId } = (await request.json()) as { bookingId?: string };
  if (!bookingId) {
    return NextResponse.json({ error: 'Nedostaje bookingId' }, { status: 400 });
  }

  // ── Load booking ─────────────────────────────────────────────────
  const supabase = createServerSupabaseClient();
  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .select('id, guest_email, deposit, status, room_slug')
    .eq('id', bookingId)
    .single();

  if (bookingErr || !booking) {
    return NextResponse.json({ error: 'Rezervacija nije pronađena' }, { status: 404 });
  }

  if (booking.status === 'cancelled') {
    return NextResponse.json(
      { error: 'Rezervacija je otkazana — link nije moguće kreirati' },
      { status: 409 },
    );
  }

  const depositEur = booking.deposit as number;
  if (!depositEur || depositEur <= 0) {
    return NextResponse.json({ error: 'Nevažan iznos depozita' }, { status: 422 });
  }

  // ── Generate booking-view token server-side ───────────────────────
  const token = createBookingViewToken(bookingId, booking.guest_email as string);

  // ── Build return path (same shape as public checkout) ─────────────
  const returnBasePath = `/booking/confirmation/${bookingId}?token=${encodeURIComponent(token)}`;

  try {
    const result = await createCheckoutSession({
      booking_id: bookingId,
      amount_cents: eurToCents(depositEur),
      currency: 'eur',
      returnBasePath,
      metadata: {
        payment_type: 'deposit',
        room_slug: booking.room_slug as string,
        created_by: 'admin',
      },
    });

    return NextResponse.json({
      url: result.url,
      stripe_payment_intent_id: result.stripe_payment_intent_id,
      amount_cents: result.amount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[admin/payments/link]', message);

    if (message.includes('STRIPE_SECRET_KEY') || message.includes('No API key')) {
      return NextResponse.json(
        { error: 'Stripe nije konfiguriran. Provjeri STRIPE_SECRET_KEY.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: 'Greška pri kreiranju linka' }, { status: 500 });
  }
}
