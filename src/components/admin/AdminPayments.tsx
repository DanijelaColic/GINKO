'use client';

// Admin payments list with status/date filters.
// Shows payment_intents joined with booking guest info.
// Actions per row: generate/copy payment link.

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Copy, ExternalLink, RefreshCw,
  CheckCircle, XCircle, Clock, CreditCard, RotateCcw,
} from 'lucide-react';
import clsx from 'clsx';
import { centsToEur } from '@/modules/payments/payment.types';
import type { PaymentIntentStatus } from '@/modules/payments/payment.types';
import { ToastContainer, type ToastItem } from './Toast';

// ── Types ─────────────────────────────────────────────────────────

type BookingEmbed = {
  id: string;
  guest_name: string;
  guest_email: string;
  room_slug: string;
  check_in: string;
  check_out: string;
  deposit: number;
  total_price: number;
  deposit_paid: boolean;
  status: string;
};

type PaymentRow = {
  id: string;
  booking_id: string | null;
  provider_payment_id: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  booking: BookingEmbed | null;
};

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  requires_payment_method: 'Čeka uplatu',
  requires_confirmation:   'Na potvrdi',
  requires_action:         'Akcija',
  processing:              'Obrađuje se',
  requires_capture:        'Capture',
  cancelled:               'Otkazano',
  succeeded:               'Plaćeno',
};

const STATUS_COLORS: Record<string, string> = {
  requires_payment_method: 'text-amber-700 bg-amber-50',
  requires_confirmation:   'text-amber-700 bg-amber-50',
  requires_action:         'text-amber-700 bg-amber-50',
  processing:              'text-blue-700  bg-blue-50',
  requires_capture:        'text-blue-700  bg-blue-50',
  cancelled:               'text-gray-500  bg-gray-100',
  succeeded:               'text-green-700 bg-green-50',
};

function StatusBadge({ status }: { status: string }) {
  const icon =
    status === 'succeeded' ? <CheckCircle size={11} className="shrink-0" /> :
    status === 'cancelled' ? <XCircle size={11} className="shrink-0" /> :
    <Clock size={11} className="shrink-0" />;
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5',
      STATUS_COLORS[status] ?? 'text-gray-500 bg-gray-100',
    )}>
      {icon}
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

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

// ── Row action cell ───────────────────────────────────────────────

