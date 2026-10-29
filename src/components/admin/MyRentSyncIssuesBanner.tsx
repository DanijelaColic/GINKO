'use client';

/**
 * Jednostavan prikaz rezervacija koje nisu live-sinkronizirane s MyRentom.
 * mocked_ok ≠ uspješan MyRent upis.
 */
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { bookingReference } from '@/modules/booking/booking.config';

type SyncIssue = {
  bookingId: string;
  syncStatus: string;
  confirmedLiveSync: boolean;
  error: string | null;
  roomSlug: string | null;
  checkIn: string | null;
  checkOut: string | null;
  guestName: string | null;
  lastAttemptedAt: string | null;
};

function statusLabel(status: string): string {
  switch (status) {
    case 'failed':
      return 'Greška synca';
    case 'mocked_ok':
      return 'Samo mock (nije u MyRentu)';
    case 'skipped_disabled':
      return 'Write isključen';
    case 'pending':
      return 'Na čekanju';
    default:
      return status;
  }
}

export default function MyRentSyncIssuesBanner() {
  const [issues, setIssues] = useState<SyncIssue[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/myrent/sync-issues');
      const data = (await res.json()) as {
        ok?: boolean;
        issues?: SyncIssue[];
        note?: string;
        message?: string;
      };
      if (res.ok && data.ok !== false) {
        setIssues(data.issues ?? []);
        setNote(
          data.note === 'migration_pending'
            ? data.message ?? 'Migracija sync tablice još nije pokrenuta.'
            : null,
        );
      } else {
        setIssues([]);
        setNote(null);
      }
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && issues.length === 0 && !note) {
    return null;
  }

  if (!note && issues.length === 0) {
    return null;
  }

  const failedCount = issues.filter((i) => i.syncStatus === 'failed').length;

  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-amber-900">
              MyRent sync
              {issues.length > 0
                ? ` — ${issues.length} rezervacija nije u MyRentu (live)`
                : ''}
              {failedCount > 0 ? ` · ${failedCount} s greškom` : ''}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="text-amber-700 hover:text-amber-900 p-1"
              title="Osvježi"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          {note && (
            <p className="text-xs text-amber-800 mt-1">{note}</p>
          )}
          {issues.length > 0 && (
            <>
              <p className="text-xs text-amber-800 mt-1">
                Mock sync nije stvarni upis u MyRent. Live write još nije
                aktivan.
              </p>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="mt-2 text-xs font-medium text-amber-900 inline-flex items-center gap-1 hover:underline"
              >
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {open ? 'Sakrij popis' : 'Prikaži popis'}
              </button>
              {open && (
                <ul className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                  {issues.map((i) => (
                    <li
                      key={i.bookingId}
                      className="text-xs text-amber-900 bg-white/60 rounded-lg px-3 py-2 border border-amber-100"
                    >
                      <span className="font-semibold">
                        {bookingReference(i.bookingId)}
                      </span>
                      {i.guestName ? ` · ${i.guestName}` : ''}
                      {i.roomSlug ? ` · ${i.roomSlug}` : ''}
                      {i.checkIn && i.checkOut
                        ? ` · ${i.checkIn} → ${i.checkOut}`
                        : ''}
                      <span className="block text-amber-700 mt-0.5">
                        {statusLabel(i.syncStatus)}
                        {i.error ? ` — ${i.error}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
