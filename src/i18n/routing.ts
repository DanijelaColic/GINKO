import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['hr', 'en', 'cs'],
  defaultLocale: 'hr',
  localePrefix: 'as-needed',
  // URL je izvor istine — bez Accept-Language redirecta s / na /en ili /cs
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
