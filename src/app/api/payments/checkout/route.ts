// POST /api/payments/checkout
//
// Body: { bookingId: string; token: string; paymentType?: 'deposit' }
// Returns: { url: string } — Saferpay Payment Page redirect URL.
// Guest-facing failures return a stable `error` code (see bookingConfirmation.checkoutErrors).

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { verifyBookingViewToken } from '@/lib/bookingConfirmation';
import { guestApiError } from '@/lib/guest-api-error';
import { createCheckoutSession } from '@/modules/payments/payment.service';
import { eurToCents } from '@/modules/payments/payment.types';
import { getSiteUrl } from '@/lib/siteUrl';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, token, paymentType = 'deposit' } = (await request.json()) as {
      bookingId?: string;
      token?: string;
      paymentType?: string;
    };

    if (!bookingId || !token) {
      return guestApiError('missingParams', 400);
    }

    const supabase = createServerSupabaseClient();
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, guest_email, deposit, status, room_slug')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      return guestApiError('bookingNotFound', 404);
    }

    if (!verifyBookingViewToken(token, booking.id, booking.guest_email)) {
      return guestApiError('invalidToken', 403);
    }

    if (booking.status === 'cancelled') {
      return guestApiError('bookingCancelled', 409);
    }

    const depositEur: number = booking.deposit as number;
    if (!depositEur || depositEur <= 0) {
      return guestApiError('invalidDeposit', 422);
    }
    const amountCents = eurToCents(depositEur);

    const siteUrl = getSiteUrl();
    const returnBasePath = `/booking/confirmation/${bookingId}?token=${encodeURIComponent(token)}`;

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

    if (
      message.includes('SAFERPAY_') ||
      message.includes('Saferpay') ||
      message.includes('Nedostaju Saferpay')
    ) {
      return guestApiError('paymentUnavailable', 503);
    }

    return guestApiError('createFailed', 500);
  }
}
