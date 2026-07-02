'use client';

import type { ElementType, ReactNode } from 'react';

type Props = {
  icon: ElementType;
  iconSize?: number;
  label: string;
  children: ReactNode;
  className?: string;
};

function openField(container: HTMLElement) {
  const field = container.querySelector('input, select') as
    | HTMLInputElement
    | HTMLSelectElement
    | null;
  if (!field) return;

  field.focus();

  if (field instanceof HTMLInputElement && field.type === 'date' && 'showPicker' in field) {
    try {
      field.showPicker();
    } catch {
      // Neki browseri odbijaju showPicker izvan direktnog user gesturea
    }
    return;
  }

  if (field instanceof HTMLSelectElement) {
    field.click();
  }
}

export default function SearchFieldCell({
  icon: Icon,
  iconSize = 16,
  label,
  children,
  className = '',
}: Props) {
  return (
    <label
      className={`flex items-center gap-3 cursor-pointer hover:bg-stone-light/60 transition-colors min-h-[56px] ${className}`}
      onClick={(e) => {
        const target = e.target;
        if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) return;
        openField(e.currentTarget);
      }}
    >
      <Icon size={iconSize} className="text-primary shrink-0 pointer-events-none" />
      <div className="flex flex-col min-w-0 flex-1 justify-center">
        <span className="text-[10px] uppercase tracking-widest font-semibold text-muted pointer-events-none">
          {label}
        </span>
        {children}
      </div>
    </label>
  );
}
