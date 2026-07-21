'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import {
  MAX_ADULTS,
  MAX_CHILD_AGE,
  MAX_CHILDREN,
  resizeChildAges,
} from '@/modules/booking/guest-occupancy';

type Props = {
  adults: number;
  children: number;
  childAges: Array<number | null>;
  onAdultsChange: (n: number) => void;
  onChildrenChange: (n: number) => void;
  onChildAgesChange: (ages: Array<number | null>) => void;
  className?: string;
  labels?: {
    adults?: string;
    children?: string;
    guests?: string;
    childAge?: string;
    childAgeNeeded?: string;
    agesHint?: string;
    done?: string;
  };
};

function Stepper({
  value,
  min,
  max,
  onChange,
  ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="inline-flex items-center border border-stone rounded-lg overflow-hidden"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        disabled={value <= min}
        onClick={(e) => {
          e.stopPropagation();
          onChange(Math.max(min, value - 1));
        }}
        className="p-2.5 text-text hover:bg-stone-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="-"
      >
        <Minus size={14} />
      </button>
      <span className="w-9 text-center text-sm font-semibold text-text tabular-nums">
        {value}
      </span>
      <button
        type="button"
        disabled={value >= max}
        onClick={(e) => {
          e.stopPropagation();
          onChange(Math.min(max, value + 1));
        }}
        className="p-2.5 text-text hover:bg-stone-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="+"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function ageLabel(age: number): string {
  if (age === 1) return '1 godina';
  if (age >= 2 && age <= 4) return `${age} godine`;
  return `${age} godina`;
}

export default function GuestPicker({
  adults,
  children,
  childAges,
  onAdultsChange,
  onChildrenChange,
  onChildAgesChange,
  className = '',
  labels = {},
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const l = {
    adults: labels.adults ?? 'Odrasli',
    children: labels.children ?? 'Djeca',
    guests: labels.guests ?? 'Gosti',
    childAge: labels.childAge ?? 'Starost djeteta',
    childAgeNeeded: labels.childAgeNeeded ?? 'Potrebno',
    agesHint:
      labels.agesHint ??
      'Da bismo pronašli smještaj s odgovarajućim kapacitetom i prikazali točne cijene, trebamo starost djece u trenutku odjave.',
    done: labels.done ?? 'Gotovo',
  };

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function setChildrenCount(n: number) {
    onChildrenChange(n);
    onChildAgesChange(resizeChildAges(childAges, n));
  }

  function setAgeAt(index: number, age: number | null) {
    const next = resizeChildAges(childAges, children);
    next[index] = age;
    onChildAgesChange(next);
  }

  const summaryParts: string[] = [];
  if (adults > 0) summaryParts.push(`${adults} ${l.adults.toLowerCase()}`);
  if (children > 0) summaryParts.push(`${children} ${l.children.toLowerCase()}`);
  const summary =
    summaryParts.length > 0 ? summaryParts.join(' · ') : `0 ${l.adults.toLowerCase()}`;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        data-search-trigger
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="w-full flex items-center gap-2 text-left text-text text-sm font-medium bg-transparent outline-none cursor-pointer"
      >
        <span className="flex-1 truncate">{summary}</span>
        <ChevronDown
          size={16}
          className={`text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={l.guests}
          className="absolute left-0 right-0 sm:left-auto sm:right-0 sm:w-[340px] top-full mt-2 z-[100] bg-white border border-stone rounded-xl shadow-2xl p-4 space-y-4"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text">{l.adults}</p>
              <p className="text-[11px] text-muted">Max {MAX_ADULTS}</p>
            </div>
            <Stepper
              value={adults}
              min={0}
              max={MAX_ADULTS}
              onChange={onAdultsChange}
              ariaLabel={l.adults}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text">{l.children}</p>
              <p className="text-[11px] text-muted">Max {MAX_CHILDREN}</p>
            </div>
            <Stepper
              value={children}
              min={0}
              max={MAX_CHILDREN}
              onChange={setChildrenCount}
              ariaLabel={l.children}
            />
          </div>

          {children > 0 && (
            <div className="space-y-3 pt-3 border-t border-stone">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {l.childAge}
              </p>
              <div
                className={`grid gap-2 ${children === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
              >
                {Array.from({ length: children }, (_, i) => (
                  <label key={i} className="block">
                    <span className="sr-only">
                      {l.childAge} {i + 1}
                    </span>
                    <select
                      value={childAges[i] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setAgeAt(i, v === '' ? null : Number(v));
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full border border-stone rounded-lg px-3 py-2.5 text-sm text-text bg-white focus:outline-none focus:border-primary"
                    >
                      <option value="">{l.childAgeNeeded}</option>
                      {Array.from({ length: MAX_CHILD_AGE + 1 }, (_, age) => (
                        <option key={age} value={age}>
                          {ageLabel(age)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted leading-relaxed">{l.agesHint}</p>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="w-full border-2 border-primary text-primary font-semibold rounded-lg py-2.5 text-sm hover:bg-primary/5 transition-colors"
          >
            {l.done}
          </button>
        </div>
      )}
    </div>
  );
}