function PaymentActions({ row, onGenerated }: {
  row: PaymentRow;
  onGenerated: (rowId: string, url: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!row.booking_id) return <span className="text-xs text-gray-400">Nema rezervacije</span>;

  const generateLink = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/payments/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: row.booking_id }),
    });
    const data = await res.json() as { url?: string; error?: string };
    if (res.ok && data.url) {
      setUrl(data.url);
      onGenerated(row.id, data.url);
    }
    setLoading(false);
  };

  const copy = (u: string) => {
    navigator.clipboard.writeText(u).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={generateLink}
        disabled={loading}
        title={url ? 'Rekreiraj link' : 'Generiraj link'}
        className="flex items-center gap-1 text-xs border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
        {url ? 'Rekreiraj' : 'Link'}
      </button>
      {url && (
        <>
          <button
            onClick={() => copy(url)}
            className="flex items-center gap-1 text-xs border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full hover:border-primary hover:text-primary transition-colors"
          >
            <Copy size={10} />
            {copied ? 'OK!' : 'Kopiraj'}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full hover:border-primary hover:text-primary transition-colors"
          >
            <ExternalLink size={10} />
          </a>
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function AdminPayments() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const [reconciling, setReconciling] = useState(false);
  const { toasts, show, dismiss } = useToasts();

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterFrom)   params.set('from', filterFrom);
    if (filterTo)     params.set('to', filterTo);
    const res = await fetch(`/api/admin/payments?${params.toString()}`);
    if (res.ok) setRows(await res.json());
    else show('Greška pri dohvatu plaćanja', 'error');
    setLoading(false);
  }, [filterStatus, filterFrom, filterTo, show]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPayments();
  }, [fetchPayments]);

  const handleReconcile = useCallback(async () => {
    setReconciling(true);
    const res = await fetch('/api/admin/payments/reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json() as { checked?: number; repaired?: number; error?: string };
    if (res.ok) {
      show(`Usklađivanje završeno: ${data.repaired ?? 0} popravaka od ${data.checked ?? 0} zapisa`);
      await fetchPayments();
    } else {
      show(data.error ?? 'Greška usklađivanja', 'error');
    }
    setReconciling(false);
  }, [fetchPayments, show]);

  // Client-side search filter (by guest name / email / booking id)
  const search = filterSearch.toLowerCase();
  const visible = rows.filter((r) => {
    if (!search) return true;
    const b = r.booking;
    return (
      r.booking_id?.includes(search) ||
      r.provider_payment_id.toLowerCase().includes(search) ||
      b?.guest_name.toLowerCase().includes(search) ||
      b?.guest_email.toLowerCase().includes(search) ||
      b?.room_slug.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-serif font-semibold text-gray-900">Plaćanja</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Saferpay plaćanja · {visible.length} zapis{visible.length === 1 ? '' : 'a'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReconcile}
              disabled={reconciling || loading}
              title="Uskladi lokalni status sa Saferpay API-jem"
              className="flex items-center gap-2 text-sm border border-amber-200 text-amber-700 px-4 py-2 rounded-full hover:bg-amber-50 transition-colors disabled:opacity-50"
            >
              <RotateCcw size={14} className={clsx(reconciling && 'animate-spin')} />
              Uskladi
            </button>
            <button
              onClick={fetchPayments}
              disabled={loading}
              className="flex items-center gap-2 text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-full hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={clsx(loading && 'animate-spin')} />
              Osvježi
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3">
          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
          >
            <option value="">Svi statusi</option>
            <option value="succeeded">Plaćeno</option>
            <option value="requires_payment_method">Čeka uplatu</option>
            <option value="processing">Obrađuje se</option>
            <option value="cancelled">Otkazano</option>
          </select>

          {/* Date from */}
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            placeholder="Od datuma"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />

          {/* Date to */}
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            placeholder="Do datuma"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />

          {/* Search */}
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Pretraži gosta / ID..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary flex-1 min-w-40"
          />

          {(filterStatus || filterFrom || filterTo || filterSearch) && (
            <button
              onClick={() => {
                setFilterStatus(''); setFilterFrom('');
                setFilterTo(''); setFilterSearch('');
              }}
              className="text-xs text-gray-400 hover:text-gray-700 px-2 transition-colors"
            >
              Resetiraj
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={24} className="animate-spin mr-2" /> Učitavanje...
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <CreditCard size={32} className="mx-auto mb-3 opacity-30" />
            <p>Nema plaćanja</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Gost', 'Soba / Termin', 'Iznos', 'Status', 'Saferpay ID', 'Kreirano', 'Akcija'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {visible.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Guest */}
                      <td className="px-4 py-3">
                        {row.booking ? (
                          <div>
                            <div className="font-medium text-gray-800">{row.booking.guest_name}</div>
                            <div className="text-xs text-gray-400 truncate max-w-36">{row.booking.guest_email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Room / dates */}
                      <td className="px-4 py-3">
                        {row.booking ? (
                          <div>
                            <div className="text-gray-700 font-medium">{row.booking.room_slug}</div>
                            <div className="text-xs text-gray-400">
                              {row.booking.check_in} → {row.booking.check_out}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-800">
                        {centsToEur(row.amount).toFixed(2)} {row.currency.toUpperCase()}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>

                      {/* Saferpay ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-500 truncate block max-w-32">
                          {row.provider_payment_id}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(row.created_at).toLocaleDateString('hr-HR')}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <PaymentActions
                          row={row}
                          onGenerated={() => show('Link kreiran')}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
