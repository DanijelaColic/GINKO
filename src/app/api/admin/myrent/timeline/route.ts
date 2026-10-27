/**
 * Admin-only MyRent zauzetost za Timeline (7 fizičkih jedinica).
 * Bez PII, bez write-a. Fail-closed ako MyRent nije dostupan.
 *
 * GET /api/admin/myrent/timeline?date_from=YYYY-MM-DD&date_until=YYYY-MM-DD
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import {
  fetchMyRentCalendar,
  isMyRentConfigured,
  MyRentApiError,
  MyRentAuthError,
  MYRENT_TIMELINE_UNITS,
  occupiedDatesToBookedRanges,
} from '@/modules/myrent';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isMyRentConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'MyRent nije konfiguriran. Provjeri MYRENT_* env varijable.',
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('date_from');
  const dateUntil = searchParams.get('date_until');

  if (!dateFrom || !dateUntil || !DATE_RE.test(dateFrom) || !DATE_RE.test(dateUntil)) {
    return NextResponse.json(
      { ok: false, error: 'Potrebni su date_from i date_until (YYYY-MM-DD).' },
      { status: 400 },
    );
  }

  if (dateUntil < dateFrom) {
    return NextResponse.json(
      { ok: false, error: 'date_until mora biti >= date_from.' },
      { status: 400 },
    );
  }

  try {
    const units = await Promise.all(
      MYRENT_TIMELINE_UNITS.map(async (unit) => {
        const calendar = await fetchMyRentCalendar({
          objectId: unit.objectId,
          dateFrom,
          dateUntil,
        });
        return {
          unitId: unit.unitId,
          label: unit.label,
          objectId: unit.objectId,
          roomSlugs: [...unit.roomSlugs],
          // Samo rangeovi — bez imena gostiju / MyRent PII
          occupiedRanges: occupiedDatesToBookedRanges(
            calendar.occupied.map((d) => d.day),
          ),
        };
      }),
    );

    return NextResponse.json({
      ok: true,
      dateFrom,
      dateUntil,
      units,
    });
  } catch (err) {
    if (err instanceof MyRentAuthError || err instanceof MyRentApiError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'MyRent kalendar trenutno nije dostupan.',
        },
        { status: 503 },
      );
    }
    const message =
      err instanceof Error ? err.message : 'MyRent timeline greška';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
