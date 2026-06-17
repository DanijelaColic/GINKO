import type { ElementType } from 'react';
import {
  DoorOpen,
  DoorClosed,
  Info,
  Users,
  UserCheck,
  PawPrint,
  CreditCard,
  CigaretteOff,
  PartyPopper,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  HOUSE_RULES,
  HOUSE_RULES_COPY,
  type HouseRuleItem,
} from '@/modules/property/property-details.config';

const RULE_ICONS: Record<string, ElementType> = {
  checkin: DoorOpen,
  checkout: DoorClosed,
  cancellation: Info,
  children: Users,
  age: UserCheck,
  pets: PawPrint,
  payment: CreditCard,
  smoking: CigaretteOff,
  parties: PartyPopper,
};

function RuleContent({ rule }: { rule: HouseRuleItem }) {
  if (rule.subsections) {
    return (
      <div className="space-y-5">
        {rule.subsections.map((section) => (
          <div key={section.title}>
            <p className="font-semibold text-sm text-text mb-2">{section.title}</p>
            <div className="space-y-1.5">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm text-muted leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
            {section.highlight && (
              <div className="mt-3 border border-stone rounded-lg overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-3 px-4 py-3 bg-stone-light/50 text-sm">
                  <span className="text-text font-medium">{section.highlight.ageRange}</span>
                  <span className="text-muted">{section.highlight.label}</span>
                  <span className="text-green-600 font-semibold sm:text-right">
                    {section.highlight.price}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  const paragraphs = rule.paragraphs ?? [];

  return (
    <div className="space-y-1.5">
      {paragraphs.map((paragraph, index) => {
        const isLast = index === paragraphs.length - 1;

        return (
          <p key={paragraph} className="text-sm text-muted leading-relaxed">
            {paragraph}
            {isLast && rule.link && (
              <>
                {' '}
                <Link
                  href={rule.link.href}
                  className="text-primary hover:text-primary-dark underline underline-offset-2"
                >
                  {rule.link.label}
                </Link>
                .
              </>
            )}
          </p>
        );
      })}
    </div>
  );
}

function HouseRuleRow({ rule }: { rule: HouseRuleItem }) {
  const Icon = RULE_ICONS[rule.id] ?? Info;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3 md:gap-8 px-5 py-5 border-b border-stone last:border-b-0">
      <div className="flex items-start gap-2.5">
        <Icon size={18} className="text-muted shrink-0 mt-0.5" />
        <p className="font-semibold text-sm text-text leading-snug">{rule.title}</p>
      </div>
      <RuleContent rule={rule} />
    </div>
  );
}

type Props = {
  embedded?: boolean;
};

export default function PropertyHouseRulesSection({ embedded = false }: Props) {
  const content = (
    <div className="border border-stone rounded-xl overflow-hidden bg-white">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-5 py-5 border-b border-stone bg-stone-light/30">
        <div>
          <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-text">
            {HOUSE_RULES_COPY.title}
          </h3>
          <p className="text-sm text-muted mt-1.5 max-w-2xl">{HOUSE_RULES_COPY.subtitle}</p>
        </div>
        <a
          href="#raspolozivost"
          className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm whitespace-nowrap shrink-0"
        >
          {HOUSE_RULES_COPY.showAvailability}
        </a>
      </div>

      {HOUSE_RULES.map((rule) => (
        <HouseRuleRow key={rule.id} rule={rule} />
      ))}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="py-14 px-4 bg-white border-t border-stone">
      <div className="max-w-6xl mx-auto">{content}</div>
    </section>
  );
}
