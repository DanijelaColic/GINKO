// POST /api/payments/intent
//
// Creates a Stripe PaymentIntent for use with Stripe Elements (inline form).
// Body: { bookingId: string; token: string; paymentType?: 'deposit' }
// - token: HMAC booking-view token that proves caller knows the guest email.
// - Amount is always derived server-side from booking.deposit — never trusted from client.
// Returns: { clientSecret: string }

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyBookingViewToken } from '@/lib/bookingConfirmation';
import { createPaymentIntentForElements } from '@/modules/payments/payment.service';
import { eurToCents } from '@/modules/payments/payment.types';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, token, paymentType = 'deposit' } = (await request.json()) as {
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

    // ── Verify token ──────────────────────────────────────────────
    if (!verifyBookingViewToken(token, booking.id, booking.guest_email)) {
      return NextResponse.json({ error: 'Nevažeći pristupni token' }, { status: 403 });
    }

    // ── Guard: no payment for cancelled bookings ──────────────────
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Rezervacija je otkazana — plaćanje nije moguće' },
        { status: 409 },
      );
    }

    // ── Server-side amount ────────────────────────────────────────
    const depositEur: number = booking.deposit as number;
    if (!depositEur || depositEur <= 0) {
      return NextResponse.json({ error: 'Nevažan iznos depozita' }, { status: 422 });
    }
    const amountCents = eurToCents(depositEur);

    // ── Create Stripe PaymentIntent + persist record ──────────────
    const result = await createPaymentIntentForElements({
      booking_id: bookingId,
      amount_cents: amountCents,
      currency: 'eur',
      metadata: {
        payment_type: paymentType,
        room_slug: booking.room_slug as string,
      },
    });

    return NextResponse.json({ clientSecret: result.clientSecret });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[POST /api/payments/intent]', message);

    if (message.includes('STRIPE_SECRET_KEY') || message.includes('No API key')) {
      return NextResponse.json(
        { error: 'Stripe nije konfiguriran. Provjeri STRIPE_SECRET_KEY u .env.local.' },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: 'Greška pri kreiranju plaćanja' }, { status: 500 });
  }
}
