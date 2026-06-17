import { UtensilsCrossed, TrainFront, Plane } from 'lucide-react';
import {
  PROPERTY_MAP_URL,
  SURROUNDINGS,
  SURROUNDINGS_COPY,
  type SurroundingItem,
} from '@/modules/property/property-details.config';

const CATEGORIES = [
  { key: 'restaurants' as const, icon: UtensilsCrossed },
  { key: 'transport' as const, icon: TrainFront },
  { key: 'airports' as const, icon: Plane },
];

function SurroundingList({ items }: { items: readonly SurroundingItem[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="flex justify-between gap-4 text-sm">
          <span className="text-text leading-snug">{item.label}</span>
          <span className="text-muted shrink-0">{item.distance}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PropertySurroundingsSection() {
  return (
    <section className="py-14 px-4 bg-white border-t border-stone">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-text">
              {SURROUNDINGS_COPY.title}
            </h2>
            <a
              href={PROPERTY_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm text-primary hover:text-primary-dark transition-colors"
            >
              {SURROUNDINGS_COPY.showMap}
            </a>
          </div>
          <a
            href="#raspolozivost"
            className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap shrink-0"
          >
            {SURROUNDINGS_COPY.showAvailability}
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-8">
          {CATEGORIES.map(({ key, icon: Icon }) => (
            <div key={key}>
              <h3 className="flex items-center gap-2 font-semibold text-sm text-text mb-4">
                <Icon size={16} className="text-muted shrink-0" />
                {SURROUNDINGS_COPY.categories[key]}
              </h3>
              <SurroundingList items={SURROUNDINGS[key]} />
            </div>
          ))}
        </div>

        <p className="text-xs text-muted mt-8 leading-relaxed">
          {SURROUNDINGS_COPY.disclaimer}
        </p>
      </div>
    </section>
  );
}
