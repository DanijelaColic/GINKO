/**
 * Admin-only: rezervacije koje nisu live-sinkronizirane s MyRentom.
 * GET /api/admin/myrent/sync-issues
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticatedFromRequest } from '@/lib/admin-auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getMyRentSyncStore } from '@/modules/myrent/myrent.sync-store';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const store = getMyRentSyncStore();
    const rows = await store.listNeedingAttention();

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, issues: [], count: 0 });
    }

    const supabase = createServerSupabaseClient();
    const ids = rows.map((r) => r.bookingId);
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

    const issues = rows.map((r) => {
      const b = byId.get(r.bookingId);
      return {
        bookingId: r.bookingId,
        syncStatus: r.status,
        confirmedLiveSync: r.confirmedLiveSync,
        error: r.error,
        objectId: r.objectId,
        myrentRentId: r.myrentRentId,
        lastAttemptedAt: r.attemptedAt,
        roomSlug: b?.room_slug ?? null,
        checkIn: b?.check_in ?? null,
        checkOut: b?.check_out ?? null,
        guestName: b?.guest_name ?? null,
        bookingStatus: b?.status ?? null,
        depositPaid: b?.deposit_paid ?? null,
      };
    });

    return NextResponse.json({ ok: true, issues, count: issues.length });
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
