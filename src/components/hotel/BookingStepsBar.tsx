'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Props = {
  currentStep: 1 | 2 | 3;
  /** All steps checked — used after deposit is paid */
  complete?: boolean;
};

export default function BookingStepsBar({ currentStep, complete = false }: Props) {
  const t = useTranslations('bookingWidget.stepper');
  const visualStep = complete ? 4 : currentStep;

  const steps: { n: 1 | 2 | 3; label: string }[] = [
    { n: 1, label: t('step1') },
    { n: 2, label: t('step2') },
    { n: 3, label: t('step3') },
  ];

  return (
    <div className="flex items-start justify-center mb-10 select-none">
      {steps.map((step, i) => (
        <div key={step.n} className="flex items-start">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                visualStep > step.n
                  ? 'bg-primary text-white'
                  : visualStep === step.n
                    ? 'bg-primary text-white ring-4 ring-primary/15'
                    : 'bg-stone border border-stone text-muted'
              }`}
            >
              {visualStep > step.n ? <Check size={14} /> : step.n}
            </div>
            <span
              className={`text-xs font-medium whitespace-nowrap transition-colors ${
                visualStep === step.n
                  ? 'text-text'
                  : visualStep > step.n
                    ? 'text-primary'
                    : 'text-muted'
              }`}
            >
              {step.label}
            </span>
          </div>

          {i < steps.length - 1 && (
            <div
              className={`h-px w-10 sm:w-16 mx-2 mt-4 shrink-0 transition-colors ${
                visualStep > step.n ? 'bg-primary' : 'bg-stone'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
