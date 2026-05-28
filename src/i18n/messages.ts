import { hasLocale } from 'next-intl';
import hrMessages from '../../messages/hr.json';
import enMessages from '../../messages/en.json';
import deMessages from '../../messages/de.json';
import { routing, type AppLocale } from './routing';

const messagesByLocale = {
  hr: hrMessages,
  en: enMessages,
  de: deMessages,
} as const;

export function getValidLocale(locale: string | null | undefined): AppLocale {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

export function getMessagesForLocale(locale: string | null | undefined) {
  return messagesByLocale[getValidLocale(locale)];
}
