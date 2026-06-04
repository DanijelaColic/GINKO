// Adapted from VJ/src/app/api/bookings/[id]/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBookingConfirmationData } from '@/modules/booking/booking.confirmation';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const token = new URL(request.url).searchParams.get('token')?.trim() ?? '';

    if (!id || !token) {
      return NextResponse.json({ error: 'Nedostaju parametri' }, { status: 400 });
    }

    const data = await getBookingConfirmationData(id, token);
    if (!data) {
      return NextResponse.json({ error: 'Rezervacija nije pronađena' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('GET /api/bookings/[id]/public:', err);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju potvrde rezervacije' },
      { status: 500 },
    );
  }
}
