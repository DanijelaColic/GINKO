'use client';

// Payment status panel rendered inside EditBookingModal.

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Copy, ExternalLink, RefreshCw, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { centsToEur } from '@/modules/payments/payment.types';
import type { PaymentIntentStatus } from '@/modules/payments/payment.types';

type PaymentRecord = {
  id: string;
  provider_payment_id: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

// ── Status helpers ────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  requires_payment_method: 'Čeka uplatu',
  requires_confirmation:   'Potvrda na čekanju',
  requires_action:         'Akcija potrebna',
  processing:              'Obrađuje se',
  requires_capture:        'Capture potreban',
  cancelled:               'Otkazano',
  succeeded:               'Plaćeno',
};

const STATUS_COLORS: Record<string, string> = {
  requires_payment_method: 'text-amber-700 bg-amber-50 border-amber-200',
  requires_confirmation:   'text-amber-700 bg-amber-50 border-amber-200',
  requires_action:         'text-amber-700 bg-amber-50 border-amber-200',
  processing:              'text-blue-700  bg-blue-50  border-blue-200',
  requires_capture:        'text-blue-700  bg-blue-50  border-blue-200',
  cancelled:               'text-gray-600  bg-gray-50  border-gray-200',
  succeeded:               'text-green-700 bg-green-50 border-green-200',
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'succeeded') return <CheckCircle size={13} className="shrink-0" />;
  if (status === 'cancelled') return <XCircle size={13} className="shrink-0" />;
  return <Clock size={13} className="shrink-0" />;
}

// ── Main panel ────────────────────────────────────────────────────

type Props = {
  bookingId: string;
  /** Deposit amount in EUR (from booking.deposit) */
  depositEur: number;
};

export default function BookingPaymentPanel({ bookingId, depositEur }: Props) {
  const [record, setRecord] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Refund state
  const [showRefund, setShowRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refunding, setRefunding] = useState(false);
  const [refundResult, setRefundResult] = useState<string | null>(null);

  const fetchPayment = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/payments?bookingId=${bookingId}`);
    if (res.ok) {
      const list = (await res.json()) as PaymentRecord[];
      setRecord(list[0] ?? null); // latest
    }
    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPayment();
  }, [fetchPayment]);

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    setError(null);
    const res = await fetch('/api/admin/payments/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    });
    const data = await res.json() as { url?: string; error?: string };
    if (res.ok && data.url) {
      setGeneratedUrl(data.url);
      await fetchPayment(); // refresh status
    } else {
      setError(data.error ?? 'Greška pri kreiranju linka');
    }
    setGeneratingLink(false);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleRefund = async () => {
    if (!record) return;
    setRefunding(true);
    setRefundResult(null);
    setError(null);

    const amtCents = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined;
    const res = await fetch('/api/admin/payments/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentIntentId: record.id,
        amountCents: amtCents,
        reason: 'requested_by_customer',
      }),
    });
    const data = await res.json() as { ok?: boolean; note?: string; providerRefundId?: string; amountCents?: number; error?: string };
    if (res.ok && data.ok) {
      const amtStr = data.amountCents ? ` (${(data.amountCents / 100).toFixed(2)} EUR)` : '';
      setRefundResult(`Povrat uspješan${amtStr} · ID: ${data.providerRefundId ?? ''}`);
      setRefundAmount('');
      setShowRefund(false);
      await fetchPayment();
    } else {
      setError(data.error ?? data.note ?? 'Greška pri povratu');
    }
    setRefunding(false);
  };

  const activeUrl = generatedUrl;

  return (
    <div className="border-t border-gray-100 pt-4 mt-1">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Worldline plaćanje
        </h3>
        <button
          onClick={fetchPayment}
          disabled={loading}
          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          title="Osvježi"
        >
          <RefreshCw size={12} className={clsx(loading && 'animate-spin')} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
          <Loader2 size={12} className="animate-spin" /> Učitavanje...
        </div>
      ) : record ? (
        <div className="space-y-2.5 text-sm">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2.5 py-0.5',
                STATUS_COLORS[record.status] ?? 'text-gray-600 bg-gray-50 border-gray-200',
              )}
            >
              <StatusIcon status={record.status} />
              {STATUS_LABELS[record.status] ?? record.status}
            </span>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <span className="text-gray-400">Iznos depozita</span>
              <div className="font-semibold text-gray-800 mt-0.5">
                {depositEur} €
              </div>
            </div>
            <div>
              <span className="text-gray-400">Iznos transakcije</span>
              <div className="font-semibold text-gray-800 mt-0.5">
                {centsToEur(record.amount).toFixed(2)} {record.currency.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Worldline ID */}
          <div className="text-xs">
            <span className="text-gray-400">Worldline ID</span>
            <div className="font-mono text-gray-700 mt-0.5 truncate text-xs">
              {record.provider_payment_id}
            </div>
          </div>

          {/* Created */}
          <div className="text-xs text-gray-400">
            Kreirano: {new Date(record.created_at).toLocaleString('hr-HR')}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 py-1">Nema aktivnog plaćanja za ovu rezervaciju.</p>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-2">{error}</p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={handleGenerateLink}
          disabled={generatingLink}
          className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generatingLink
            ? <Loader2 size={11} className="animate-spin" />
            : <RefreshCw size={11} />}
          {record ? 'Rekreiraj link' : 'Generiraj link'}
        </button>

        {activeUrl && (
          <>
            <button
              onClick={() => copyUrl(activeUrl)}
              className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:border-primary hover:text-primary transition-colors"
            >
              <Copy size={11} />
              {copyFeedback ? 'Kopirano!' : 'Kopiraj link'}
            </button>
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:border-primary hover:text-primary transition-colors"
            >
              <ExternalLink size={11} /> Otvori
            </a>
          </>
        )}

        {/* Refund — only for succeeded payments */}
        {record?.status === 'succeeded' && (
          <button
            onClick={() => setShowRefund((v) => !v)}
            className="flex items-center gap-1.5 text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors"
          >
            <RotateCcw size={11} />
            Povrat
          </button>
        )}
      </div>

      {/* Refund success note */}
      {refundResult && (
        <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mt-2">
          ✓ {refundResult}
        </p>
      )}

      {/* Inline refund form */}
      {showRefund && record?.status === 'succeeded' && (
        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl space-y-2">
          <p className="text-xs font-semibold text-red-700">Povrat plaćanja</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              max={(record.amount / 100).toFixed(2)}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder={`Max ${(record.amount / 100).toFixed(2)} € (prazno = puni povrat)`}
              className="flex-1 border border-red-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-red-400 bg-white"
            />
            <button
              onClick={handleRefund}
              disabled={refunding}
              className="flex items-center gap-1 text-xs bg-red-600 text-white px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {refunding ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />}
              Potvrdi
            </button>
            <button
              onClick={() => { setShowRefund(false); setRefundAmount(''); }}
              className="text-xs text-gray-400 hover:text-gray-700 px-2"
            >
              Odustani
            </button>
          </div>
          <p className="text-xs text-red-500">
            Ova akcija je ireverzibilna. Prazno polje = puni povrat depozita.
          </p>
        </div>
      )}
    </div>
  );
}
