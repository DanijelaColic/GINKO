// New — Phase 9. Trigger manual iCal sync for a specific room.
// POST /api/admin/channels/sync   body: { room_slug }
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import { syncICalForRoom } from '@/modules/channels/ical.sync';

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { room_slug } = await request.json();
  if (!room_slug) {
    return NextResponse.json({ error: 'Nedostaje room_slug' }, { status: 400 });
  }

  const result = await syncICalForRoom(room_slug);

  if (result.error) {
    return NextResponse.json({ error: result.error, ...result }, { status: 422 });
  }

  return NextResponse.json(result);
}
