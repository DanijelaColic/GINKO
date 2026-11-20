/**
 * Admin-only: rezervacije koje nisu live-sinkronizirane s MyRentom.
 * GET /api/admin/myrent/sync-issues
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getMyRentSyncStore } from '@/modules/myrent/myrent.sync-store';
import { isMyRentActivationSchemaMissing } from '@/modules/myrent/myrent.inbound-cancel';

function activationIssueLabel(issue: string | null | undefined): string {
  switch (issue) {
    case 'not_yet_active':
      return 'Depozit je naplaćen, ali MyRent rezervacija nikad nije bila active=Y. Kalendar nije zatvoren. Nema automatskog otkazivanja ni povrata.';
    case 'calendar_open':
      return 'Depozit je naplaćen i MyRent je active=Y, ali kalendar nema sve noći boravka zatvorene.';
    case 'check_failed':
      return 'Depozit je naplaćen. Provjera MyRent kalendara nije uspjela — termin nije potvrđen kao blokiran.';
    default:
      return 'Depozit je naplaćen, a MyRent kalendar nije potvrđeno zatvoren.';
  }
}

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const store = getMyRentSyncStore();
    const rows = await store.listNeedingAttention();
    let activationRows: Awaited<
      ReturnType<NonNullable<typeof store.listActivationGaps>>
    > = [];
    let activationSchemaPending = false;
    try {
      activationRows = store.listActivationGaps
        ? await store.listActivationGaps()
        : [];
    } catch (err) {
      if (isMyRentActivationSchemaMissing(err)) {
        activationSchemaPending = true;
      } else {
        throw err;
      }
    }

    if (rows.length === 0 && activationRows.length === 0) {
      return NextResponse.json({
        ok: true,
        issues: [],
        count: 0,
        ...(activationSchemaPending
          ? {
              note: 'migration_pending',
              message:
                'Migracija 019 (seen_active_at) još nije primijenjena. Inbound-cancel ne otkazuje rezervacije.',
            }
          : {}),
      });
    }

    const supabase = createServerSupabaseClient();
    const ids = [...rows, ...activationRows].map((r) => r.bookingId);
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(
        'id, room_slug, check_in, check_out, guest_name, status, deposit_paid',
      )
      .in('id', ids);

    if (error) {
      // Tablica sync možda postoji, bookings join fail — vrati barem sync redove
      return NextResponse.json({
        ok: true,
        issues: rows.map((r) => ({
          bookingId: r.bookingId,
          syncStatus: r.status,
          confirmedLiveSync: r.confirmedLiveSync,
          error: r.error,
          objectId: r.objectId,
          myrentRentId: r.myrentRentId,
          lastAttemptedAt: r.attemptedAt,
          roomSlug: null,
          checkIn: null,
          checkOut: null,
          guestName: null,
          bookingStatus: null,
          depositPaid: null,
        })),
        count: rows.length,
        note: 'booking_join_failed',
      });
    }

    const byId = new Map((bookings ?? []).map((b) => [b.id as string, b]));

    const toIssue = (
      r: (typeof rows)[number],
      kind: 'sync' | 'activation',
    ) => {
      const b = byId.get(r.bookingId);
      return {
        bookingId: r.bookingId,
        syncStatus: kind === 'activation' ? 'live_ok' : r.status,
        confirmedLiveSync: r.confirmedLiveSync,
        error:
          kind === 'activation'
            ? activationIssueLabel(r.activationIssue)
            : r.error,
        objectId: r.objectId,
        myrentRentId: r.myrentRentId,
        lastAttemptedAt: r.attemptedAt,
        roomSlug: b?.room_slug ?? null,
        checkIn: b?.check_in ?? null,
        checkOut: b?.check_out ?? null,
        guestName: b?.guest_name ?? null,
        bookingStatus: b?.status ?? null,
        depositPaid: b?.deposit_paid ?? null,
        issueKind: kind,
      };
    };

    const issues = [
      ...rows.map((r) => toIssue(r, 'sync')),
      ...activationRows
        .filter((r) => {
          const b = byId.get(r.bookingId);
          // Otkazane (uključujući test 2521332) ne dižemo kao otvoreni problem.
          return b?.status === 'confirmed' && b?.deposit_paid === true;
        })
        .map((r) => toIssue(r, 'activation')),
    ];

    // Plaćene bez potvrđenog live synca — prioritet za admin
    const paidUnconfirmedCount = issues.filter(
      (i) => i.depositPaid === true && i.confirmedLiveSync !== true,
    ).length;

    return NextResponse.json({
      ok: true,
      issues,
      count: issues.length,
      paidUnconfirmedCount,
      ...(activationSchemaPending
        ? {
            note: 'migration_pending',
            message:
              'Migracija 019 (seen_active_at) još nije primijenjena. Inbound-cancel ne otkazuje rezervacije.',
          }
        : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync issues greška';
    // Migracija možda još nije pokrenuta
    if (/myrent_booking_sync|relation|does not exist/i.test(message)) {
      return NextResponse.json({
        ok: true,
        issues: [],
        count: 0,
        note: 'migration_pending',
        message:
          'Tablica myrent_booking_sync još ne postoji — pokreni migraciju 012_myrent_booking_sync.sql',
      });
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
