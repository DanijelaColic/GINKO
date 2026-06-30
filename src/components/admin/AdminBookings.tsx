'use client';

// Copied from Villa-Jurina/src/components/admin/AdminDashboard.tsx
// Adaptations:
//   - apartments → rooms (from @/modules/rooms/rooms.config)
//   - b.apartment_slug → b.room_slug
//   - APT_NAMES → ROOM_NAMES
//   - calculatePrice import from @/modules/booking/dates
//   - Booking type from @/modules/booking/booking.types
//   - Cookie name updated to ginko_admin
//   - Removed "Villa Jurina" brand → "Ginko Sobe"
//   - Scoped to bookings only (nav lives in AdminNav)
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BookingPaymentPanel from './BookingPaymentPanel';
import {
  Plus,
  Check,
  X,
  Banknote,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  Loader2,
  Download,
  TableProperties,
  GanttChartSquare,
  Search,
  BarChart2,
  Mail,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import { rooms } from '@/modules/rooms/rooms.config';
import { formatDisplayDate, parseLocalDate, calculatePrice } from '@/modules/booking/dates';
import { DEPOSIT_PERCENT } from '@/modules/booking/booking.config';
import type { Booking } from '@/modules/booking/booking.types';
import BookingTimeline from './BookingTimeline';
import { ToastContainer, type ToastItem } from './Toast';

const MONTHS_HR_SHORT = [
  'Sij', 'Velj', 'Ožu', 'Tra', 'Svi', 'Lip',
  'Srp', 'Kol', 'Ruj', 'Lis', 'Stu', 'Pro',
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Na čekanju',
  confirmed: 'Potvrđeno',
  cancelled: 'Otkazano',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700 line-through',
};

const ROOM_NAMES = Object.fromEntries(rooms.map((r) => [r.slug, r.name]));

type SortKey = 'check_in' | 'created_at' | 'total_price';

function SortIcon({ k, sortKey, sortAsc }: { k: SortKey; sortKey: SortKey; sortAsc: boolean }) {
  if (sortKey !== k) return null;
  return sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
}

export default function AdminBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRoom, setFilterRoom] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('check_in');
  const [sortAsc, setSortAsc] = useState(false);
  const [view, setView] = useState<'table' | 'timeline'>('table');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMonthlyStats, setShowMonthlyStats] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/bookings');
    if (res.ok) setBookings(await res.json());
    setLoading(false);
  }, []);

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookings();
  }, [fetchBookings]);

  // Derived: remove stale selection IDs (from filtered/deleted bookings) on the fly
  const activeBookingIds = useMemo(() => new Set(bookings.map((b) => b.id)), [bookings]);

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    document.cookie = 'ginko_admin=; Max-Age=0; path=/';
    router.push('/admin/login');
    router.refresh();
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    setActionLoading(id);
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      if (updates.status === 'confirmed') showToast('Rezervacija potvrđena');
      else if (updates.status === 'cancelled') showToast('Rezervacija otkazana');
      else if ('deposit_paid' in updates)
        showToast(updates.deposit_paid ? 'Depozit označen kao plaćen' : 'Depozit označen kao neplaćen');
    } else {
      showToast('Greška pri ažuriranju', 'error');
    }
    await fetchBookings();
    setActionLoading(null);
  };

  const deleteBooking = async (id: string, name: string) => {
    if (!confirm(`Obriši rezervaciju gosta ${name}?`)) return;
    setActionLoading(id);
    const res = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
    if (res.ok) showToast(`Rezervacija za ${name} obrisana`);
    else showToast('Greška pri brisanju', 'error');
    await fetchBookings();
    setActionLoading(null);
  };

  const toggleBookingSelection = (id: string) => {
    setSelectedBookingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resendEmail = async (booking: Booking) => {
    setActionLoading(booking.id);
    const res = await fetch(`/api/admin/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _resend_email: true }),
    });
    if (res.ok) showToast(`Email poslan na ${booking.guest_email}`);
    else showToast('Greška pri slanju emaila', 'error');
    setActionLoading(null);
  };

  // Overlap detection
  const overlaps = useMemo(() => {
    const active = bookings.filter((b) => b.status !== 'cancelled');
    const conflicts: Array<{ a: Booking; b: Booking }> = [];
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i], b = active[j];
        if (a.room_slug !== b.room_slug) continue;
        if (a.check_in < b.check_out && b.check_in < a.check_out) {
          conflicts.push({ a, b });
        }
      }
    }
    return conflicts;
  }, [bookings]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  // eslint-disable-next-line react-hooks/purity
  const in14Str = useMemo(() => new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], []);
  const upcoming = bookings
    .filter((b) => b.status !== 'cancelled' && b.check_in >= todayStr && b.check_in <= in14Str)
    .sort((a, b) => a.check_in.localeCompare(b.check_in));

  const currentYear = new Date().getFullYear();
  const daysInYear = new Date(currentYear, 1, 29).getDate() === 29 ? 366 : 365;

  const monthlyStats = useMemo(() => {
    return Array.from({ length: 12 }, (_, month) => {
      const relevant = bookings.filter((b) => {
        if (b.status === 'cancelled') return false;
        const year = parseInt(b.check_in.slice(0, 4));
        const m = parseInt(b.check_in.slice(5, 7)) - 1;
        return year === currentYear && m === month;
      });
      return {
        month,
        bookings: relevant.length,
        nights: relevant.reduce((s, b) => s + b.nights, 0),
        revenue: relevant.reduce((s, b) => s + b.total_price, 0),
      };
    });
  }, [bookings, currentYear]);

  const occupancy = useMemo(() => {
    return rooms.map((room) => {
      const bookedNights = bookings
        .filter((b) => b.room_slug === room.slug && b.status !== 'cancelled')
        .filter((b) => parseInt(b.check_in.slice(0, 4)) === currentYear)
        .reduce((s, b) => s + b.nights, 0);
      return {
        name: room.name,
        bookedNights,
        pct: Math.min(100, Math.round((bookedNights / daysInYear) * 100)),
      };
    });
  }, [bookings, currentYear, daysInYear]);

  const filtered = bookings
    .filter((b) => !filterRoom || b.room_slug === filterRoom)
    .filter((b) => !filterStatus || b.status === filterStatus)
    .filter((b) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.guest_name.toLowerCase().includes(q) ||
        b.guest_email.toLowerCase().includes(q) ||
        (b.guest_phone ?? '').toLowerCase().includes(q)
      );
    })
    .filter((b) => {
      if (!filterDateFrom && !filterDateTo) return true;
      if (filterDateFrom && filterDateTo)
        return b.check_in <= filterDateTo && b.check_out > filterDateFrom;
      if (filterDateFrom) return b.check_out > filterDateFrom;
      if (filterDateTo) return b.check_in <= filterDateTo;
      return true;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      return sortAsc ? (av < bv ? -1 : 1) : av > bv ? -1 : 1;
    });

  const filteredIds = filtered.map((b) => b.id);
  // Only count selections that still correspond to active (non-deleted) bookings
  const selectedFilteredCount = filteredIds.filter(
    (id) => selectedBookingIds.has(id) && activeBookingIds.has(id),
  ).length;
  const allFilteredSelected = filtered.length > 0 && selectedFilteredCount === filtered.length;

  const stats = {
    total: bookings.filter((b) => b.status !== 'cancelled').length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    revenue: bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((s, b) => s + b.total_price, 0),
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const exportCSV = () => {
    const headers = [
      'Soba', 'Gost', 'Email', 'Telefon', 'Check-in', 'Check-out',
      'Noći', 'Odrasli', 'Djeca', 'Ukupno (€)', 'Depozit (€)', 'Depozit plaćen',
      'Status', 'Napomena', 'Kreirano',
    ];
    const rows = filtered.map((b) => [
      ROOM_NAMES[b.room_slug] ?? b.room_slug,
      b.guest_name, b.guest_email, b.guest_phone ?? '',
      b.check_in, b.check_out, b.nights, b.adults, b.children,
      b.total_price, b.deposit, b.deposit_paid ? 'Da' : 'Ne',
      STATUS_LABELS[b.status] ?? b.status, b.notes ?? '',
      new Date(b.created_at).toLocaleDateString('hr-HR'),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rezervacije-ginko-${todayStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectAllFiltered = () => {
    setSelectedBookingIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const deleteSelectedBookings = async () => {
    if (selectedFilteredCount === 0) return;
    if (!confirm(`Obriši ${selectedFilteredCount} odabranih rezervacija?`)) return;
    setBulkDeleteLoading(true);
    const idsToDelete = filteredIds.filter((id) => selectedBookingIds.has(id));
    const res = await fetch('/api/admin/bookings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: idsToDelete }),
    });
    if (res.ok) {
      showToast(`Obrisano ${idsToDelete.length} rezervacija`);
      setSelectedBookingIds((prev) => {
        const next = new Set(prev);
        idsToDelete.forEach((id) => next.delete(id));
        return next;
      });
      await fetchBookings();
    } else {
      showToast('Greška pri grupnom brisanju', 'error');
    }
    setBulkDeleteLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-primary text-white px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-lg font-semibold">Ginko Sobe</h1>
          <span className="text-white/50 text-sm hidden sm:inline">Rezervacije</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/10 rounded-full p-0.5">
            <button
              onClick={() => setView('table')}
              title="Tablica"
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                view === 'table' ? 'bg-white text-primary' : 'text-white/70 hover:text-white',
              )}
            >
              <TableProperties size={14} />
              <span className="hidden sm:inline">Tablica</span>
            </button>
            <button
              onClick={() => setView('timeline')}
              title="Timeline"
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                view === 'timeline' ? 'bg-white text-primary' : 'text-white/70 hover:text-white',
              )}
            >
              <GanttChartSquare size={14} />
              <span className="hidden sm:inline">Timeline</span>
            </button>
          </div>
          <button
            onClick={fetchBookings}
            className="text-white/70 hover:text-white p-1.5 rounded-full transition-colors"
            title="Osvježi"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Nova rezervacija</span>
          </button>
          <button
            onClick={handleLogout}
            className="text-white/70 hover:text-white flex items-center gap-1.5 text-sm transition-colors"
          >
            <span className="hidden sm:inline">Odjava</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Ukupno rezervacija', value: stats.total, color: 'text-primary' },
            { label: 'Na čekanju', value: stats.pending, color: 'text-yellow-600' },
            { label: 'Potvrđeno', value: stats.confirmed, color: 'text-green-600' },
            { label: 'Prihod', value: `${stats.revenue.toLocaleString('hr-HR')}€`, color: 'text-emerald-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={clsx('text-2xl font-bold', color)}>{value}</p>
            </div>
          ))}
        </div>

        {/* Overlap warning */}
        {overlaps.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700 mb-1">
                  {overlaps.length === 1
                    ? 'Pronađeno 1 preklapanje rezervacija!'
                    : `Pronađeno ${overlaps.length} preklapanja rezervacija!`}
                </p>
                <ul className="space-y-1">
                  {overlaps.map(({ a, b }, i) => (
                    <li key={i} className="text-xs text-red-600">
                      <span className="font-semibold">{ROOM_NAMES[a.room_slug]}</span>
                      {' — '}
                      {a.guest_name} ({a.check_in} → {a.check_out})
                      {' ⟺ '}
                      {b.guest_name} ({b.check_in} → {b.check_out})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Monthly stats — collapsible */}
        <div className="mb-6 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowMonthlyStats((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <BarChart2 size={16} className="text-primary" />
              Statistike {currentYear}
            </span>
            <ChevronRight
              size={16}
              className={clsx('text-gray-400 transition-transform', showMonthlyStats && 'rotate-90')}
            />
          </button>

          {showMonthlyStats && (
            <div className="border-t border-gray-100 px-5 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Zauzetost (noći / {daysInYear})
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {occupancy.map((o) => (
                  <div key={o.name} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-gray-700">{o.name}</span>
                      <span className="text-xs font-bold text-primary">{o.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${o.pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{o.bookedNights} noći</p>
                  </div>
                ))}
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Prihod po mjesecu
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase">
                      <th className="text-left pb-2 font-medium">Mjesec</th>
                      <th className="text-center pb-2 font-medium">Rez.</th>
                      <th className="text-center pb-2 font-medium">Noći</th>
                      <th className="text-right pb-2 font-medium">Prihod</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {monthlyStats
                      .filter((m) => m.revenue > 0)
                      .map((m) => (
                        <tr key={m.month} className="hover:bg-gray-50">
                          <td className="py-1.5 font-medium text-gray-700">
                            {MONTHS_HR_SHORT[m.month]}
                          </td>
                          <td className="py-1.5 text-center text-gray-500">{m.bookings}</td>
                          <td className="py-1.5 text-center text-gray-500">{m.nights}</td>
                          <td className="py-1.5 text-right font-semibold text-gray-900">
                            {m.revenue.toLocaleString('hr-HR')}€
                          </td>
                        </tr>
                      ))}
                    {monthlyStats.every((m) => m.revenue === 0) && (
                      <tr>
                        <td colSpan={4} className="py-3 text-center text-gray-400 text-xs">
                          Nema potvrđenih rezervacija za {currentYear}.
                        </td>
                      </tr>
                    )}
                    {monthlyStats.some((m) => m.revenue > 0) && (
                      <tr className="border-t border-gray-200 font-semibold">
                        <td className="pt-2 text-gray-700">Ukupno</td>
                        <td className="pt-2 text-center text-gray-700">
                          {monthlyStats.reduce((s, m) => s + m.bookings, 0)}
                        </td>
                        <td className="pt-2 text-center text-gray-700">
                          {monthlyStats.reduce((s, m) => s + m.nights, 0)}
                        </td>
                        <td className="pt-2 text-right text-primary">
                          {monthlyStats.reduce((s, m) => s + m.revenue, 0).toLocaleString('hr-HR')}€
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Timeline view */}
        {view === 'timeline' && (
          <BookingTimeline bookings={bookings} onEditBooking={(b) => setEditingBooking(b)} />
        )}

        {/* Table view */}
        {view === 'table' && (
          <>
            {/* Upcoming stays */}
            {upcoming.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Predstojeći boravci — sljedećih 14 dana
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {upcoming.map((b) => {
                    const daysUntil = Math.round(
                      (new Date(b.check_in).getTime() - new Date(todayStr).getTime()) / 86400000,
                    );
                    return (
                      <div
                        key={b.id}
                        className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm flex items-start gap-3"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{b.guest_name}</p>
                          <p className="text-xs text-primary font-medium">
                            {ROOM_NAMES[b.room_slug] ?? b.room_slug}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDisplayDate(parseLocalDate(b.check_in))} · {b.nights} noći
                            {daysUntil === 0 && (
                              <span className="ml-1.5 text-orange-600 font-semibold">danas!</span>
                            )}
                            {daysUntil === 1 && (
                              <span className="ml-1.5 text-yellow-600 font-semibold">sutra</span>
                            )}
                            {daysUntil > 1 && (
                              <span className="ml-1.5 text-gray-400">za {daysUntil} dana</span>
                            )}
                          </p>
                        </div>
                        <span
                          className={clsx(
                            'ml-auto text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
                            STATUS_COLORS[b.status],
                          )}
                        >
                          {STATUS_LABELS[b.status]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
              <div className="relative mb-3">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pretraži po imenu, emailu ili telefonu..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Filter size={16} className="text-gray-400 shrink-0" />
                <select
                  value={filterRoom}
                  onChange={(e) => setFilterRoom(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">Sve sobe</option>
                  {rooms.map((r) => (
                    <option key={r.slug} value={r.slug}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">Svi statusi</option>
                  <option value="pending">Na čekanju</option>
                  <option value="confirmed">Potvrđeno</option>
                  <option value="cancelled">Otkazano</option>
                </select>

                <span className="hidden sm:block text-gray-200 text-lg">|</span>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 shrink-0">Period:</span>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                  />
                  <span className="text-gray-300 text-xs">—</span>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                  />
                  {(filterDateFrom || filterDateTo) && (
                    <button
                      onClick={() => {
                        setFilterDateFrom('');
                        setFilterDateTo('');
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-sm text-gray-400">
                    {filtered.length} / {bookings.length}
                  </span>
                  <button
                    onClick={deleteSelectedBookings}
                    disabled={selectedFilteredCount === 0 || bulkDeleteLoading}
                    className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">
                      {bulkDeleteLoading
                        ? 'Brišem...'
                        : `Briši odabrane (${selectedFilteredCount})`}
                    </span>
                  </button>
                  <button
                    onClick={exportCSV}
                    disabled={filtered.length === 0}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary border border-gray-200 hover:border-primary rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile card view */}
            {!loading && filtered.length > 0 && (
              <div className="sm:hidden space-y-3 mb-4">
                {filtered.map((booking) => (
                  <div
                    key={booking.id}
                    className={clsx(
                      'bg-white rounded-xl border border-gray-100 shadow-sm p-4',
                      booking.status === 'cancelled' && 'opacity-60',
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-primary">
                        {ROOM_NAMES[booking.room_slug] ?? booking.room_slug}
                      </span>
                      <span
                        className={clsx(
                          'text-xs px-2.5 py-0.5 rounded-full font-medium',
                          STATUS_COLORS[booking.status],
                        )}
                      >
                        {STATUS_LABELS[booking.status]}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{booking.guest_name}</p>
                    {booking.guest_email && (
                      <p className="text-xs text-gray-400 mb-2">{booking.guest_email}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 mb-3">
                      <div className="text-xs text-gray-600">
                        <span>{booking.check_in}</span>
                        <span className="mx-1 text-gray-300">→</span>
                        <span>{booking.check_out}</span>
                        <span className="ml-1.5 text-gray-400">· {booking.nights} noći</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{booking.total_price}€</span>
                    </div>
                    <button
                      onClick={() =>
                        updateBooking(booking.id, { deposit_paid: !booking.deposit_paid })
                      }
                      disabled={actionLoading === booking.id}
                      className={clsx(
                        'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium mb-3 transition-colors',
                        booking.deposit_paid
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500',
                      )}
                    >
                      <Banknote size={12} />
                      {booking.deposit_paid ? 'Depozit plaćen' : 'Depozit nije plaćen'}
                    </button>
                    <div className="flex items-center gap-2 flex-wrap border-t border-gray-50 pt-3">
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => updateBooking(booking.id, { status: 'confirmed' })}
                          disabled={actionLoading === booking.id}
                          className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg"
                        >
                          <Check size={13} /> Potvrdi
                        </button>
                      )}
                      {booking.status !== 'cancelled' && (
                        <button
                          onClick={() => updateBooking(booking.id, { status: 'cancelled' })}
                          disabled={actionLoading === booking.id}
                          className="flex items-center gap-1 text-xs bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg"
                        >
                          <X size={13} /> Otkaži
                        </button>
                      )}
                      <button
                        onClick={() => setEditingBooking(booking)}
                        className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg"
                      >
                        <Pencil size={13} /> Uredi
                      </button>
                      <button
                        onClick={() => deleteBooking(booking.id, booking.guest_name)}
                        disabled={actionLoading === booking.id}
                        className="flex items-center gap-1 text-xs bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-lg ml-auto"
                      >
                        <Trash2 size={13} /> Briši
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Desktop table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                  <Loader2 size={24} className="animate-spin mr-2" />
                  Učitavanje...
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-lg mb-1">Nema rezervacija</p>
                  <p className="text-sm">Dodajte prvu rezervaciju klikom na &quot;Nova rezervacija&quot;</p>
                </div>
              ) : (
                <div className="overflow-x-auto sm:block hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-center px-3 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">
                          <input
                            type="checkbox"
                            checked={allFilteredSelected}
                            onChange={toggleSelectAllFiltered}
                            aria-label="Odaberi sve filtrirane rezervacije"
                            className="h-4 w-4 accent-primary cursor-pointer"
                          />
                        </th>
                        <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">
                          Soba
                        </th>
                        <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">
                          Gost
                        </th>
                        <th
                          className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide cursor-pointer hover:text-primary select-none"
                          onClick={() => toggleSort('check_in')}
                        >
                          <span className="flex items-center gap-1">
                            Check-in{' '}
                            <SortIcon k="check_in" sortKey={sortKey} sortAsc={sortAsc} />
                          </span>
                        </th>
                        <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">
                          Check-out
                        </th>
                        <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">
                          Noći
                        </th>
                        <th
                          className="text-right px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide cursor-pointer hover:text-primary select-none"
                          onClick={() => toggleSort('total_price')}
                        >
                          <span className="flex items-center justify-end gap-1">
                            Ukupno{' '}
                            <SortIcon k="total_price" sortKey={sortKey} sortAsc={sortAsc} />
                          </span>
                        </th>
                        <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">
                          Depozit
                        </th>
                        <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">
                          Status
                        </th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((booking) => (
                        <>
                          <tr
                            key={booking.id}
                            className={clsx(
                              'hover:bg-gray-50 transition-colors',
                              booking.status === 'cancelled' && 'opacity-50',
                            )}
                          >
                            <td className="px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={selectedBookingIds.has(booking.id)}
                                onChange={() => toggleBookingSelection(booking.id)}
                                aria-label={`Odaberi rezervaciju ${booking.guest_name}`}
                                className="h-4 w-4 accent-primary cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 font-medium text-primary">
                              {ROOM_NAMES[booking.room_slug] ?? booking.room_slug}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">{booking.guest_name}</p>
                              <p className="text-xs text-gray-400">{booking.guest_email}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {formatDisplayDate(parseLocalDate(booking.check_in))}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {formatDisplayDate(parseLocalDate(booking.check_out))}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">
                              {booking.nights}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {booking.total_price}€
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() =>
                                  updateBooking(booking.id, { deposit_paid: !booking.deposit_paid })
                                }
                                disabled={actionLoading === booking.id}
                                className={clsx(
                                  'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-colors',
                                  booking.deposit_paid
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                                )}
                              >
                                <Banknote size={12} />
                                {booking.deposit_paid ? 'Plaćen' : 'Nije'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={clsx(
                                  'text-xs px-2.5 py-1 rounded-full font-medium',
                                  STATUS_COLORS[booking.status],
                                )}
                              >
                                {STATUS_LABELS[booking.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 justify-end">
                                {booking.status === 'pending' && (
                                  <button
                                    onClick={() =>
                                      updateBooking(booking.id, { status: 'confirmed' })
                                    }
                                    disabled={actionLoading === booking.id}
                                    title="Potvrdi rezervaciju"
                                    className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                                  >
                                    <Check size={15} />
                                  </button>
                                )}
                                {booking.status !== 'cancelled' && (
                                  <button
                                    onClick={() =>
                                      updateBooking(booking.id, { status: 'cancelled' })
                                    }
                                    disabled={actionLoading === booking.id}
                                    title="Otkaži rezervaciju"
                                    className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 transition-colors"
                                  >
                                    <X size={15} />
                                  </button>
                                )}
                                <button
                                  onClick={() => setEditingBooking(booking)}
                                  title="Uredi rezervaciju"
                                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() =>
                                    setExpandedId(expandedId === booking.id ? null : booking.id)
                                  }
                                  title="Detalji"
                                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                                >
                                  <ChevronDown
                                    size={15}
                                    className={clsx(
                                      'transition-transform',
                                      expandedId === booking.id && 'rotate-180',
                                    )}
                                  />
                                </button>
                                <button
                                  onClick={() => deleteBooking(booking.id, booking.guest_name)}
                                  disabled={actionLoading === booking.id}
                                  title="Obriši"
                                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {expandedId === booking.id && (
                            <tr key={`${booking.id}-expanded`} className="bg-blue-50/30">
                              <td colSpan={10} className="px-4 py-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Telefon</p>
                                    <p className="text-gray-700">{booking.guest_phone ?? '—'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Gosti</p>
                                    <p className="text-gray-700">
                                      {booking.adults} odraslih, {booking.children} djece
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Depozit iznos</p>
                                    <p className="text-gray-700">{booking.deposit}€</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Kreirano</p>
                                    <p className="text-gray-700">
                                      {new Date(booking.created_at).toLocaleDateString('hr-HR')}
                                    </p>
                                  </div>
                                  {booking.notes && (
                                    <div className="col-span-2 sm:col-span-4">
                                      <p className="text-xs text-gray-400 mb-0.5">Napomena</p>
                                      <p className="text-gray-700">{booking.notes}</p>
                                    </div>
                                  )}
                                  {booking.status === 'confirmed' && booking.guest_email && (
                                    <div className="col-span-2 sm:col-span-4 pt-1">
                                      <button
                                        onClick={() => resendEmail(booking)}
                                        disabled={actionLoading === booking.id}
                                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                                      >
                                        <Mail size={13} />
                                        Pošalji potvrdu ponovo
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!loading && filtered.length === 0 && (
                <div className="hidden sm:block text-center py-16 text-gray-400">
                  <p className="text-lg mb-1">Nema rezervacija</p>
                  <p className="text-sm">
                    Dodajte prvu rezervaciju klikom na &quot;Nova rezervacija&quot;
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showAddForm && (
        <AddBookingModal
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            fetchBookings();
            showToast('Rezervacija dodana');
          }}
        />
      )}

      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSuccess={() => {
            setEditingBooking(null);
            fetchBookings();
            showToast('Rezervacija ažurirana');
          }}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ── Price preview ────────────────────────────────────────────────

function PricePreview({
  roomSlug,
  checkIn,
  checkOut,
}: {
  roomSlug: string;
  checkIn: string;
  checkOut: string;
}) {
  const priceData = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    const room = rooms.find((r) => r.slug === roomSlug);
    if (!room) return null;
    const ci = parseLocalDate(checkIn);
    const co = parseLocalDate(checkOut);
    if (co <= ci) return null;
    return calculatePrice(ci, co, room);
  }, [roomSlug, checkIn, checkOut]);

  if (!priceData) return null;

  return (
    <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm">
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-500">{priceData.nights} noći</span>
        <span className="font-bold text-primary text-base">{priceData.totalPrice}€</span>
      </div>
      {priceData.lines.map((l) => (
        <div key={l.label} className="flex justify-between text-xs text-gray-500">
          <span>
            {l.nights}× {l.label} · {l.pricePerNight}€/noć
          </span>
          <span>{l.subtotal}€</span>
        </div>
      ))}
      <div className="flex justify-between text-xs text-gray-500 mt-1 pt-1 border-t border-blue-100">
        <span>Depozit ({Math.round(DEPOSIT_PERCENT * 100)}%)</span>
        <span className="font-medium">{priceData.deposit}€</span>
      </div>
    </div>
  );
}

// ── Add Booking Modal ────────────────────────────────────────────

type ModalProps = { onClose: () => void; onSuccess: () => void };

function AddBookingModal({ onClose, onSuccess }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const [form, setForm] = useState({
    room_slug: rooms.find((r) => !r.fullyBooked)?.slug ?? '',
    check_in: '',
    check_out: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    adults: '2',
    children: '0',
    status: 'confirmed',
    deposit_paid: false,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, adults: parseInt(form.adults), children: parseInt(form.children) }),
    });
    if (res.ok) onSuccess();
    else {
      const d = await res.json();
      setError(d.error ?? 'Greška');
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-serif text-lg font-semibold text-gray-900">Nova rezervacija</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Soba</label>
              <select
                name="room_slug"
                value={form.room_slug}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white"
              >
                {rooms.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Check-in *</label>
              <input
                type="date"
                name="check_in"
                value={form.check_in}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Check-out *</label>
              <input
                type="date"
                name="check_out"
                value={form.check_out}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <PricePreview roomSlug={form.room_slug} checkIn={form.check_in} checkOut={form.check_out} />

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Ime i prezime *</label>
              <input
                type="text"
                name="guest_name"
                value={form.guest_name}
                onChange={handleChange}
                required
                placeholder="Ana Horvat"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                name="guest_email"
                value={form.guest_email}
                onChange={handleChange}
                placeholder="ana@email.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
              <input
                type="tel"
                name="guest_phone"
                value={form.guest_phone}
                onChange={handleChange}
                placeholder="+385..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Odrasli</label>
              <input
                type="number"
                name="adults"
                value={form.adults}
                onChange={handleChange}
                min="1"
                max="10"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Djeca</label>
              <input
                type="number"
                name="children"
                value={form.children}
                onChange={handleChange}
                min="0"
                max="10"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white"
              >
                <option value="confirmed">Potvrđeno</option>
                <option value="pending">Na čekanju</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                name="deposit_paid"
                id="add_deposit_paid"
                checked={form.deposit_paid}
                onChange={handleChange}
                className="accent-primary"
              />
              <label htmlFor="add_deposit_paid" className="text-sm text-gray-700 cursor-pointer">
                Depozit plaćen
              </label>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Napomena</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-full text-sm hover:bg-gray-50 transition-colors"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:opacity-90 text-white py-2.5 rounded-full text-sm font-medium transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Spremi rezervaciju
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Booking Modal ───────────────────────────────────────────

type EditModalProps = { booking: Booking; onClose: () => void; onSuccess: () => void };

function EditBookingModal({ booking, onClose, onSuccess }: EditModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const [form, setForm] = useState({
    room_slug: booking.room_slug,
    check_in: booking.check_in,
    check_out: booking.check_out,
    guest_name: booking.guest_name,
    guest_email: booking.guest_email,
    guest_phone: booking.guest_phone ?? '',
    adults: String(booking.adults),
    children: String(booking.children),
    status: booking.status,
    deposit_paid: booking.deposit_paid,
    notes: booking.notes ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch(`/api/admin/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        adults: parseInt(form.adults),
        children: parseInt(form.children),
        guest_phone: form.guest_phone || null,
        notes: form.notes || null,
      }),
    });

    if (res.ok) {
      onSuccess();
    } else {
      const d = await res.json();
      setError(d.error ?? 'Greška pri spremanju');
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-serif text-lg font-semibold text-gray-900">Uredi rezervaciju</h2>
            <p className="text-xs text-gray-400 mt-0.5">{booking.guest_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Soba</label>
              <select
                name="room_slug"
                value={form.room_slug}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white"
              >
                {rooms.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Check-in *</label>
              <input
                type="date"
                name="check_in"
                value={form.check_in}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Check-out *</label>
              <input
                type="date"
                name="check_out"
                value={form.check_out}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <PricePreview roomSlug={form.room_slug} checkIn={form.check_in} checkOut={form.check_out} />

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Ime i prezime *</label>
              <input
                type="text"
                name="guest_name"
                value={form.guest_name}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                name="guest_email"
                value={form.guest_email}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
              <input
                type="tel"
                name="guest_phone"
                value={form.guest_phone}
                onChange={handleChange}
                placeholder="+385..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Odrasli</label>
              <input
                type="number"
                name="adults"
                value={form.adults}
                onChange={handleChange}
                min="1"
                max="10"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Djeca</label>
              <input
                type="number"
                name="children"
                value={form.children}
                onChange={handleChange}
                min="0"
                max="10"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white"
              >
                <option value="pending">Na čekanju</option>
                <option value="confirmed">Potvrđeno</option>
                <option value="cancelled">Otkazano</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                name="deposit_paid"
                id="edit_deposit_paid"
                checked={form.deposit_paid}
                onChange={handleChange}
                className="accent-primary"
              />
              <label htmlFor="edit_deposit_paid" className="text-sm text-gray-700 cursor-pointer">
                Depozit plaćen
              </label>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Napomena</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Stripe payment info */}
          <BookingPaymentPanel bookingId={booking.id} depositEur={booking.deposit} />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-full text-sm hover:bg-gray-50 transition-colors"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:opacity-90 text-white py-2.5 rounded-full text-sm font-medium transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Spremi promjene
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
