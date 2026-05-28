// New — Stripe 2. Public checkout session creation endpoint.
// POST /api/payments/checkout
//
// Body: { bookingId: string; token: string; paymentType?: 'deposit' }
// - token is the HMAC booking-view token (already in the guest's confirmation URL).
//   It proves the caller knows the guest email — no separate auth needed.
// - Amount is derived server-side from booking.deposit (EUR) → never trusted from client.
// Returns: { url: string }  — Stripe Checkout Session URL for redirect.

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyBookingViewToken } from '@/lib/bookingConfirmation';
import { createCheckoutSession } from '@/modules/payments/payment.service';
import { eurToCents } from '@/modules/payments/payment.types';
import { getSiteUrl } from '@/lib/siteUrl';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, token, paymentType = 'deposit' } = await request.json() as {
      bookingId?: string;
      token?: string;
      paymentType?: string;
    };

    if (!bookingId || !token) {
      return NextResponse.json(
        { error: 'Nedostaju bookingId ili token' },
        { status: 400 },
      );
    }

    // ── Load booking (server is source of truth for amount) ───────
    const supabase = createServerSupabaseClient();
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, guest_email, deposit, status, room_slug')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Rezervacija nije pronađena' }, { status: 404 });
    }

    // ── Verify token (proves caller knows guest email) ─────────────
    if (!verifyBookingViewToken(token, booking.id, booking.guest_email)) {
      return NextResponse.json({ error: 'Nevažeći pristupni token' }, { status: 403 });
    }

    // ── Guard: don't allow paying for cancelled bookings ──────────
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Rezervacija je otkazana — plaćanje nije moguće' },
        { status: 409 },
      );
    }

    // ── Server-side amount calculation ────────────────────────────
    const depositEur: number = booking.deposit as number;
    if (!depositEur || depositEur <= 0) {
      return NextResponse.json({ error: 'Nevažan iznos depozita' }, { status: 422 });
    }
    const amountCents = eurToCents(depositEur);

    // ── Build the return base path ─────────────────────────────────
    // Stripe appends &session_id={...} to success_url automatically
    const siteUrl = getSiteUrl();
    const returnBasePath = `/booking/confirmation/${bookingId}?token=${encodeURIComponent(token)}`;

    // ── Create Stripe Checkout Session + persist record ───────────
    const result = await createCheckoutSession({
      booking_id: bookingId,
      amount_cents: amountCents,
      currency: 'eur',
      returnBasePath,
      metadata: {
        payment_type: paymentType,
        room_slug: booking.room_slug as string,
        site_url: siteUrl,
      },
    });

    return NextResponse.json({ url: result.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[POST /api/payments/checkout]', message);

    // Surface Stripe configuration errors clearly in development
    if (message.includes('STRIPE_SECRET_KEY') || message.includes('No API key')) {
      return NextResponse.json(
        { error: 'Stripe nije konfiguriran. Provjeri STRIPE_SECRET_KEY u .env.local.' },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: 'Greška pri kreiranju plaćanja' }, { status: 500 });
  }
}
