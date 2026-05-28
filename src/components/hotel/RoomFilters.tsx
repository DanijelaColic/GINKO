'use client';

// Newly created — no direct equivalent in Villa-Jurina (Jurina has no filter UI)

type Props = {
  maxGuests: number;
  maxPrice: number;
  guests: number;
  price: number;
  labels: {
    guestsLabel: string;
    maxPriceLabel: string;
    any: string;
  };
  onGuestsChange: (v: number) => void;
  onPriceChange: (v: number) => void;
};

export default function RoomFilters({
  maxGuests,
  maxPrice,
  guests,
  price,
  labels,
  onGuestsChange,
  onPriceChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      {/* Guests */}
      <label className="flex flex-col gap-1 text-sm text-muted">
        {labels.guestsLabel}
        <select
          value={guests}
          onChange={(e) => onGuestsChange(Number(e.target.value))}
          className="rounded-lg border border-stone bg-white px-3 py-2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value={0}>{labels.any}</option>
          {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
      </label>

      {/* Max price */}
      <label className="flex flex-col gap-1 text-sm text-muted">
        {labels.maxPriceLabel}: <strong className="text-text">{price > 0 ? `${price}€` : labels.any}</strong>
        <input
          type="range"
          min={0}
          max={maxPrice}
          step={10}
          value={price}
          onChange={(e) => onPriceChange(Number(e.target.value))}
          className="w-44 accent-primary"
        />
      </label>
    </div>
  );
}
