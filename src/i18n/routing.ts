import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['hr', 'en', 'cs'],
  defaultLocale: 'hr',
  localePrefix: 'as-needed',
});

export type AppLocale = (typeof routing.locales)[number];
