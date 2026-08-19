import type { ElementType } from 'react';
import { getLocale } from 'next-intl/server';
import {
  Check,
  Car,
  Ban,
  Wifi,
  Sparkles,
  Bath,
  Bed,
  CookingPot,
  PawPrint,
  Monitor,
  CircleParking,
  ConciergeBell,
  Info,
  Languages,
} from 'lucide-react';
import type { FacilityGroup } from '@/modules/property/property-details.config';
import {
  getFacilitiesUi,
  getFacilityGroupsLocalized,
  getPopularFacilities,
} from '@/modules/property/property-details.i18n';
import { FACILITIES_SECTION_ID } from '@/modules/booking/booking.config';
import PropertyHouseRulesSection from '@/components/hotel/PropertyHouseRulesSection';

const POPULAR_ICONS: Record<string, ElementType> = {
  parking: Car,
  nonSmoking: Ban,
  wifi: Wifi,
};

const GROUP_ICONS: Record<string, ElementType> = {
  greatForStay: Sparkles,
  bathroom: Bath,
  bedroom: Bed,
  kitchen: CookingPot,
  pets: PawPrint,
  media: Monitor,
  parking: CircleParking,
  services: ConciergeBell,
  general: Info,
  languages: Languages,
};

function FacilityGroupBlock({ group }: { group: FacilityGroup }) {
  const Icon = GROUP_ICONS[group.id] ?? Info;

  return (
    <div>
      <h3 className="flex items-center gap-2 font-semibold text-sm text-text mb-3">
        <Icon size={16} className="text-muted shrink-0" />
        {group.title}
      </h3>
      {group.type === 'list' ? (
        <ul className="space-y-1.5">
          {group.items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted">
              <Check size={14} className="text-muted shrink-0 mt-0.5" />
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted leading-relaxed">{group.text}</p>
      )}
    </div>
  );
}

export default async function PropertyFacilitiesSection() {
  const locale = await getLocale();
  const copy = getFacilitiesUi(locale);
  const groups = getFacilityGroupsLocalized(locale);
  const popular = getPopularFacilities(locale);
  const columns: FacilityGroup[][] = [[], [], []];

  for (const group of groups) {
    columns[group.column - 1].push(group);
  }

  return (
    <section id={FACILITIES_SECTION_ID} className="py-14 px-4 bg-white border-t border-stone scroll-mt-28">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-text">
            {copy.title}
          </h2>
          <a
            href="#raspolozivost"
            className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap shrink-0"
          >
            {copy.showAvailability}
          </a>
        </div>

        <h3 className="font-semibold text-sm text-text mb-4">
          {copy.popularTitle}
        </h3>
        <div className="flex flex-wrap gap-x-8 gap-y-3 mb-10">
          {popular.map(({ id, label }) => {
            const Icon = POPULAR_ICONS[id];
            return (
              <div key={id} className="flex items-center gap-2 text-sm text-text">
                <Icon size={18} className="text-primary shrink-0" />
                <span>{label}</span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {columns.map((groups, columnIndex) => (
            <div key={columnIndex} className="space-y-8">
              {groups.map((group) => (
                <FacilityGroupBlock key={group.id} group={group} />
              ))}
            </div>
          ))}
        </div>

        {/* Kućni red — ispod sadržaja objekta */}
        <div className="mt-14">
          <PropertyHouseRulesSection embedded />
        </div>
      </div>
    </section>
  );
}
