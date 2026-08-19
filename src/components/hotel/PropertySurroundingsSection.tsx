import { Landmark, UtensilsCrossed, TrainFront, Plane, type LucideIcon } from 'lucide-react';
import { getLocale } from 'next-intl/server';
import { PropertyLocationMapPreview } from '@/components/hotel/PropertyLocationMap';
import { getSurroundingsCopy } from '@/modules/property/property-details.i18n';
import type { SurroundingItem } from '@/modules/property/property-details.config';
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
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: readonly SurroundingItem[];
  icon: LucideIcon;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 font-semibold text-sm text-text mb-4">
        <Icon size={16} className="text-muted shrink-0" />
        {title}
      </h3>
      <SurroundingList items={items} />
    </div>
  );
}

export default async function PropertySurroundingsSection() {
  const locale = await getLocale();
  const { ui, items } = getSurroundingsCopy(locale);

  return (
    <section id={SURROUNDINGS_SECTION_ID} className="py-14 px-4 bg-white border-t border-stone scroll-mt-28">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-text">
              {ui.title}
            </h2>
          </div>
          <a
            href="#raspolozivost"
            className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap shrink-0"
          >
            {ui.showAvailability}
          </a>
        </div>

        <PropertyLocationMapPreview />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10 mt-8">
          <SurroundingCategory
            title={ui.categories.attractions}
            items={items.attractions}
            icon={Landmark}
          />

          <div className="lg:row-span-3 lg:row-start-1 lg:col-start-2">
            <h3 className="flex items-center gap-2 font-semibold text-sm text-text mb-4">
              <UtensilsCrossed size={16} className="text-muted shrink-0" />
              {ui.categories.restaurants}
            </h3>
            <SurroundingList items={items.restaurants} />
          </div>

          <SurroundingCategory
            title={ui.categories.transport}
            items={items.transport}
            icon={TrainFront}
          />
          <SurroundingCategory
            title={ui.categories.airports}
            items={items.airports}
            icon={Plane}
          />
        </div>

        <p className="text-xs text-muted mt-8 leading-relaxed">
          {ui.disclaimer}
        </p>
      </div>
    </section>
  );
}
