'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { bookingReference } from '@/modules/booking/booking.config';

type AlertRow = {
  id: string;
  booking_id: string | null;
  kind: string;
  message: string;
  created_at: string;
};

export default function PaymentHoldAlertsBanner() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch('/api/admin/payments/hold-alerts');
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as AlertRow[];
      if (!cancelled) setAlerts(Array.isArray(data) ? data : []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl px-5 py-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-orange-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-orange-900">
            Zakašnjelo plaćanje traži pregled
          </p>
          <ul className="mt-2 space-y-2">
            {alerts.slice(0, 8).map((alert) => (
              <li key={alert.id} className="text-xs text-orange-900/90">
                {alert.booking_id ? (
                  <span className="font-mono font-semibold">
                    {bookingReference(alert.booking_id)}{' '}
                  </span>
                ) : null}
                {alert.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
