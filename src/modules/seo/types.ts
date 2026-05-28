import type { AppLocale } from '@/i18n/routing';

export interface GuideTranslation {
  title: string;
  excerpt: string;
  body: string;
}

export interface Guide {
  slug: string;
  publishedAt: string; // ISO date
  coverImage: string;
  translations: Record<AppLocale, GuideTranslation>;
}

export interface LandingPageTranslation {
  title: string;
  description: string;
  body: string;
}

export interface LandingPage {
  key: string;
  path: string;
  translations: Record<AppLocale, LandingPageTranslation>;
}
