import type { AppLocale } from '@/i18n/routing';
import {
  DEPOSIT_PERCENT,
  FREE_CANCELLATION_DAYS,
} from '@/modules/booking/booking.config';

const depositPct = Math.round(DEPOSIT_PERCENT * 100);

export type LandingTrustCopy = {
  sectionTitle: string;
  parking: string;
  deposit: string;
  cancellation: string;
  breakfast: string;
  /** {rating} i {count} zamijenjeni kad reviews postoje */
  reviews: string;
};

export const LANDING_TRUST_COPY: Record<AppLocale, LandingTrustCopy> = {
  hr: {
    sectionTitle: 'Prije rezervacije — na kratko',
    parking: 'Besplatno privatno parkiralište uz objekt',
    deposit: `Depozit ${depositPct} % pri rezervaciji; ostatak na dolasku`,
    cancellation: `Besplatno otkazivanje i povrat depozita do ${FREE_CANCELLATION_DAYS} dana prije dolaska`,
    breakfast: 'Doručak se može naručiti pri rezervaciji (nije automatski uključen u cijenu sobe)',
    reviews: 'Gosti na Googleu: {rating}/5 · {count} recenzija',
  },
  en: {
    sectionTitle: 'Before you book — at a glance',
    parking: 'Free private parking next to the property',
    deposit: `${depositPct}% deposit at booking; balance on arrival`,
    cancellation: `Free cancellation and deposit refund up to ${FREE_CANCELLATION_DAYS} days before arrival`,
    breakfast: 'Breakfast can be ordered when you book (not included in the room rate by default)',
    reviews: 'Google guest rating: {rating}/5 · {count} reviews',
  },
  cs: {
    sectionTitle: 'Před rezervací — stručně',
    parking: 'Soukromé parkování zdarma u objektu',
    deposit: `Záloha ${depositPct} % při rezervaci; doplatek při příjezdu`,
    cancellation: `Bezplatné storno a vrácení zálohy do ${FREE_CANCELLATION_DAYS} dní před příjezdem`,
    breakfast: 'Snídani lze objednat při rezervaci (není automaticky v ceně pokoje)',
    reviews: 'Hodnocení hostů na Google: {rating}/5 · {count} recenzí',
  },
};

export function formatLandingReviewsLine(
  locale: AppLocale,
  rating: number,
  reviewCount: number,
): string {
  return LANDING_TRUST_COPY[locale].reviews
    .replace('{rating}', rating.toFixed(1).replace('.', ','))
    .replace('{count}', String(reviewCount));
}
