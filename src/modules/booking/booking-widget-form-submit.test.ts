/**
 * Korak 2 — gumb mora prikazati depozit (isti iznos kao u BookingSummaryCard).
 */

import { describe, expect, it } from 'vitest';
import hr from '../../../messages/hr.json';
import en from '../../../messages/en.json';
import cs from '../../../messages/cs.json';

const SUBMIT_TEMPLATES = {
  hr: hr.bookingWidget.form.submit,
  en: en.bookingWidget.form.submit,
  cs: cs.bookingWidget.form.submit,
} as const;

/** Isti oblik kao next-intl za jednostavne {var} zamjene. */
function formatSubmitLabel(template: string, deposit: number): string {
  return template.replace(/\{deposit\}/g, String(deposit));
}

describe('bookingWidget.form.submit (korak 2)', () => {
  it.each([
    {
      locale: 'hr',
      template: SUBMIT_TEMPLATES.hr,
      expected: 'Nastavi na plaćanje depozita – 90 €',
    },
    {
      locale: 'en',
      template: SUBMIT_TEMPLATES.en,
      expected: 'Continue to deposit payment – 90 €',
    },
    {
      locale: 'cs',
      template: SUBMIT_TEMPLATES.cs,
      expected: 'Pokračovat k platbě zálohy – 90 €',
    },
  ])('$locale koristi {deposit}, ne ukupnu cijenu', ({ template, expected }) => {
    expect(template).toContain('{deposit}');
    expect(template).not.toContain('totalPrice');
    expect(formatSubmitLabel(template, 90)).toBe(expected);
  });

  it('iznos u natpisu = priceData.deposit iz sažetka (npr. 180 € / 90 € depozit)', () => {
    const priceData = { totalPrice: 180, deposit: 90 };
    for (const template of Object.values(SUBMIT_TEMPLATES)) {
      const label = formatSubmitLabel(template, priceData.deposit);
      expect(label).toContain(`${priceData.deposit} €`);
      expect(label).not.toContain(`${priceData.totalPrice} €`);
    }
  });
});