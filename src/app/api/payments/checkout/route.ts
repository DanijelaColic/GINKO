// POST /api/payments/checkout
//
// Body: { bookingId: string; token: string; paymentType?: 'deposit' }
// Returns: { url: string } — Saferpay Payment Page redirect URL.
// Guest-facing failures return a stable `error` code (see bookingConfirmation.checkoutErrors).

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import {
  getBookingConfirmationPath,
  verifyBookingViewToken,
} from '@/lib/bookingConfirmation';
import { guestApiError } from '@/lib/guest-api-error';
import { createCheckoutSession } from '@/modules/payments/payment.service';
import { eurToCents } from '@/modules/payments/payment.types';
import { getSiteUrl } from '@/lib/siteUrl';
import { getValidLocale } from '@/i18n/messages';

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
      .select('id, guest_email, deposit, status, deposit_paid, room_slug, locale')
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

    if (booking.status === 'confirmed' || booking.deposit_paid === true) {
      return guestApiError('alreadyPaid', 409);
    }

    const depositEur: number = booking.deposit as number;
    if (!depositEur || depositEur <= 0) {
      return guestApiError('invalidDeposit', 422);
    }
    const amountCents = eurToCents(depositEur);

    const locale = getValidLocale(
      typeof booking.locale === 'string' ? booking.locale : 'hr',
    );
    const siteUrl = getSiteUrl();
    // Localized path so Saferpay return lands on the same language as booking
    const returnBasePath = getBookingConfirmationPath(bookingId, token, locale);

    const result = await createCheckoutSession({
      booking_id: bookingId,
      amount_cents: amountCents,
      currency: 'eur',
      languageCode: locale,
      returnBasePath,
      metadata: {
        payment_type: paymentType,
        room_slug: booking.room_slug as string,
        site_url: siteUrl,
        locale,
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
