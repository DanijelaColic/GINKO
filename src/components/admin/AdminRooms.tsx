'use client';

// New — no equivalent in source projects
// Practical room editor: base fields + localized translations (hr/en/cs)
import { useState, useEffect, useCallback } from 'react';
import { Loader2, ChevronDown, ChevronUp, Save } from 'lucide-react';
import clsx from 'clsx';
import { rooms as staticRooms } from '@/modules/rooms/rooms.config';
import { ToastContainer, type ToastItem } from './Toast';

type DbRoom = {
  id: string;
  slug: string;
  capacity: number;
  price_off_season: number;
  price_high_season: number;
  min_nights: number;
  active: boolean;
  sort_order: number;
  amenities: string[];
  room_translations: Array<{
    locale: string;
    name: string;
    tagline: string | null;
    description: string | null;
  }>;
};

type LocaleKey = 'hr' | 'en' | 'cs';
const LOCALES: LocaleKey[] = ['hr', 'en', 'cs'];
const LOCALE_LABELS: Record<LocaleKey, string> = { hr: 'Hrvatski', en: 'English', cs: 'Čeština' };

function RoomEditor({
  room,
  onSaved,
  onError,
}: {
  room: DbRoom;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeLocale, setActiveLocale] = useState<LocaleKey>('hr');

  const [fields, setFields] = useState({
    price_off_season: String(room.price_off_season),
    price_high_season: String(room.price_high_season),
    min_nights: String(room.min_nights),
    capacity: String(room.capacity),
    active: room.active,
    sort_order: String(room.sort_order),
  });

  const [translations, setTranslations] = useState<
    Record<LocaleKey, { name: string; tagline: string; description: string }>
  >(
    Object.fromEntries(
      LOCALES.map((locale) => {
        const tr = room.room_translations?.find((t) => t.locale === locale);
        const staticRoom = staticRooms.find((r) => r.slug === room.slug);
        return [
          locale,
          {
            name: tr?.name ?? staticRoom?.name ?? '',
            tagline: tr?.tagline ?? staticRoom?.tagline ?? '',
            description: tr?.description ?? staticRoom?.description ?? '',
          },
        ];
      }),
    ) as Record<LocaleKey, { name: string; tagline: string; description: string }>,
  );

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/rooms/${room.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price_off_season: parseFloat(fields.price_off_season),
        price_high_season: parseFloat(fields.price_high_season),
        min_nights: parseInt(fields.min_nights),
        capacity: parseInt(fields.capacity),
        active: fields.active,
        sort_order: parseInt(fields.sort_order),
        translations,
      }),
    });
    if (res.ok) onSaved();
    else {
      const d = await res.json();
      onError(d.error ?? 'Greška pri spremanju');
    }
    setSaving(false);
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
              room.active ? 'bg-green-400' : 'bg-gray-300',
            )}
          />
          <span className="font-semibold text-gray-800">{room.slug}</span>
          <span className="text-sm text-gray-500">
            {room.price_off_season}€ / {room.price_high_season}€ · {room.capacity} osoba
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-6 py-5 space-y-6">
          {/* Base fields */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Osnovna polja
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Cijena van sezone (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fields.price_off_season}
                  onChange={(e) => setFields((p) => ({ ...p, price_off_season: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Cijena visoka sezona (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fields.price_high_season}
                  onChange={(e) => setFields((p) => ({ ...p, price_high_season: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Minimalan boravak (noći)
                </label>
                <input
                  type="number"
                  min="1"
                  value={fields.min_nights}
                  onChange={(e) => setFields((p) => ({ ...p, min_nights: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kapacitet</label>
                <input
                  type="number"
                  min="1"
                  value={fields.capacity}
                  onChange={(e) => setFields((p) => ({ ...p, capacity: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Redoslijed</label>
                <input
                  type="number"
                  min="0"
                  value={fields.sort_order}
                  onChange={(e) => setFields((p) => ({ ...p, sort_order: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id={`active-${room.slug}`}
                  checked={fields.active}
                  onChange={(e) => setFields((p) => ({ ...p, active: e.target.checked }))}
                  className="accent-primary"
                />
                <label htmlFor={`active-${room.slug}`} className="text-sm text-gray-700 cursor-pointer">
                  Aktivna soba
                </label>
              </div>
            </div>
          </div>

          {/* Translations */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Prijevodi
            </h4>
            <div className="flex gap-1 mb-4">
              {LOCALES.map((locale) => (
                <button
                  key={locale}
                  onClick={() => setActiveLocale(locale)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    activeLocale === locale
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {LOCALE_LABELS[locale]}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Naziv</label>
                <input
                  type="text"
                  value={translations[activeLocale].name}
                  onChange={(e) =>
                    setTranslations((p) => ({
                      ...p,
                      [activeLocale]: { ...p[activeLocale], name: e.target.value },
                    }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tagline</label>
                <input
                  type="text"
                  value={translations[activeLocale].tagline}
                  onChange={(e) =>
                    setTranslations((p) => ({
                      ...p,
                      [activeLocale]: { ...p[activeLocale], tagline: e.target.value },
                    }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Opis</label>
                <textarea
                  rows={4}
                  value={translations[activeLocale].description}
                  onChange={(e) =>
                    setTranslations((p) => ({
                      ...p,
                      [activeLocale]: { ...p[activeLocale], description: e.target.value },
                    }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Spremi promjene
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminRooms() {
  const [rooms, setRooms] = useState<DbRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/rooms');
    if (res.ok) setRooms(await res.json());
    else showToast('Greška pri dohvatu soba', 'error');
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRooms();
  }, [fetchRooms]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-serif font-semibold text-gray-900">Upravljanje sobama</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Uredi cijene, prijevode i vidljivost soba
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={24} className="animate-spin mr-2" />
            Učitavanje soba...
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <p className="text-sm">Nema soba u bazi.</p>
            <p className="text-xs mt-1">Pokreni seed.sql iz supabase/ mape.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <RoomEditor
                key={room.id}
                room={room}
                onSaved={() => {
                  showToast(`Soba ${room.slug} spremljena`);
                  fetchRooms();
                }}
                onError={(msg) => showToast(msg, 'error')}
              />
            ))}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
