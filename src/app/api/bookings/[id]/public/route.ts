// Adapted from VJ/src/app/api/bookings/[id]/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { guestApiError } from '@/lib/guest-api-error';
import { getBookingConfirmationData } from '@/modules/booking/booking.confirmation';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const token = new URL(request.url).searchParams.get('token')?.trim() ?? '';

    if (!id || !token) {
      return guestApiError('missingParams', 400);
    }

    const data = await getBookingConfirmationData(id, token);
    if (!data) {
      return guestApiError('bookingNotFound', 404);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('GET /api/bookings/[id]/public:', err);
    return guestApiError('fetchFailed', 500);
  }
}
