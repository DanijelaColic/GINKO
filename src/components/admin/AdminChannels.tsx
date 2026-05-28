'use client';

// New — Phase 9. Lightweight admin UI for iCal channel management.
// One row per room: set import URL, toggle sync, trigger manual sync, copy export URL.
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, Check, X, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import { rooms as staticRooms } from '@/modules/rooms/rooms.config';
import { ToastContainer, type ToastItem } from './Toast';
import type { ChannelMapping } from '@/modules/channels/channel.types';

function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const show = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = crypto.randomUUID();
    setToasts((p) => [...p, { id, message, type }]);
  }, []);
  const dismiss = useCallback((id: string) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);
  return { toasts, show, dismiss };
}

function getSiteUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

// ── Room channel row ─────────────────────────────────────────────

function RoomChannelRow({
  mapping,
  onUpdated,
  onError,
}: {
  mapping: ChannelMapping;
  onUpdated: (updated: ChannelMapping) => void;
  onError: (msg: string) => void;
}) {
  const room = staticRooms.find((r) => r.slug === mapping.room_slug);
  const [expanded, setExpanded] = useState(false);
  const [importUrl, setImportUrl] = useState(mapping.import_ical_url ?? '');
  const [syncEnabled, setSyncEnabled] = useState(mapping.sync_enabled);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const exportUrl = `${getSiteUrl()}/api/ical/${mapping.export_token}`;

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/channels', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_slug: mapping.room_slug,
        import_ical_url: importUrl,
        sync_enabled: syncEnabled,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdated(updated);
    } else {
      const d = await res.json();
      onError(d.error ?? 'Greška pri spremanju');
    }
    setSaving(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await fetch('/api/admin/channels/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_slug: mapping.room_slug }),
    });
    const data = await res.json();
    if (res.ok) {
      setSyncResult(`Uvezeno: ${data.upserted}, uklonjeno: ${data.removed}`);
      // Refresh the mapping to get updated sync status
      const updated = await fetch('/api/admin/channels').then((r) => r.json());
      const m = Array.isArray(updated)
        ? updated.find((x: ChannelMapping) => x.room_slug === mapping.room_slug)
        : null;
      if (m) onUpdated(m);
    } else {
      setSyncResult(`Greška: ${data.error}`);
    }
    setSyncing(false);
  };

  const copyExportUrl = () => {
    navigator.clipboard.writeText(exportUrl).catch(() => {});
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className={clsx(
              'w-2 h-2 rounded-full',
              mapping.last_sync_status === 'ok'
                ? 'bg-green-400'
                : mapping.last_sync_status === 'error'
                  ? 'bg-red-400'
                  : 'bg-gray-300',
            )}
          />
          <span className="font-semibold text-gray-800">{room?.name ?? mapping.room_slug}</span>
          <span className="text-xs text-gray-400">
            {mapping.import_ical_url
              ? new URL(mapping.import_ical_url).hostname
              : 'Nema uvoznog URL-a'}
          </span>
          {mapping.last_synced_at && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              · Sinhronizirano: {new Date(mapping.last_synced_at).toLocaleString('hr-HR')}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-6 py-5 space-y-5">
          {/* Status */}
          {mapping.last_sync_status && (
            <div
              className={clsx(
                'flex items-start gap-2 rounded-xl px-4 py-3 text-sm',
                mapping.last_sync_status === 'ok'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700',
              )}
            >
              {mapping.last_sync_status === 'ok' ? <Check size={15} className="mt-0.5 shrink-0" /> : <X size={15} className="mt-0.5 shrink-0" />}
              <div>
                <p className="font-medium">
                  {mapping.last_sync_status === 'ok' ? 'Zadnja sinkronizacija uspješna' : 'Zadnja sinkronizacija neuspješna'}
                </p>
                {mapping.last_sync_message && (
                  <p className="text-xs opacity-80 mt-0.5">{mapping.last_sync_message}</p>
                )}
                {mapping.last_synced_at && (
                  <p className="text-xs opacity-60 mt-0.5">
                    {new Date(mapping.last_synced_at).toLocaleString('hr-HR')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Import settings */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Uvoz (npr. Airbnb, Booking.com)
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  iCal URL za uvoz
                </label>
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Airbnb: Kalendar → Izvezi kalendar → Kopiraj link. Booking.com: Calendars → Export.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`sync-enabled-${mapping.room_slug}`}
                  checked={syncEnabled}
                  onChange={(e) => setSyncEnabled(e.target.checked)}
                  className="accent-primary"
                />
                <label
                  htmlFor={`sync-enabled-${mapping.room_slug}`}
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Sinkronizacija omogućena
                </label>
              </div>
            </div>
          </div>

          {/* Sync result feedback */}
          {syncResult && (
            <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              {syncResult}
            </div>
          )}

          {/* Export */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Izvoz (za dodavanje u Airbnb, Booking.com)
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={exportUrl}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 bg-gray-50 focus:outline-none truncate"
              />
              <button
                onClick={copyExportUrl}
                title="Kopiraj URL"
                className="p-2 text-gray-500 hover:text-primary border border-gray-200 rounded-lg hover:border-primary transition-colors"
              >
                <Copy size={15} />
              </button>
              <a
                href={exportUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Otvori .ics"
                className="p-2 text-gray-500 hover:text-primary border border-gray-200 rounded-lg hover:border-primary transition-colors"
              >
                <ExternalLink size={15} />
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Dodaj ovaj URL u Airbnb (Kalendar → Uvezi kalendar) ili Booking.com (Calendars → Import).
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={handleSync}
              disabled={syncing || !importUrl || !syncEnabled}
              className="flex items-center gap-2 text-sm border border-gray-200 text-gray-700 px-4 py-2 rounded-full hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              {syncing ? 'Sinkronizacija...' : 'Sinkroniziraj odmah'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Spremi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────

export default function AdminChannels() {
  const [mappings, setMappings] = useState<ChannelMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, show, dismiss } = useToasts();

  const fetchMappings = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/channels');
    if (res.ok) setMappings(await res.json());
    else show('Greška pri dohvatu postavki kanala', 'error');
    setLoading(false);
  }, [show]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMappings();
  }, [fetchMappings]);

  const handleUpdated = (updated: ChannelMapping) => {
    setMappings((prev) => prev.map((m) => (m.room_slug === updated.room_slug ? updated : m)));
    show('Postavke spremljene');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-serif font-semibold text-gray-900">Kanali i iCal sinkronizacija</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Uvoz rezervacija s Airbnb / Booking.com · Izvoz za sprječavanje dvostrukih rezervacija
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
          <p className="text-sm text-amber-800 font-medium mb-1">Kako ovo radi</p>
          <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
            <li>
              <strong>Uvoz:</strong> dodaj iCal URL s Airbnb/Booking.com — uvezeni termini automatski
              blokiraju dostupnost u Ginku.
            </li>
            <li>
              <strong>Izvoz:</strong> kopiraj URL za izvoz i dodaj ga u Airbnb/Booking.com kako bi
              Ginko rezervacije blokirale tamo.
            </li>
            <li>
              Sinkronizacija je ručna (klik &quot;Sinkroniziraj odmah&quot;). Automatska (cron) u sljedećoj fazi.
            </li>
          </ul>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={24} className="animate-spin mr-2" />
            Učitavanje...
          </div>
        ) : (
          <div className="space-y-3">
            {mappings.map((m) => (
              <RoomChannelRow
                key={m.room_slug}
                mapping={m}
                onUpdated={handleUpdated}
                onError={(msg) => show(msg, 'error')}
              />
            ))}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
