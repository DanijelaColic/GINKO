import { Landmark, UtensilsCrossed, TrainFront, Plane, type LucideIcon } from 'lucide-react';
import { PropertyLocationMapPreview } from '@/components/hotel/PropertyLocationMap';
import {
  SURROUNDINGS,
  SURROUNDINGS_COPY,
  type SurroundingItem,
} from '@/modules/property/property-details.config';
import { SURROUNDINGS_SECTION_ID } from '@/modules/booking/booking.config';

function SurroundingList({ items }: { items: readonly SurroundingItem[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="flex justify-between gap-4 text-sm">
          <span className="text-text leading-snug">{item.label}</span>
          <span className="text-muted shrink-0 tabular-nums">{item.distance}</span>
        </li>
      ))}
    </ul>
  );
}

function SurroundingCategory({
  categoryKey,
  icon: Icon,
}: {
  categoryKey: keyof typeof SURROUNDINGS;
  icon: LucideIcon;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 font-semibold text-sm text-text mb-4">
        <Icon size={16} className="text-muted shrink-0" />
        {SURROUNDINGS_COPY.categories[categoryKey]}
      </h3>
      <SurroundingList items={SURROUNDINGS[categoryKey]} />
    </div>
  );
}

export default function PropertySurroundingsSection() {
  return (
    <section id={SURROUNDINGS_SECTION_ID} className="py-14 px-4 bg-white border-t border-stone scroll-mt-28">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-text">
              {SURROUNDINGS_COPY.title}
            </h2>
          </div>
          <a
            href="#raspolozivost"
            className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap shrink-0"
          >
            {SURROUNDINGS_COPY.showAvailability}
          </a>
        </div>

        <PropertyLocationMapPreview />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10 mt-8">
          <SurroundingCategory categoryKey="attractions" icon={Landmark} />

          <div className="lg:row-span-3 lg:row-start-1 lg:col-start-2">
            <h3 className="flex items-center gap-2 font-semibold text-sm text-text mb-4">
              <UtensilsCrossed size={16} className="text-muted shrink-0" />
              {SURROUNDINGS_COPY.categories.restaurants}
            </h3>
            <SurroundingList items={SURROUNDINGS.restaurants} />
          </div>

          <SurroundingCategory categoryKey="transport" icon={TrainFront} />
          <SurroundingCategory categoryKey="airports" icon={Plane} />
        </div>

        <p className="text-xs text-muted mt-8 leading-relaxed">
          {SURROUNDINGS_COPY.disclaimer}
        </p>
      </div>
    </section>
  );
}
