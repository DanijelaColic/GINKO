// POST /api/admin/payments/link   body: { bookingId: string }
// Returns: { url: string, provider_payment_id: string }
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import {
  createBookingViewToken,
  getBookingConfirmationPath,
} from '@/lib/bookingConfirmation';
import { createCheckoutSession } from '@/modules/payments/payment.service';
import { eurToCents } from '@/modules/payments/payment.types';
import { getValidLocale } from '@/i18n/messages';

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticatedFromRequest(request))) {
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
    .select('id, guest_email, deposit, status, room_slug, locale')
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
  const locale = getValidLocale(
    typeof booking.locale === 'string' ? booking.locale : 'hr',
  );

  // ── Build return path (same shape as public checkout) ─────────────
  const returnBasePath = getBookingConfirmationPath(bookingId, token, locale);

  try {
    const result = await createCheckoutSession({
      booking_id: bookingId,
      amount_cents: eurToCents(depositEur),
      currency: 'eur',
      languageCode: locale,
      returnBasePath,
      metadata: {
        payment_type: 'deposit',
        room_slug: booking.room_slug as string,
        created_by: 'admin',
        locale,
      },
    });

    return NextResponse.json({
      url: result.url,
      provider_payment_id: result.provider_payment_id,
      amount_cents: result.amount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[admin/payments/link]', message);

    if (
      message.includes('SAFERPAY_') ||
      message.includes('Saferpay') ||
      message.includes('Nedostaju Saferpay')
    ) {
      return NextResponse.json(
        { error: 'Saferpay nije konfiguriran. Provjeri env varijable.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: 'Greška pri kreiranju linka' }, { status: 500 });
  }
}
