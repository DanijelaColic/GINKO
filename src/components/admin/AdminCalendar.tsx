'use client';

// New — no equivalent in source (Ginko has blocked_dates table, VJ/VV did not)
// Month-view calendar with booking + block visualization per room
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2, X } from 'lucide-react';
import clsx from 'clsx';
import { rooms } from '@/modules/rooms/rooms.config';
import { getMonthGrid } from '@/modules/booking/dates';
import { ToastContainer, type ToastItem } from './Toast';

const MONTHS_HR = [
  'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
  'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac',
];
const DAYS_SHORT = ['Po', 'Ut', 'Sr', 'Če', 'Pe', 'Su', 'Ne'];


type BlockedDate = {
  id: string;
  room_slug: string;
  check_in: string;
  check_out: string;
  reason: string | null;
};

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AdminCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.slug ?? '');
  const [bookings, setBookings] = useState<{ check_in: string; check_out: string; guest_name: string }[]>([]);
  const [blocks, setBlocks] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedRoom) return;
    setLoading(true);
    const [bRes, blRes] = await Promise.all([
      fetch(`/api/admin/bookings`),
      fetch(`/api/admin/blocked-dates?room=${selectedRoom}`),
    ]);
    if (bRes.ok) {
      const all = await bRes.json();
      setBookings(
        all
          .filter((b: { room_slug: string; status: string }) => b.room_slug === selectedRoom && b.status !== 'cancelled')
          .map((b: { check_in: string; check_out: string; guest_name: string }) => ({
            check_in: b.check_in,
            check_out: b.check_out,
            guest_name: b.guest_name,
          })),
      );
    }
    if (blRes.ok) setBlocks(await blRes.json());
    setLoading(false);
  }, [selectedRoom]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const deleteBlock = async (id: string) => {
    if (!confirm('Ukloni blokadu?')) return;
    const res = await fetch('/api/admin/blocked-dates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showToast('Blokada uklonjena');
      fetchData();
    } else {
      showToast('Greška pri uklanjanju blokade', 'error');
    }
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const grid = getMonthGrid(year, month);
  const todayStr = formatYMD(today);

  const getDayState = (day: Date): 'booked' | 'blocked' | 'free' => {
    const d = formatYMD(day);
    if (blocks.some((b) => d >= b.check_in && d < b.check_out)) return 'blocked';
    if (bookings.some((b) => d >= b.check_in && d < b.check_out)) return 'booked';
    return 'free';
  };

  const getDayTooltip = (day: Date): string | undefined => {
    const d = formatYMD(day);
    const block = blocks.find((b) => d >= b.check_in && d < b.check_out);
    if (block) return `Blokada${block.reason ? ': ' + block.reason : ''}`;
    const booking = bookings.find((b) => d >= b.check_in && d < b.check_out);
    if (booking) return `Rezervacija: ${booking.guest_name}`;
    return undefined;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-serif font-semibold text-gray-900">Kalendar dostupnosti</h1>
            <p className="text-sm text-gray-500 mt-0.5">Pregled zauzetosti i upravljanje blokadama</p>
          </div>
          <button
            onClick={() => setShowAddBlock(true)}
            className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            Dodaj blokadu
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

        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <h2 className="font-semibold text-gray-800">
              {MONTHS_HR[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="text-center py-2 text-xs font-semibold text-gray-400 uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              Učitavanje...
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {grid.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="border-b border-r border-gray-50 min-h-[52px]" />;
                }
                const state = getDayState(day);
                const tooltip = getDayTooltip(day);
                const isToday = formatYMD(day) === todayStr;
                const isPast = day < today && !isToday;

                return (
                  <div
                    key={day.toISOString()}
                    title={tooltip}
                    className={clsx(
                      'border-b border-r border-gray-50 min-h-[52px] p-1.5 relative',
                      state === 'booked' && 'bg-primary/10',
                      state === 'blocked' && 'bg-red-50',
                      isPast && 'opacity-40',
                    )}
                  >
                    <span
                      className={clsx(
                        'w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold',
                        isToday && 'bg-primary text-white',
                        !isToday && state === 'free' && 'text-gray-700',
                        !isToday && state === 'booked' && 'text-primary',
                        !isToday && state === 'blocked' && 'text-red-600',
                      )}
                    >
                      {day.getDate()}
                    </span>
                    {state === 'booked' && (
                      <div className="mt-0.5 h-1 bg-primary/50 rounded-full mx-1" />
                    )}
                    {state === 'blocked' && (
                      <div className="mt-0.5 h-1 bg-red-300 rounded-full mx-1" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-6 px-6 py-3 border-t border-gray-100 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
              Rezervirano
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-200" />
              Blokirano
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-white border border-gray-200" />
              Slobodno
            </span>
          </div>
        </div>

        {/* Blocks list */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">
              Aktivne blokade — {rooms.find((r) => r.slug === selectedRoom)?.name}
            </h3>
          </div>
          {blocks.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">Nema aktivnih blokada</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {blocks.map((block) => (
                <div key={block.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {block.check_in} → {block.check_out}
                    </p>
                    {block.reason && <p className="text-xs text-gray-400 mt-0.5">{block.reason}</p>}
                  </div>
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    title="Ukloni blokadu"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddBlock && (
        <AddBlockModal
          roomSlug={selectedRoom}
          onClose={() => setShowAddBlock(false)}
          onSuccess={() => {
            setShowAddBlock(false);
            fetchData();
            showToast('Blokada dodana');
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ── Add Block Modal ──────────────────────────────────────────────

function AddBlockModal({
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
  const [form, setForm] = useState({ room_slug: roomSlug, check_in: '', check_out: '', reason: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/blocked-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
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
          <h2 className="font-serif text-lg font-semibold text-gray-900">Nova blokada</h2>
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
              <input type="date" required value={form.check_in}
                onChange={(e) => setForm((p) => ({ ...p, check_in: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Do *</label>
              <input type="date" required value={form.check_out}
                onChange={(e) => setForm((p) => ({ ...p, check_out: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Razlog (opcionalno)</label>
            <input type="text" value={form.reason} placeholder="Npr. Privatni boravak, Održavanje..."
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
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
              Dodaj blokadu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
