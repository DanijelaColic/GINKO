'use client';

// New — no equivalent in source (Ginko has seasonal_rates table, VJ/VV did not)
// Manage base room pricing (from rooms.config) + seasonal rate overrides
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, X } from 'lucide-react';
import clsx from 'clsx';
import { rooms } from '@/modules/rooms/rooms.config';
import { ToastContainer, type ToastItem } from './Toast';

type SeasonalRate = {
  id: string;
  room_slug: string;
  valid_from: string;
  valid_to: string;
  price_per_night: number;
  label: string | null;
};

export default function AdminPricing() {
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.slug ?? '');
  const [rates, setRates] = useState<SeasonalRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddRate, setShowAddRate] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/pricing?room=${selectedRoom}`);
    if (res.ok) setRates(await res.json());
    setLoading(false);
  }, [selectedRoom]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRates();
  }, [fetchRates]);

  const deleteRate = async (id: string) => {
    if (!confirm('Obriši sezonsku cijenu?')) return;
    const res = await fetch('/api/admin/pricing', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showToast('Sezonska cijena obrisana');
      fetchRates();
    } else {
      showToast('Greška pri brisanju', 'error');
    }
  };

  const currentRoom = rooms.find((r) => r.slug === selectedRoom);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-serif font-semibold text-gray-900">Upravljanje cijenama</h1>
            <p className="text-sm text-gray-500 mt-0.5">Osnovne cijene i sezonski popusti / dodaci</p>
          </div>
          <button
            onClick={() => setShowAddRate(true)}
            className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            Dodaj sezonsku cijenu
          </button>
        </div>

        {/* Room selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {rooms.map((r) => (
            <button
              key={r.slug}
              onClick={() => setSelectedRoom(r.slug)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                selectedRoom === r.slug
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary',
              )}
            >
              {r.name}
            </button>
          ))}
        </div>

        {/* Base pricing card */}
        {currentRoom && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Osnovna cijena — {currentRoom.name}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Van sezone</p>
                <p className="text-2xl font-bold text-gray-900">{currentRoom.priceOffSeason}€</p>
                <p className="text-xs text-gray-400 mt-0.5">po noći</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Visoka sezona (7-8)</p>
                <p className="text-2xl font-bold text-primary">{currentRoom.priceHighSeason}€</p>
                <p className="text-xs text-gray-400 mt-0.5">po noći</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Kapacitet</p>
                <p className="text-2xl font-bold text-gray-900">{currentRoom.capacity}</p>
                <p className="text-xs text-gray-400 mt-0.5">osoba</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Za promjenu osnovnih cijena, uredi{' '}
              <code className="bg-gray-100 px-1 rounded">src/modules/rooms/rooms.config.ts</code>{' '}
              ili koristi panel Sobe.
            </p>
          </div>
        )}

        {/* Seasonal rates */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Sezonske cijene</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              Učitavanje...
            </div>
          ) : rates.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              Nema sezonskih cijena za ovu sobu
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {rates.map((rate) => (
                <div key={rate.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {rate.valid_from} → {rate.valid_to}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-primary font-bold text-base">
                        {rate.price_per_night}€
                      </span>
                      <span className="text-xs text-gray-400">po noći</span>
                      {rate.label && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {rate.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteRate(rate.id)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    title="Obriši sezonsku cijenu"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddRate && (
        <AddRateModal
          roomSlug={selectedRoom}
          onClose={() => setShowAddRate(false)}
          onSuccess={() => {
            setShowAddRate(false);
            fetchRates();
            showToast('Sezonska cijena dodana');
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ── Add Rate Modal ───────────────────────────────────────────────

function AddRateModal({
  roomSlug,
  onClose,
  onSuccess,
  onError,
}: {
  roomSlug: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    room_slug: roomSlug,
    valid_from: '',
    valid_to: '',
    price_per_night: '',
    label: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price_per_night: parseFloat(form.price_per_night),
      }),
    });
    if (res.ok) onSuccess();
    else {
      const d = await res.json();
      onError(d.error ?? 'Greška');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-serif text-lg font-semibold text-gray-900">Dodaj sezonsku cijenu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Soba</label>
            <select
              value={form.room_slug}
              onChange={(e) => setForm((p) => ({ ...p, room_slug: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white"
            >
              {rooms.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Od *</label>
              <input type="date" required value={form.valid_from}
                onChange={(e) => setForm((p) => ({ ...p, valid_from: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Do *</label>
              <input type="date" required value={form.valid_to}
                onChange={(e) => setForm((p) => ({ ...p, valid_to: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cijena po noći (€) *</label>
            <input type="number" required min="1" step="0.01" value={form.price_per_night}
              onChange={(e) => setForm((p) => ({ ...p, price_per_night: e.target.value }))}
              placeholder="85"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Oznaka (opcionalno)</label>
            <input type="text" value={form.label} placeholder="Npr. Visoka sezona 2026, Uskrs..."
              onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-full text-sm hover:bg-gray-50 transition-colors">
              Odustani
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-primary text-white py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Spremi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
