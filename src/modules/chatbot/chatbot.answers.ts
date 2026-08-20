/**
 * Izvlačenje odobrenog odgovora za widget (Faza 2).
 * Ne izmišlja copy — samo slaže postojeći FAQ / kućni red.
 */

import type { HouseRuleItem } from '@/modules/property/property-details.config';
import { getHouseRules } from '@/modules/property/property-details.i18n';

export function flattenHouseRule(rule: HouseRuleItem): string {
  const parts: string[] = [];
  if (rule.paragraphs?.length) {
    parts.push(...rule.paragraphs);
  }
  for (const sub of rule.subsections ?? []) {
    if (sub.title) parts.push(sub.title);
    if (sub.paragraphs?.length) parts.push(...sub.paragraphs);
    if (sub.highlight) {
      parts.push(
        `${sub.highlight.ageRange}: ${sub.highlight.label} — ${sub.highlight.price}`,
      );
    }
  }
  return parts.join('\n');
}

export function houseRuleAnswer(
  locale: string,
  houseRuleId: string,
): string | null {
  const rule = getHouseRules(locale).find((item) => item.id === houseRuleId);
  if (!rule) return null;
  const body = flattenHouseRule(rule);
  if (!body) return null;
  return `${rule.title}\n${body}`;
}
