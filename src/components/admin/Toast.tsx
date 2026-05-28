'use client';

// Copied 1:1 from Villa-Jurina/src/components/admin/Toast.tsx
import { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import clsx from 'clsx';

export type ToastItem = {
  id: string;
  message: string;
  type: 'success' | 'error';
};

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <SingleToast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function SingleToast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3200);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={clsx(
        'pointer-events-auto flex items-center gap-3 pl-4 pr-3 py-3 rounded-xl shadow-xl',
        'text-sm font-medium min-w-[220px] max-w-sm',
        toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white',
      )}
    >
      {toast.type === 'success' ? (
        <CheckCircle2 size={17} className="shrink-0 text-green-400" />
      ) : (
        <XCircle size={17} className="shrink-0" />
      )}
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-1 opacity-50 hover:opacity-100 transition-opacity p-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
}
