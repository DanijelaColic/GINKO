/**
 * Admin-only, read-only MyRent probe.
 * GET /api/admin/myrent/calendar?probe=auth
 * GET /api/admin/myrent/calendar?room=ginko-1&date_from=YYYY-MM-DD&date_until=YYYY-MM-DD
 * GET /api/admin/myrent/calendar?object_id=16575&date_from=...&date_until=...
 *
 * Ne kreira / ne mijenja / ne otkazuje rezervacije.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import {
  fetchMyRentCalendar,
  getRoomSlugsForObjectId,
  isMyRentConfigured,
  MyRentApiError,
  MyRentAuthError,
  probeMyRentAuth,
} from '@/modules/myrent';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isMyRentConfigured()) {
    return NextResponse.json(
      {
        error:
          'MyRent nije konfiguriran. Provjeri MYRENT_* env varijable.',
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const probe = searchParams.get('probe');

  try {
    if (probe === 'auth') {
      const auth = await probeMyRentAuth();
      return NextResponse.json({
        probe: 'auth',
        // token se namjerno ne vraća
        ...auth,
      });
    }

    const roomSlug = searchParams.get('room');
    const objectIdRaw = searchParams.get('object_id');
    const objectId = objectIdRaw ? Number(objectIdRaw) : null;
    const dateFrom = searchParams.get('date_from') || todayIso();
    const dateUntil = searchParams.get('date_until') || plusDaysIso(30);

    if (!roomSlug && (objectId == null || !Number.isFinite(objectId))) {
      return NextResponse.json(
        {
          error:
            'Potreban je query param room=<slug> ili object_id=<broj>. ' +
            'Za auth smoke: ?probe=auth',
        },
        { status: 400 },
      );
    }

    if (objectIdRaw && (objectId == null || !Number.isFinite(objectId))) {
      return NextResponse.json(
        { error: 'object_id mora biti broj.' },
        { status: 400 },
      );
    }

    const result = await fetchMyRentCalendar({
      roomSlug,
      objectId,
      dateFrom,
      dateUntil,
    });

    // Za usporedbu s MyRent UI: sažetak + zauzeti dani (bez tajni)
    return NextResponse.json({
      ok: true,
      objectId: result.objectId,
      roomSlug: result.roomSlug,
      roomSlugsSharingCalendar: getRoomSlugsForObjectId(result.objectId),
      dateFrom: result.dateFrom,
      dateUntil: result.dateUntil,
      summary: result.summary,
      occupied: result.occupied,
      occupiedDates: result.occupied.map((d) => d.day),
      // Sirovi dani korisni za debug (cijene / free flagovi) — i dalje read-only
      days: result.days.map((d) => ({
        day: d.day,
        price: d.price ?? null,
        free: d.free ?? null,
        enable: d.enable ?? null,
        is_booked: d.is_booked ?? null,
        stock_available: d.stock_available ?? null,
        min_stay: d.min_stay ?? null,
        check_in: d.check_in ?? null,
        check_out: d.check_out ?? null,
      })),
    });
  } catch (err) {
    if (err instanceof MyRentAuthError || err instanceof MyRentApiError) {
      return NextResponse.json(
        { error: err.message, status: err.status },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    const message = err instanceof Error ? err.message : 'MyRent greška';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
